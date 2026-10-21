"use client";

import React, { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useI18n, reviewWord } from "@/lib/alash/i18n";
import { L } from "@/lib/alash/types";
import { useContent } from "../ContentProvider";
import { DoctorCard } from "../DoctorCard";
import { Breadcrumbs } from "../ui-bits";
import type { DictKey } from "@/lib/alash/i18n";

type Sort = "rating" | "exp" | "priceAsc" | "priceDesc";

export function DoctorsPage() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQ = searchParams.get("q") ?? "";
  const urlBranch = searchParams.get("branch") ?? "all";
  const urlSpec = searchParams.get("spec") ?? "all";
  const { doctors, branches, specialties } = useContent();

  const [q, setQ] = useState(urlQ);
  const [branch, setBranch] = useState<string>(urlBranch);
  const [spec, setSpec] = useState<string>(urlSpec);
  const [sort, setSort] = useState<Sort>("rating");

  const norm = (x: string) => x.toLowerCase().replace(/ё/g, "е");
  const s = norm(q.trim());

  const filtered = useMemo(() => {
    let list = [...doctors];
    if (branch !== "all") list = list.filter((d) => d.branches.includes(branch));
    if (spec !== "all") list = list.filter((d) => d.specialties.includes(spec));
    if (s.length >= 2) {
      list = list.filter((d) => {
        const name = norm(L(d.name, "ru")) + " " + norm(L(d.name, "kz"));
        const title = norm(L(d.title, "ru")) + " " + norm(L(d.title, "kz"));
        const specs = d.specialties
          .map((sl) => specialties.find((sp) => sp.slug === sl))
          .filter(Boolean)
          .map((sp) => norm(L(sp!.name, "ru")) + " " + norm(L(sp!.name, "kz")))
          .join(" ");
        return name.includes(s) || title.includes(s) || specs.includes(s);
      });
    }
    switch (sort) {
      case "rating": list.sort((a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount); break;
      case "exp": list.sort((a, b) => b.experience - a.experience); break;
      case "priceAsc": list.sort((a, b) => a.price - b.price); break;
      case "priceDesc": list.sort((a, b) => b.price - a.price); break;
    }
    return list;
  }, [s, branch, spec, sort, doctors, specialties]);

  const hasFilters = branch !== "all" || spec !== "all" || q.trim().length > 0;

  const reset = () => {
    setQ("");
    setBranch("all");
    setSpec("all");
    setSort("rating");
    router.push("/doctors");
  };

  const totalReviews = filtered.reduce((a, d) => a + d.reviewsCount, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <Breadcrumbs items={[{ label: t("bc.home"), href: "/" }, { label: t("bc.doctors") }]} />

      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">{t("dp.title")}</h1>
      </div>

      {/* Filters bar */}
      <div className="mb-6 rounded-2xl border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("dp.search")}
              className="h-11 w-full rounded-xl border bg-muted/40 pl-10 pr-4 text-sm outline-none transition focus:border-primary/50 focus:bg-white"
              aria-label={t("dp.search")}
            />
          </div>

          <Select value={branch} onValueChange={setBranch}>
            <SelectTrigger className="h-11 w-full rounded-xl" aria-label={t("dp.fBranch")}>
              <SelectValue placeholder={t("dp.fBranch")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("dp.allBranches")}</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>{L(b.name, lang)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={spec} onValueChange={setSpec}>
            <SelectTrigger className="h-11 w-full rounded-xl" aria-label={t("dp.fSpec")}>
              <SelectValue placeholder={t("dp.fSpec")} />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">{t("dp.allSpecs")}</SelectItem>
              {specialties.map((sp) => (
                <SelectItem key={sp.slug} value={sp.slug}>{L(sp.name, lang)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-3">
            <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
              <SelectTrigger className="h-11 w-full rounded-xl" aria-label={t("dp.sort")}>
                <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">{t("sort.rating")}</SelectItem>
                <SelectItem value="exp">{t("sort.exp")}</SelectItem>
                <SelectItem value="priceAsc">{t("sort.priceAsc")}</SelectItem>
                <SelectItem value="priceDesc">{t("sort.priceDesc")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <p className="text-sm text-muted-foreground">
            {q.trim().length >= 2 && <b className="text-foreground">{t("dp.resultsFor", { q: q.trim() })} · </b>}
            {t("dp.found", { n: filtered.length })}
            {filtered.length > 0 && (
              <span className="ml-1.5 text-xs">
                ({totalReviews} {reviewWord(totalReviews, lang).toLowerCase()})
              </span>
            )}
          </p>
          {hasFilters && (
            <button
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-primary"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              {t("dp.reset")}
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center">
          <p className="text-lg font-bold">{t("dp.empty")}</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{t("dp.emptySub")}</p>
          <button
            onClick={reset}
            className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            {t("dp.reset")}
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => (
            <DoctorCard key={d.id} doctor={d} />
          ))}
        </div>
      )}
    </div>
  );
}
