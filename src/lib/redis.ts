import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { getDownloadUrl } from "@edgestore/react/utils";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

export const handleDownload = (url: string, filename: string) => {
  const downloadUrl = getDownloadUrl(url, filename);

  // Create a temporary anchor element
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = filename;
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
