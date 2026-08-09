import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { canAccessRoute, type AppRole } from "@/lib/rbac";
import { checkRateLimit } from "@/lib/rate-limit";

const SESSION_COOKIE = "mobeng_session";

function sign(value: string) {
  return createHmac("sha256", env.AUTH_SECRET).update(value).digest("base64url");
}

function parseRoleFromToken(token?: string | null): AppRole | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = sign(body);
  if (signature.length !== expected.length) return null;
  const valid = timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) return null;
  const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as { role?: AppRole; exp?: number };
  if (!payload.exp || payload.exp < Date.now() || !payload.role) return null;
  return payload.role;
}

export function enforceRbac(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const apiLimiter = checkRateLimit(`api:${ip}:${pathname}`, 180, 60_000);
  if (pathname.startsWith("/api") && !apiLimiter.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many requests" },
      { status: 429 }
    );
  }

  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (
    pathname === "/unauthorized" ||
    pathname === "/api/health" ||
    pathname === "/api/cron/process-jobs" ||
    pathname === "/api/integrations/transactions/import"
  ) {
    return NextResponse.next();
  }

  // Bypass autentikasi selama pengembangan - default ke role Admin
  const role = parseRoleFromToken(request.cookies.get(SESSION_COOKIE)?.value) ?? "Admin";

  if (!canAccessRoute(pathname, role)) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}
