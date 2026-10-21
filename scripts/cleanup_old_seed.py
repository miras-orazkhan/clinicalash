"""Очистка старых демо-данных (Task 20): 3 старых филиала + скрытая процедура check-up."""
import sqlite3, json

con = sqlite3.connect('/home/z/my-project/db/custom.db')
cur = con.cursor()

# Предохранители: убедиться, что на старые филиалы нет ссылок
refs = {}
for (b,) in cur.execute('SELECT branches FROM Doctor'):
    for x in json.loads(b):
        refs[x] = refs.get(x, 0) + 1
print('Ссылки врачей на филиалы:', refs)
assert not (set(refs) & {'samal', 'central', 'aksay'}), 'Врач ссылается на удаляемый филиал!'
assert cur.execute("SELECT COUNT(*) FROM Review WHERE branchId IN ('samal','central','aksay')").fetchone()[0] == 0
assert cur.execute("SELECT COUNT(*) FROM Booking WHERE branchId IN ('samal','central','aksay')").fetchone()[0] == 0

# Удаление старых демо-филиалов (не опубликованы, старые телефоны 350-40-4x)
for bid in ('samal', 'central', 'aksay'):
    cur.execute('DELETE FROM Branch WHERE id=? AND published=0', (bid,))
    print('удалён филиал:', bid, '(rows:', cur.rowcount, ')')

# Удаление скрытой демо-процедуры check-up (входит только в старый сид, услуг 5, не в реальном прайсе)
cur.execute("DELETE FROM Specialty WHERE slug='check-up' AND published=0")
print('удалён check-up (rows:', cur.rowcount, ')')

con.commit()

# Итоговые счётчики
for t in ('Branch', 'Specialty', 'Doctor', 'SiteText', 'Review', 'FaqItem', 'Setting', 'SiteImage'):
    print(t, cur.execute(f'SELECT COUNT(*) FROM {t}').fetchone()[0])
con.close()
print('OK')
