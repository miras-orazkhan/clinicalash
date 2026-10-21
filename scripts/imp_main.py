# -*- coding: utf-8 -*-
"""Импорт реальных данных клиники из xlsx (doq.kz parser) в БД сайта:
- Врачи: замена плейсхолдеров (58 реальных врачей)
- Специальности: +7 новых направлений, услуги/цены реальных направлений заменяют плейсхолдеры
- Филиал «Серкебаева, 81» (все врачи из файла оттуда), старые плейсхолдер-филиалы скрываются
- Отзывы-плейсхолдеры отвязываются от старых врачей/филиалов
Запуск: python3 scripts/imp_main.py  (идемпотентен, можно перезапускать)
"""
import json, re, sqlite3, sys, unicodedata
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from imp_specialists import SPECIALIST, NEW_SPECS
from imp_services import service_direction_and_kz

ROOT = Path("/home/z/my-project")
DB = ROOT / "db/custom.db"
RAW = ROOT / "scripts/tmp/xlsx_raw.json"
PHOTO_DIR = ROOT / "public/uploads/doctors"
NOTE0 = {"ru": "по записи", "kz": "жазылу бойынша"}

TRANSLIT = {
    "а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"yo","ж":"zh","з":"z","и":"i","й":"y",
    "к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f",
    "х":"kh","ц":"ts","ч":"ch","ш":"sh","щ":"shch","ъ":"","ы":"y","ь":"","э":"e","ю":"yu","я":"ya",
    "ұ":"u","ә":"a","ғ":"g","қ":"q","ң":"n","ө":"o","ү":"u","һ":"h","і":"i","і":"i",
}

def translit(s: str) -> str:
    s = s.lower()
    out = []
    for ch in s:
        if ch in TRANSLIT: out.append(TRANSLIT[ch])
        elif ch.isalnum(): out.append(ch)
        else: out.append("-")
    return re.sub(r"-+", "-", "".join(out)).strip("-")

def norm(s: str) -> str:
    return " ".join((s or "").replace("&nbsp;", " ").split())

def parse_service_line(line: str):
    """'Название (24000 ₸)' → (name, price). 'Не указана' → 0."""
    m = re.match(r"^(.*?)[\s]*\((\d+|Не указана)[^)]*₸\)$", line.strip())
    if not m: return norm(line), None
    return norm(m.group(1)), (0 if m.group(2) == "Не указана" else int(m.group(2)))

def parse_name(full: str):
    """'Фамилия Имя [Отчество]' → (имя фамилия, отчество) — сайт хранит «Имя Фамилия»."""
    w = full.split()
    if len(w) >= 3:
        return f"{w[1]} {w[0]}", " ".join(w[2:])
    if len(w) == 2:
        return f"{w[1]} {w[0]}", ""
    return full, ""

def load_doctors():
    data = json.load(open(RAW))
    rows = [r for r in data["Врачи"][1:] if r and norm(r[0])]
    docs = []
    for r in rows:
        docs.append({
            "full": norm(r[0]),
            "exp": int(float(r[1])) if r[1] and r[1].replace(".0","").strip().isdigit() else 0,
            "category": norm(r[2]),
            "degree": norm(r[3]),
            "specialities": [norm(x) for x in (r[4] or "").split(",") if norm(x)],
            "photo": (r[6] or "").strip(),
            "about": norm(r[7]),
            "education": norm(r[8]),
            "refresher": norm(r[9]),
            "work_history": norm(r[10]),
            "services_raw": [norm(x) for x in (r[11] or "").split(";") if norm(x)],
        })
    return docs

def category_code(s: str) -> str:
    if "Первая" in s or "первая" in s: return "first"
    if "Вторая" in s or "вторая" in s: return "second"
    return "highest"

def download_photo(url: str, slug: str):
    import urllib.request
    ext_m = re.search(r"\.(jpe?g|png|webp|gif)(?:\?|$)", url)
    ext = ext_m.group(1).replace("jpeg", "jpg") if ext_m else "jpg"
    dest = PHOTO_DIR / f"{slug}.{ext}"
    if dest.exists() and dest.stat().st_size > 1000:
        return f"/uploads/doctors/{dest.name}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"})
    with urllib.request.urlopen(req, timeout=25) as resp, open(dest, "wb") as f:
        f.write(resp.read())
    return f"/uploads/doctors/{dest.name}"

