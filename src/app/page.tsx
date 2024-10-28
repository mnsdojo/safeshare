"use client";

import FileUpload from "@/components/file/FileUpload";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Shield, Lock, Timer, Upload } from "lucide-react";

function Page() {
  return (
    <div className="max-w-3xl mx-auto space-y-12 py-8">
      <div className="space-y-4">
        <p className="text-xl text-center text-muted-foreground max-w-2xl mx-auto">
          Upload and share files securely. Your files are encrypted end-to-end
          and automatically expire after download.
        </p>

        <Card className="border-dashed">
          <CardHeader>
            <CardDescription className="flex items-center justify-center gap-2 text-base">
              <Upload className="h-4 w-4" />
              Drag and drop files here or click to browse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">End-to-End Encrypted</h3>
            <p className="text-sm text-muted-foreground">
              Files are encrypted before upload
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 text-center">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Timer className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">Auto-Expire</h3>
            <p className="text-sm text-muted-foreground">
              Files delete after download
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 text-center">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">No Sign Up</h3>
            <p className="text-sm text-muted-foreground">
              Share files instantly
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Page;
