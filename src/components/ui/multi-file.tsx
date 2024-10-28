"use client";

import { formatFileSize } from "@edgestore/react/utils";
import {
  CheckCircle,
  FileIcon,
  AlertTriangle,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import * as React from "react";
import { useDropzone, type DropzoneOptions } from "react-dropzone";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

export type FileState = {
  file: File;
  key: string;
  progress: "PENDING" | "COMPLETE" | "ERROR" | number;
  abortController?: AbortController;
};

type InputProps = {
  className?: string;
  value?: FileState[];
  onChange?: (files: FileState[]) => void | Promise<void>;
  onFilesAdded?: (addedFiles: FileState[]) => void | Promise<void>;
  disabled?: boolean;
  dropzoneOptions?: Omit<DropzoneOptions, "disabled">;
};

const variants = {
  base: "relative rounded-lg p-8 w-full flex justify-center items-center flex-col cursor-pointer border-2 border-dashed border-muted-foreground/25 transition-colors duration-200 ease-in-out",
  active: "border-primary/50",
  disabled: "bg-muted/50 border-muted cursor-default pointer-events-none",
  accept: "border-primary/50 bg-primary/10",
  reject: "border-destructive/50 bg-destructive/10",
};

const ERROR_MESSAGES = {
  fileTooLarge(maxSize: number) {
    return `The file is too large. Max size is ${formatFileSize(maxSize)}.`;
  },
  fileInvalidType() {
    return "Invalid file type.";
  },
  tooManyFiles(maxFiles: number) {
    return `You can only add ${maxFiles} file(s).`;
  },
  fileNotSupported() {
    return "The file is not supported.";
  },
};

const MultiFileDropzone = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { dropzoneOptions, value, className, disabled, onFilesAdded, onChange },
    ref
  ) => {
    const [customError, setCustomError] = React.useState<string>();

    if (dropzoneOptions?.maxFiles && value?.length) {
      disabled = disabled ?? value.length >= dropzoneOptions.maxFiles;
    }

    const {
      getRootProps,
      getInputProps,
      fileRejections,
      isFocused,
      isDragAccept,
      isDragReject,
    } = useDropzone({
      disabled,
      onDrop: (acceptedFiles) => {
        const files = acceptedFiles;
        setCustomError(undefined);
        if (
          dropzoneOptions?.maxFiles &&
          (value?.length ?? 0) + files.length > dropzoneOptions.maxFiles
        ) {
          setCustomError(ERROR_MESSAGES.tooManyFiles(dropzoneOptions.maxFiles));
          return;
        }
        if (files) {
          const addedFiles = files.map<FileState>((file) => ({
            file,
            key: Math.random().toString(36).slice(2),
            progress: "PENDING",
          }));
          void onFilesAdded?.(addedFiles);
          void onChange?.([...(value ?? []), ...addedFiles]);
        }
      },
      ...dropzoneOptions,
    });

    const dropZoneClassName = React.useMemo(
      () =>
        cn(
          variants.base,
          isFocused && variants.active,
          disabled && variants.disabled,
          (isDragReject ?? fileRejections[0]) && variants.reject,
          isDragAccept && variants.accept,
          className
        ),
      [
        isFocused,
        fileRejections,
        isDragAccept,
        isDragReject,
        disabled,
        className,
      ]
    );

    const errorMessage = React.useMemo(() => {
      if (fileRejections[0]) {
        const { errors } = fileRejections[0];
        if (errors[0]?.code === "file-too-large") {
          return ERROR_MESSAGES.fileTooLarge(dropzoneOptions?.maxSize ?? 0);
        } else if (errors[0]?.code === "file-invalid-type") {
          return ERROR_MESSAGES.fileInvalidType();
        } else if (errors[0]?.code === "too-many-files") {
          return ERROR_MESSAGES.tooManyFiles(dropzoneOptions?.maxFiles ?? 0);
        } else {
          return ERROR_MESSAGES.fileNotSupported();
        }
      }
      return undefined;
    }, [fileRejections, dropzoneOptions]);

    return (
      <div className="w-full space-y-3">
        {/* Dropzone Area */}
        <div {...getRootProps({ className: dropZoneClassName })}>
          <input ref={ref} {...getInputProps()} />
          <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <Upload className="h-10 w-10" />
            <div>drag & drop or click to upload</div>
          </div>
        </div>

        {/* Error Message */}
        {(customError || errorMessage) && (
          <Alert variant="destructive">
            <AlertDescription>{customError ?? errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* File List */}
        {value?.map(({ file, progress, abortController }, i) => (
          <Card key={i} className="p-3">
            <div className="flex items-center gap-2">
              <FileIcon className="h-8 w-8 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{file.name}</div>
                <div className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {progress === "PENDING" ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      onChange?.(value.filter((_, index) => index !== i));
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : progress === "ERROR" ? (
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                ) : progress !== "COMPLETE" ? (
                  <div className="flex items-center gap-2">
                    {abortController && (
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={progress === 100}
                        onClick={() => {
                          abortController.abort();
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {Math.round(progress)}%
                    </span>
                  </div>
                ) : (
                  <CheckCircle className="h-5 w-5 text-primary" />
                )}
              </div>
            </div>
            {typeof progress === "number" && (
              <Progress value={progress} className="mt-3 h-1" />
            )}
          </Card>
        ))}
      </div>
    );
  }
);

MultiFileDropzone.displayName = "MultiFileDropzone";

export { MultiFileDropzone };
// https://github.com/edgestorejs/edgestore/blob/main/examples/components/src/components/upload/multi-file.tsx
