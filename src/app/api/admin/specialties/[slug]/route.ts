import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/alash/admin-auth";
import { toClientSpecialty } from "@/lib/alash/admin-rows";

export async function PUT(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { slug } = await params;
  const b = (await req.json()) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  for (const f of ["kind", "icon", "nameRu", "nameKz", "shortRu", "shortKz", "descRu", "descKz"]) {
    if (f in b) data[f] = String(b[f] ?? "");
  }
  if ("featured" in b) data.featured = Boolean(b.featured);
  if ("published" in b) data.published = Boolean(b.published);
  if ("services" in b) data.services = JSON.stringify(b.services ?? []);
  if ("sortOrder" in b) data.sortOrder = Number(b.sortOrder ?? 0);
  if ("newSlug" in b && b.newSlug && b.newSlug !== slug) {
    const old = await db.specialty.findUnique({ where: { slug } });
    if (!old) return NextResponse.json({ error: "not found" }, { status: 404 });
    await db.specialty.delete({ where: { slug } });
    const row = await db.specialty.create({ data: { ...old, ...data, slug: String(b.newSlug), updatedAt: undefined } });
    return NextResponse.json(toClientSpecialty(row));
  }
  try {
    const row = await db.specialty.update({ where: { slug }, data });
    return NextResponse.json(toClientSpecialty(row));
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { slug } = await params;
  await db.specialty.delete({ where: { slug } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
