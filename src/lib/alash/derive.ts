/** Производные выборки — чистые функции поверх массивов контента (клиент-безопасно) */
import type { Branch, Doctor, Specialty } from "./types";

export const doctorByIdFrom = (list: Doctor[], id: string): Doctor | undefined => list.find((d) => d.id === id);
export const branchByIdFrom = (list: Branch[], id: string): Branch | undefined => list.find((b) => b.id === id);
export const specialtyBySlugFrom = (list: Specialty[], slug: string): Specialty | undefined =>
  list.find((s) => s.slug === slug);

export const doctorsBySpecialtyFrom = (doctors: Doctor[], slug: string): Doctor[] =>
  doctors.filter((d) => d.specialties.includes(slug));

export const doctorsByBranchFrom = (doctors: Doctor[], id: string): Doctor[] =>
  doctors.filter((d) => d.branches.includes(id));

export const minPriceOfFrom = (s?: Specialty): number | undefined => {
  const prices = s?.services.map((x) => x.price).filter((p) => p > 0) ?? [];
  return prices.length ? Math.min(...prices) : undefined;
};

export const totalReviewsCountFrom = (doctors: Doctor[]): number =>
  doctors.reduce((acc, d) => acc + d.reviewsCount, 0);

export const avgRatingFrom = (doctors: Doctor[]): number =>
  doctors.length ? Math.round((doctors.reduce((acc, d) => acc + d.rating, 0) / doctors.length) * 10) / 10 : 0;
