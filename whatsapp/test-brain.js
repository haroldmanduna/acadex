import { loadBank, handleTurn, resetFree } from './tutor.js';
import { solveMath, explainScience, helpEnglish } from './brain.js';
import path from 'path';
import { fileURLToPath } from 'url';

process.env.DISABLE_LLM = '1';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const bank = loadBank(root);
const from = '263771000001';

async function turn(text) {
  resetFree(from);
  return handleTurn({
    from, text, bank,
    publicUrl: 'https://acadex-r6z0.onrender.com',
    adminPhone: '263716987183',
    trigger: 'mhoro acadex',
    sessionMinutes: 30,
  });
}

function firstText(r) {
  return (r.replies || []).filter(x => x.type === 'text').map(x => x.text).join('\n');
}

const fail = [];
function expect(name, cond, detail) {
  if (!cond) fail.push(name + (detail ? ' :: ' + detail : ''));
  else console.log('OK', name);
}

await handleTurn({ from, text: 'mhoro acadex', bank, publicUrl: '', adminPhone: '263716987183', trigger: 'mhoro acadex', sessionMinutes: 30 });

const cases = [
  ['Help 2+2', r => /4/.test(firstText(r)) && !/PAPERS/.test(firstText(r))],
  ['2+2', r => /\b4\b/.test(firstText(r))],
  ['15% of 80', r => /\b12\b/.test(firstText(r))],
  ['2x+3=11', r => /4/.test(firstText(r))],
  ['photosynthesis', r => /chlorophyll|glucose|CO/i.test(firstText(r))],
  ['Download 2024 Maths Paper 1', r => (r.replies || []).some(x => x.type === 'document' && /4004/.test(x.filename))],
];

for (const [q, fn] of cases) {
  const r = await turn(q);
  expect(q, fn(r), firstText(r).replace(/\s+/g, ' ').slice(0, 160));
}

expect('solveMath Help 2+2', solveMath('Help 2+2')?.answer === '4', '');
expect('science', !!explainScience('photosynthesis'), '');
expect('english', !!helpEnglish('composition about drought'), '');

if (fail.length) {
  console.error('FAIL', fail.length);
  fail.forEach(f => console.error(' -', f));
  process.exit(1);
}
console.log('ALL PASS', cases.length);
