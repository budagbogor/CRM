"use client";

import { useActionState, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { confirmTransactionImportAction } from "@/app/actions/imports";
import { transactionImportRowSchema } from "@/lib/validations/transaction-import";

type ImportPreviewRow = Record<string, unknown>;

const requiredHeaders = [
  "invoice_number",
  "transaction_date",
  "branch_name",
  "customer_name",
  "customer_phone",
  "customer_email",
  "vehicle_plate",
  "vehicle_brand",
  "vehicle_model",
  "vehicle_year",
  "mileage",
  "service_category",
  "service_description",
  "parts_replaced",
  "total_amount",
  "service_advisor",
  "technician_name",
  "payment_status",
];

export function TransactionImportPanel() {
  const [state, formAction] = useActionState(confirmTransactionImportAction, null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ImportPreviewRow[]>([]);
  const [errors, setErrors] = useState<Array<{ row: number; error: string }>>([]);
  const [duplicateMode, setDuplicateMode] = useState<"SKIP" | "UPDATE">("SKIP");

  const validation = useMemo(() => {
    const rowErrors: Array<{ row: number; error: string }> = [];
    rows.forEach((row, index) => {
      const parsed = transactionImportRowSchema.safeParse(row);
      if (!parsed.success) {
        rowErrors.push({
          row: index + 1,
          error: parsed.error.issues[0]?.message ?? "Invalid row.",
        });
      }
    });
    return {
      isValid: rowErrors.length === 0 && rows.length > 0,
      rowErrors,
    };
  }, [rows]);

  async function onFileChange(file: File | null) {
    if (!file) return;
    setFileName(file.name);
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      toast.error("Sheet tidak ditemukan.");
      return;
    }
    const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], {
      defval: "",
    });
    const first = jsonRows[0] ?? {};
    const missingHeaders = requiredHeaders.filter((header) => !(header in first));
    if (missingHeaders.length > 0) {
      setRows([]);
      setErrors(missingHeaders.map((header, index) => ({ row: index + 1, error: `Header wajib tidak ada: ${header}` })));
      return;
    }
    setRows(jsonRows);
    setErrors([]);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept=".csv,.xlsx"
            onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
            className="block w-full max-w-md cursor-pointer text-sm file:cursor-pointer"
          />
          <a
            href="/templates/mobeng-transaction-import-template.xlsx"
            download
            className="text-sm font-medium text-sky-600 hover:underline dark:text-sky-400"
          >
            Download Template Excel
          </a>
        </div>
        {fileName ? <p className="mt-2 text-xs text-zinc-500">File: {fileName}</p> : null}
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Preview & Validasi</h3>
          <div className="flex items-center gap-2 text-sm">
            <label htmlFor="duplicate-mode">Duplicate:</label>
            <select
              id="duplicate-mode"
              value={duplicateMode}
              onChange={(event) => setDuplicateMode(event.target.value as "SKIP" | "UPDATE")}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="SKIP">Skip existing invoice</option>
              <option value="UPDATE">Update existing invoice</option>
            </select>
          </div>
        </div>

        <p className="text-xs text-zinc-500">
          Total rows: {rows.length} | Valid: {validation.isValid ? "Ya" : "Tidak"} | Error: {validation.rowErrors.length + errors.length}
        </p>

        {(errors.length > 0 || validation.rowErrors.length > 0) ? (
          <ul className="mt-3 max-h-40 space-y-1 overflow-auto rounded-md bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            {[...errors, ...validation.rowErrors].slice(0, 20).map((item, index) => (
              <li key={`${item.row}-${index}`}>Row {item.row}: {item.error}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="fileName" value={fileName || "manual-upload"} />
        <input type="hidden" name="duplicateMode" value={duplicateMode} />
        <input type="hidden" name="rowsJson" value={JSON.stringify(rows)} />
        <button
          type="submit"
          disabled={!validation.isValid}
          className="inline-flex h-10 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-zinc-950"
        >
          Confirm Import
        </button>
        {state?.message ? (
          <p className={`text-sm ${state.ok ? "text-emerald-600" : "text-rose-600"}`}>
            {state.message}
          </p>
        ) : null}
      </form>

      {rows.length > 0 ? (
        <div className="overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="min-w-full text-xs">
            <thead className="bg-zinc-100 dark:bg-zinc-900">
              <tr>
                {requiredHeaders.map((header) => (
                  <th key={header} className="px-2 py-2 text-left font-semibold">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 10).map((row, index) => (
                <tr key={index} className="border-t border-zinc-200 dark:border-zinc-800">
                  {requiredHeaders.map((header) => (
                    <td key={header} className="whitespace-nowrap px-2 py-2">
                      {String(row[header] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

