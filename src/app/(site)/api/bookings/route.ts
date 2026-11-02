import { NextResponse } from "next/server";
import { getPayloadClient } from "@/lib/alash/payloadClient";

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

    const n = Date.now().toString().slice(-4);
    const ticket = `АЛШ-${1000 + (Number(n) % 9000)}${String(Math.floor(Math.random() * 90) + 10)}`;

    await payload.create({
      collection: "bookings",
      data: {
        ticket,
        name: body.name.trim().slice(0, 120),
        phone: body.phone!.trim().slice(0, 40),
        specSlug: body.specSlug || null,
        doctor: doctorId as never,
        branch: branchId as never,
        date: body.date ?? "",
        time: body.time ?? "",
        status: "new",
      },
      overrideAccess: true,
    });

    return NextResponse.json({ id: ticket });
  } catch {
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
