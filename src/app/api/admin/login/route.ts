import { NextResponse } from "next/server";
import { getAdminPassword, setAdminCookie, clearAdminCookie } from "@/lib/alash/admin-auth";

export async function POST(req: Request) {
  const { password } = (await req.json()) as { password?: string };
  const expected = await getAdminPassword();
  if (!password || password !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  await setAdminCookie(password);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await clearAdminCookie();
  return NextResponse.json({ ok: true });
}
