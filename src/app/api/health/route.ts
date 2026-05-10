import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { getNotificationProviderStatus } from "@/services/notifications";

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    await prisma.$queryRaw`SELECT 1`;
    const lastJobRun = await prisma.automationJob.findFirst({
      where: { processedAt: { not: null } },
      orderBy: { processedAt: "desc" },
      select: { processedAt: true },
    });
    return NextResponse.json({
      appStatus: "ok",
      app: env.APP_NAME,
      version: env.APP_VERSION,
      environment: env.APP_ENV,
      databaseStatus: "connected",
      schedulerStatus: env.JOB_RUNNER_MODE === "database" ? "active" : "memory_mode",
      notificationProviderStatus: getNotificationProviderStatus(),
      lastJobRunAt: lastJobRun?.processedAt ?? null,
      timestamp,
    });
  } catch {
    return NextResponse.json(
      {
        appStatus: "degraded",
        app: env.APP_NAME,
        version: env.APP_VERSION,
        environment: env.APP_ENV,
        databaseStatus: "disconnected",
        schedulerStatus: env.JOB_RUNNER_MODE === "database" ? "active" : "memory_mode",
        notificationProviderStatus: getNotificationProviderStatus(),
        lastJobRunAt: null,
        timestamp,
      },
      { status: 503 }
    );
  }
}
