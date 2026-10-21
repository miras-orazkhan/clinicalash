# -*- coding: utf-8 -*-
"""Задача 18, шаг 1: сверка списка врачей пользователя (филиал Пограничная) с БД."""
import sqlite3, unicodedata

DB = "/home/z/my-project/db/custom.db"

# Список от пользователя: «Фамилия Имя Отчество»
USER_LIST = [
    "Подкорытов Владимир Владимирович",
    "Кулиев Аслан Серикович",
    "Муталиев Мурат Бердешевич",
    "Нашауова Инна Владимировна",
    "Кудайберген Мадина Базарбаевна",
    "Байболов Канат Заутбекович",
    "Советова Молдир Нурбаевна",
    "Турсынбеков Улан Саятулы",
    "Тулегенова Айман Жакыпбековна",
    "Конай Назым Отегалиевна",
    "Маманов Сабит Жигангалиевич",
    "Мусаева Багила Сайрамбаевна",
    "Тасболат Самат Рысполатович",
    "Баракова Альмара Карибаевна",
    "Дайрабекова Айдана Біржанқызы",
    "Дуйсен Амина Даулетовна",
    "Куляшбекова Нуршат Самидиновна",
    "Мамитниязов Мунаждин Имирдинович",
    "Жандос Аружан Серікжанқызы",
    "Мансур Мукагали Ергалиулы",
    "Байбулатов Курмангали Кожахметович",
    "Шарипхан Альтаир Маликулы",
]

def norm(s):
    if not s:
        return ""
    s = unicodedata.normalize("NFKC", str(s)).lower().replace("ё", "е")
    return " ".join(s.split())

con = sqlite3.connect(DB)
rows = con.execute(
    "SELECT id, nameRu, patronymicRu, nameKz, patronymicKz, branches, published FROM Doctor ORDER BY nameRu"
).fetchall()
con.close()

print(f"Всего врачей в БД: {len(rows)}\n")

# Индексы для поиска: фамилия+имя (RU и KZ)
db_index = {}
for (id_, nameRu, patRu, nameKz, patKz, branches, published) in rows:
    key = norm(nameRu)
    db_index.setdefault(key, []).append((id_, nameRu, patRu, nameKz, patKz, branches, published))

matched, unmatched = [], []
for full in USER_LIST:
    parts = full.split()
    surname, first = parts[0], parts[1] if len(parts) > 1 else ""
    key = norm(f"{surname} {first}")
    cands = db_index.get(key, [])
    if cands:
        matched.append((full, cands))
    else:
        # мягкий поиск: по фамилии
        fuzzy = [(k, v) for k, v in db_index.items() if k.startswith(norm(surname))]
        unmatched.append((full, fuzzy))

print("=== СОВПАДЕНИЯ ===")
for full, cands in matched:
    for (id_, nameRu, patRu, nameKz, patKz, branches, published) in cands:
        print(f"  {full!r:55} -> DB: {nameRu} / {patRu or '-'} | KZ: {nameKz} {patKz or ''} | branches={branches} | pub={published}")

print(f"\n=== НЕ НАЙДЕНЫ ({len(unmatched)}) ===")
for full, fuzzy in unmatched:
    print(f"  {full}")
    for k, v in fuzzy[:3]:
        print(f"      похожие: {v[0][2]} / {v[0][3]}")

print(f"\nИтог: совпало {len(matched)} из {len(USER_LIST)}")
