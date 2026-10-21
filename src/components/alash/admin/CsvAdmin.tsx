"use client";

import React, { useRef, useState } from "react";
import { Download, FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const TYPES = [
  { id: "doctors", label: "Врачи", desc: "id, ФИО RU/KZ, отчество, должность, направления (через |), стаж, категория, филиалы (через |), рейтинг, отзывы, цена, био, образование, фото, публикация" },
  { id: "specialties", label: "Специализации", desc: "slug, тип, иконка, названия RU/KZ, короткие и полные описания, популярное, публикация" },
  { id: "services", label: "Услуги и цены", desc: "specialty_slug, название RU/KZ, цена, примечание. Услуги выбранного направления заменяются строками файла" },
  { id: "branches", label: "Филиалы", desc: "id, названия, районы, адреса, телефон, часы (JSON), описания, преимущества (JSON), ориентир, карта, фото, публикация" },
  { id: "reviews", label: "Отзывы", desc: "id (пустой = новый), автор, дата, оценка, филиал, врач, текст" },
  { id: "faq", label: "FAQ", desc: "id (пустой = новый), вопрос RU/KZ, ответ RU/KZ, публикация" },
];

export function CsvAdmin() {
  const { toast } = useToast();
  const [type, setType] = useState("doctors");
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<{ created: number; updated: number; errors: string[]; total: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const current = TYPES.find((t) => t.id === type)!;

  const importCsv = async (file: File) => {
    setBusy(true);
    setReport(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", type);
      const res = await fetch("/api/admin/csv/import", { method: "POST", body: fd });
      const data = (await res.json()) as { created?: number; updated?: number; errors?: string[]; total?: number; error?: string };
      if (data.error) {
        alert(data.error);
        return;
      }
      setReport({ created: data.created ?? 0, updated: data.updated ?? 0, errors: data.errors ?? [], total: data.total ?? 0 });
      toast({ title: `Импорт: +${data.created} создано, ${data.updated} обновлено` });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h1 className="mb-1 text-xl font-extrabold">CSV импорт / экспорт</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Массовое обновление данных. Формат: первая строка — заголовки колонок, разделитель «;» или «,», кодировка UTF-8.
        Скачайте текущие данные, отредактируйте в Excel и загрузите обратно — строки обновляются по id/slug.
      </p>

      <div className="mb-5 flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setType(t.id); setReport(null); }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              type === t.id ? "bg-primary text-primary-foreground" : "border text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border bg-card p-5">
        <p className="text-sm leading-relaxed text-muted-foreground">
          <b className="text-foreground">Колонки «{current.label}»:</b> {current.desc}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href={`/api/admin/csv/export?type=${type}`} className="inline-flex h-10 items-center gap-2 rounded-full border px-5 text-sm font-semibold transition hover:border-primary hover:text-primary">
            <Download className="h-4 w-4" aria-hidden />
            Скачать текущие ({current.label.toLowerCase()})
          </a>
          <Button className="rounded-full font-semibold" disabled={busy} onClick={() => fileRef.current?.click()}>
            {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden /> : <FileUp className="mr-1 h-4 w-4" aria-hidden />}
            Загрузить CSV…
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importCsv(f);
              e.target.value = "";
            }}
          />
        </div>

        {report && (
          <div className="mt-4 rounded-xl border bg-muted/30 p-4 text-sm">
            <p><b>Строк в файле:</b> {report.total}</p>
            <p className="mt-1 text-primary"><b>Создано:</b> {report.created} · <b>Обновлено:</b> {report.updated}</p>
            {report.errors.length > 0 && (
              <div className="mt-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                {report.errors.map((e, i) => <div key={i}>{e}</div>)}
              </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">Обновите страницу сайта, чтобы увидеть изменения.</p>
          </div>
        )}
      </div>
    </div>
  );
}
