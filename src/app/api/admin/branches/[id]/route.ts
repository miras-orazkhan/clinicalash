import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/alash/admin-auth";
import { toClientBranch } from "@/lib/alash/admin-rows";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const b = (await req.json()) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  for (const f of ["nameRu", "nameKz", "districtRu", "districtKz", "addressRu", "addressKz", "phone", "descRu", "descKz", "landmarkRu", "landmarkKz", "mapUrl"]) {
    if (f in b) data[f] = String(b[f] ?? "");
  }
  if ("hours" in b) data.hours = JSON.stringify(b.hours ?? []);
  if ("highlights" in b) data.highlights = JSON.stringify(b.highlights ?? []);
  if ("published" in b) data.published = Boolean(b.published);
  if ("sortOrder" in b) data.sortOrder = Number(b.sortOrder ?? 0);
  if ("photoUrl" in b) data.photoUrl = b.photoUrl ? String(b.photoUrl) : null;
  try {
    const row = await db.branch.update({ where: { id }, data });
    return NextResponse.json(toClientBranch(row));
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.branch.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
