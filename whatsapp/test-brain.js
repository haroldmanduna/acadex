import { loadBank, handleTurn, resetFree } from './tutor.js';
import { solveMath, explainScience, helpEnglish } from './brain.js';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const bank = loadBank(root);
const from = '263771000001';

function turn(text) {
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
  const t = (r.replies || []).filter(x => x.type === 'text').map(x => x.text).join('\n');
  return t;
}

const fail = [];
function expect(name, cond, detail) {
  if (!cond) fail.push(name + (detail ? ' :: ' + detail : ''));
  else console.log('OK', name);
}

handleTurn({ from, text: 'mhoro acadex', bank, publicUrl: '', adminPhone: '263716987183', trigger: 'mhoro acadex', sessionMinutes: 30 });

const cases = [
  ['Help 2+2', r => /4/.test(firstText(r)) && !/PAPERS/.test(firstText(r))],
  ['2+2', r => /\b4\b/.test(firstText(r))],
  ['what is 9-4', r => /\b5\b/.test(firstText(r))],
  ['15% of 80', r => /\b12\b/.test(firstText(r))],
  ['2x+3=11', r => /x = 4/.test(firstText(r)) || /\b4\b/.test(firstText(r))],
  ['x^2-5x+6=0', r => /2/.test(firstText(r)) && /3/.test(firstText(r))],
  ['photosynthesis', r => /chlorophyll|glucose|CO₂|CO2/i.test(firstText(r))],
  ['osmosis', r => /water potential/i.test(firstText(r))],
  ['composition about a kombi', r => /kombi/i.test(firstText(r)) && /P1|350/i.test(firstText(r))],
  ['Download 2024 Maths Paper 1', r => (r.replies || []).some(x => x.type === 'document' && /4004/.test(x.filename))],
  ['Download 2024 Science Paper 2', r => (r.replies || []).some(x => x.type === 'document' && /5006/.test(x.filename))],
  ['Download 2024 English Paper 1', r => (r.replies || []).some(x => x.type === 'document' && /1122/.test(x.filename))],
  ['predictor', r => /4004/.test(firstText(r)) && /5006/.test(firstText(r))],
  ['help', r => /send the actual question/i.test(firstText(r))],
  ['zzzz not a real topic 999', r => /will not dump the menu/i.test(firstText(r))],
  ['F=ma m=2 a=3', r => /6/.test(firstText(r))],
  ['1/2 + 1/4', r => /3\/4/.test(firstText(r))],
  ['area rectangle 5 by 8', r => /\b40\b/.test(firstText(r))],
];

for (const [q, fn] of cases) {
  const r = turn(q);
  const detail = firstText(r).replace(/\s+/g, ' ').slice(0, 160);
  expect(q, fn(r), detail);
}

const sm = solveMath('Help 2+2');
expect('solveMath Help 2+2', sm && sm.answer === '4', JSON.stringify(sm));
expect('science', !!explainScience('photosynthesis'), '');
expect('english', !!helpEnglish('composition about drought'), '');

if (fail.length) {
  console.error('FAIL', fail.length);
  fail.forEach(f => console.error(' -', f));
  process.exit(1);
}
console.log('ALL PASS', cases.length);
