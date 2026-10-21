import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/alash/admin-auth";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const rows = await db.faqItem.findMany({ orderBy: [{ sortOrder: "asc" }] });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = (await req.json()) as Record<string, unknown>;
  const max = await db.faqItem.aggregate({ _max: { sortOrder: true } });
  const row = await db.faqItem.create({
    data: {
      qRu: String(b.qRu ?? ""),
      qKz: String(b.qKz ?? ""),
      aRu: String(b.aRu ?? ""),
      aKz: String(b.aKz ?? ""),
      published: b.published === undefined ? true : Boolean(b.published),
      sortOrder: (max._max.sortOrder ?? 0) + 1,
    },
  });
  return NextResponse.json(row);
}
