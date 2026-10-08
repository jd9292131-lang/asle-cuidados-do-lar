import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "../db/prisma";
import type { UserRole, UserStatus } from "../../generated/prisma/client";

const SESSION_COOKIE = "asle_session";
const DEFAULT_SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;
const STAFF_SESSION_DURATION_SECONDS = 60 * 60 * 4;

type SessionPayload = {
  userId: string;
  role: UserRole;
  exp: number;
};

type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  suspendedUntil: Date | null;
  firstName: string;
  lastName: string;
  phone: string | null;
};

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET não configurada ou demasiado curta. Use pelo menos 32 caracteres."
    );
  }

  return secret;
}

function encodePayload(payload: SessionPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePayload(value: string): SessionPayload | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8")
    ) as SessionPayload;

    if (
      typeof parsed.userId !== "string" ||
      typeof parsed.role !== "string" ||
      typeof parsed.exp !== "number"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function createSignature(value: string) {
  return createHmac("sha256", getAuthSecret())
    .update(value)
    .digest("base64url");
}

function createSessionToken(payload: SessionPayload) {
  const encodedPayload = encodePayload(payload);
  const signature = createSignature(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

function verifySessionToken(token: string): SessionPayload | null {
  const separatorIndex = token.lastIndexOf(".");

  if (separatorIndex <= 0) {
    return null;
  }

  const encodedPayload = token.slice(0, separatorIndex);
  const providedSignature = token.slice(separatorIndex + 1);

  const expectedSignature = createSignature(encodedPayload);

  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (providedBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null;
  }

  const payload = decodePayload(encodedPayload);

  if (!payload) {
    return null;
  }

  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}

export async function createSession(user: {
  id: string;
  role: UserRole;
}) {
  const sessionDuration =
    user.role === "ADMIN" || user.role === "RECRUITER"
      ? STAFF_SESSION_DURATION_SECONDS
      : DEFAULT_SESSION_DURATION_SECONDS;
  const payload: SessionPayload = {
    userId: user.id,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + sessionDuration,
  };

  const token = createSessionToken(payload);

  const cookieStore = await cookies();

  cookieStore.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionDuration,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();

  cookieStore.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const payload = verifySessionToken(token);

  if (!payload) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: payload.userId,
    },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      suspendedUntil: true,
      firstName: true,
      lastName: true,
      phone: true,
    },
  });

  if (!user) {
    return null;
  }

  if (user.status === "INACTIVE") {
    return null;
  }

  if (user.status === "SUSPENDED") {
    if (!user.suspendedUntil || user.suspendedUntil > new Date()) return null;

    await prisma.user.updateMany({
      where: { id: user.id, status: "SUSPENDED", suspendedUntil: { lte: new Date() } },
      data: { status: "ACTIVE", suspendedUntil: null, statusReason: null },
    });
    user.status = "ACTIVE";
    user.suspendedUntil = null;
  }

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  return user;
}

export async function requireRole(...roles: UserRole[]) {
  const user = await requireAuth();

  if (!roles.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }

  return user;
}