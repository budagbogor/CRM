"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-rose-900 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100">
      <h2 className="text-base font-semibold">Something went wrong</h2>
      <p className="mt-2 text-sm">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 h-9 rounded-md bg-rose-700 px-3 text-sm font-medium text-white hover:bg-rose-800"
      >
        Try again
      </button>
    </div>
  );
}
