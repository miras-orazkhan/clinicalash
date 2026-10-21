import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/alash/admin-auth";
import { toClientBranch } from "@/lib/alash/admin-rows";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const rows = await db.branch.findMany({ orderBy: [{ sortOrder: "asc" }, { nameRu: "asc" }] });
  return NextResponse.json(rows.map(toClientBranch));
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = (await req.json()) as Record<string, unknown>;
  const id = String(b.id ?? "").trim();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const exists = await db.branch.findUnique({ where: { id } });
  if (exists) return NextResponse.json({ error: "exists" }, { status: 409 });
  const row = await db.branch.create({
    data: {
      id,
      nameRu: String(b.nameRu ?? ""),
      nameKz: String(b.nameKz ?? b.nameRu ?? ""),
      districtRu: String(b.districtRu ?? ""),
      districtKz: String(b.districtKz ?? ""),
      addressRu: String(b.addressRu ?? ""),
      addressKz: String(b.addressKz ?? ""),
      phone: String(b.phone ?? ""),
      hours: JSON.stringify(b.hours ?? []),
      descRu: String(b.descRu ?? ""),
      descKz: String(b.descKz ?? ""),
      highlights: JSON.stringify(b.highlights ?? []),
      landmarkRu: String(b.landmarkRu ?? ""),
      landmarkKz: String(b.landmarkKz ?? ""),
      mapUrl: String(b.mapUrl ?? ""),
      photoUrl: b.photoUrl ? String(b.photoUrl) : null,
      published: b.published === undefined ? true : Boolean(b.published),
      sortOrder: Number(b.sortOrder ?? 0),
    },
  });
  return NextResponse.json(toClientBranch(row));
}
