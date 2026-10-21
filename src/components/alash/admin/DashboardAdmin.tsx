"use client";

import React from "react";
import { CalendarClock, Star, Stethoscope, Users, Building2 } from "lucide-react";
import { useAdminFetch } from "./AdminShell";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface BookingRow {
  id: string;
  name: string;
  phone: string;
  specSlug: string | null;
  doctorId: string | null;
  branchId: string | null;
  date: string;
  time: string;
  status: string;
  createdAt: string;
}

interface BookingsData {
  bookings: BookingRow[];
  doctors: Record<string, string>;
  specialties: Record<string, string>;
  branches: Record<string, string>;
}

const STATUS_LABELS: Record<string, string> = {
  new: "Новая",
  confirmed: "Подтверждена",
  done: "Завершена",
  cancelled: "Отменена",
};

function Stats({ data }: { data: BookingsData }) {
  const cards = [
    { label: "Заявки на запись", value: data.bookings.length, icon: CalendarClock },
    { label: "Новые заявки", value: data.bookings.filter((b) => b.status === "new").length, icon: Star },
  ];
  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
      {cards.map((c) => (
        <div key={c.label} className="flex items-center gap-4 rounded-2xl border bg-card p-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <c.icon className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-2xl font-extrabold">{c.value}</p>
            <p className="text-sm text-muted-foreground">{c.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardAdmin() {
  const { data, loading, reload } = useAdminFetch<BookingsData>("/api/admin/bookings");

  const setStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/bookings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    void reload();
  };

  return (
    <div>
      <h1 className="mb-1 text-xl font-extrabold">Дашборд</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Заявки с формы «Записаться на приём» и статистика. Контент управляется в разделах выше.
      </p>

      {loading || !data ? (
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      ) : (
        <>
          <Stats data={data} />

          <div className="overflow-hidden rounded-2xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>№</TableHead>
                  <TableHead>Пациент</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead>Направление / врач</TableHead>
                  <TableHead>Филиал</TableHead>
                  <TableHead>Дата и время</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.bookings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                      Заявок пока нет — они появятся после первой записи с сайта.
                    </TableCell>
                  </TableRow>
                )}
                {data.bookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="whitespace-nowrap font-mono text-xs">{b.id}</TableCell>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell className="whitespace-nowrap">{b.phone}</TableCell>
                    <TableCell>
                      {b.specSlug
                        ? data.specialties[b.specSlug] ?? b.specSlug
                        : "—"}
                      {b.doctorId && (
                        <span className="block text-xs text-muted-foreground">{data.doctors[b.doctorId] ?? b.doctorId}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{b.branchId ? data.branches[b.branchId] ?? b.branchId : "—"}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {b.date} · {b.time}
                    </TableCell>
                    <TableCell>
                      <Select value={b.status} onValueChange={(v) => void setStatus(b.id, v)}>
                        <SelectTrigger className="h-8 w-40 rounded-full text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
