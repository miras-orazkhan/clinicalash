"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, MessageCircle } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/alash/i18n";
import { L, consultPrice } from "@/lib/alash/types";
import { useContent, useClinic } from "./ContentProvider";

export interface BookingPrefill {
  doctorId?: string;
  specialtySlug?: string;
  branchId?: string;
}

interface BookingCtx {
  openBooking: (prefill?: BookingPrefill) => void;
}

const Ctx = createContext<BookingCtx>({ openBooking: () => {} });

export const useBooking = () => useContext(Ctx);

const SLOTS = [
  "9:00", "9:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00",
];

function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [prefill, setPrefill] = useState<BookingPrefill>({});

  const openBooking = useCallback((p?: BookingPrefill) => {
    setPrefill(p ?? {});
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ openBooking }), [openBooking]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <BookingDialog open={open} onOpenChange={setOpen} prefill={prefill} />
    </Ctx.Provider>
  );
}

function BookingDialog({
  open,
  onOpenChange,
  prefill,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  prefill: BookingPrefill;
}) {
  const { t, lang } = useI18n();
  const { doctors, branches, specialties } = useContent();
  const allSpecialtiesList = specialties;
  const { waLink } = useClinic();

  const preDoc = prefill.doctorId ? doctors.find((d) => d.id === prefill.doctorId) : undefined;
  const preSpec = prefill.specialtySlug ?? preDoc?.specialties[0];

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [spec, setSpec] = useState<string>(preSpec ?? "any");
  const [doc, setDoc] = useState<string>(prefill.doctorId ?? "any");
  const [branch, setBranch] = useState<string>(prefill.branchId ?? "any");
  const [date, setDate] = useState("");
  const [time, setTime] = useState<string>("10:00");
  const [errors, setErrors] = useState<string[]>([]);
  const [ticket, setTicket] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // Reset form state each time dialog opens with a new prefill
  const [lastOpen, setLastOpen] = useState(false);
  if (open && !lastOpen) {
    setLastOpen(true);
    setTicket(null);
    setErrors([]);
    setName("");
    setPhone("");
    const ps = prefill.specialtySlug ?? preDoc?.specialties[0];
    setSpec(ps ?? "any");
    setDoc(prefill.doctorId ?? "any");
    setBranch(prefill.branchId ?? "any");
    setDate("");
    setTime("10:00");
  } else if (!open && lastOpen) {
    setLastOpen(false);
  }

  const specValue = spec === "any" ? undefined : spec;
  const docOptions = useMemo(() => {
    if (specValue) return doctors.filter((d) => d.specialties.includes(specValue));
    return doctors;
  }, [specValue, doctors]);

  const docInvalid = doc !== "any" && !docOptions.some((d) => d.id === doc);
  const effectiveDoc = docInvalid ? "any" : doc;

  const digits = phone.replace(/\D/g, "");
  const phoneValid = digits.length >= 11 && digits.startsWith("7");
  const dateValid = !!date && date >= todayISO();

  const submit = async () => {
    const errs: string[] = [];
    if (name.trim().length < 2) errs.push(t("bk.errName"));
    if (!phoneValid) errs.push(t("bk.errPhone"));
    if (!dateValid) errs.push(t("bk.errDate"));
    setErrors(errs);
    if (errs.length) return;
    setSending(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          specSlug: specValue ?? null,
          doctorId: effectiveDoc === "any" ? null : effectiveDoc,
          branchId: branch === "any" ? null : branch,
          date,
          time,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { id: string };
      setTicket(data.id);
    } catch {
      setErrors([lang === "kz" ? "Сервер қатесі, кейінірек қайталаңыз" : "Ошибка сервера, попробуйте позже"]);
    } finally {
      setSending(false);
    }
  };

  const docName = effectiveDoc !== "any" ? L(doctors.find((d) => d.id === effectiveDoc)!.name, lang) : t("bk.doctorAny");
  const branchName = branch !== "any" ? L(branches.find((b) => b.id === branch)!.name, lang) : t("dp.allBranches");
  const specName = specValue ? L(specialties.find((s) => s.slug === specValue)!.name, lang) : t("bk.specAny");

  const waText = ticket
    ? t("bk.waText", { id: ticket, name: name.trim(), doctor: docName, branch: branchName, date, time, phone })
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        {ticket ? (
          <div className="py-2 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-primary" aria-hidden />
            <DialogHeader className="items-center">
              <DialogTitle className="text-xl">{t("bk.successTitle")}</DialogTitle>
              <DialogDescription className="max-w-sm">
                {t("bk.successText", { id: ticket })}
              </DialogDescription>
            </DialogHeader>
            <div className="mx-auto mt-4 w-full max-w-sm rounded-xl border bg-muted/40 p-4 text-left text-sm">
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                <span className="text-muted-foreground">{t("bk.spec")}:</span>
                <span className="font-medium">{specName}</span>
                <span className="text-muted-foreground">{t("bk.doctor")}:</span>
                <span className="font-medium">{docName}</span>
                <span className="text-muted-foreground">{t("bk.branch")}:</span>
                <span className="font-medium">{branchName}</span>
                <span className="text-muted-foreground">{t("bk.date")}:</span>
                <span className="font-medium">{date} · {time}</span>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-2.5">
              <a
                href={waLink(waText)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#1FA855] px-5 text-sm font-semibold text-white transition hover:bg-[#188a45]"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                {t("bk.waRepeat")}
              </a>
              <Button variant="outline" className="h-11 rounded-full" onClick={() => onOpenChange(false)}>
                {t("bk.close")}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">{t("bk.title")}</DialogTitle>
              <DialogDescription>{t("bk.sub")}</DialogDescription>
            </DialogHeader>
            <form
              className="mt-2 grid gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              <div className="grid gap-1.5">
                <Label htmlFor="bk-name">{t("bk.name")}</Label>
                <Input id="bk-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("bk.namePh")} autoComplete="name" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="bk-phone">{t("bk.phone")}</Label>
                <Input id="bk-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("bk.phonePh")} autoComplete="tel" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>{t("bk.spec")}</Label>
                  <Select value={spec} onValueChange={(v) => { setSpec(v); setDoc("any"); }}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value="any">{t("bk.specAny")}</SelectItem>
                      {allSpecialtiesList.map((s) => (
                        <SelectItem key={s.slug} value={s.slug}>{L(s.name, lang)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>{t("bk.doctor")}</Label>
                  <Select value={effectiveDoc} onValueChange={setDoc}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value="any">{t("bk.doctorAny")}</SelectItem>
                      {docOptions.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {L(d.name, lang)} · {consultPrice(d.price, lang)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>{t("bk.branch")}</Label>
                  <Select value={branch} onValueChange={setBranch}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">{t("dp.allBranches")}</SelectItem>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{L(b.name, lang)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="bk-date">{t("bk.date")}</Label>
                  <Input
                    id="bk-date"
                    type="date"
                    min={todayISO()}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>{t("bk.time")}</Label>
                <div className="flex flex-wrap gap-1.5">
                  {SLOTS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setTime(s)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        time === s
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              {errors.length > 0 && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  {errors.map((e, i) => (
                    <div key={i}>{e}</div>
                  ))}
                </div>
              )}
              <Button type="submit" disabled={sending} className="h-12 rounded-full text-sm font-semibold">
                {t("bk.submit")}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
