import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/alash/admin-auth";
import { toClientDoctor } from "@/lib/alash/admin-rows";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const b = (await req.json()) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  const strFields = ["nameRu", "nameKz", "patronymicRu", "patronymicKz", "titleRu", "titleKz", "bioRu", "bioKz", "educationRu", "educationKz", "category"];
  for (const f of strFields) if (f in b) data[f] = String(b[f] ?? "");
  if ("specialties" in b) data.specialties = JSON.stringify(b.specialties ?? []);
  if ("branches" in b) data.branches = JSON.stringify(b.branches ?? []);
  for (const f of ["experience", "reviewsCount", "price", "rating", "sortOrder"]) if (f in b) data[f] = Number(b[f] ?? 0);
  if ("published" in b) data.published = Boolean(b.published);
  if ("photoUrl" in b) data.photoUrl = b.photoUrl ? String(b.photoUrl) : null;

  try {
    const row = await db.doctor.update({ where: { id }, data });
    return NextResponse.json(toClientDoctor(row));
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.doctor.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
