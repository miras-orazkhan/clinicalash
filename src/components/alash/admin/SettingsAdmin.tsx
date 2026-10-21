"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { PhotoField, useAdminFetch } from "./AdminShell";

interface Data {
  settings: Record<string, string>;
  images: Record<string, { url: string; altRu: string; altKz: string }>;
}

const SETTING_LABELS: Record<string, string> = {
  phone_main: "Основной телефон",
  phone_mobile: "Мобильный телефон",
  whatsapp: "WhatsApp (только цифры, напр. 77013504040)",
  email: "E-mail",
  clinic_legal: "Юридическое название",
  clinic_license: "Лицензия (строка в подвале)",
};

export function SettingsAdmin() {
  const { toast } = useToast();
  const { data, loading, reload } = useAdminFetch<Data>("/api/admin/settings");
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [images, setImages] = useState<Data["images"]>({});
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data) {
      const { admin_password, ...rest } = data.settings;
      setSettings(rest);
      setImages(data.images);
    }
  }, [data]);

  const save = async () => {
    setBusy(true);
    try {
      const payload: Record<string, unknown> = { settings, images };
      if (password.trim().length >= 4) payload.settings = { ...settings, admin_password: password.trim() };
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        alert("Ошибка сохранения");
        return;
      }
      setPassword("");
      toast({ title: "Настройки сохранены" });
      void reload();
    } finally {
      setBusy(false);
    }
  };

  if (loading || !data) return <p className="text-sm text-muted-foreground">Загрузка…</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold">Настройки и фото сайта</h1>
          <p className="text-sm text-muted-foreground">Контакты клиники, главные фотографии и пароль админки</p>
        </div>
        <Button className="rounded-full font-semibold" disabled={busy} onClick={save}>
          {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden /> : <Save className="mr-1 h-4 w-4" aria-hidden />}
          Сохранить
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="mb-4 text-base font-bold">Контакты</h2>
          <div className="grid gap-4">
            {Object.entries(SETTING_LABELS).map(([key, label]) => (
              <div key={key} className="grid gap-1.5">
                <Label>{label}</Label>
                <Input
                  value={settings[key] ?? ""}
                  onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-5">
          <h2 className="mb-4 text-base font-bold">Фотографии сайта</h2>
          <div className="grid gap-5">
            <PhotoField
              aspect="aspect-[3/4]"
              label="Фото в шапке главной (врач)"
              url={images["hero.doctor"]?.url}
              onChange={(url) => setImages((im) => ({ ...im, "hero.doctor": { url: url ?? "", altRu: im["hero.doctor"]?.altRu ?? "", altKz: im["hero.doctor"]?.altKz ?? "" } }))}
            />
            <PhotoField
              aspect="aspect-video"
              label="Групповое фото команды"
              url={images["team.group"]?.url}
              onChange={(url) => setImages((im) => ({ ...im, "team.group": { url: url ?? "", altRu: im["team.group"]?.altRu ?? "", altKz: im["team.group"]?.altKz ?? "" } }))}
            />
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-5">
          <h2 className="mb-4 text-base font-bold">Пароль админ-панели</h2>
          <div className="grid gap-1.5">
            <Label>Новый пароль (мин. 4 символа, пусто = не менять)</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">После смены пароля текущая сессия продолжит работать до 30 дней.</p>
        </section>
      </div>
    </div>
  );
}
