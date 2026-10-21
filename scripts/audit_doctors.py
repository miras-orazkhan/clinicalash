#!/usr/bin/env python3
"""Аудит полноты данных врачей в БД."""
import sqlite3, json

con = sqlite3.connect('/home/z/my-project/db/custom.db')
con.row_factory = sqlite3.Row
rows = con.execute('SELECT * FROM Doctor ORDER BY sortOrder, id').fetchall()

fields = {
    'bioRu': 'Био RU', 'bioKz': 'Био KZ',
    'educationRu': 'Образование RU', 'educationKz': 'Образование KZ',
    'experience': 'Опыт (лет)', 'category': 'Категория',
    'titleRu': 'Должность RU', 'titleKz': 'Должность KZ',
    'photoUrl': 'Фото', 'price': 'Цена',
    'specialties': 'Направления', 'branches': 'Филиалы',
}

missing = {f: [] for f in fields}
for r in rows:
    for f in fields:
        v = r[f]
        empty = v is None or (isinstance(v, str) and (not v.strip() or v.strip() in ('[]', '""')))
        if f == 'price':
            empty = v is None or v == 0
        if f in ('specialties', 'branches'):
            try:
                arr = json.loads(v or '[]')
                empty = not arr
            except Exception:
                empty = True
        if empty:
            missing[f].append(f"{r['nameRu']} ({r['id']})")

print(f"Всего врачей: {len(rows)}\n")
for f, label in fields.items():
    lst = missing[f]
    print(f"=== {label}: пусто у {len(lst)} ===")
    for name in lst:
        print(f"  - {name}")
    print()

# Полная сводка по врачам с наиболее неполными данными
print("=== Сводка: сколько полей пусто у каждого врача ===")
scores = []
for r in rows:
    cnt = 0
    det = []
    v = r['bioRu']
    if not (v and v.strip()): cnt += 1; det.append('bio')
    v = r['educationRu']
    if not (v and v.strip()): cnt += 1; det.append('edu')
    if not r['experience']: cnt += 1; det.append('exp')
    if not r['price']: cnt += 1; det.append('price')
    if not r['photoUrl']: cnt += 1; det.append('photo')
    if cnt: scores.append((cnt, r['nameRu'], det))
scores.sort(reverse=True)
for cnt, name, det in scores:
    print(f"  {name}: {cnt} ({', '.join(det)})")
