"use client";
import FileUpload from "@/components/file/FileUpload";
import React from "react";

function Page() {
  return (
    <div className="flex flex-col h-screen items-center justify-center">
      <div className="p-4">
        <FileUpload />
      </div>
    </div>
  );
}

export default Page;
