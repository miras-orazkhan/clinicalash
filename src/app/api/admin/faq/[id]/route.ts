import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/alash/admin-auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const b = (await req.json()) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  for (const f of ["qRu", "qKz", "aRu", "aKz"]) if (f in b) data[f] = String(b[f] ?? "");
  if ("published" in b) data.published = Boolean(b.published);
  if ("sortOrder" in b) data.sortOrder = Number(b.sortOrder ?? 0);
  try {
    const row = await db.faqItem.update({ where: { id }, data });
    return NextResponse.json(row);
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.faqItem.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
