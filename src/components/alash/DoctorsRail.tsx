"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DoctorCard } from "./DoctorCard";
import type { Doctor } from "@/lib/alash/types";

/**
 * Горизонтальный слайдер карточек врачей (snap-scroll).
 * На мобильных — свайп, на десктопе — стрелки; карточки фиксированной ширины,
 * поэтому ФИО и данные всегда помещаются.
 */
export function DoctorsRail({
  title,
  titleId,
  doctors,
}: {
  title: React.ReactNode;
  titleId?: string;
  doctors: Doctor[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update, doctors.length]);

  const scrollByCards = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const card = el.querySelector(":scope > div");
    const step = card ? card.getBoundingClientRect().width + 16 : 356;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  if (doctors.length === 0) return null;

  return (
    <section aria-label={typeof title === "string" ? title : undefined}>
      <div className="flex items-center justify-between gap-3">
        <h2 id={titleId} className="text-xl font-extrabold tracking-tight sm:text-2xl">
          {title}
        </h2>
        <div className="hidden shrink-0 gap-2 md:flex">
          <button
            type="button"
            aria-label="Прокрутить назад"
            onClick={() => scrollByCards(-1)}
            disabled={!canLeft}
            className="flex h-10 w-10 items-center justify-center rounded-full border bg-card text-foreground transition hover:border-primary/40 hover:text-primary disabled:cursor-default disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Прокрутить вперёд"
            onClick={() => scrollByCards(1)}
            disabled={!canRight}
            className="flex h-10 w-10 items-center justify-center rounded-full border bg-card text-foreground transition hover:border-primary/40 hover:text-primary disabled:cursor-default disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>

      <div
        ref={ref}
        className="no-scrollbar -mx-4 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-1"
      >
        {doctors.map((d) => (
          <div key={d.id} className="w-[84vw] max-w-[360px] shrink-0 snap-start sm:w-[350px]">
            <DoctorCard doctor={d} />
          </div>
        ))}
      </div>
    </section>
  );
}
