import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "@/lib/logger";

export class AppError extends Error {
  statusCode: number;
  details?: Record<string, unknown>;

  constructor(message: string, statusCode = 400, details?: Record<string, unknown>) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    logger.warn("API handled AppError", {
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
    });
    return NextResponse.json(
      { success: false, error: error.message, details: error.details },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    logger.warn("API validation error", { issues: error.issues });
    return NextResponse.json(
      { success: false, error: "Validation failed", details: error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  logger.error("API unhandled error", {
    error: error instanceof Error ? error.message : String(error),
  });
  return NextResponse.json(
    { success: false, error: "Internal server error" },
    { status: 500 }
  );
}

