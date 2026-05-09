import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      app: env.APP_NAME,
      version: env.APP_VERSION,
      environment: env.APP_ENV,
      database: "connected",
      timestamp,
    });
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        app: env.APP_NAME,
        version: env.APP_VERSION,
        environment: env.APP_ENV,
        database: "disconnected",
        timestamp,
      },
      { status: 503 }
    );
  }
}

