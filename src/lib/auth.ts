import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/services/audit";
import { hasPermission, type AppRole, type PermissionAction, type PermissionScope } from "@/lib/rbac";

type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  branchId?: string | null;
};

const SESSION_COOKIE = "mobeng_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;


function sign(value: string) {
  return createHmac("sha256", env.AUTH_SECRET).update(value).digest("base64url");
}

function makeToken(payload: SessionUser) {
  const body = Buffer.from(
    JSON.stringify({ ...payload, exp: Date.now() + SESSION_MAX_AGE * 1000 })
  ).toString("base64url");
  return `${body}.${sign(body)}`;
}

function parseToken(token?: string | null): SessionUser | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = sign(body);
  if (signature.length !== expected.length) return null;
  const valid = timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) return null;
  const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionUser & {
    exp: number;
  };
  if (payload.exp < Date.now()) return null;
  return payload;
}

export async function createSessionForUser(user: SessionUser) {
  const store = await cookies();
  store.set(SESSION_COOKIE, makeToken(user), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionUser() {
  const store = await cookies();
  return parseToken(store.get(SESSION_COOKIE)?.value);
}

export async function requireSessionUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function assertPermission(scope: PermissionScope, action: PermissionAction) {
  const user = await requireSessionUser();
  if (!hasPermission(user.role, scope, action)) {
    throw new Error("Anda tidak memiliki izin untuk melakukan aksi ini.");
  }
  return user;
}

export function canAccessAllBranches(role: AppRole) {
  return role === "Admin" || role === "Owner";
}

export async function assertBranchAccess(branchId?: string | null) {
  const user = await requireSessionUser();
  if (canAccessAllBranches(user.role)) return user;
  if (!branchId || !user.branchId || branchId !== user.branchId) {
    throw new Error("Akses data lintas cabang tidak diizinkan.");
  }
  return user;
}

export async function authenticateLogin(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });
  if (!user?.passwordHash) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;
  if (
    !["Admin", "Owner", "Manager", "Service Advisor", "Customer Service", "Technician", "Marketing CRM"].includes(
      user.role.name
    )
  ) {
    return null;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  await auditLog({
    action: "auth.login",
    entityType: "User",
    entityId: user.id,
    metadata: { email: user.email, role: user.role.name },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.name as AppRole,
    branchId: user.branchId,
  } satisfies SessionUser;
}

export async function logLogout(userId?: string) {
  if (!userId) return;
  await auditLog({
    action: "auth.logout",
    entityType: "User",
    entityId: userId,
  });
}
