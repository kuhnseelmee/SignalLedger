import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { FastifyReply, FastifyRequest } from "fastify";
import { config } from "@signalledger/config";
import { hasPermission, type Role } from "@signalledger/auth";

export type AuthContext = {
  userId: string;
  tenantId: string;
  role: Role;
  permissions: string[];
};

export type JwtClaims = {
  sub: string;
  tenantId: string;
  role: Role;
  displayName: string;
};

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function signSession(claims: JwtClaims): string {
  return jwt.sign(claims, config.JWT_SECRET, { expiresIn: "12h" });
}

export function verifySession(token: string): JwtClaims {
  return jwt.verify(token, config.JWT_SECRET) as JwtClaims;
}

export function setAuthCookie(reply: FastifyReply, token: string): void {
  reply.setCookie("sl_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.NODE_ENV === "production",
    path: "/",
    signed: false,
  });
}

export function clearAuthCookie(reply: FastifyReply): void {
  reply.clearCookie("sl_session", { path: "/" });
}

export function resolveAuth(request: FastifyRequest): AuthContext | null {
  try {
    const cookies =
      (request as FastifyRequest & { cookies?: Record<string, string> })
        .cookies ?? {};
    const token =
      cookies.sl_session ??
      request.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) return null;
    const claims = verifySession(token);
    return {
      userId: claims.sub,
      tenantId: claims.tenantId,
      role: claims.role,
      permissions: [],
    };
  } catch {
    return null;
  }
}

export function can(role: Role, permission: string): boolean {
  return hasPermission(role, permission);
}
