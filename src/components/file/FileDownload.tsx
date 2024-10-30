

'use client';

import React from "react";
import { Button } from "@/components/ui/button";
import { DownloadIcon } from "lucide-react";
import { getDownloadUrl } from '@edgestore/react/utils';

interface FileDownloadProps {
  url: string;
  filename: string;
}

function FileDownload({ url, filename }: FileDownloadProps) {
  const handleDownload = () => {
    const downloadUrl = getDownloadUrl(url, filename);
    
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handleDownload}
    >
      <DownloadIcon className="h-5 w-5 text-green-500" />
    </Button>
  );
}

export default FileDownload;
