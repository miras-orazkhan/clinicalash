"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/alash/i18n";
import { L } from "@/lib/alash/types";
import { useContent } from "../ContentProvider";
import { Breadcrumbs, RatingStars } from "../ui-bits";

export function ReviewsPage() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const { toast } = useToast();
  const { reviews, branches, doctors } = useContent();

  const [sending, setSending] = useState(false);

  const [filterBranch, setFilterBranch] = useState("all");

  const [formName, setFormName] = useState("");
  const [formBranch, setFormBranch] = useState("any");
  const [formDoctor, setFormDoctor] = useState("any");
  const [formRating, setFormRating] = useState(5);
  const [formText, setFormText] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const all = reviews;

  const shown = useMemo(
    () =>
      (filterBranch === "all" ? all : all.filter((r) => r.branchId === filterBranch)).sort(
        (a, b) => b.date.localeCompare(a.date)
      ),
    [all, filterBranch]
  );

  const doctorName = (id?: string) => {
    if (!id) return null;
    const d = doctors.find((x) => x.id === id);
    return d ? L(d.name, lang) : null;
  };

  const branchName = (id?: string) => {
    if (!id) return null;
    const b = branches.find((x) => x.id === id);
    return b ? L(b.name, lang) : null;
  };

  const avg = all.length ? all.reduce((a, r) => a + r.rating, 0) / all.length : 0;

  const submit = async () => {
    const errs: string[] = [];
    if (formName.trim().length < 2) errs.push(t("rp.errName"));
    if (formText.trim().length < 10) errs.push(t("rp.errText"));
    setErrors(errs);
    if (errs.length) return;

    setSending(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: formName.trim(),
          rating: formRating,
          branchId: formBranch === "any" ? null : formBranch,
          doctorId: formDoctor === "any" ? null : formDoctor,
          text: formText.trim(),
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setFormName("");
      setFormText("");
      setFormRating(5);
      setFormDoctor("any");
      toast({ title: t("rp.thanks"), duration: 3500 });
      router.refresh();
    } catch {
      setErrors([lang === "kz" ? "Сервер қатесі, кейінірек қайталаңыз" : "Ошибка сервера, попробуйте позже"]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <Breadcrumbs items={[{ label: t("bc.home"), href: "/" }, { label: t("bc.reviews") }]} />

      <div className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">{t("rp.title")}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left: list */}
        <div>
          {/* Summary + filter */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-5">
            <div className="flex items-center gap-4">
              <p className="text-4xl font-extrabold">{avg.toFixed(1)}</p>
              <div>
                <RatingStars value={avg} className="h-4.5 w-4.5" />
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("rp.basedOn", { n: all.length })}
                </p>
              </div>
            </div>
            <div className="w-full sm:w-52">
              <Select value={filterBranch} onValueChange={setFilterBranch}>
                <SelectTrigger className="h-10 w-full rounded-xl" aria-label={t("rp.formBranch")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("rp.allBranches")}</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{L(b.name, lang)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {shown.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              {t("rp.empty")}
            </div>
          ) : (
            <ul className="space-y-4">
              {shown.map((r) => (
                <li key={r.id} className="rounded-2xl border bg-card p-5 sm:p-6">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 text-xs font-bold text-teal-800">
                      {r.author[0].toUpperCase()}
                    </span>
                    <b className="text-sm">{r.author}</b>
                    <RatingStars value={r.rating} />
                    <span className="text-xs text-muted-foreground">
                      {r.date.split("-")[2]} {t(`month.${Number(r.date.split("-")[1]) - 1}` as never)} {r.date.split("-")[0]}
                    </span>
                    {r.local && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                        {t("rp.leave")}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/90">{r.text}</p>
                  {(doctorName(r.doctorId) || branchName(r.branchId)) && (
                    <p className="mt-3 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      {doctorName(r.doctorId) && <span>{t("bk.doctor")}: {doctorName(r.doctorId)}</span>}
                      {branchName(r.branchId) && <span>{t("bk.branch")}: {branchName(r.branchId)}</span>}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right: form */}
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="rounded-2xl border bg-card p-5 sm:p-6">
            <h2 className="text-lg font-bold">{t("rp.formTitle")}</h2>
            <form
              className="mt-4 grid gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              <div className="grid gap-1.5">
                <Label htmlFor="rv-name">{t("rp.formName")}</Label>
                <Input id="rv-name" value={formName} onChange={(e) => setFormName(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>{t("rp.formBranch")}</Label>
                <Select value={formBranch} onValueChange={setFormBranch}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">{t("rp.allBranches")}</SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{L(b.name, lang)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>{t("rp.formDoctor")}</Label>
                <Select value={formDoctor} onValueChange={setFormDoctor}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    <SelectItem value="any">{t("rp.formDoctorAny")}</SelectItem>
                    {doctors.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{L(d.name, lang)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>{t("rp.formRating")}</Label>
                <div className="flex gap-1" role="radiogroup" aria-label={t("rp.formRating")}>
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button
                      key={v}
                      type="button"
                      role="radio"
                      aria-checked={formRating === v}
                      aria-label={`${v} / 5`}
                      onClick={() => setFormRating(v)}
                      className="rounded-lg p-1.5 transition hover:bg-muted"
                    >
                      <Star className={`h-6 w-6 transition ${v <= formRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="rv-text">{t("rp.formText")}</Label>
                <Textarea id="rv-text" rows={4} value={formText} onChange={(e) => setFormText(e.target.value)} placeholder={t("rp.formTextPh")} />
              </div>
              {errors.length > 0 && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  {errors.map((e, i) => (
                    <div key={i}>{e}</div>
                  ))}
                </div>
              )}
              <Button type="submit" disabled={sending} className="h-12 rounded-full text-sm font-semibold">
                {t("rp.submit")}
              </Button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}
