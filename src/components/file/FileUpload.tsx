"use client";

import React from "react";
import { Button } from "../ui/button";
import { MultiFileDropzone } from "../ui/multi-file";
import type { FileState } from "../ui/multi-file";
import { useEdgeStore } from "@/lib/edgestore";
import { UploadAbortedError } from "@edgestore/react/errors";
import { Alert, AlertDescription } from "../ui/alert";
import { Copy, Link2, Loader2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import QRCodeDialog from "./QrCodeDialog";

interface UploadResult {
  url: string;
  filename: string;
}

interface ShareLinkResponse {
  shareId: string;
  message?: string;
}

function FileUpload() {
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sharedUrl, setSharedUrl] = React.useState<string>("");
  const [fileStates, setFileStates] = React.useState<FileState[]>([]);
  const [copySuccess, setCopySuccess] = React.useState(false);
  const [showUploadBox, setShowUploadBox] = React.useState(true);
  const { edgestore } = useEdgeStore();

  function updateFileState(key: string, changes: Partial<FileState>) {
    setFileStates((prevStates) => {
      return prevStates.map((fileState) => {
        if (fileState.key === key) {
          return { ...fileState, ...changes };
        }
        return fileState;
      });
    });
  }

  const handleUpload = async () => {
    setError(null);
    setIsUploading(true);
    try {
      const results = await Promise.all(
        fileStates.map(async (fileState) => {
          if (fileState.progress !== "PENDING") return null;

          try {
            const abortController = new AbortController();
            updateFileState(fileState.key, { abortController });

            const res = await edgestore.publicFiles.upload({
              options: {
                temporary: true,
              },
              file: fileState.file,
              signal: abortController.signal,
              onProgressChange: async (progress) => {
                updateFileState(fileState.key, { progress });
                if (progress === 100) {
                  await new Promise((resolve) => setTimeout(resolve, 1000));
                  updateFileState(fileState.key, { progress: "COMPLETE" });
                }
              },
            });

            return {
              url: res.url,
              filename: fileState.file.name,
            };
          } catch (err) {
            if (err instanceof UploadAbortedError) {
              updateFileState(fileState.key, { progress: "PENDING" });
            } else {
              updateFileState(fileState.key, { progress: "ERROR" });
              throw err;
            }
            return null;
          }
        }),
      );
      const successfulUploads = results.filter(
        (result): result is UploadResult => result !== null,
      );

      if (successfulUploads.length > 0) {
        const res = await fetch("/api/create-link", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ files: successfulUploads }),
        });

        const data: ShareLinkResponse = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to create share link");
        }

        const shareUrl = `${window.location.origin}/share/${data.shareId}`;
        setSharedUrl(shareUrl);
        setShowUploadBox(false); // Hide the upload box after successful upload
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload files");
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setFileStates([]);
    setSharedUrl("");
    setError(null);
    setShowUploadBox(true);
  };

  const pendingUploads = fileStates.filter(
    (fileState) => fileState.progress === "PENDING",
  ).length;

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(sharedUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      setError("Failed to copy link to clipboard");
    }
  };

  return (
    <div className="flex flex-col items-center relative">
      {error && (
        <Alert variant="destructive" className="w-full mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {showUploadBox && (
        <div className="w-full relative">
          <MultiFileDropzone
            value={fileStates}
            dropzoneOptions={{
              maxFiles: 5,
              maxSize: 1024 * 1024 * 4,
            }}
            onChange={setFileStates}
            onFilesAdded={async (addedFiles) => {
              setFileStates([...fileStates, ...addedFiles]);
            }}
          />
          {sharedUrl && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-2 -right-2 bg-background rounded-full shadow-md hover:bg-muted"
              onClick={handleReset}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {!showUploadBox && (
        <Button onClick={handleReset} className="mb-4">
          Upload More Files
        </Button>
      )}

      {pendingUploads > 0 && (
        <Button onClick={handleUpload} disabled={isUploading} className="mt-4">
          {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isUploading
            ? "Uploading..."
            : `Upload ${pendingUploads} file${pendingUploads !== 1 ? "s" : ""}`}
        </Button>
      )}

      {sharedUrl && (
        <Card className="w-full mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Share Files
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 bg-muted p-3 rounded-md">
              <input
                type="text"
                value={sharedUrl}
                readOnly
                className="flex-1 bg-transparent border-none focus:outline-none text-sm"
              />
              <QRCodeDialog url={sharedUrl} />
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyShareLink}
                className="relative"
              >
                <Copy className="h-4 w-4 text-green-500" />
                {copySuccess && (
                  <span className="absolute -top-8 left-1/2 bg-black transform -translate-x-1/2 text-green-500 text-xs py-1 px-2 rounded">
                    Copied!
                  </span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default FileUpload;
