import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/alash/admin-auth";
import { toClientDoctor } from "@/lib/alash/admin-rows";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const rows = await db.doctor.findMany({ orderBy: [{ sortOrder: "asc" }, { nameRu: "asc" }] });
  return NextResponse.json(
    rows.map(toClientDoctor)
  );
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = (await req.json()) as Record<string, unknown>;
  const id = String(b.id ?? "").trim();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const exists = await db.doctor.findUnique({ where: { id } });
  if (exists) return NextResponse.json({ error: "exists" }, { status: 409 });
  const row = await db.doctor.create({
    data: {
      id,
      nameRu: String(b.nameRu ?? ""),
      nameKz: String(b.nameKz ?? b.nameRu ?? ""),
      patronymicRu: String(b.patronymicRu ?? ""),
      patronymicKz: String(b.patronymicKz ?? ""),
      titleRu: String(b.titleRu ?? ""),
      titleKz: String(b.titleKz ?? ""),
      specialties: JSON.stringify(b.specialties ?? []),
      experience: Number(b.experience ?? 0),
      category: String(b.category ?? "highest"),
      branches: JSON.stringify(b.branches ?? []),
      rating: Number(b.rating ?? 4.9),
      reviewsCount: Number(b.reviewsCount ?? 0),
      price: Number(b.price ?? 0),
      bioRu: String(b.bioRu ?? ""),
      bioKz: String(b.bioKz ?? ""),
      educationRu: String(b.educationRu ?? ""),
      educationKz: String(b.educationKz ?? ""),
      photoUrl: b.photoUrl ? String(b.photoUrl) : null,
      published: b.published === undefined ? true : Boolean(b.published),
      sortOrder: Number(b.sortOrder ?? 0),
    },
  });
  return NextResponse.json(toClientDoctor(row));
}
