import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ImportDuplicateMode, ImportSource } from "@/generated/prisma/enums";
import { AppError, handleApiError } from "@/lib/api-error";
import { env } from "@/lib/env";
import { runTransactionImport } from "@/services/imports/service";

const payloadSchema = z.object({
  duplicateMode: z.enum(["SKIP", "UPDATE"]).optional(),
  transactions: z.array(z.record(z.string(), z.unknown())).min(1),
});

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-api-key");
    if (!apiKey || apiKey !== env.INTEGRATION_API_KEY) {
      throw new AppError("Unauthorized integration key.", 401);
    }

    const json = await request.json();
    const payload = payloadSchema.parse(json);

    const result = await runTransactionImport({
      rows: payload.transactions,
      duplicateMode:
        payload.duplicateMode === "UPDATE"
          ? ImportDuplicateMode.UPDATE
          : ImportDuplicateMode.SKIP,
      source: ImportSource.API,
      fileName: "api-batch-import.json",
    });

    return NextResponse.json({
      success: true,
      message: "Import selesai diproses.",
      data: {
        logId: result.logId,
        totalRows: result.totalRows,
        successRows: result.successRows,
        failedRows: result.failedRows,
        skippedRows: result.skippedRows,
      },
      errors: result.errors,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

