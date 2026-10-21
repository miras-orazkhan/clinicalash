import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/alash/admin-auth";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const rows = await db.review.findMany({ orderBy: [{ date: "desc" }, { createdAt: "desc" }] });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = (await req.json()) as Record<string, unknown>;
  const now = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  const row = await db.review.create({
    data: {
      author: String(b.author ?? "").slice(0, 80),
      date: String(b.date ?? `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`),
      rating: Math.min(5, Math.max(1, Number(b.rating ?? 5))),
      branchId: b.branchId ? String(b.branchId) : null,
      doctorId: b.doctorId ? String(b.doctorId) : null,
      text: String(b.text ?? "").slice(0, 2000),
      source: "site",
    },
  });
  return NextResponse.json(row);
}
