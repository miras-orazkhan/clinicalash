/**
 * Общая нормализация строк БД для админских API и UI.
 * JSON-колонки (services, hours, highlights, specialties, branches) хранятся
 * в SQLite как строки — при выдаче клиенту их нужно превращать в массивы,
 * иначе в админке падает .map / .length.
 */

export function parseJsonSafe<T>(v: unknown, fallback: T): T {
  if (typeof v !== "string" || !v) return fallback;
  try {
    const parsed = JSON.parse(v) as T;
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
}

/** Значение → массив: массив возвращается как есть, JSON-строка парсится, остальное → fallback */
export function asArray<T>(v: unknown, fallback: T[] = []): T[] {
  if (Array.isArray(v)) return v as T[];
  if (typeof v === "string") return parseJsonSafe<T[]>(v, fallback);
  return fallback;
}

/** Строка Specialty из Prisma → объект для клиента (services: string → массив) */
export function toClientSpecialty<T extends { services?: unknown }>(row: T): T & { services: unknown[] } {
  return { ...row, services: asArray(row.services) };
}

/** Строка Branch из Prisma → объект для клиента (hours/highlights: string → массивы) */
export function toClientBranch<T extends { hours?: unknown; highlights?: unknown }>(
  row: T
): T & { hours: unknown[]; highlights: unknown[] } {
  return { ...row, hours: asArray(row.hours), highlights: asArray(row.highlights) };
}

/** Строка Doctor из Prisma → объект для клиента (specialties/branches: string → массивы) */
export function toClientDoctor<T extends { specialties?: unknown; branches?: unknown }>(
  row: T
): T & { specialties: string[]; branches: string[] } {
  return { ...row, specialties: asArray<string>(row.specialties), branches: asArray<string>(row.branches) };
}
