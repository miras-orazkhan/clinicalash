/** Минимальный CSV-парсер/сериализатор: RFC4180, авто-определение «,» или «;», BOM */
export type CsvRow = string[];

export function detectDelimiter(headerLine: string): string {
  let commas = 0;
  let semis = 0;
  let inQ = false;
  for (let i = 0; i < headerLine.length; i++) {
    const ch = headerLine[i];
    if (ch === '"') inQ = !inQ;
    else if (!inQ && ch === ",") commas++;
    else if (!inQ && ch === ";") semis++;
  }
  return semis > commas ? ";" : ",";
}

export function parseCsv(input: string): CsvRow[] {
  const text = input.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const firstLineEnd = text.indexOf("\n");
  const delim = detectDelimiter(firstLineEnd === -1 ? text : text.slice(0, firstLineEnd));

  const rows: CsvRow[] = [];
  let row: CsvRow = [];
  let field = "";
  let inQ = false;
  let i = 0;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    // пропускаем полностью пустые строки
    if (row.length > 1 || row[0].trim() !== "") rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQ = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQ = true;
      i++;
      continue;
    }
    if (ch === delim) {
      pushField();
      i++;
      continue;
    }
    if (ch === "\n") {
      pushField();
      pushRow();
      i++;
      continue;
    }
    field += ch;
    i++;
  }
  if (field !== "" || row.length > 0) {
    pushField();
    pushRow();
  }
  return rows;
}

/** rows → CSV-строка (по умолчанию «,»; значения с , ; " \n берутся в кавычки) */
export function serializeCsv(rows: CsvRow[], delim = ","): string {
  const esc = (v: string) => {
    const s = v ?? "";
    return s.includes(delim) || s.includes('"') || /[\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(esc).join(delim)).join("\n");
}

/** [{col: val}] из CSV-текста */
export function csvToObjects(text: string): Record<string, string>[] {
  const rows = parseCsv(text);
  if (rows.length < 1) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    header.forEach((h, i) => (obj[h] = (r[i] ?? "").trim()));
    return obj;
  });
}

/** объекты → CSV-текст с заголовком */
export function objectsToCsv(items: Record<string, string>[], columns: string[], delim = ","): string {
  const rows: CsvRow[] = [columns, ...items.map((it) => columns.map((c) => it[c] ?? ""))];
  return serializeCsv(rows, delim);
}
