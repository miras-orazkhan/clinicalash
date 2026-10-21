"use client";

import React, { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAdminFetch } from "./AdminShell";

export interface ReviewRow {
  id: string; author: string; date: string; rating: number;
  branchId: string | null; doctorId: string | null; text: string; source: string;
}

function ReviewForm({ onSaved, onClose }: { onSaved: () => void; onClose: () => void }) {
  const [author, setAuthor] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!author.trim() || !text.trim()) {
      alert("Заполните имя и текст");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, date, rating, text }),
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
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Новый отзыв</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4">
        <div className="grid gap-1.5">
          <Label>Автор</Label>
          <Input value={author} onChange={(e) => setAuthor(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label>Дата</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Оценка (1–5)</Label>
            <Input type="number" min="1" max="5" value={rating} onChange={(e) => setRating(Number(e.target.value))} />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label>Текст</Label>
          <Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} />
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

export function ReviewsAdmin() {
  const { toast } = useToast();
  const reviews = useAdminFetch<ReviewRow[]>("/api/admin/reviews");
  const [open, setOpen] = useState(false);

  const remove = async (r: ReviewRow) => {
    if (!confirm(`Удалить отзыв от «${r.author}»?`)) return;
    await fetch(`/api/admin/reviews/${r.id}`, { method: "DELETE" });
    toast({ title: "Удалено" });
    void reviews.reload();
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold">Отзывы ({reviews.data?.length ?? 0})</h1>
          <p className="text-sm text-muted-foreground">Отзывы с сайта и импортированные. Публикуются сразу.</p>
        </div>
        <Button className="rounded-full font-semibold" onClick={() => setOpen(true)}>
          <Plus className="mr-1 h-4 w-4" aria-hidden />
          Добавить
        </Button>
      </div>

      <div className="grid gap-3">
        {reviews.loading && <p className="text-sm text-muted-foreground">Загрузка…</p>}
        {reviews.data?.map((r) => (
          <article key={r.id} className="flex items-start justify-between gap-4 rounded-2xl border bg-card p-4">
            <div className="min-w-0">
              <p className="text-sm">
                <b>{r.author}</b>
                <span className="ml-2 text-xs text-muted-foreground">
                  {r.date} · ★{r.rating} · {r.source === "site" ? "с сайта" : "импорт"}
                  {r.doctorId && ` · врач: ${r.doctorId}`}
                </span>
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.text}</p>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 shrink-0 p-0 text-destructive" aria-label="Удалить" onClick={() => void remove(r)}>
              <Trash2 className="h-4 w-4" aria-hidden />
            </Button>
          </article>
        ))}
      </div>

      {open && (
        <Dialog open={open} onOpenChange={setOpen}>
          <ReviewForm onSaved={() => { toast({ title: "Сохранено" }); void reviews.reload(); }} onClose={() => setOpen(false)} />
        </Dialog>
      )}
    </div>
  );
}
