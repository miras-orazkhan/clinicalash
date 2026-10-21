import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/alash/admin-auth";
import { ruDict } from "@/lib/alash/dicts";

/** GET: все редактируемые тексты поверх встроенных (для редактора) */
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const rows = await db.siteText.findMany({ orderBy: { key: "asc" } });
  const map = new Map(rows.map((r) => [r.key, { valueRu: r.valueRu, valueKz: r.valueKz }]));
  const keys = [...new Set([...Object.keys(ruDict), ...map.keys()])].sort();
  return NextResponse.json(
    keys.map((key) => ({
      key,
      valueRu: map.get(key)?.valueRu ?? (ruDict as Record<string, string>)[key] ?? "",
      valueKz: map.get(key)?.valueKz ?? "",
      overridden: map.has(key),
    }))
  );
}

/** PUT: пакетное сохранение { items: [{key, valueRu, valueKz}] } */
export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { items } = (await req.json()) as {
    items: { key: string; valueRu: string; valueKz: string }[];
  };
  if (!Array.isArray(items)) return NextResponse.json({ error: "items required" }, { status: 400 });
  let saved = 0;
  for (const it of items) {
    if (!it.key) continue;
    await db.siteText.upsert({
      where: { key: it.key },
      update: { valueRu: String(it.valueRu ?? ""), valueKz: String(it.valueKz ?? "") },
      create: { key: it.key, valueRu: String(it.valueRu ?? ""), valueKz: String(it.valueKz ?? "") },
    });
    saved++;
  }
  return NextResponse.json({ saved });
}
