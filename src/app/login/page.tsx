import { redirect } from "next/navigation";
import { Gauge } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { brandIdentity } from "@/lib/brand";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 p-4 dark:bg-black">
      <section className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
            <Gauge className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-semibold text-zinc-950 dark:text-white">{brandIdentity.appName}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{brandIdentity.subtitle}</p>
          </div>
        </div>
        <h1 className="text-lg font-semibold text-zinc-950 dark:text-white">Masuk ke CRM</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Satu Tempat untuk Kebutuhan Mobil Anda
        </p>
        <div className="mt-5">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}

