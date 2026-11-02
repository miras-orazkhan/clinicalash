import { NextResponse } from "next/server";
import { getPayloadClient } from "@/lib/alash/payloadClient";

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

    const payload = await getPayloadClient();

    const slugToId = async (
      slug: string | null | undefined,
      collection: "doctors" | "branches",
    ): Promise<number | undefined> => {
      if (!slug) return undefined;
      const hit = await payload.find({
        collection,
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      });
      return (hit.docs[0]?.id as number) ?? undefined;
    };

    const [doctorId, branchId] = await Promise.all([
      slugToId(body.doctorId, "doctors"),
      slugToId(body.branchId, "branches"),
    ]);

    const now = new Date();
    const p = (n: number) => String(n).padStart(2, "0");

    const review = await payload.create({
      collection: "reviews",
      data: {
        author: body.author.trim().slice(0, 80),
        date: `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`,
        rating: Math.min(5, Math.max(1, Number(body.rating) || 5)),
        doctor: doctorId as never,
        branch: branchId as never,
        text: body.text.trim().slice(0, 2000),
        source: "site",
      },
      overrideAccess: true,
    });

    return NextResponse.json({ id: String(review.id) });
  } catch {
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
