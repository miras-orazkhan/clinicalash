#!/usr/bin/env python3
"""Применение переводов и исправленных био к БД (идемпотентно)."""
import json
import sqlite3

DB = "/home/z/my-project/db/custom.db"
PREP = "/home/z/my-project/scripts/tmp/bios_for_translation.json"
KZ = "/home/z/my-project/scripts/tmp/bios_kz.json"

prep = {i["id"]: i for i in json.load(open(PREP, encoding="utf-8"))}
kz = json.load(open(KZ, encoding="utf-8"))

con = sqlite3.connect(DB)
cur = con.cursor()

n_ru = n_bio_kz = n_edu_kz = 0
for doc_id, it in prep.items():
    # bioRu — исправленные/нормализованные тексты (3 новых + 52 с переносом строки)
    cur.execute("UPDATE Doctor SET bioRu=? WHERE id=?", (it["bioRu"], doc_id))
    if cur.rowcount:
        n_ru += 1
    tr = kz.get(doc_id)
    if tr:
        cur.execute("UPDATE Doctor SET bioKz=? WHERE id=?", (tr["bioKz"], doc_id))
        if cur.rowcount:
            n_bio_kz += 1
        cur.execute("UPDATE Doctor SET educationKz=? WHERE id=?", (tr["educationKz"], doc_id))
        if cur.rowcount:
            n_edu_kz += 1

con.commit()

# Сводка полноты
rows = cur.execute(
    """SELECT
        SUM(CASE WHEN bioRu IS NULL OR TRIM(bioRu)='' THEN 1 ELSE 0 END) bioRuEmpty,
        SUM(CASE WHEN bioKz IS NULL OR TRIM(bioKz)='' THEN 1 ELSE 0 END) bioKzEmpty,
        SUM(CASE WHEN educationRu IS NULL OR TRIM(educationRu)='' THEN 1 ELSE 0 END) eduRuEmpty,
        SUM(CASE WHEN educationKz IS NULL OR TRIM(educationKz)='' THEN 1 ELSE 0 END) eduKzEmpty,
        COUNT(*) total FROM Doctor"""
).fetchone()
print(f"Обновлено bioRu: {n_ru}, bioKz: {n_bio_kz}, educationKz: {n_edu_kz}")
print(
    f"Пустых полей после обновления (из {rows[4]}): "
    f"bioRu={rows[0]}, bioKz={rows[1]}, educationRu={rows[2]}, educationKz={rows[3]}"
)

# Примеры
for sid in ("amirova-khaliya", "shabelyanov-sergey", "abdiev-gabit"):
    r = cur.execute("SELECT id, bioRu, bioKz, educationKz FROM Doctor WHERE id=?", (sid,)).fetchone()
    print("\n=== " + sid)
    print("RU:", r[1][:150].replace("\n", " ⏎ "))
    print("KZ:", r[2][:150].replace("\n", " ⏎ "))
    print("EDU KZ:", r[3][:100])
con.close()
