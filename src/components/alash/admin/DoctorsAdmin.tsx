"use client";

import React, { useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { asArray } from "@/lib/alash/admin-rows";
import { PhotoField, useAdminFetch } from "./AdminShell";

export interface DoctorRow {
  id: string;
  nameRu: string; nameKz: string;
  patronymicRu: string; patronymicKz: string;
  titleRu: string; titleKz: string;
  specialties: string[]; branches: string[];
  experience: number; category: string;
  rating: number; reviewsCount: number; price: number;
  bioRu: string; bioKz: string; educationRu: string; educationKz: string;
  photoUrl: string | null; published: boolean; sortOrder: number;
}

interface SpecRow { slug: string; nameRu: string; kind: string }
interface BranchRow { id: string; nameRu: string }

const EMPTY: DoctorRow = {
  id: "", nameRu: "", nameKz: "", patronymicRu: "", patronymicKz: "",
  titleRu: "", titleKz: "", specialties: [], branches: [],
  experience: 10, category: "highest", rating: 4.9, reviewsCount: 0, price: 10000,
  bioRu: "", bioKz: "", educationRu: "", educationKz: "",
  photoUrl: null, published: true, sortOrder: 0,
};

function MultiChips({
  options, value, onChange,
}: {
  options: { id: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== o.id) : [...value, o.id])}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              on ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:border-primary/40"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function DoctorForm({
  initial, specialties, branches, onSaved, onClose,
}: {
  initial: DoctorRow | null;
  specialties: SpecRow[];
  branches: BranchRow[];
  onSaved: () => void;
  onClose: () => void;
}) {
  const isNew = !initial;
  // защита от JSON-строк/мусора в specialties/branches (исторические данные, ручные правки БД)
  const [form, setForm] = useState<DoctorRow>(() => ({
    ...(initial ?? EMPTY),
    specialties: asArray<string>(initial?.specialties),
    branches: asArray<string>(initial?.branches),
  }));
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof DoctorRow>(k: K, v: DoctorRow[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.id.trim() || !form.nameRu.trim() || !form.titleRu.trim()) {
      alert("Заполните ID, ФИО и должность");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(isNew ? "/api/admin/doctors" : `/api/admin/doctors/${initial!.id}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        alert(data.error === "exists" ? "Врач с таким ID уже есть" : "Ошибка сохранения");
        return;
      }
      onSaved();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const field = (label: string, node: React.ReactNode, span = false) => (
    <div className={`grid gap-1.5 ${span ? "sm:col-span-2" : ""}`}>
      <Label>{label}</Label>
      {node}
    </div>
  );

  return (
    <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>{isNew ? "Новый врач" : `Врач: ${initial!.nameRu}`}</DialogTitle>
        <DialogDescription>Все поля редактируются на двух языках (RU / KZ)</DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        {field("ID (латиницей, используется в ссылках)", <Input value={form.id} disabled={!isNew} onChange={(e) => set("id", e.target.value)} placeholder="например, satybaldiyeva" />)}
        <div className="grid gap-1.5">
          <Label>Категория</Label>
          <Select value={form.category} onValueChange={(v) => set("category", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="highest">Высшая</SelectItem>
              <SelectItem value="first">Первая</SelectItem>
              <SelectItem value="second">Вторая</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {field("ФИО (RU)", <Input value={form.nameRu} onChange={(e) => set("nameRu", e.target.value)} placeholder="Айгерим Сатыбалдиева" />)}
        {field("ФИО (KZ)", <Input value={form.nameKz} onChange={(e) => set("nameKz", e.target.value)} />)}
        {field("Отчество (RU)", <Input value={form.patronymicRu} onChange={(e) => set("patronymicRu", e.target.value)} />)}
        {field("Әке аты (KZ)", <Input value={form.patronymicKz} onChange={(e) => set("patronymicKz", e.target.value)} />)}
        {field("Должность (RU)", <Input value={form.titleRu} onChange={(e) => set("titleRu", e.target.value)} placeholder="Кардиолог" />)}
        {field("Должность (KZ)", <Input value={form.titleKz} onChange={(e) => set("titleKz", e.target.value)} />)}

        {field("Специализации (направления)", (
          <MultiChips
            options={specialties.map((s) => ({ id: s.slug, label: s.nameRu }))}
            value={form.specialties}
            onChange={(v) => set("specialties", v)}
          />
        ), true)}

        {field("Филиалы приёма", (
          <MultiChips
            options={branches.map((b) => ({ id: b.id, label: b.nameRu }))}
            value={form.branches}
            onChange={(v) => set("branches", v)}
          />
        ), true)}

        {field("Стаж (лет)", <Input type="number" value={form.experience} onChange={(e) => set("experience", Number(e.target.value))} />)}
        {field("Цена консультации, ₸", <Input type="number" value={form.price} onChange={(e) => set("price", Number(e.target.value))} />)}
        {field("Рейтинг (1–5)", <Input type="number" step="0.1" min="1" max="5" value={form.rating} onChange={(e) => set("rating", Number(e.target.value))} />)}
        {field("Число отзывов", <Input type="number" value={form.reviewsCount} onChange={(e) => set("reviewsCount", Number(e.target.value))} />)}

        {field("О враче (RU)", <Textarea rows={4} value={form.bioRu} onChange={(e) => set("bioRu", e.target.value)} />, true)}
        {field("Дәрігер туралы (KZ)", <Textarea rows={4} value={form.bioKz} onChange={(e) => set("bioKz", e.target.value)} />, true)}
        {field("Образование (RU)", <Textarea rows={2} value={form.educationRu} onChange={(e) => set("educationRu", e.target.value)} />, true)}
        {field("Білімі (KZ)", <Textarea rows={2} value={form.educationKz} onChange={(e) => set("educationKz", e.target.value)} />, true)}

        <div className="sm:col-span-2">
          <PhotoField url={form.photoUrl} onChange={(u) => set("photoUrl", u)} label="Фотография врача (круглая на карточке)" />
        </div>

        <label className="flex items-center gap-2 text-sm font-medium">
          <Switch checked={form.published} onCheckedChange={(v) => set("published", v)} />
          Показывать на сайте
        </label>
      </div>

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button variant="outline" className="rounded-full" onClick={onClose}>Отмена</Button>
        <Button className="rounded-full font-semibold" disabled={busy} onClick={save}>
          {busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden />}
          Сохранить
        </Button>
      </div>
    </DialogContent>
  );
}

export function DoctorsAdmin() {
  const { toast } = useToast();
  const doctors = useAdminFetch<DoctorRow[]>("/api/admin/doctors");
  const specs = useAdminFetch<SpecRow[]>("/api/admin/specialties");
  const branches = useAdminFetch<BranchRow[]>("/api/admin/branches");
  const [editing, setEditing] = useState<DoctorRow | null>(null);
  const [open, setOpen] = useState(false);

  const remove = async (d: DoctorRow) => {
    if (!confirm(`Удалить врача «${d.nameRu}»?`)) return;
    await fetch(`/api/admin/doctors/${d.id}`, { method: "DELETE" });
    toast({ title: "Врач удалён" });
    void doctors.reload();
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold">Врачи ({doctors.data?.length ?? 0})</h1>
          <p className="text-sm text-muted-foreground">Добавляйте, редактируйте, загружайте фото или импортируйте списком из CSV</p>
        </div>
        <Button
          className="rounded-full font-semibold"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="mr-1 h-4 w-4" aria-hidden />
          Добавить врача
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Врач</th>
              <th className="px-4 py-3">Должность</th>
              <th className="px-4 py-3">Направления</th>
              <th className="px-4 py-3">Цена</th>
              <th className="px-4 py-3">На сайте</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {doctors.loading && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Загрузка…</td></tr>
            )}
            {doctors.data?.map((d) => (
              <tr key={d.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {d.photoUrl ? (
                      <img src={d.photoUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-bold">
                        {d.nameRu.slice(0, 2)}
                      </span>
                    )}
                    <span>
                      <b className="block">{d.nameRu} {d.patronymicRu}</b>
                      <span className="text-xs text-muted-foreground">{d.id} · {d.experience} лет · ★{d.rating}</span>
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">{d.titleRu}</td>
                <td className="max-w-56 px-4 py-3 text-xs text-muted-foreground">{asArray<string>(d.specialties).join(", ") || "—"}</td>
                <td className="whitespace-nowrap px-4 py-3">{d.price.toLocaleString("ru-RZ")} ₸</td>
                <td className="px-4 py-3">
                  {d.published ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">да</span> : <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">скрыт</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Редактировать" onClick={() => { setEditing(d); setOpen(true); }}>
                      <Pencil className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" aria-label="Удалить" onClick={() => void remove(d)}>
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DoctorForm
            initial={editing}
            specialties={specs.data ?? []}
            branches={branches.data ?? []}
            onSaved={() => {
              toast({ title: "Сохранено" });
              void doctors.reload();
            }}
            onClose={() => setOpen(false)}
          />
        </Dialog>
      )}
    </div>
  );
}
