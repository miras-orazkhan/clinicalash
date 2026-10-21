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
import { useAdminFetch } from "./AdminShell";

export interface ServiceItem { name: { ru: string; kz: string }; price: number; note?: { ru: string; kz: string } }
export interface SpecialtyRow {
  slug: string; kind: string; icon: string;
  nameRu: string; nameKz: string; shortRu: string; shortKz: string; descRu: string; descKz: string;
  featured: boolean; published: boolean; sortOrder: number; services: ServiceItem[];
}

const EMPTY: SpecialtyRow = {
  slug: "", kind: "specialty", icon: "Stethoscope",
  nameRu: "", nameKz: "", shortRu: "", shortKz: "", descRu: "", descKz: "",
  featured: false, published: true, sortOrder: 0, services: [],
};

function ServicesEditor({ services, onChange }: { services: ServiceItem[]; onChange: (s: ServiceItem[]) => void }) {
  return (
    <div className="sm:col-span-2">
      <div className="mb-2 flex items-center justify-between">
        <Label>Услуги и цены</Label>
        <Button type="button" variant="outline" size="sm" className="h-8 rounded-full" onClick={() => onChange([...services, { name: { ru: "", kz: "" }, price: 0 }])}>
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Добавить услугу
        </Button>
      </div>
      <div className="grid max-h-72 gap-2 overflow-y-auto rounded-xl border bg-muted/20 p-3">
        {services.length === 0 && <p className="text-sm text-muted-foreground">Услуг нет — добавьте первую строку</p>}
        {services.map((svc, i) => (
          <div key={i} className="grid grid-cols-[1fr_110px_auto] items-center gap-2">
            <Input
              value={svc.name.ru}
              placeholder="Название (RU)"
              onChange={(e) => {
                const next = [...services];
                next[i] = { ...svc, name: { ...svc.name, ru: e.target.value } };
                onChange(next);
              }}
            />
            <Input
              type="number"
              value={svc.price}
              placeholder="₸"
              onChange={(e) => {
                const next = [...services];
                next[i] = { ...svc, price: Number(e.target.value) };
                onChange(next);
              }}
            />
            <Button type="button" variant="ghost" size="sm" className="h-9 w-9 p-0 text-destructive" aria-label="Удалить услугу" onClick={() => onChange(services.filter((_, j) => j !== i))}>
              <Trash2 className="h-4 w-4" aria-hidden />
            </Button>
            <Input
              className="col-span-2"
              value={svc.name.kz}
              placeholder="Атауы (KZ)"
              onChange={(e) => {
                const next = [...services];
                next[i] = { ...svc, name: { ...svc.name, kz: e.target.value } };
                onChange(next);
              }}
            />
          </div>
        ))}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Цена 0 = показывается пометка «по записи» на сайте</p>
    </div>
  );
}

