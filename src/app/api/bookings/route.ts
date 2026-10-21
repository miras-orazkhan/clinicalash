import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      name?: string;
      phone?: string;
      specSlug?: string | null;
      doctorId?: string | null;
      branchId?: string | null;
      date?: string;
      time?: string;
    };
    if (!body.name || body.name.trim().length < 2) {
      return NextResponse.json({ error: "name" }, { status: 400 });
    }
    const digits = (body.phone ?? "").replace(/\D/g, "");
    if (digits.length < 10) {
      return NextResponse.json({ error: "phone" }, { status: 400 });
    }
    const n = Date.now().toString().slice(-4);
    const id = `АЛШ-${1000 + Number(n) % 9000}${String(Math.floor(Math.random() * 90) + 10)}`;
    const booking = await db.booking.create({
      data: {
        id,
        name: body.name.trim().slice(0, 120),
        phone: body.phone!.trim().slice(0, 40),
        specSlug: body.specSlug || null,
        doctorId: body.doctorId || null,
        branchId: body.branchId || null,
        date: body.date ?? "",
        time: body.time ?? "",
      },
    });
    return NextResponse.json({ id: booking.id });
  } catch {
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
