import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

// Перевод названий медицинских процедур на казахский (для прайс-листов).
// Чекпоинт: scripts/tmp/procedures_kz.json — перезапуск продолжает с места остановки.

const SRC = '/home/z/my-project/scripts/tmp/procedures_ru.json';
const OUT = '/home/z/my-project/scripts/tmp/procedures_kz.json';
const CHUNK = 15;

const data = JSON.parse(fs.readFileSync(SRC, 'utf8'));
let done = {};
if (fs.existsSync(OUT)) done = JSON.parse(fs.readFileSync(OUT, 'utf8'));

const SYSTEM = `Ты профессиональный медицинский переводчик с русского на казахский язык (Казахстан).
Тебе дают JSON-массив названий медицинских процедур/исследований (прайс-лист клиники).
Переведи КАЖДУЮ позицию на казахский язык, сохраняя порядок и количество.
Правила:
1. Медицинские сокращения сохраняются латиницей/кириллицей как принято: МРТ, КТ, ЭКГ, ЭЭГ, ЭНМГ, СМАД, Холтер, MRCP, PI-RADS, FIESTA, FULL BODY, ВНЧС, ТБС, УЗИ.
2. Названия проекций: "в 1 проекции" → "1 проекцияда", "в 2-х проекциях" → "2 проекцияда", "прямая проекция" → "тікелей проекция", "боковая" → "бүйірлік", "косая" → қиғаш ("қиғаш проекцияда").
3. "с контрастом" → "контрастімен", "без контраста" → "контрастісіз".
4. Части тела: головной мозг → ми, шейный отдел позвоночника → мойын омыртқа бөлімі, грудной → кеуде, пояснично-крестцовый → бел-сегізжілік, крестец → сегізжілік, копчик → құймышақ, тазобедренный сустав → жамбас-сан буыны, коленный → тізе, локтевой → шынтақ, плечевой → иық, лучезапястный → білезік, голеностопный → тізеүсті/табан буыны (используй "голеностопный буын" нельзя — пиши "табан буыны"), придаточные пазухи носа → мұрын қосалқы қуыстары, глазные орбиты → көз алақандары/көз орбиталары (пиши "көз орбиталары"), щитовидная железа → қалқанша безі, брюшная полость → құрсақ қуысы, забрюшинное пространство → ішекарты кеңістігі (пиши "құрсақ арты кеңістігі"), органы малого таза → жамбас мүшелері, мочевыводящая система → зәр шығару жүйесі, мягкие ткани → жұмсақ тіндер, позвоночник → омыртқа бағаны, ребра → қабырғалар, ключица → кұс宻... НЕ выдумывай: ключица → кілт жілік, лопатка → жауырын, грудина → төс сүйек, челюсть → жақ, турецкое седло → түрік седласы (пиши "түрік ерітіндісі" НЕЛЬЗЯ — пиши "түрік седласы").
5. Справки/документы: справка → анықтама, больничный лист → еңбекке уақытша жарамсыздық парағы (бөліп айт: "(ауру парағы)"), санитарная книжка → санитарлық книжка, санаторно-курортная карта → санаторий-курорттық карта, профилактический осмотр → профилактикалық қарау, детский сад → бала бақша, школа → мектеп.
6. Процедуры: капельница → тамшылатын инфузия (пиши "Капельница" НЕЛЬЗЯ — пиши "Тамшылатын инфузия"), укол внутривенно → көктамыр ішіне инъекция, внутримышечно → бұлшықет ішіне, подкожно → тері астына, внутрикожно → тері ішіне, проба → сынама, кровопускание → қан ағыту (пиши "Қан ағыту"), сатурация → қанықтыру (сатурация).
7. Числа, объёмы (мл), номера справок (№ 075/у) не изменяй.
8. Ответь СТРОГО одним JSON-массивом казахских строк без markdown, той же длины.`;

function extractJson(text) {
  if (!text) return null;
  let t = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  const m = t.match(/\[[\s\S]*\]/);
  if (!m) return null;
  try {
    const arr = JSON.parse(m[0]);
    if (Array.isArray(arr) && arr.every((x) => typeof x === 'string')) return arr;
  } catch { /* noop */ }
  return null;
}

async function translateChunk(zai, slug, start, names) {
  const key = `${slug}:${start}`;
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: SYSTEM },
          { role: 'user', content: JSON.stringify(names) },
        ],
        thinking: { type: 'disabled' },
      });
      const arr = extractJson(completion.choices?.[0]?.message?.content);
      if (!arr || arr.length !== names.length) throw new Error(`bad array len ${arr?.length}/${names.length}`);
      if (arr.some((s) => !s.trim())) throw new Error('empty translation');
      return arr;
    } catch (e) {
      console.error(`  FAIL ${key} attempt ${attempt}: ${e.message}`);
      const is429 = /429/.test(e.message);
      if (attempt < 6) await new Promise((s) => setTimeout(s, is429 ? 8000 * attempt : 1500 * attempt));
    }
  }
  return null;
}

const zai = await ZAI.create();

const jobs = [];
for (const [slug, items] of Object.entries(data)) {
  for (let i = 0; i < items.length; i += CHUNK) {
    const chunk = items.slice(i, i + CHUNK);
    const doneKey = `${slug}:${i}`;
    if (chunk.every((it, j) => done[`${slug}:${i + j}`])) continue;
    jobs.push({ slug, start: i, names: chunk.map((it) => it.n) });
  }
}
console.log(`Батчей к переводу: ${jobs.length}`);

let idx = 0;
async function worker() {
  while (true) {
    const my = idx++;
    if (my >= jobs.length) break;
    const { slug, start, names } = jobs[my];
    const arr = await translateChunk(zai, slug, start, names);
    if (arr) {
      arr.forEach((kz, j) => { done[`${slug}:${start + j}`] = kz; });
      fs.writeFileSync(OUT, JSON.stringify(done, null, 1));
      console.log(`OK ${slug}:${start} (${arr.length})`);
    } else {
      console.error(`SKIP ${slug}:${start}`);
    }
  }
}

await Promise.all(Array.from({ length: 1 }, () => worker()));

// Сводка
let missing = 0;
for (const [slug, items] of Object.entries(data)) {
  for (let i = 0; i < items.length; i++) if (!done[`${slug}:${i}`]) missing++;
}
console.log(`\nПереведено: ${Object.keys(done).length}; отсутствует: ${missing}`);
if (missing) process.exitCode = 2;
