"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { submitSurveyResponseFormAction } from "@/app/actions/retention";
import { brandIdentity } from "@/lib/brand";

export function SurveyResponseForm({ surveyId }: { surveyId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
          try {
            await submitSurveyResponseFormAction(formData);
            toast.success("Respon survey tersimpan.");
            router.refresh();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Gagal menyimpan survey.");
          }
        });
      }}
    >
      <input type="hidden" name="surveyId" value={surveyId} />
      {[
        ["serviceQuality", "Kualitas servis"],
        ["staffService", "Pelayanan service advisor"],
        ["facilityRating", "Kenyamanan fasilitas"],
      ].map(([name, label]) => (
        <label key={name} className="grid gap-1 text-sm font-medium">
          {label}
          <select
            name={name}
            defaultValue="5"
            className="h-10 rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-800 dark:bg-zinc-950"
          >
            {[5, 4, 3, 2, 1].map((rating) => (
              <option key={rating} value={rating}>
                {rating}
              </option>
            ))}
          </select>
        </label>
      ))}
      <label className="grid gap-1 text-sm font-medium">
        Catatan
        <textarea
          name="notes"
          rows={4}
          className="rounded-md border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950"
          placeholder="Tulis masukan pelanggan atau konteks recovery"
        />
      </label>
      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
        Nilai kualitas servis 1 atau 2 otomatis membuat tiket komplain dan task recovery untuk tim {brandIdentity.appName}.
      </div>
      <button
        type="submit"
        disabled={pending}
        className="h-10 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-zinc-950"
      >
        {pending ? "Mengirim..." : "Kirim survey"}
      </button>
    </form>
  );
}
