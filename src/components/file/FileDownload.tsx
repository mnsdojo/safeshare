"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { DownloadIcon } from "lucide-react";
import { handleDownload } from "@/lib/redis";

interface FileDownloadProps {
  url: string;
  filename: string;
}

function FileDownload({ url, filename }: FileDownloadProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => handleDownload(url, filename)}
    >
      <DownloadIcon className="h-5 w-5 text-green-500" />
    </Button>
  );
}

export default FileDownload;
