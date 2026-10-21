import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      author?: string;
      rating?: number;
      branchId?: string | null;
      doctorId?: string | null;
      text?: string;
    };
    if (!body.author || body.author.trim().length < 2) {
      return NextResponse.json({ error: "name" }, { status: 400 });
    }
    if (!body.text || body.text.trim().length < 5) {
      return NextResponse.json({ error: "text" }, { status: 400 });
    }
    const now = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    const review = await db.review.create({
      data: {
        author: body.author.trim().slice(0, 80),
        date: `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`,
        rating: Math.min(5, Math.max(1, Number(body.rating) || 5)),
        branchId: body.branchId || null,
        doctorId: body.doctorId || null,
        text: body.text.trim().slice(0, 2000),
        source: "site",
      },
    });
    return NextResponse.json({ id: review.id });
  } catch {
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
