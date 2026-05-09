import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 p-4 dark:bg-black">
      <section className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-lg font-semibold text-zinc-950 dark:text-white">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          URL yang Anda akses tidak tersedia di Mobeng CRM.
        </p>
        <Link href="/dashboard" className="mt-4 inline-flex h-10 items-center rounded-lg bg-zinc-950 px-4 text-sm font-medium text-white dark:bg-white dark:text-zinc-950">
          Kembali ke Dashboard
        </Link>
      </section>
    </main>
  );
}

