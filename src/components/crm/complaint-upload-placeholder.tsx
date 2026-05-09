import { UploadCloud } from "lucide-react";

export function ComplaintUploadPlaceholder() {
  return (
    <section className="rounded-lg border border-dashed border-zinc-300 bg-white/70 p-4 dark:border-zinc-700 dark:bg-zinc-950/40">
      <div className="flex items-start gap-3">
        <UploadCloud className="mt-0.5 h-4 w-4 text-zinc-500" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Upload Lampiran Komplain
          </p>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Fondasi upload siap. Integrasi storage live belum diaktifkan. Format: JPG, PNG, WEBP,
            PDF (maks 5MB).
          </p>
        </div>
      </div>
    </section>
  );
}

