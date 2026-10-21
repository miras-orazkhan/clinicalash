import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

// Перевод био и образования 58 врачей на казахский язык (bioKz, educationKz).
// Чекпоинт: scripts/tmp/bios_kz.json — можно перезапускать, готовые пропускаются.

const SRC = '/home/z/my-project/scripts/tmp/bios_for_translation.json';
const OUT = '/home/z/my-project/scripts/tmp/bios_kz.json';

const items = JSON.parse(fs.readFileSync(SRC, 'utf8'));
let done = {};
if (fs.existsSync(OUT)) done = JSON.parse(fs.readFileSync(OUT, 'utf8'));

const SYSTEM = `Ты профессиональный медицинский переводчик с русского на казахский язык (Казахстан, официальная медицинская терминология).
Тебе дают JSON с полями bioRu (био врача) и educationRu (образование и опыт в исходном виде).
Правила:
1. Переведи оба поля на казахский язык точно и естественно, без добавления новых фактов и без пропуска информации.
2. Если в тексте встречается строка "Опыт работы:" — переводи её как "Еңбек өтілі:" и сохраняй перенос строки \\n перед ней (она идёт отдельным абзацем).
3. Имена и фамилии транслитерируй по казахским нормам; названия клиник, больниц, вузов и городов сохраняй как есть (например: «ЭМИРМЕД», КазНМУ, ТОО «СУНКАР») либо используй устоявшееся казахское написание.
4. Сокращения (к.м.н., PHD, УЗИ, ТРУЗИ) передавай принятыми в казахском языке: "м.ғ.к." для кандидата медицинских наук, "УДЗ" не нужен — УЗИ обычно оставляют как "УЗИ".
5. Числа, годы, цены не изменяй.
6. Ответь СТРОГО одним JSON-объектом без markdown-обёртки: {"bioKz": "...", "educationKz": "..."}`;

function extractJson(text) {
  if (!text) return null;
  let t = text.trim();
  t = t.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  const m = t.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const obj = JSON.parse(m[0]);
    if (typeof obj.bioKz === 'string' && typeof obj.educationKz === 'string') return obj;
  } catch {
    /* try repair below */
  }
  // Попытка починки обрезанного JSON
  try {
    const repaired = m[0].replace(/,\s*}$/, '}') + (m[0].trim().endsWith('}') ? '' : '"}');
    const obj = JSON.parse(repaired);
    if (typeof obj.bioKz === 'string' && typeof obj.educationKz === 'string') return obj;
  } catch {
    return null;
  }
  return null;
}

async function translateOne(zai, item) {
  const user = JSON.stringify({ bioRu: item.bioRu, educationRu: item.educationRu });
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: SYSTEM },
          { role: 'user', content: user },
        ],
        thinking: { type: 'disabled' },
      });
      const raw = completion.choices?.[0]?.message?.content;
      const obj = extractJson(raw);
      if (!obj) throw new Error('bad JSON response');
      if (obj.bioKz.trim().length < Math.max(60, item.bioRu.length * 0.35)) throw new Error('bioKz too short');
      if (item.educationRu && obj.educationKz.trim().length < Math.max(20, item.educationRu.length * 0.25)) throw new Error('educationKz too short');
      return { bioKz: obj.bioKz.trim(), educationKz: obj.educationKz.trim() };
    } catch (e) {
      console.error(`  FAIL ${item.id} attempt ${attempt}: ${e.message}`);
      const is429 = /429/.test(e.message);
      if (attempt < 6) await new Promise((s) => setTimeout(s, is429 ? 8000 * attempt : 1500 * attempt));
    }
  }
  return null;
}

const zai = await ZAI.create();
const queue = items.filter((i) => !done[i.id]);
console.log(`Всего ${items.length}, осталось ${queue.length}`);

let idx = 0;
async function worker() {
  while (true) {
    const my = idx++;
    if (my >= queue.length) break;
    const item = queue[my];
    const res = await translateOne(zai, item);
    if (res) {
      done[item.id] = res;
      fs.writeFileSync(OUT, JSON.stringify(done, null, 1));
      console.log(`OK [${my + 1}/${queue.length}] ${item.id} (bio ${res.bioKz.length} симв.)`);
    } else {
      console.error(`SKIP ${item.id} — все попытки исчерпаны`);
    }
  }
}

const CONC = Number(process.env.CONC || 1);
await Promise.all(Array.from({ length: CONC }, () => worker()));

const okCount = Object.keys(done).length;
const failed = items.filter((i) => !done[i.id]).map((i) => i.id);
console.log(`\nГотово: ${okCount}/${items.length}; провалов: ${failed.length}${failed.length ? ' -> ' + failed.join(', ') : ''}`);
if (failed.length) process.exitCode = 2;
