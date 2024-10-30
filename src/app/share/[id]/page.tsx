import React from "react";
import { notFound } from "next/navigation";
import { redis } from "@/lib/redis";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileIcon } from "lucide-react";
import FileDownload from "@/components/file/FileDownload";

interface SharedFile {
  url: string;
  filename: string;
}

interface ShareData {
  files: SharedFile[];
  createdAt: string;
  expiresAt: string;
}

async function Page({ params }: { params: { id: string } }) {
  const { id } = params;

  const data = await redis.get(`share:${id}`);

  if (!data) {
    notFound();
  }

  const shareData = data as unknown as ShareData;
  const expiresAt = new Date(shareData.expiresAt);
  const now = new Date();

  if (now > expiresAt) {
    await redis.del(`share:${id}`);
    notFound();
  }

  const timeRemaining = expiresAt.getTime() - now.getTime();
  const minutesRemaining = Math.max(0, Math.floor(timeRemaining / (1000 * 60)));

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Shared Files</CardTitle>
          <CardDescription>
            These files will expire in {minutesRemaining} minute
            {minutesRemaining !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {shareData.files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-muted rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <FileIcon className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="font-medium">{file.filename}</p>
                  </div>
                </div>
                <FileDownload url={file.url} filename={file.filename} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Page;
