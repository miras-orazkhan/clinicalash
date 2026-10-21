import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/alash/admin-auth";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const [rows, doctors, specialties, branches] = await Promise.all([
    db.booking.findMany({ orderBy: { createdAt: "desc" } }),
    db.doctor.findMany({ select: { id: true, nameRu: true } }),
    db.specialty.findMany({ select: { slug: true, nameRu: true } }),
    db.branch.findMany({ select: { id: true, nameRu: true } }),
  ]);
  return NextResponse.json({
    bookings: rows,
    doctors: Object.fromEntries(doctors.map((d) => [d.id, d.nameRu])),
    specialties: Object.fromEntries(specialties.map((s) => [s.slug, s.nameRu])),
    branches: Object.fromEntries(branches.map((b) => [b.id, b.nameRu])),
  });
}
