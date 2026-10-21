import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

// Топ-8 врачей по рейтингу (блок «Наша команда»)
const TEAM = [
  { id: 'satybaldiyeva',   p: 'Professional medical headshot portrait of a Kazakh woman doctor in her mid 30s, long dark hair, white medical coat over light blouse, stethoscope around neck, warm confident smile, looking at camera, head and shoulders, studio portrait, soft even lighting, plain light warm-gray background, photorealistic, high quality' },
  { id: 'bekmuratova',     p: 'Professional medical headshot portrait of a Kazakh woman doctor in her mid 40s, dark hair pulled back, white medical coat over pastel blouse, stethoscope, calm friendly smile, looking at camera, head and shoulders, studio portrait, soft even lighting, plain light warm-gray background, photorealistic, high quality' },
  { id: 'erzhanova',       p: 'Professional medical headshot portrait of a young Kazakh woman doctor in her early 30s, shoulder-length dark hair, white medical coat over light top, stethoscope, bright warm smile, looking at camera, head and shoulders, studio portrait, soft even lighting, plain light warm-gray background, photorealistic, high quality' },
  { id: 'tulegenov',       p: 'Professional medical headshot portrait of a Kazakh man doctor in his early 50s, short graying hair, white medical coat over shirt, stethoscope, confident kind smile, looking at camera, head and shoulders, studio portrait, soft even lighting, plain light warm-gray background, photorealistic, high quality' },
  { id: 'abdrakhmanov',    p: 'Professional medical headshot portrait of a Kazakh man doctor in his mid 40s, short dark hair, neat short beard, white medical coat over blue shirt, stethoscope, friendly smile, looking at camera, head and shoulders, studio portrait, soft even lighting, plain light warm-gray background, photorealistic, high quality' },
  { id: 'kulkenov',        p: 'Professional medical headshot portrait of an Asian man doctor in his early 40s, short black hair, white medical coat over dark shirt, stethoscope, composed friendly expression, looking at camera, head and shoulders, studio portrait, soft even lighting, plain light warm-gray background, photorealistic, high quality' },
  { id: 'abylkassymova',   p: 'Professional medical headshot portrait of a Kazakh woman doctor in her early 40s, dark hair in a low bun, white medical coat over beige blouse, stethoscope, warm professional smile, looking at camera, head and shoulders, studio portrait, soft even lighting, plain light warm-gray background, photorealistic, high quality' },
  { id: 'kenzhebekova',    p: 'Professional medical headshot portrait of a young Kazakh woman doctor in her early 30s, long wavy dark hair, white medical coat over white blouse, stethoscope, cheerful warm smile, looking at camera, head and shoulders, studio portrait, soft even lighting, plain light warm-gray background, photorealistic, high quality' },
];

const OUT = '/home/z/my-project/scripts/team-raw';
fs.mkdirSync(OUT, { recursive: true });

const zai = await ZAI.create();

for (const { id, p } of TEAM) {
  const out = path.join(OUT, `${id}.png`);
  if (fs.existsSync(out) && fs.statSync(out).size > 50000) {
    console.log(`skip ${id} (exists)`);
    continue;
  }
  let ok = false;
  for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
    try {
      const r = await zai.images.generations.create({ prompt: p, size: '1024x1024' });
      const b64 = r?.data?.[0]?.base64;
      if (!b64) throw new Error('empty base64');
      fs.writeFileSync(out, Buffer.from(b64, 'base64'));
      console.log(`OK ${id} (${Math.round(fs.statSync(out).size / 1024)} KB)`);
      ok = true;
    } catch (e) {
      console.error(`FAIL ${id} attempt ${attempt}: ${e.message}`);
      if (attempt < 3) await new Promise((s) => setTimeout(s, 1500 * attempt));
    }
  }
  if (!ok) process.exitCode = 1;
}
console.log('DONE');
