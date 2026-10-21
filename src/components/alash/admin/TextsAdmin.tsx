"use client";

import React, { useMemo, useState } from "react";
import { Loader2, Save, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAdminFetch } from "./AdminShell";

interface TextRow { key: string; valueRu: string; valueKz: string; overridden: boolean }

/** Группировка ключей по префиксу до точки с человекочитаемыми названиями */
const GROUP_LABELS: Record<string, string> = {
  nav: "Навигация", cta: "Кнопки действий", hero: "Главная — шапка", specs: "Главная — направления",
  home: "Главная — блоки", adv: "Главная — преимущества", team: "Команда", faq: "FAQ (тексты блока)",
  dp: "Страница врачей", doctor: "Карточка врача", cat: "Категории", sp: "Специализации",
  bc: "Хлебные крошки", about: "О клинике", br: "Филиалы", rp: "Отзывы", fp: "FAQ-страница",
  pp: "Политика конфиденциальности", footer: "Подвал", bk: "Форма записи", misc: "Разное", month: "Месяцы",
};

export function TextsAdmin() {
  const { toast } = useToast();
  const texts = useAdminFetch<TextRow[]>("/api/admin/texts");
  const [group, setGroup] = useState<string>("nav");
  const [q, setQ] = useState("");
  const [drafts, setDrafts] = useState<Record<string, { valueRu: string; valueKz: string }>>({});
  const [busy, setBusy] = useState(false);

  const groups = useMemo(() => {
    const all = texts.data ?? [];
    const prefixes = new Set(all.map((r) => r.key.split(".")[0]));
    return [...prefixes].sort();
  }, [texts.data]);

  const rows = useMemo(() => {
    let list = (texts.data ?? []).filter((r) => r.key.startsWith(group + "."));
    const s = q.trim().toLowerCase();
    if (s) {
      list = (texts.data ?? []).filter(
        (r) => r.key.toLowerCase().includes(s) || r.valueRu.toLowerCase().includes(s) || r.valueKz.toLowerCase().includes(s)
      );
    }
    return list;
  }, [texts.data, group, q]);

  const dirtyCount = Object.keys(drafts).length;

  const save = async () => {
    setBusy(true);
    try {
      const items = Object.entries(drafts).map(([key, v]) => ({ key, ...v }));
      const res = await fetch("/api/admin/texts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        alert("Ошибка сохранения");
        return;
      }
      setDrafts({});
      toast({ title: `Сохранено: ${items.length} текст(ов). Обновите страницу сайта.` });
      void texts.reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold">Тексты сайта</h1>
          <p className="text-sm text-muted-foreground">
            Все надписи интерфейса на RU и KZ. Изменённые тексты подсвечены и применяются после «Сохранить».
          </p>
        </div>
        <Button className="rounded-full font-semibold" disabled={busy || dirtyCount === 0} onClick={save}>
          {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden /> : <Save className="mr-1 h-4 w-4" aria-hidden />}
          Сохранить{dirtyCount > 0 ? ` (${dirtyCount})` : ""}
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {groups.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => { setGroup(g); setQ(""); }}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              group === g && !q ? "bg-primary text-primary-foreground" : "border text-muted-foreground hover:text-foreground"
            }`}
          >
            {GROUP_LABELS[g] ?? g}
          </button>
        ))}
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по ключу или тексту" className="pl-9" />
        </div>
      </div>

      <div className="grid gap-3">
        {texts.loading && <p className="text-sm text-muted-foreground">Загрузка…</p>}
        {rows.map((r) => {
          const draft = drafts[r.key];
          const ru = draft?.valueRu ?? r.valueRu;
          const kz = draft?.valueKz ?? r.valueKz;
          const isDirty = !!draft;
          return (
            <div key={r.key} className={`rounded-2xl border bg-card p-4 ${isDirty ? "border-primary/60" : ""}`}>
              <div className="mb-2 flex items-center gap-2">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{r.key}</code>
                {r.overridden && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">изменён</span>}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>RU</Label>
                  <Textarea rows={2} value={ru} onChange={(e) => setDrafts((d) => ({ ...d, [r.key]: { valueRu: e.target.value, valueKz: kz } }))} />
                </div>
                <div className="grid gap-1.5">
                  <Label>KZ</Label>
                  <Textarea rows={2} value={kz} onChange={(e) => setDrafts((d) => ({ ...d, [r.key]: { valueRu: ru, valueKz: e.target.value } }))} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
