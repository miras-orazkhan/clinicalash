import { createHash } from "crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

const COOKIE = "alash_admin";

export async function getAdminPassword(): Promise<string> {
  const s = await db.setting.findUnique({ where: { key: "admin_password" } });
  return s?.value || "alash2026";
}

export function tokenFor(password: string): string {
  return createHash("sha256").update(`alash-admin::${password}`).digest("hex");
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  const tok = store.get(COOKIE)?.value;
  if (!tok) return false;
  return tok === tokenFor(await getAdminPassword());
}

export async function setAdminCookie(password: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, tokenFor(password), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearAdminCookie(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
}
