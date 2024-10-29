"use client";
import React from "react";

import { Button } from "../ui/button";
import { MultiFileDropzone } from "../ui/multi-file";
import type { FileState } from "../ui/multi-file";

import { useEdgeStore } from "@/lib/edgestore";
import { UploadAbortedError } from "@edgestore/react/errors";
import { Alert, AlertDescription } from "../ui/alert";
import { Loader2 } from "lucide-react";
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
        })
      );
      const successfulUploads = results.filter(
        (result): result is UploadResult => result !== null
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
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload files");
    } finally {
      setIsUploading(false);
    }
  };

  const pendingUploads = fileStates.filter(
    (fileState) => fileState.progress === "PENDING"
  ).length;

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(sharedUrl);
    } catch {
      setError("Failed to copy link to clipboard");
    }
  };

  return (
    <div className="flex flex-col items-center">
      {error && (
        <Alert variant="destructive" className="w-full">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <MultiFileDropzone
        value={fileStates}
        dropzoneOptions={{
          maxFiles: 5,
          maxSize: 1024 * 1024 * 4, // 1 MB
        }}
        onChange={setFileStates}
        onFilesAdded={async (addedFiles) => {
          setFileStates([...fileStates, ...addedFiles]);
        }}
      />
      <Button
        onClick={handleUpload}
        disabled={pendingUploads === 0 || isUploading}
        className="mt-4"
      >
        {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isUploading
          ? "Uploading..."
          : `Upload ${pendingUploads} file${pendingUploads !== 1 ? "s" : ""}`}
      </Button>

      {sharedUrl && (
        <div className="w-full p-4 mt-4 bg-muted rounded-lg flex items-center gap-2">
          <input
            type="text"
            value={sharedUrl}
            readOnly
            className="flex-1 bg-transparent border-none focus:outline-none text-sm"
          />
          <Button size="sm" onClick={handleCopyShareLink}>
            Copy
          </Button>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
