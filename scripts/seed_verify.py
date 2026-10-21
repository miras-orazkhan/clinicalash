"""Сверка оригинальной БД и восстановленной из сида (контентные таблицы, без дат)."""
import sqlite3, json, sys

DATE_FIELDS = {
    'Doctor': {'createdAt', 'updatedAt'},
    'Specialty': {'updatedAt'},
    'Branch': {'updatedAt'},
    'Review': {'createdAt'},
    'FaqItem': set(),
    'SiteText': {'updatedAt'},
    'SiteImage': {'updatedAt'},
    'Setting': {'updatedAt'},
}
TABLES = list(DATE_FIELDS)

def dump(path):
    con = sqlite3.connect(path)
    con.row_factory = sqlite3.Row
    out = {}
    for t in TABLES:
        skip = DATE_FIELDS[t]
        rows = [dict(r) for r in con.execute(f'SELECT * FROM "{t}"')]
        out[t] = sorted(
            ({k: v for k, v in r.items() if k not in skip} for r in rows),
            key=lambda r: json.dumps(r, sort_keys=True, ensure_ascii=False),
        )
    con.close()
    return out

a = dump('/home/z/my-project/db/custom.db')          # оригинал
b = dump('/home/z/my-project/tmp-seedtest/test.db')  # восстановленная

ok = True
for t in TABLES:
    same = a[t] == b[t]
    ok &= same
    mark = 'OK ' if same else 'FAIL'
    print(f'{mark} {t}: orig={len(a[t])} seed={len(b[t])}')
    if not same:
        only_a = [r for r in a[t] if r not in b[t]][:2]
        only_b = [r for r in b[t] if r not in a[t]][:2]
        print('  только в оригинале:', json.dumps(only_a, ensure_ascii=False)[:300])
        print('  только в сиде:    ', json.dumps(only_b, ensure_ascii=False)[:300])

# Точечные проверки бизнес-логики
con = sqlite3.connect('/home/z/my-project/tmp-seedtest/test.db')
cur = con.cursor()
pod = cur.execute("SELECT branches FROM Doctor WHERE id='podkorytov-vladimir'").fetchone()[0]
print('Подкорытов branches:', pod)
adv1 = cur.execute("SELECT valueRu FROM SiteText WHERE key='adv.1'").fetchone()
print('adv.1:', (adv1[0][:80] + '…') if adv1 else 'ОТСУТСТВУЕТ')
faq_n = cur.execute("SELECT COUNT(*) FROM FaqItem").fetchone()[0]
dms = cur.execute("SELECT COUNT(*) FROM FaqItem WHERE qRu LIKE '%ДМС%'").fetchone()[0]
print(f'FAQ: {faq_n} шт., про ДМС: {dms} (должно быть 6 и 0)')
rev_linked = cur.execute(
    "SELECT COUNT(*) FROM Review WHERE doctorId IS NOT NULL AND doctorId NOT IN (SELECT id FROM Doctor)"
).fetchone()[0]
print('Отзывы с битой ссылкой на врача:', rev_linked)
sys.exit(0 if ok and pod == '["pogranichnaya"]' and dms == 0 else 1)
