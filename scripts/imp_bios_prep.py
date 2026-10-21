#!/usr/bin/env python3
"""Подготовка био к переводу: композиция фактических био для 3 врачей,
нормализация «Опыт работы:» на новую строку, выгрузка JSON для перевода."""
import json
import re
import sqlite3

DB = "/home/z/my-project/db/custom.db"
OUT = "/home/z/my-project/scripts/tmp/bios_for_translation.json"

# --- 1. Фактические био (составлены СТРОГО из данных источника: категория,
# стаж, специальности из xlsx, карьера из experience, услуги из services) ---
COMPOSED = {
    "abdiev-gabit": (
        "Врач высшей квалификационной категории со стажем работы 16 лет. "
        "Принимает взрослых и детей: проводит диагностику и лечение заболеваний "
        "урологического, андрологического и проктологического профиля, а также "
        "заболеваний, передающихся половым путём. "
        "Опыт работы: с 2017 года — Медицинский центр «ЭМИРМЕД»."
    ),
    "shabelyanov-sergey": (
        "Врач ультразвуковой диагностики высшей квалификационной категории со "
        "стажем работы 10 лет. Проводит ультразвуковые исследования взрослым и "
        "детям: УЗИ щитовидной железы, органов малого таза, сердца "
        "(эхокардиографию), мягких тканей, лимфатических узлов, УЗИ головного "
        "мозга у детей (нейросонографию), ТРУЗИ и УЗИ предстательной железы."
    ),
    "podkorytov-vladimir": (
        "Кандидат медицинских наук, врач эндоскопической диагностики высшей "
        "квалификационной категории со стажем работы более 20 лет. Проводит "
        "эндоскопические исследования взрослым и детям. "
        "Опыт работы: с 2018 года — Медицинский центр «Эмирмед»; ранее — "
        "Городская клиническая больница №3, Больница скорой помощи."
    ),
}

con = sqlite3.connect(DB)
con.row_factory = sqlite3.Row
rows = con.execute(
    "SELECT id, nameRu, titleRu, bioRu, educationRu FROM Doctor ORDER BY sortOrder, id"
).fetchall()

items = []
patched = 0
normalized = 0
for r in rows:
    bio = r["bioRu"] or ""
    if r["id"] in COMPOSED:
        bio = COMPOSED[r["id"]]
        patched += 1
    else:
        # « Опыт работы:» внутри текста -> перенос строки (но не в самом начале)
        new = re.sub(r"(?<!^)\s+(Опыт работы:\s)", r"\n\1", bio, count=1)
        if new != bio:
            bio = new
            normalized += 1
    bio = bio.strip()
    items.append(
        {
            "id": r["id"],
            "nameRu": r["nameRu"],
            "titleRu": r["titleRu"],
            "bioRu": bio,
            "educationRu": (r["educationRu"] or "").strip(),
        }
    )

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(items, f, ensure_ascii=False, indent=1)

print(f"Всего: {len(items)}; составлено новых био: {patched}; нормализовано «Опыт работы» -> новая строка: {normalized}")
for it in items:
    if it["id"] in COMPOSED:
        print(f"  [NEW] {it['id']}: {it['bioRu'][:80]}...")
lens = sorted(len(i["bioRu"]) for i in items)
print(f"Длина био: мин {lens[0]}, медиана {lens[len(lens)//2]}, макс {lens[-1]}")
