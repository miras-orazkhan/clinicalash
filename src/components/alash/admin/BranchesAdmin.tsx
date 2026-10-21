"use client";

import React, { useState } from "react";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { asArray } from "@/lib/alash/admin-rows";
import { PhotoField, useAdminFetch } from "./AdminShell";

interface Loc { ru: string; kz: string }
export interface BranchRow {
  id: string; nameRu: string; nameKz: string; districtRu: string; districtKz: string;
  addressRu: string; addressKz: string; phone: string;
  hours: Loc[]; descRu: string; descKz: string; highlights: Loc[];
  landmarkRu: string; landmarkKz: string; mapUrl: string; photoUrl: string | null;
  published: boolean; sortOrder: number;
}

const EMPTY: BranchRow = {
  id: "", nameRu: "", nameKz: "", districtRu: "", districtKz: "", addressRu: "", addressKz: "",
  phone: "", hours: [{ ru: "Пн–Сб: 8:00–20:00", kz: "Дс–Сб: 8:00–20:00" }],
  descRu: "", descKz: "", highlights: [], landmarkRu: "", landmarkKz: "", mapUrl: "",
  photoUrl: null, published: true, sortOrder: 0,
};

function LocListEditor({ items, onChange, label }: { items: Loc[]; onChange: (v: Loc[]) => void; label: string }) {
  return (
    <div className="sm:col-span-2">
      <div className="mb-2 flex items-center justify-between">
        <Label>{label}</Label>
        <Button type="button" variant="outline" size="sm" className="h-8 rounded-full" onClick={() => onChange([...items, { ru: "", kz: "" }])}>
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Строка
        </Button>
      </div>
      <div className="grid gap-2">
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
            <Input value={it.ru} placeholder="RU" onChange={(e) => { const n = [...items]; n[i] = { ...it, ru: e.target.value }; onChange(n); }} />
            <Input value={it.kz} placeholder="KZ" onChange={(e) => { const n = [...items]; n[i] = { ...it, kz: e.target.value }; onChange(n); }} />
            <Button type="button" variant="ghost" size="sm" className="h-9 w-9 p-0 text-destructive" aria-label="Удалить" onClick={() => onChange(items.filter((_, j) => j !== i))}>
              <X className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function BranchForm({ initial, onSaved, onClose }: { initial: BranchRow | null; onSaved: () => void; onClose: () => void }) {
  const isNew = !initial;
  // защита от JSON-строк/мусора в hours/highlights (исторические данные, ручные правки БД)
  const [form, setForm] = useState<BranchRow>(() => ({
    ...(initial ?? EMPTY),
    hours: asArray<Loc>(initial?.hours, EMPTY.hours),
    highlights: asArray<Loc>(initial?.highlights, EMPTY.highlights),
  }));
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof BranchRow>(k: K, v: BranchRow[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.id.trim() || !form.nameRu.trim()) {
      alert("Заполните ID и название");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(isNew ? "/api/admin/branches" : `/api/admin/branches/${initial!.id}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        alert("Ошибка сохранения");
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
        <DialogTitle>{isNew ? "Новый филиал" : `Филиал: ${initial!.nameRu}`}</DialogTitle>
        <DialogDescription>Адрес, часы работы, преимущества и фото филиала</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        {field("ID (латиницей)", <Input value={form.id} disabled={!isNew} onChange={(e) => set("id", e.target.value)} />)}
        {field("Телефон", <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />)}
        {field("Название (RU)", <Input value={form.nameRu} onChange={(e) => set("nameRu", e.target.value)} />)}
        {field("Атауы (KZ)", <Input value={form.nameKz} onChange={(e) => set("nameKz", e.target.value)} />)}
        {field("Район (RU)", <Input value={form.districtRu} onChange={(e) => set("districtRu", e.target.value)} />)}
        {field("Аудан (KZ)", <Input value={form.districtKz} onChange={(e) => set("districtKz", e.target.value)} />)}
        {field("Адрес (RU)", <Input value={form.addressRu} onChange={(e) => set("addressRu", e.target.value)} />)}
        {field("Мекенжай (KZ)", <Input value={form.addressKz} onChange={(e) => set("addressKz", e.target.value)} />)}
        {field("Описание (RU)", <Textarea rows={3} value={form.descRu} onChange={(e) => set("descRu", e.target.value)} />, true)}
        {field("Сипаттама (KZ)", <Textarea rows={3} value={form.descKz} onChange={(e) => set("descKz", e.target.value)} />, true)}
        {field("Как найти (RU)", <Input value={form.landmarkRu} onChange={(e) => set("landmarkRu", e.target.value)} />, true)}
        {field("Қалай табуға болады (KZ)", <Input value={form.landmarkKz} onChange={(e) => set("landmarkKz", e.target.value)} />, true)}
        {field("Ссылка на 2ГИС", <Input value={form.mapUrl} onChange={(e) => set("mapUrl", e.target.value)} />, true)}
        <LocListEditor items={form.hours} onChange={(v) => set("hours", v)} label="Часы работы" />
        <LocListEditor items={form.highlights} onChange={(v) => set("highlights", v)} label="Что есть в филиале" />
        <div className="sm:col-span-2">
          <PhotoField url={form.photoUrl} onChange={(u) => set("photoUrl", u)} label="Фото филиала" aspect="aspect-video" />
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

export function BranchesAdmin() {
  const { toast } = useToast();
  const branches = useAdminFetch<BranchRow[]>("/api/admin/branches");
  const [editing, setEditing] = useState<BranchRow | null>(null);
  const [open, setOpen] = useState(false);

  const remove = async (b: BranchRow) => {
    if (!confirm(`Удалить филиал «${b.nameRu}»?`)) return;
    await fetch(`/api/admin/branches/${b.id}`, { method: "DELETE" });
    toast({ title: "Удалено" });
    void branches.reload();
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold">Филиалы ({branches.data?.length ?? 0})</h1>
          <p className="text-sm text-muted-foreground">Адреса, часы, контакты и фото филиалов</p>
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
              <th className="px-4 py-3">Филиал</th>
              <th className="px-4 py-3">Адрес</th>
              <th className="px-4 py-3">Телефон</th>
              <th className="px-4 py-3">На сайте</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {branches.loading && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">Загрузка…</td></tr>}
            {branches.data?.map((b) => (
              <tr key={b.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <b className="block">{b.nameRu}</b>
                  <span className="text-xs text-muted-foreground">{b.id}</span>
                </td>
                <td className="px-4 py-3">{b.addressRu}</td>
                <td className="whitespace-nowrap px-4 py-3">{b.phone}</td>
                <td className="px-4 py-3">
                  {b.published ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">да</span> : <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">скрыт</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Редактировать" onClick={() => { setEditing(b); setOpen(true); }}>
                      <Pencil className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" aria-label="Удалить" onClick={() => void remove(b)}>
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
          <BranchForm
            initial={editing}
            onSaved={() => { toast({ title: "Сохранено" }); void branches.reload(); }}
            onClose={() => setOpen(false)}
          />
        </Dialog>
      )}
    </div>
  );
}
