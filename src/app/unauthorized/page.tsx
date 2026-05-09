import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 p-4 dark:bg-black">
      <section className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-lg font-semibold text-zinc-950 dark:text-white">Akses Ditolak</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Anda tidak memiliki izin untuk membuka halaman ini.
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950"
        >
          Kembali ke Dashboard
        </Link>
      </section>
    </main>
  );
}

