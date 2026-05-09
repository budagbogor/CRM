import type { NextRequest } from "next/server";
import { enforceRbac } from "@/lib/auth-middleware";

export function middleware(request: NextRequest) {
  return enforceRbac(request);
}

export const config = {
  runtime: "nodejs",
  matcher: [
    "/api/:path*",
    "/dashboard/:path*",
    "/mobile/:path*",
    "/branches/:path*",
    "/customers/:path*",
    "/vehicles/:path*",
    "/transactions/:path*",
    "/complaints/:path*",
    "/follow-ups/:path*",
    "/reminders/:path*",
    "/bookings/:path*",
    "/reports/:path*",
    "/settings/:path*",
  ],
};
