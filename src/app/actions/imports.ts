"use server";

import { revalidatePath } from "next/cache";
import { ImportDuplicateMode, ImportSource } from "@/generated/prisma/enums";
import { requireSessionUser, assertPermission } from "@/lib/auth";
import { actionError, actionOk } from "@/lib/form-data";
import { runTransactionImport } from "@/services/imports/service";

function parseRowsJson(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function confirmTransactionImportAction(
  _prev: unknown,
  formData: FormData
) {
  await assertPermission("transactions", "write");
  const user = await requireSessionUser();

  const fileName = String(formData.get("fileName") ?? "manual-upload");
  const duplicateModeRaw = String(formData.get("duplicateMode") ?? "SKIP");
  const rowsJson = String(formData.get("rowsJson") ?? "[]");
  const rows = parseRowsJson(rowsJson);

  if (!rows || rows.length === 0) {
    return actionError("Tidak ada data baris yang bisa diimpor.");
  }

  const duplicateMode =
    duplicateModeRaw === "UPDATE"
      ? ImportDuplicateMode.UPDATE
      : ImportDuplicateMode.SKIP;

  const result = await runTransactionImport({
    rows,
    duplicateMode,
    source: ImportSource.UPLOAD,
    fileName,
    importedById: user.id,
  });

  revalidatePath("/transactions");
  revalidatePath("/customers");
  revalidatePath("/vehicles");
  revalidatePath("/dashboard");
  revalidatePath("/integrations/transactions");
  revalidatePath("/integrations/imports");

  return actionOk(
    `Import selesai: ${result.successRows} sukses, ${result.failedRows} gagal, ${result.skippedRows} skip.`
  );
}

