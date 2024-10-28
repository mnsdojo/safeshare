"use client";
import React from "react";

import { Button } from "../ui/button";
import { MultiFileDropzone } from "../ui/multi-file";
import type { FileState } from "../ui/multi-file";

import { useEdgeStore } from "@/lib/edgestore";
import { UploadAbortedError } from "@edgestore/react/errors";

function FileUpload() {
  const [fileStates, setFileStates] = React.useState<FileState[]>([]);
  const [uploadRes, setUploadRes] = React.useState<
    {
      url: string;
      filename: string;
    }[]
  >([]);
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

  return (
    <div className="flex flex-col items-center">
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
        className="mt-2"
        onClick={async () => {
          await Promise.all(
            fileStates.map(async (fileState) => {
              try {
                if (fileState.progress !== "PENDING") return;
                const abortController = new AbortController();
                updateFileState(fileState.key, { abortController });
                const res = await edgestore.publicFiles.upload({
                  file: fileState.file,
                  signal: abortController.signal,
                  onProgressChange: async (progress) => {
                    updateFileState(fileState.key, { progress });
                    if (progress === 100) {
                      // wait 1 second to set it to complete
                      // so that the user can see the progress bar
                      await new Promise((resolve) => setTimeout(resolve, 1000));
                      updateFileState(fileState.key, { progress: "COMPLETE" });
                    }
                  },
                });
                setUploadRes((uploadRes) => [
                  ...uploadRes,
                  {
                    url: res.url,
                    filename: fileState.file.name,
                  },
                ]);
              } catch (err) {
                console.error(err);
                if (err instanceof UploadAbortedError) {
                  updateFileState(fileState.key, { progress: "PENDING" });
                } else {
                  updateFileState(fileState.key, { progress: "ERROR" });
                }
              }
            })
          );
        }}
        disabled={
          !fileStates.filter((fileState) => fileState.progress === "PENDING")
            .length
        }
      >
        Upload
      </Button>
      {uploadRes.length > 0 && (
        <div className="mt-2">
          {uploadRes.map((res) => (
            <a
              key={res.url}
              className="mt-2 block underline"
              href={res.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {res.filename}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default FileUpload;
