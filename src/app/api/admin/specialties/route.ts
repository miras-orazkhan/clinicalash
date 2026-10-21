import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/alash/admin-auth";
import { toClientSpecialty } from "@/lib/alash/admin-rows";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const rows = await db.specialty.findMany({ orderBy: [{ sortOrder: "asc" }, { nameRu: "asc" }] });
  return NextResponse.json(rows.map(toClientSpecialty));
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = (await req.json()) as Record<string, unknown>;
  const slug = String(b.slug ?? "").trim();
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });
  const exists = await db.specialty.findUnique({ where: { slug } });
  if (exists) return NextResponse.json({ error: "exists" }, { status: 409 });
  const row = await db.specialty.create({
    data: {
      slug,
      kind: String(b.kind ?? "specialty"),
      icon: String(b.icon ?? "Stethoscope"),
      nameRu: String(b.nameRu ?? ""),
      nameKz: String(b.nameKz ?? b.nameRu ?? ""),
      shortRu: String(b.shortRu ?? ""),
      shortKz: String(b.shortKz ?? ""),
      descRu: String(b.descRu ?? ""),
      descKz: String(b.descKz ?? ""),
      featured: Boolean(b.featured),
      published: b.published === undefined ? true : Boolean(b.published),
      services: JSON.stringify(b.services ?? []),
      sortOrder: Number(b.sortOrder ?? 0),
    },
  });
  return NextResponse.json(toClientSpecialty(row));
}
