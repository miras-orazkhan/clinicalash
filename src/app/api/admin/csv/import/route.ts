import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/alash/admin-auth";
import { csvToObjects } from "@/lib/alash/csv";

/**
 * POST multipart/form-data { file, type }
 * type: doctors | specialties | services | branches | reviews | faq
 * Строки обновляются по id/slug, отсутствующие — создаются.
 */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  const type = String(form.get("type") ?? "");
  if (!(file instanceof File)) return NextResponse.json({ error: "file required" }, { status: 400 });

  const text = await file.text();
  const rows = csvToObjects(text);
  if (!rows.length) return NextResponse.json({ error: "empty file" }, { status: 400 });

  let created = 0;
  let updated = 0;
  const errors: string[] = [];
  const isTrue = (v: string) => v === "1" || v.toLowerCase() === "true" || v.toLowerCase() === "да";

  try {
    if (type === "doctors") {
      for (const [i, r] of rows.entries()) {
        const id = (r.id ?? "").trim();
        if (!id) { errors.push(`строка ${i + 2}: пустой id`); continue; }
        const data = {
          nameRu: r.name_ru ?? "", nameKz: r.name_kz || r.name_ru || "",
          patronymicRu: r.patronymic_ru ?? "", patronymicKz: r.patronymic_kz ?? "",
          titleRu: r.title_ru ?? "", titleKz: r.title_kz || r.title_ru || "",
          specialties: JSON.stringify((r.specialties ?? "").split("|").map((x) => x.trim()).filter(Boolean)),
          experience: Number(r.experience ?? 0) || 0,
          category: r.category || "highest",
          branches: JSON.stringify((r.branches ?? "").split("|").map((x) => x.trim()).filter(Boolean)),
          rating: Number(r.rating ?? 4.9) || 4.9,
          reviewsCount: Number(r.reviews_count ?? 0) || 0,
          price: Number(r.price ?? 0) || 0,
          bioRu: r.bio_ru ?? "", bioKz: r.bio_kz ?? "",
          educationRu: r.education_ru ?? "", educationKz: r.education_kz ?? "",
          photoUrl: r.photo_url || null,
          published: r.published === undefined ? true : isTrue(r.published),
        };
        const exists = await db.doctor.findUnique({ where: { id } });
        if (exists) { await db.doctor.update({ where: { id }, data }); updated++; }
        else { await db.doctor.create({ data: { id, ...data } }); created++; }
      }
    } else if (type === "specialties") {
      for (const [i, r] of rows.entries()) {
        const slug = (r.slug ?? "").trim();
        if (!slug) { errors.push(`строка ${i + 2}: пустой slug`); continue; }
        const data = {
          kind: r.kind || "specialty",
          icon: r.icon || "Stethoscope",
          nameRu: r.name_ru ?? "", nameKz: r.name_kz || r.name_ru || "",
          shortRu: r.short_ru ?? "", shortKz: r.short_kz ?? "",
          descRu: r.desc_ru ?? "", descKz: r.desc_kz ?? "",
          featured: r.featured === undefined ? false : isTrue(r.featured),
          published: r.published === undefined ? true : isTrue(r.published),
        };
        const exists = await db.specialty.findUnique({ where: { slug } });
        if (exists) { await db.specialty.update({ where: { slug }, data }); updated++; }
        else { await db.specialty.create({ data: { slug, ...data } }); created++; }
      }
    } else if (type === "services") {
      // группируем по specialty_slug и заменяем список услуг целиком
      const bySpec = new Map<string, { name: { ru: string; kz: string }; price: number; note?: { ru: string; kz: string } }[]>();
      for (const [i, r] of rows.entries()) {
        const slug = (r.specialty_slug ?? "").trim();
        if (!slug) { errors.push(`строка ${i + 2}: пустой specialty_slug`); continue; }
        if (!bySpec.has(slug)) bySpec.set(slug, []);
        bySpec.get(slug)!.push({
          name: { ru: r.name_ru ?? "", kz: r.name_kz || r.name_ru || "" },
          price: Number(r.price ?? 0) || 0,
          note: r.note_ru || r.note_kz ? { ru: r.note_ru ?? "", kz: r.note_kz ?? "" } : undefined,
        });
      }
      for (const [slug, services] of bySpec) {
        const exists = await db.specialty.findUnique({ where: { slug } });
        if (!exists) { errors.push(`специализация «${slug}» не найдена`); continue; }
        await db.specialty.update({ where: { slug }, data: { services: JSON.stringify(services) } });
        updated++;
      }
    } else if (type === "branches") {
      for (const [i, r] of rows.entries()) {
        const id = (r.id ?? "").trim();
        if (!id) { errors.push(`строка ${i + 2}: пустой id`); continue; }
        const data = {
          nameRu: r.name_ru ?? "", nameKz: r.name_kz || r.name_ru || "",
          districtRu: r.district_ru ?? "", districtKz: r.district_kz ?? "",
          addressRu: r.address_ru ?? "", addressKz: r.address_kz ?? "",
          phone: r.phone ?? "",
          hours: r.hours ? JSON.stringify(JSON.parse(r.hours)) : "[]",
          descRu: r.desc_ru ?? "", descKz: r.desc_kz ?? "",
          highlights: r.highlights ? JSON.stringify(JSON.parse(r.highlights)) : "[]",
          landmarkRu: r.landmark_ru ?? "", landmarkKz: r.landmark_kz ?? "",
          mapUrl: r.map_url ?? "",
          photoUrl: r.photo_url || null,
          published: r.published === undefined ? true : isTrue(r.published),
        };
        const exists = await db.branch.findUnique({ where: { id } });
        if (exists) { await db.branch.update({ where: { id }, data }); updated++; }
        else { await db.branch.create({ data: { id, ...data } }); created++; }
      }
    } else if (type === "reviews") {
      for (const [i, r] of rows.entries()) {
        const data = {
          author: (r.author ?? "").slice(0, 80),
          date: r.date || new Date().toISOString().slice(0, 10),
          rating: Math.min(5, Math.max(1, Number(r.rating ?? 5) || 5)),
          branchId: r.branch_id || null,
          doctorId: r.doctor_id || null,
          text: (r.text ?? "").slice(0, 2000),
          source: "imported",
        };
        if (r.id) {
          const exists = await db.review.findUnique({ where: { id: r.id } });
          if (exists) { await db.review.update({ where: { id: r.id }, data }); updated++; }
          else { await db.review.create({ data: { id: r.id, ...data } }); created++; }
        } else {
          if (!data.author || !data.text) { errors.push(`строка ${i + 2}: нужны author и text`); continue; }
          await db.review.create({ data }); created++;
        }
      }
    } else if (type === "faq") {
      for (const [i, r] of rows.entries()) {
        const data = {
          qRu: r.q_ru ?? "", qKz: r.q_kz ?? "", aRu: r.a_ru ?? "", aKz: r.a_kz ?? "",
          published: r.published === undefined ? true : isTrue(r.published),
        };
        if (r.id) {
          const exists = await db.faqItem.findUnique({ where: { id: r.id } });
          if (exists) { await db.faqItem.update({ where: { id: r.id }, data }); updated++; }
          else { await db.faqItem.create({ data: { id: r.id, ...data } }); created++; }
        } else {
          await db.faqItem.create({ data }); created++;
        }
      }
    } else {
      return NextResponse.json({ error: "unknown type" }, { status: 400 });
    }
  } catch (e) {
    errors.push(`ошибка обработки: ${e instanceof Error ? e.message : String(e)}`);
  }

  return NextResponse.json({ created, updated, errors, total: rows.length });
}
