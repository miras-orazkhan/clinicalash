#!/usr/bin/env python3
"""Казахские формы отчеств (ұлы/қызы) для KZ-версии — официальная практика РК.
Славянские отчества (Владимировна, Олегович...) остаются без изменений.
Заодно: nameKz «Еркинкызы»→«Еркинқызы» (орфография), пустые отчества остаются пустыми."""
import sqlite3

DB = "/home/z/my-project/db/custom.db"

# id -> patronymicKz (только уверенные казахские формы)
KZ = {
    "abdiev-gabit": "Серікұлы",
    "abdullaev-erke-ali": "Бек-Әліұлы",
    "abenova-sholpan": "Абутәліпқызы",
    "akhmetzhanov-omirkhan": "Тұлеугазіұлы",
    "alimbekov-nurbolat": "Шерәліұлы",
    "amirova-khaliya": "Құлынбекқызы",
    "barakova-almara": "Қарыбайқызы",
    "baybolov-kanat": "Зауытбекұлы",
    "baybulatov-kurmangali": "Қожахметұлы",
    "baygulova-gulzhakhan": "Шайзадақызы",
    "bektemirova-zarina": "Оразбекқызы",
    "duysembaev-beknazar": "Тоқназарұлы",
    "duysen-amina": "Дәулетқызы",
    "elmuratov-alimardon": "Таймұратұлы",
    "kadyrbekova-zhazira": "Құзембайқызы",
    "kenes-alikhat": "Жасұланұлы",
    "kiyabaeva-lyazzat": "Қорабайқызы",
    "konay-nazym": "Өтегәліқызы",
    "kudaybergen-madina": "Базарбайқызы",
    "kuliev-aslan": "Серікұлы",
    "kulyashbekova-nurshat": "Самидинқызы",
    "mamanov-sabit": "Жиенғалиұлы",
    "mamitniyazov-munazhdin": "Әмірдінұлы",
    "musaeva-bagila": "Сайрамбайқызы",
    "mutaliev-murat": "Бердешұлы",
    "omarova-karlygash": "Әлжанқызы",
    "sapakova-baktynur": "Рысбекқызы",
    "shertaeva-adiya": "Бақтиярханқызы",
    "sikhymbaev-marat": "Дауренұлы",
    "sovetova-moldir": "Нұрбайқызы",
    "tasbolat-samat": "Рысполатұлы",
    "tulegenova-ayman": "Жақыпбекқызы",
    "ukenov-alibek": "Жанатұлы",
    "usmanov-ramil": "Әбдіқарымжанұлы",
    "zhakasheva-aygerim": "Мұхтарқызы",
    "zharmenov-samat": "Мәдиханұлы",
}

NAME_KZ_FIX = {
    "erkinkyzy-aynur": "Айнур Еркинқызы",
    "rayymbekkyzy-akerke": "Акерке Райымбекқызы",
}

con = sqlite3.connect(DB)
cur = con.cursor()

n = 0
for doc_id, pkz in KZ.items():
    cur.execute("UPDATE Doctor SET patronymicKz=? WHERE id=?", (pkz, doc_id))
    n += cur.rowcount

for doc_id, nkz in NAME_KZ_FIX.items():
    cur.execute("UPDATE Doctor SET nameKz=? WHERE id=?", (nkz, doc_id))

con.commit()
print(f"Обновлено patronymicKz: {n}; nameKz: {len(NAME_KZ_FIX)}")

# Сводка
rows = cur.execute("SELECT patronymicKz FROM Doctor").fetchall()
forms = {"қызы": 0, "ұлы": 0, "русская": 0, "пусто": 0}
for (p,) in rows:
    if not p:
        forms["пусто"] += 1
    elif p.endswith("қызы") or p.endswith("кызы"):
        forms["қызы"] += 1
    elif p.endswith("ұлы") or p.endswith("улы"):
        forms["ұлы"] += 1
    else:
        forms["русская"] += 1
print(forms)

for sid in ("amirova-khaliya", "shabelyanov-sergey", "erkinkyzy-aynur"):
    r = cur.execute("SELECT nameRu, patronymicRu, nameKz, patronymicKz FROM Doctor WHERE id=?", (sid,)).fetchone()
    print(sid, "| RU:", r[1], "| KZ:", r[3], "| nameKz:", r[2])
con.close()
