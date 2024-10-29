import { ratelimit, redis } from "@/lib/redis";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { z } from "zod";
interface ErrorResponse {
  message: string;
  code?: string;
}

interface SuccessResponse {
  shareId: string;
}

// Define validation schema for request body
const createLinkSchema = z.object({
  files: z
    .array(
      z.object({
        url: z.string().url(),
        filename: z.string().min(1),
      })
    )
    .min(1),
});

const createResponseWithHeaders = (
  body: ErrorResponse | SuccessResponse,
  status: number,
  rateLimitHeaders: Record<string, string>
) => {
  return Response.json(body, {
    status,
    headers: rateLimitHeaders,
  });
};

export async function POST(req: Request) {
  try {
    const headersList = headers();
    const forwarded = headersList.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "127.0.0.1";

    const { success, limit, reset, remaining } = await ratelimit.limit(ip);

    const rateLimitHeaders = {
      "X-RateLimit-Limit": limit.toString(),
      "X-RateLimit-Remaining": remaining.toString(),
      "X-RateLimit-Reset": reset.toString(),
    };

    if (!success) {
      return createResponseWithHeaders(
        {
          message: "Too many requests. Please try again later.",
          code: "RATE_LIMIT_EXCEEDED",
        },
        429,
        rateLimitHeaders
      );
    }
    const body = await req.json();
    const validationResult = createLinkSchema.safeParse(body);

    if (!validationResult.success) {
      return createResponseWithHeaders(
        {
          message: "Invalid request body",
          code: "INVALID_REQUEST",
        },
        400,
        rateLimitHeaders
      );
    }

    const { files } = validationResult.data;

    // Generate a unique share ID

    const shareId = nanoid(10);
    // Store share data in Redis
    // Store share data in Redis
    const shareData = {
      files,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
    };

    // Set the share data in Redis with expiration
    await redis.set(`share:${shareId}`, JSON.stringify(shareData), {
      ex: 10 * 60,
    });

    // Return success response with share ID
    return createResponseWithHeaders({ shareId }, 201, rateLimitHeaders);
  } catch (error) {
    console.error("Error creating share link:", error);

    if (error instanceof z.ZodError) {
      return Response.json(
        {
          message: "Invalid request data",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
