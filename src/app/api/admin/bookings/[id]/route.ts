import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/alash/admin-auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const { status } = (await req.json()) as { status?: string };
  const allowed = ["new", "confirmed", "done", "cancelled"];
  if (!status || !allowed.includes(status)) {
    return NextResponse.json({ error: "bad status" }, { status: 400 });
  }
  try {
    const row = await db.booking.update({ where: { id }, data: { status } });
    return NextResponse.json(row);
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.booking.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
