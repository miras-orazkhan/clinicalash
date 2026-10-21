# -*- coding: utf-8 -*-
"""Задача 18: привязать 22 врача из списка пользователя к филиалу «Пограничная» (pogranichnaya).
В БД формат «Имя Фамилия», у пользователя «Фамилия Имя Отчество» — матчинг двусторонний,
с проверкой отчества (RU или KZ). Попутно обновляются описания филиалов (счётчики врачей)."""
import sqlite3, json, unicodedata

DB = "/home/z/my-project/db/custom.db"

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

NEW_DESCS = {
    "serkebaeva": (
        "Основной филиал — 36 врачей и вся диагностика клиники.",
        "Негізгі филиал — 36 дәрігер және клиниканың толық диагностикасы.",
    ),
    "pogranichnaya": (
        "Второй филиал — 22 врача и диагностика, круглосуточно.",
        "Екінші филиал — 22 дәрігер мен диагностика, тәулік бойы.",
    ),
}

def norm(s):
    if not s:
        return ""
    s = unicodedata.normalize("NFKC", str(s)).lower().replace("ё", "е")
    return " ".join(s.split())

con = sqlite3.connect(DB)
cur = con.cursor()
doctors = cur.execute(
    "SELECT id, nameRu, patronymicRu, nameKz, patronymicKz, branches FROM Doctor"
).fetchall()

# Индекс: "имя фамилия" (норм.) -> [(id, patronymicRu, patronymicKz, branches)]
idx = {}
for (id_, nameRu, patRu, nameKz, patKz, branches) in doctors:
    idx.setdefault(norm(nameRu), []).append((id_, patRu, patKz, branches))

updated, failed = 0, []
for full in USER_LIST:
    parts = full.split()
    surname, first, pat = parts[0], parts[1], (parts[2] if len(parts) > 2 else "")
    # DB: "Имя Фамилия"
    cands = idx.get(norm(f"{first} {surname}"), [])
    hit = None
    for (id_, patRu, patKz, branches) in cands:
        pats = {norm(patRu), norm(patKz)}
        if norm(pat) in pats or not pat:
            hit = id_
            break
    if hit:
        cur.execute("UPDATE Doctor SET branches=?, updatedAt=datetime('now') WHERE id=?",
                    (json.dumps(["pogranichnaya"], ensure_ascii=False), hit))
        updated += 1
    else:
        failed.append(full)

# Описания филиалов
for bid, (ru, kz) in NEW_DESCS.items():
    cur.execute("UPDATE Branch SET descRu=?, descKz=?, updatedAt=datetime('now') WHERE id=?", (ru, kz, bid))

con.commit()

# Итоговые счётчики
counts = {}
for (id_, nameRu, patRu, nameKz, patKz, branches) in doctors:
    pass  # снимок устарел после UPDATE — пересчитываем свежим запросом
counts = {}
for bid, br in cur.execute("SELECT id, branches FROM Doctor").fetchall():
    for b in json.loads(br or "[]"):
        counts[b] = counts.get(b, 0) + 1
desc_check = dict(cur.execute("SELECT id, descRu FROM Branch WHERE id IN ('serkebaeva','pogranichnaya')").fetchall())
con.close()

print(f"Обновлено врачей → pogranichnaya: {updated} из {len(USER_LIST)}")
if failed:
    print("НЕ НАЙДЕНЫ:")
    for f in failed:
        print("  ", f)
print("Врачи по филиалам:", counts)
for k, v in desc_check.items():
    print(f"desc[{k}]: {v}")
