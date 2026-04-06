import "server-only";

import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "ecosat_demo_user";

type DemoSession = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "SUPERVISOR" | "TECHNICIAN";
  supervisorId?: string | null;
};

function getSecret() {
  return process.env.DEMO_AUTH_SECRET || "dev-secret-cambia-esto";
}

function encodeSession(session: DemoSession) {
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function decodeSession(value: string): DemoSession | null {
  const [payload, sig] = value.split(".");
  if (!payload || !sig) return null;

  const expected = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
  if (sig !== expected) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as DemoSession;
    if (!parsed || !parsed.id || !parsed.name || !parsed.email || !parsed.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  return decodeSession(raw);
}

export async function setDemoUserCookie(user: DemoSession) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, encodeSession(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearDemoUserCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export const DEMO_COOKIE_NAME = COOKIE_NAME;
