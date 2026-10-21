import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/alash/admin-auth";
import { objectsToCsv } from "@/lib/alash/csv";

export const DOCTOR_COLUMNS = [
  "id", "name_ru", "name_kz", "patronymic_ru", "patronymic_kz", "title_ru", "title_kz",
  "specialties", "experience", "category", "branches", "rating", "reviews_count", "price",
  "bio_ru", "bio_kz", "education_ru", "education_kz", "photo_url", "published",
];
export const SPECIALTY_COLUMNS = [
  "slug", "kind", "icon", "name_ru", "name_kz", "short_ru", "short_kz", "desc_ru", "desc_kz",
  "featured", "published",
];
export const SERVICE_COLUMNS = [
  "specialty_slug", "name_ru", "name_kz", "price", "note_ru", "note_kz", "sort_order",
];
export const BRANCH_COLUMNS = [
  "id", "name_ru", "name_kz", "district_ru", "district_kz", "address_ru", "address_kz",
  "phone", "hours", "desc_ru", "desc_kz", "highlights", "landmark_ru", "landmark_kz",
  "map_url", "photo_url", "published",
];
export const REVIEW_COLUMNS = ["id", "author", "date", "rating", "branch_id", "doctor_id", "text"];
export const FAQ_COLUMNS = ["id", "q_ru", "q_kz", "a_ru", "a_kz", "published"];

const b = (v: boolean) => (v ? "1" : "0");
const j = (s: string) => {
  try {
    return JSON.stringify(JSON.parse(s));
  } catch {
    return s;
  }
};

export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const type = new URL(req.url).searchParams.get("type") ?? "";
  let csv = "";
  let name = "export.csv";

  if (type === "doctors") {
    const rows = await db.doctor.findMany({ orderBy: { sortOrder: "asc" } });
    csv = objectsToCsv(
      rows.map((d) => ({
        id: d.id, name_ru: d.nameRu, name_kz: d.nameKz, patronymic_ru: d.patronymicRu,
        patronymic_kz: d.patronymicKz, title_ru: d.titleRu, title_kz: d.titleKz,
        specialties: (JSON.parse(d.specialties || "[]") as string[]).join("|"),
        experience: String(d.experience), category: d.category,
        branches: (JSON.parse(d.branches || "[]") as string[]).join("|"),
        rating: String(d.rating), reviews_count: String(d.reviewsCount), price: String(d.price),
        bio_ru: d.bioRu, bio_kz: d.bioKz, education_ru: d.educationRu, education_kz: d.educationKz,
        photo_url: d.photoUrl ?? "", published: b(d.published),
      })),
      DOCTOR_COLUMNS, ";"
    );
    name = "doctors.csv";
  } else if (type === "specialties") {
    const rows = await db.specialty.findMany({ orderBy: { sortOrder: "asc" } });
    csv = objectsToCsv(
      rows.map((s) => ({
        slug: s.slug, kind: s.kind, icon: s.icon, name_ru: s.nameRu, name_kz: s.nameKz,
        short_ru: s.shortRu, short_kz: s.shortKz, desc_ru: s.descRu, desc_kz: s.descKz,
        featured: b(s.featured), published: b(s.published),
      })),
      SPECIALTY_COLUMNS, ";"
    );
    name = "specialties.csv";
  } else if (type === "services") {
    const rows = await db.specialty.findMany({ orderBy: { sortOrder: "asc" } });
    const items: Record<string, string>[] = [];
    for (const s of rows) {
      const services = JSON.parse(s.services || "[]") as { name: { ru: string; kz: string }; price: number; note?: { ru: string; kz: string } }[];
      services.forEach((svc, i) => {
        items.push({
          specialty_slug: s.slug, name_ru: svc.name?.ru ?? "", name_kz: svc.name?.kz ?? "",
          price: String(svc.price ?? 0), note_ru: svc.note?.ru ?? "", note_kz: svc.note?.kz ?? "",
          sort_order: String(i),
        });
      });
    }
    csv = objectsToCsv(items, SERVICE_COLUMNS, ";");
    name = "services.csv";
  } else if (type === "branches") {
    const rows = await db.branch.findMany({ orderBy: { sortOrder: "asc" } });
    csv = objectsToCsv(
      rows.map((x) => ({
        id: x.id, name_ru: x.nameRu, name_kz: x.nameKz, district_ru: x.districtRu, district_kz: x.districtKz,
        address_ru: x.addressRu, address_kz: x.addressKz, phone: x.phone, hours: j(x.hours),
        desc_ru: x.descRu, desc_kz: x.descKz, highlights: j(x.highlights),
        landmark_ru: x.landmarkRu, landmark_kz: x.landmarkKz, map_url: x.mapUrl,
        photo_url: x.photoUrl ?? "", published: b(x.published),
      })),
      BRANCH_COLUMNS, ";"
    );
    name = "branches.csv";
  } else if (type === "reviews") {
    const rows = await db.review.findMany({ orderBy: { date: "desc" } });
    csv = objectsToCsv(
      rows.map((r) => ({
        id: r.id, author: r.author, date: r.date, rating: String(r.rating),
        branch_id: r.branchId ?? "", doctor_id: r.doctorId ?? "", text: r.text,
      })),
      REVIEW_COLUMNS, ";"
    );
    name = "reviews.csv";
  } else if (type === "faq") {
    const rows = await db.faqItem.findMany({ orderBy: { sortOrder: "asc" } });
    csv = objectsToCsv(
      rows.map((f) => ({
        id: f.id, q_ru: f.qRu, q_kz: f.qKz, a_ru: f.aRu, a_kz: f.aKz, published: b(f.published),
      })),
      FAQ_COLUMNS, ";"
    );
    name = "faq.csv";
  } else {
    return NextResponse.json({ error: "unknown type" }, { status: 400 });
  }

  return new NextResponse("\uFEFF" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
    },
  });
}