def main():
    docs = load_doctors()
    print(f"Врачей в файле: {len(docs)}")

    # --- 1. Агрегация услуг по направлениям ---
    spec_services: dict[str, dict[str, dict]] = {}   # slug → ru_name → item
    warnings: list[str] = []

    def add_service(slug: str, ru: str, kz: str, price: int):
        item = spec_services.setdefault(slug, {}).get(ru)
        if item is None:
            spec_services[slug][ru] = {"name": {"ru": ru, "kz": kz}, "price": price}
        elif price and (item["price"] == 0 or price < item["price"]):
            item["price"] = price  # минимум цен из реальных данных

    for d in docs:
        for raw in d["services_raw"]:
            name, price = parse_service_line(raw)
            if name in SPECIALIST:
                _, kz_name, gen = SPECIALIST[name]
                ru_cons = f"Приём {gen}"
                kz_cons = f"{kz_name} қабылдауы"
                targets = SPECIALIST[name][0]
                for slug in targets if isinstance(targets, list) else [targets]:
                    add_service(slug, ru_cons, kz_cons, price or 0)
            else:
                slug, kz = service_direction_and_kz(name)
                if slug is None:
                    warnings.append(f"Не найдено направление для услуги: «{name}» ({d['full']})")
                    continue
                add_service(slug, name, kz, price or 0)

    if warnings:
        print("!! Предупреждения:"); [print("  -", w) for w in sorted(set(warnings))]

    # --- 2. Слаги врачей (уникальные) ---
    used: set[str] = set()
    for d in docs:
        fam_im = d["full"].split()
        base = translit(f"{fam_im[0]}-{fam_im[1]}") if len(fam_im) > 1 else translit(d["full"])
        slug, i = base, 2
        while slug in used: slug, i = f"{base}-{i}", i + 1
        used.add(slug); d["id"] = slug

    # --- 3. Фото ---
    PHOTO_DIR.mkdir(parents=True, exist_ok=True)
    ok = fail = 0
    for d in docs:
        d["photoUrl"] = None
        if d["photo"].startswith("http"):
            try:
                d["photoUrl"] = download_photo(d["photo"], d["id"]); ok += 1
            except Exception as e:
                d["photoUrl"] = d["photo"]  # внешняя ссылка как fallback
                fail += 1; print(f"  фото не скачалось ({d['id']}): {e} — оставляю внешнюю ссылку")
    print(f"Фото: скачано {ok}, fallback-ссылок {fail}")

    # --- 4. Поля врачей ---
    for i, d in enumerate(docs):
        name, patronymic = parse_name(d["full"])
        d["name"], d["patronymic"] = name, patronymic
        first = next((s for s in d["specialities"] if s in SPECIALIST), d["specialities"][0] if d["specialities"] else "Врач")
        if first in SPECIALIST:
            d["title"] = {"ru": first, "kz": SPECIALIST[first][1]}
        else:
            d["title"] = {"ru": first, "kz": first}
        slugs: list[str] = []
        for s in d["specialities"]:
            if s not in SPECIALIST:
                warnings.append(f"Специалист без маппинга: «{s}» ({d['full']})"); continue
            t = SPECIALIST[s][0]
            for slug in t if isinstance(t, list) else [t]:
                if slug not in slugs: slugs.append(slug)
        d["slugs"] = slugs
        edu = ". ".join(x for x in [d["degree"], d["education"], d["refresher"]] if x)
        bio = " ".join(x for x in [d["about"], f"Опыт работы: {d['work_history']}" if d["work_history"] else ""] if x)
        cons_prices = [parse_service_line(raw)[1] for raw in d["services_raw"]
                       if parse_service_line(raw)[0] in SPECIALIST and parse_service_line(raw)[1] is not None]
        cons_prices = [p for p in cons_prices if p > 0]  # «Не указана» (0) не обнуляет цену
        d["price"] = min(cons_prices) if cons_prices else 0
        d["edu"], d["bio"] = edu, bio
        d["category"] = category_code(d["category"])

    # --- 5. Запись в БД ---
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("PRAGMA journal_mode=WAL")

    # 5а. новые направления
    for slug, (nru, nkz, icon, sru, skz, dru, dkz, sort) in NEW_SPECS.items():
        cur.execute("SELECT 1 FROM Specialty WHERE slug=?", (slug,))
        if cur.fetchone():
            cur.execute("UPDATE Specialty SET nameRu=?, nameKz=?, icon=? WHERE slug=?", (nru, nkz, icon, slug))
        else:
            cur.execute(
                "INSERT INTO Specialty (slug, kind, icon, nameRu, nameKz, shortRu, shortKz, descRu, descKz, featured, published, sortOrder, services, updatedAt)"
                " VALUES (?, 'specialty', ?, ?, ?, ?, ?, ?, ?, 0, 1, ?, '[]', datetime('now'))",
                (slug, icon, nru, nkz, sru, skz, dru, dkz, sort))
        print(f"  направление: {slug} ({nru})")

    # 5б. услуги по покрытым направлениям (замена плейсхолдеров реальными)
    order_first = lambda kv: (0 if kv[0].startswith("Приём") else 1, kv[0])
    covered = sorted(spec_services.keys())
    for slug in covered:
        items = sorted(spec_services[slug].values(), key=lambda it: it["name"]["ru"])
        items = [{**it, **({"note": NOTE0} if it["price"] == 0 else {})} for it in items]
        cur.execute("UPDATE Specialty SET services=?, updatedAt=datetime('now') WHERE slug=?",
                    (json.dumps(items, ensure_ascii=False), slug))
    print(f"Услугами покрыто направлений: {len(covered)} → {', '.join(covered)}")

    # 5в. врачи: замена
    cur.execute("DELETE FROM Doctor")
    for i, d in enumerate(docs):
        cur.execute(
            "INSERT INTO Doctor (id, nameRu, nameKz, patronymicRu, patronymicKz, titleRu, titleKz, specialties,"
            " experience, category, branches, rating, reviewsCount, price, bioRu, bioKz, educationRu, educationKz,"
            " photoUrl, published, sortOrder, createdAt, updatedAt)"
            " VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, datetime('now'), datetime('now'))",
            (d["id"], d["name"], d["name"], d["patronymic"], d["patronymic"],
             d["title"]["ru"], d["title"]["kz"], json.dumps(d["slugs"], ensure_ascii=False),
             d["exp"], d["category"], json.dumps(["serkebaeva"]), 4.9, 0, d["price"],
             d["bio"], "", d["edu"], "", d["photoUrl"], 1, i))
    print(f"Врачей записано: {len(docs)}")

    # 5г. филиал «Серкебаева, 81» + скрытие плейсхолдеров
    cur.execute("SELECT 1 FROM Branch WHERE id='serkebaeva'")
    if cur.fetchone():
        cur.execute("UPDATE Branch SET nameRu=?, nameKz=?, addressRu=?, addressKz=?, published=1 WHERE id='serkebaeva'",
                    ("Клиника на Серкебаева", "Серкебаева көшесіндегі клиника",
                     "г. Алматы, ул. Серкебаева, 81", "Алматы қ., Серкебаева к-сі, 81"))
    else:
        cur.execute(
            "INSERT INTO Branch (id, nameRu, nameKz, districtRu, districtKz, addressRu, addressKz, phone, hours,"
            " descRu, descKz, highlights, landmarkRu, landmarkKz, mapUrl, photoUrl, published, sortOrder, updatedAt)"
            " VALUES ('serkebaeva', ?, ?, '', '', ?, ?, (SELECT phone FROM Branch WHERE id='central'), ?,"
            " 'Основной адрес клиники — все специалисты принимают здесь.', 'Клиниканың негізгі мекенжайы — барлық мамандар осында қабылдайды.',"
            " '[]', '', '', '', NULL, 1, 0, datetime('now'))",
            ("Клиника на Серкебаева", "Серкебаева көшесіндегі клиника",
             "г. Алматы, ул. Серкебаева, 81", "Алматы қ., Серкебаева к-сі, 81",
             json.dumps([{"ru": "Пн–Сб: 8:00–20:00", "kz": "Дс–Сб: 8:00–20:00"}], ensure_ascii=False)))
    cur.execute("UPDATE Branch SET published=0 WHERE id IN ('samal','central','aksay')")
    print("Филиал «Серкебаева, 81» создан/обновлён, старые филиалы скрыты")

    # 5д. отвязать отзывы от удалённых врачей/филиалов
    n = cur.execute("UPDATE Review SET doctorId=NULL, branchId=NULL WHERE doctorId IS NOT NULL OR branchId IS NOT NULL").rowcount
    print(f"Отзывов отвязано: {n}")

    con.commit(); con.close()
    print("Импорт завершён.")

if __name__ == "__main__":
    main()
