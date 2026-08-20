import { loadBank, handleTurn, resetFree } from './tutor.js';
import path from 'path';
import { fileURLToPath } from 'url';

delete process.env.DISABLE_LLM;

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const bank = loadBank(root);
const from = '263771009999';

async function say(text) {
  resetFree(from);
  const r = await handleTurn({
    from, text, bank, publicUrl: '',
    adminPhone: '263716987183',
    trigger: 'mhoro acadex',
    sessionMinutes: 30,
  });
  const t = (r.replies || []).map(x => x.text || x.filename).join('\n');
  console.log('\n>>>', text);
  console.log(t.slice(0, 700));
  return t;
}

const fail = [];
function ok(name, cond) {
  if (!cond) { fail.push(name); console.log('FAIL', name); }
  else console.log('OK', name);
}

const g = await say('mhoro acadex');
ok('greet name', /acadex/i.test(g) && !/PAPERS/.test(g));

const n = await say("What's your name?");
ok('identity', /acadex/i.test(n) && !/claude|chatgpt|gemini|deepseek|language model|harold|manduna/i.test(n));

const m = await say('Help 2+2');
ok('2+2', /\b4\b/.test(m) && !/Download 2024 Maths Paper 1\n•/.test(m));

const sh = await say('Ndinonzi Tafadzwa. Ndiratidze photosynthesis muchiShona.');
ok('shona', /photosynth|mashizha|chiedza|glucose|CO/i.test(sh));

const fr = await say('Bonjour, comment tu t\'appelles ?');
ok('french', /acadex/i.test(fr));

const eq = await say('Solve 2x+3=11 and explain like a teacher');
ok('linear', /4/.test(eq));

if (fail.length) {
  console.error('TEACHER FAIL', fail);
  process.exit(1);
}
console.log('\nTEACHER LIVE PASS');
