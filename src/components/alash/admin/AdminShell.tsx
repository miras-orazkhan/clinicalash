"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Loader2, LockKeyhole, LogOut, Stethoscope, Users, Building2, Star, HelpCircle, Type, FileSpreadsheet, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const NAV = [
  { href: "/admin", label: "Дашборд", icon: LayoutDashboard },
  { href: "/admin/doctors", label: "Врачи", icon: Users },
  { href: "/admin/specialties", label: "Специализации и услуги", icon: Stethoscope },
  { href: "/admin/branches", label: "Филиалы", icon: Building2 },
  { href: "/admin/reviews", label: "Отзывы", icon: Star },
  { href: "/admin/faq", label: "FAQ", icon: HelpCircle },
  { href: "/admin/texts", label: "Тексты сайта", icon: Type },
  { href: "/admin/csv", label: "CSV импорт/экспорт", icon: FileSpreadsheet },
  { href: "/admin/settings", label: "Настройки и фото", icon: Settings },
];

function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("Неверный пароль");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-1 flex items-center gap-2">
          <LockKeyhole className="h-5 w-5 text-primary" aria-hidden />
          <h1 className="text-lg font-bold">Админ-панель «Алаш»</h1>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">Управление врачами, услугами, текстами и фото</p>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="adm-pass">Пароль</Label>
            <Input
              id="adm-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={busy} className="h-11 rounded-full font-semibold">
            {busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden />}
            Войти
          </Button>
        </form>
        <p className="mt-3 text-xs text-muted-foreground">Пароль по умолчанию: alash2026 (меняется в «Настройках»)</p>
      </div>
    </div>
  );
}

export function AdminShell({ authed, children }: { authed: boolean; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  if (!authed) return <LoginForm />;

  const logout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    toast({ title: "Вы вышли из админ-панели" });
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-40 border-b bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
          <a href="/" className="flex items-center gap-2 text-sm font-bold text-primary">
            <Stethoscope className="h-5 w-5" aria-hidden />
            «Алаш» · CMS
          </a>
          <span className="ml-auto" />
          <Button variant="outline" size="sm" className="h-9 rounded-full" onClick={logout}>
            <LogOut className="h-4 w-4" aria-hidden />
            Выйти
          </Button>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2" aria-label="Разделы админки">
          {NAV.map((n) => {
            const active = pathname === n.href;
            return (
              <a
                key={n.href}
                href={n.href}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <n.icon className="h-4 w-4" aria-hidden />
                {n.label}
              </a>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}

/** Поле загрузки фото: показывает текущее, загружает на /api/admin/upload */
export function PhotoField({
  url,
  onChange,
  label = "Фото",
  aspect = "aspect-square",
}: {
  url?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  aspect?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const upload = useCallback(
    async (file: File) => {
      setBusy(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const data = (await res.json()) as { url?: string; error?: string };
        if (data.url) onChange(data.url);
        else if (data.error) alert(data.error);
      } finally {
        setBusy(false);
      }
    },
    [onChange]
  );

  return (
    <div className="flex items-center gap-3">
      <div className={`flex ${aspect} w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted/40`}>
        {url ? (
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-muted-foreground">нет</span>
        )}
      </div>
      <div className="grid gap-1.5">
        <Label>{label}</Label>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" className="h-8 rounded-full" disabled={busy} onClick={() => ref.current?.click()}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : "Загрузить…"}
          </Button>
          {url && (
            <Button type="button" variant="ghost" size="sm" className="h-8 rounded-full text-destructive" onClick={() => onChange(null)}>
              Убрать
            </Button>
          )}
        </div>
        <input
          ref={ref}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

/** Хук загрузки списка с API админки */
export function useAdminFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) setData((await res.json()) as T);
    } finally {
      setLoading(false);
    }
  }, [url]);
  useEffect(() => {
    void reload();
  }, [reload]);
  return { data, loading, reload };
}
