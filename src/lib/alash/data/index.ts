export * from "./branches";
export * from "./doctors";
export * from "./procedures";
export * from "./specialties";
export * from "./reviews";
export * from "./faq";

import { branches } from "./branches";
import { doctors } from "./doctors";
import { procedures } from "./procedures";
import { specialties } from "./specialties";
import { reviews } from "./reviews";

export const allSpecialties: typeof specialties = [...procedures, ...specialties];

export const featuredSpecialties = allSpecialties.filter((s) => s.featured);

export const specialtyBySlugAll = (slug: string) => allSpecialties.find((s) => s.slug === slug);

export const minPriceOf = (slug: string): number | undefined => {
  const sp = specialtyBySlugAll(slug);
  const prices = sp?.services.map((s) => s.price).filter((p) => p > 0) ?? [];
  return prices.length ? Math.min(...prices) : undefined;
};

export const totalReviewsCount = doctors.reduce((acc, d) => acc + d.reviewsCount, 0);

export const avgRating =
  Math.round((doctors.reduce((acc, d) => acc + d.rating, 0) / doctors.length) * 10) / 10;

export { branches, doctors, procedures, specialties, reviews };
