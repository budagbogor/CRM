"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { clearSession, createSessionForUser, getSessionUser, authenticateLogin, logLogout } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function loginAction(_prev: { error?: string } | null, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for") ?? "local";
  const limiter = checkRateLimit(`auth:login:${ip}:${email}`, 10, 60_000);
  if (!limiter.allowed) {
    return { error: "Terlalu banyak percobaan login. Coba lagi sebentar." };
  }
  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  const user = await authenticateLogin(email, password);
  if (!user) {
    logger.warn("Login failed", { email, ip });
    return { error: "Email atau password tidak valid." };
  }

  await createSessionForUser(user);
  logger.info("Login success", { userId: user.id, email: user.email, ip });
  redirect("/dashboard");
}

export async function logoutAction() {
  const user = await getSessionUser();
  await logLogout(user?.id);
  logger.info("Logout", { userId: user?.id });
  await clearSession();
  redirect("/login");
}
