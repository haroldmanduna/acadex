import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadBank, handleTurn, resetFree } from './tutor.js';
import { solveMath, explainScience, helpEnglish } from './brain.js';
import { wantsVoice, ttsFile, speechScript, chunkSpeech } from './voice.js';
import { commandWord } from './zimsec.js';
import { wantsDiagram } from './diagrams.js';

process.env.DISABLE_LLM = '1';
process.env.DISABLE_VOICE = '1';

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
  if (!cond) fail.push(name + (detail ? ' :: ' + String(detail).slice(0, 180) : ''));
  else console.log('OK', name);
}

const cases = [
  ['hi', r => !r.ignored && /acadex|call you|working|mock/i.test(firstText(r))],
  ['Ndinonzi Anesu. Form 4.', r => /anesu/i.test(firstText(r)) || !r.ignored],
  ['Help 2+2', r => /4/.test(firstText(r)) && !/PAPERS/.test(firstText(r))],
  ['2x+3=11', r => /4/.test(firstText(r))],
  ['photosynthesis', r => /chlorophyll|glucose|CO/i.test(firstText(r))],
  ['Download 2024 Maths Paper 1', r => (r.replies || []).some(x => x.type === 'document' && /4004/.test(x.filename))],
];

for (const [q, fn] of cases) {
  const r = await turn(q);
  expect(q, fn(r), firstText(r).replace(/\s+/g, ' ').slice(0, 160));
}

// mock answer flow on a fresh phone
const f2 = '263771000002';
await handleTurn({ from: f2, text: 'mock', bank, publicUrl: '', adminPhone: '263716987183', trigger: 'x', sessionMinutes: 30 });
const a1 = await handleTurn({ from: f2, text: 'skip', bank, publicUrl: '', adminPhone: '263716987183', trigger: 'x', sessionMinutes: 30 });
expect('mock skip next', /Q2\/|Skipped|Keep going|Next/i.test(firstText(a1)), firstText(a1).slice(0, 120));

const marked = await handleTurn({
  from: '263771000003',
  text: 'mark 1. 4x+12\n2. 50%\n3. x=4',
  bank, publicUrl: '', adminPhone: '263716987183', trigger: 'x', sessionMinutes: 30,
});
expect('mark numbered', /Marked|✓|✗|\d+\/\d+/i.test(firstText(marked)), firstText(marked).slice(0, 120));

const essay = 'Once upon a time in Mbare the tomatoes were too expensive and the queue at the rank stretched past the clinic. '
  + 'I wanted to go home but the kombi hooted twice. '.repeat(40);
const er = await handleTurn({ from: '263771000004', text: essay, bank, publicUrl: '', adminPhone: '263716987183', trigger: 'x', sessionMinutes: 30 });
expect('essay mark', /1122|word count|composition/i.test(firstText(er)), firstText(er).slice(0, 120));

const silent = await turn('2+2');
expect('no auto audio', !(silent.replies || []).some(x => x.type === 'audio'), (silent.replies || []).map(x => x.type).join(','));

expect('solveMath Help 2+2', solveMath('Help 2+2')?.answer === '4', '');
expect('science', !!explainScience('photosynthesis'), '');
expect('english', !!helpEnglish('composition about drought'), '');

expect('wantsVoice', wantsVoice('voice') && !wantsVoice('2x+3=11'), '');
const script = speechScript('Subtract 3 from both sides. x = 4. Destarched so starch is new.', 'Anesu');
expect('speech name', /anesu/i.test(script) && /4|destarch|starch|subtract/i.test(script) && !/tatenda/i.test(script), script);
expect('chunks', chunkSpeech('Sentence one. Sentence two. Sentence three. Sentence four.', 25).length >= 2, '');
const long = 'Subtract 3 from both sides so the x is less lonely. Then divide by 2. x equals 4. Check: 2 times 4 plus 3 is 11.';
const mp3 = await ttsFile(root, long, 'en', 'Anesu');
expect('tts mp3', mp3 && fs.existsSync(mp3) && fs.statSync(mp3).size > 800 && !/solve\.mp3$/i.test(mp3), mp3 + ' ' + (mp3 && fs.statSync(mp3).size));

expect('no diagram on 2x', !(silent.replies||[]).some(x=>x.type==='image'), '');
expect('wantsDiagram', wantsDiagram('draw a triangle') && !wantsDiagram('2x+3=11'), '');
const dr = await handleTurn({ from: '263771000088', text: 'draw a right angled triangle', bank, publicUrl: '', adminPhone: '263716987183', trigger: 'x', sessionMinutes: 30 });
expect('drew triangle', (dr.replies||[]).some(x=>x.type==='image' && x.filePath), (dr.replies||[]).map(x=>x.type).join(','));
if (fail.length) {
  console.error('FAIL', fail.length);
  fail.forEach(f => console.error(' -', f));
  process.exit(1);
}
console.log('ALL PASS');
