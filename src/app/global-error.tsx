"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="grid min-h-screen place-items-center bg-zinc-50 p-4 dark:bg-black">
        <section className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">Terjadi kesalahan</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Sistem mengalami error. Silakan coba lagi.
          </p>
          <p className="mt-2 text-xs text-zinc-400">Ref: {error.digest ?? "N/A"}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 h-10 rounded-lg bg-zinc-950 px-4 text-sm font-medium text-white dark:bg-white dark:text-zinc-950"
          >
            Coba lagi
          </button>
        </section>
      </body>
    </html>
  );
}