function SpecForm({
  initial, onSaved, onClose,
}: {
  initial: SpecialtyRow | null;
  onSaved: () => void;
  onClose: () => void;
}) {
  const isNew = !initial;
  // защита от JSON-строк/мусора в services (исторические данные, ручные правки БД)
  const [form, setForm] = useState<SpecialtyRow>(
    () => ({ ...(initial ?? EMPTY), services: asArray<ServiceItem>(initial?.services) })
  );
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof SpecialtyRow>(k: K, v: SpecialtyRow[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.slug.trim() || !form.nameRu.trim()) {
      alert("Заполните slug и название (RU)");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(isNew ? "/api/admin/specialties" : `/api/admin/specialties/${initial!.slug}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        alert(data.error === "exists" ? "Направление с таким slug уже есть" : "Ошибка сохранения");
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
        <DialogTitle>{isNew ? "Новое направление" : `Направление: ${initial!.nameRu}`}</DialogTitle>
        <DialogDescription>Тип, название, описание и услуги с ценами — на двух языках</DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        {field("Slug (латиницей, в URL)", <Input value={form.slug} disabled={!isNew} onChange={(e) => set("slug", e.target.value)} placeholder="kardiologiya" />)}
        <div className="grid gap-1.5">
          <Label>Тип</Label>
          <Select value={form.kind} onValueChange={(v) => set("kind", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="specialty">Врачебное направление</SelectItem>
              <SelectItem value="procedure">Процедура / диагностика</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {field("Название (RU)", <Input value={form.nameRu} onChange={(e) => set("nameRu", e.target.value)} />)}
        {field("Атауы (KZ)", <Input value={form.nameKz} onChange={(e) => set("nameKz", e.target.value)} />)}
        {field("Короткое описание (RU)", <Input value={form.shortRu} onChange={(e) => set("shortRu", e.target.value)} />)}
        {field("Қысқаша (KZ)", <Input value={form.shortKz} onChange={(e) => set("shortKz", e.target.value)} />)}
        {field("Полное описание (RU)", <Textarea rows={3} value={form.descRu} onChange={(e) => set("descRu", e.target.value)} />, true)}
        {field("Толық сипаттама (KZ)", <Textarea rows={3} value={form.descKz} onChange={(e) => set("descKz", e.target.value)} />, true)}
        {field("Иконка (lucide, например Stethoscope)", <Input value={form.icon} onChange={(e) => set("icon", e.target.value)} />)}

        <ServicesEditor services={form.services} onChange={(s) => set("services", s)} />

        <div className="flex gap-6 sm:col-span-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <Switch checked={form.featured} onCheckedChange={(v) => set("featured", v)} />
            На главной (популярное)
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <Switch checked={form.published} onCheckedChange={(v) => set("published", v)} />
            Показывать на сайте
          </label>
        </div>
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

export function SpecialtiesAdmin() {
  const { toast } = useToast();
  const specs = useAdminFetch<SpecialtyRow[]>("/api/admin/specialties");
  const [editing, setEditing] = useState<SpecialtyRow | null>(null);
  const [open, setOpen] = useState(false);

  const remove = async (s: SpecialtyRow) => {
    if (!confirm(`Удалить «${s.nameRu}»? Врачи, привязанные к нему, останутся без направления.`)) return;
    await fetch(`/api/admin/specialties/${s.slug}`, { method: "DELETE" });
    toast({ title: "Удалено" });
    void specs.reload();
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold">Специализации и услуги ({specs.data?.length ?? 0})</h1>
          <p className="text-sm text-muted-foreground">Направления, процедуры и их прайс-листы. Массово — через CSV.</p>
        </div>
        <Button className="rounded-full font-semibold" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="mr-1 h-4 w-4" aria-hidden />
          Добавить
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Название</th>
              <th className="px-4 py-3">Тип</th>
              <th className="px-4 py-3">Услуг</th>
              <th className="px-4 py-3">На главной</th>
              <th className="px-4 py-3">На сайте</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {specs.loading && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Загрузка…</td></tr>}
            {specs.data?.map((s) => (
              <tr key={s.slug} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <b className="block">{s.nameRu}</b>
                  <span className="text-xs text-muted-foreground">{s.slug}</span>
                </td>
                <td className="px-4 py-3 text-xs">{s.kind === "procedure" ? "процедура" : "направление"}</td>
                <td className="px-4 py-3">{asArray<ServiceItem>(s.services).length}</td>
                <td className="px-4 py-3">{s.featured ? "✓" : ""}</td>
                <td className="px-4 py-3">
                  {s.published ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">да</span> : <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">скрыт</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Редактировать" onClick={() => { setEditing(s); setOpen(true); }}>
                      <Pencil className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" aria-label="Удалить" onClick={() => void remove(s)}>
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
          <SpecForm
            initial={editing}
            onSaved={() => {
              toast({ title: "Сохранено" });
              void specs.reload();
            }}
            onClose={() => setOpen(false)}
          />
        </Dialog>
      )}
    </div>
  );
}
