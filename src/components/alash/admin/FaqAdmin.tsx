"use client";

import React, { useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAdminFetch } from "./AdminShell";

export interface FaqRow { id: string; qRu: string; qKz: string; aRu: string; aKz: string; published: boolean }

function FaqForm({
  initial, onSaved, onClose,
}: {
  initial: FaqRow | null;
  onSaved: () => void;
  onClose: () => void;
}) {
  const isNew = !initial;
  const [form, setForm] = useState<FaqRow>(initial ?? { id: "", qRu: "", qKz: "", aRu: "", aKz: "", published: true });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!form.qRu.trim() || !form.aRu.trim()) {
      alert("Заполните вопрос и ответ (RU)");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(isNew ? "/api/admin/faq" : `/api/admin/faq/${initial!.id}`, {
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

  return (
    <DialogContent className="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>{isNew ? "Новый вопрос" : "Вопрос-ответ"}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4">
        <div className="grid gap-1.5">
          <Label>Вопрос (RU)</Label>
          <Input value={form.qRu} onChange={(e) => setForm({ ...form, qRu: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label>Сұрақ (KZ)</Label>
          <Input value={form.qKz} onChange={(e) => setForm({ ...form, qKz: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label>Ответ (RU)</Label>
          <Textarea rows={3} value={form.aRu} onChange={(e) => setForm({ ...form, aRu: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label>Жауап (KZ)</Label>
          <Textarea rows={3} value={form.aKz} onChange={(e) => setForm({ ...form, aKz: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" className="rounded-full" onClick={onClose}>Отмена</Button>
          <Button className="rounded-full font-semibold" disabled={busy} onClick={save}>
            {busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden />}
            Сохранить
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

export function FaqAdmin() {
  const { toast } = useToast();
  const faq = useAdminFetch<FaqRow[]>("/api/admin/faq");
  const [editing, setEditing] = useState<FaqRow | null>(null);
  const [open, setOpen] = useState(false);

  const remove = async (f: FaqRow) => {
    if (!confirm("Удалить вопрос?")) return;
    await fetch(`/api/admin/faq/${f.id}`, { method: "DELETE" });
    toast({ title: "Удалено" });
    void faq.reload();
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold">Частые вопросы ({faq.data?.length ?? 0})</h1>
          <p className="text-sm text-muted-foreground">Блок FAQ на главной и отдельная страница</p>
        </div>
        <Button className="rounded-full font-semibold" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="mr-1 h-4 w-4" aria-hidden />
          Добавить
        </Button>
      </div>

      <div className="grid gap-3">
        {faq.loading && <p className="text-sm text-muted-foreground">Загрузка…</p>}
        {faq.data?.map((f) => (
          <article key={f.id} className="flex items-start justify-between gap-4 rounded-2xl border bg-card p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold">{f.qRu}</p>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{f.aRu}</p>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Редактировать" onClick={() => { setEditing(f); setOpen(true); }}>
                <Pencil className="h-4 w-4" aria-hidden />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" aria-label="Удалить" onClick={() => void remove(f)}>
                <Trash2 className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </article>
        ))}
      </div>

      {open && (
        <Dialog open={open} onOpenChange={setOpen}>
          <FaqForm initial={editing} onSaved={() => { toast({ title: "Сохранено" }); void faq.reload(); }} onClose={() => setOpen(false)} />
        </Dialog>
      )}
    </div>
  );
}
