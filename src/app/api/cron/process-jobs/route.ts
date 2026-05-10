import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { runDueJobs } from "@/services/jobs";

export async function POST(request: NextRequest) {
  const headerSecret = request.headers.get("x-cron-secret");
  if (!headerSecret || headerSecret !== env.CRON_SECRET) {
    return NextResponse.json({ success: false, error: "Unauthorized cron secret" }, { status: 401 });
  }

  const result = await runDueJobs(100);
  return NextResponse.json({
    success: true,
    processedCount: result.processed,
    failedCount: result.failed,
    skippedCount: result.skipped,
    timestamp: new Date().toISOString(),
  });
}

