import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/alash/admin-auth";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const rows = await db.setting.findMany({ orderBy: { key: "asc" } });
  const images = await db.siteImage.findMany({ orderBy: { key: "asc" } });
  return NextResponse.json({
    settings: Object.fromEntries(rows.map((r) => [r.key, r.value])),
    images: Object.fromEntries(images.map((i) => [i.key, { url: i.url, altRu: i.altRu, altKz: i.altKz }])),
  });
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json()) as {
    settings?: Record<string, string>;
    images?: Record<string, { url: string; altRu?: string; altKz?: string }>;
  };
  let saved = 0;
  for (const [key, value] of Object.entries(body.settings ?? {})) {
    await db.setting.upsert({ where: { key }, update: { value: String(value) }, create: { key, value: String(value) } });
    saved++;
  }
  for (const [key, img] of Object.entries(body.images ?? {})) {
    if (!img?.url) continue;
    await db.siteImage.upsert({
      where: { key },
      update: { url: String(img.url), altRu: String(img.altRu ?? ""), altKz: String(img.altKz ?? "") },
      create: { key, url: String(img.url), altRu: String(img.altRu ?? ""), altKz: String(img.altKz ?? "") },
    });
    saved++;
  }
  return NextResponse.json({ saved });
}
