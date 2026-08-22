import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadBank, handleTurn, resetFree } from './tutor.js';
import { solveMath, explainScience, helpEnglish, teachConcept, isConfused, searchBank, fallback } from './brain.js';
import { askedLanguage } from './voice.js';
import { bumpStreak, getLearner, appendChat, savedChat, harareDay } from './learner.js';
import { wantsVoice, ttsFile, speechScript, chunkSpeech } from './voice.js';
import { commandWord } from './zimsec.js';
import { wantsDiagram, figureKind } from './diagrams.js';

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

expect('send diagram phrase', wantsDiagram('Send a diagram of a right angled trianglw') && wantsDiagram('sketch y=2x+1') && wantsDiagram('circle with a tangent') && !wantsDiagram('2x+3=11'), '');
expect('kind right triangle', figureKind('Send a diagram of a right angled triangle') === 'triangle', figureKind('Send a diagram of a right angled triangle'));
const sd = await handleTurn({ from: '263771000201', text: 'Send a diagram of a right angled triangle', bank, publicUrl: '', adminPhone: '263716987183', trigger: 'x', sessionMinutes: 30 });
expect('send diagram image', (sd.replies||[]).some(x=>x.type==='image' && x.filePath), (sd.replies||[]).map(x=>x.type).join(','));
expect('no cannot send', !/cannot send image/i.test(firstText(sd)), firstText(sd).slice(0,120));

expect('show that square', /6x|9/.test(solveMath('Show that (x+3)^2 = x^2 + 6x + 9')?.answer || ''), JSON.stringify(solveMath('Show that (x+3)^2 = x^2 + 6x + 9')));
expect('gradient points', solveMath('Calculate the gradient of the line through (2,3) and (6,11)')?.answer === '2', '');
expect('simultaneous', /x = 3/.test(solveMath('2x+y=7 and x-y=2')?.answer || ''), solveMath('2x+y=7 and x-y=2')?.answer);
expect('confused', isConfused("I don't understand bearings") && !isConfused('2x+3=11'), '');
expect('no bank on confused', !searchBank(bank, "I don't understand bearings. what does 060 degrees even mean"), '');
expect('explain vs describe', /because/i.test(helpEnglish('what is the difference between explain and describe')?.answer || ''), '');
expect('concept pythag', /hypotenuse|square sitting/i.test(teachConcept("I don't get Pythagoras. why a squared")?.answer || ''), '');
expect('fallback not menu', !/dump the menu/i.test(fallback('draw the graph of y = -2x + 4 I do not get gradient')), fallback('hmm'));
const br = await handleTurn({ from: '263771000099', text: "I don't understand bearings. what does 060 mean", bank, publicUrl: '', adminPhone: '263716987183', trigger: 'x', sessionMinutes: 30 });
expect('bearings not mean', /bearing|north|clockwise/i.test(firstText(br)) && !/mean of 6/i.test(firstText(br)), firstText(br).slice(0, 160));
const sh = await handleTurn({ from: '263771000100', text: 'Show that (x+3)^2 = x^2 + 6x + 9', bank, publicUrl: '', adminPhone: '263716987183', trigger: 'x', sessionMinutes: 30 });
expect('show that turn', /9/.test(firstText(sh)) && !/dump the menu/i.test(firstText(sh)), firstText(sh).slice(0, 160));

const gHi = await handleTurn({ from: '263771000401', text: 'hi', bank, publicUrl: '', adminPhone: '263716987183', trigger: 'x', sessionMinutes: 30 });
const gMh = await handleTurn({ from: '263771000402', text: 'mhoro', bank, publicUrl: '', adminPhone: '263716987183', trigger: 'x', sessionMinutes: 30 });
expect('greeting english', /hello|english|send the question/i.test(firstText(gHi)) && /hello|english|send the question/i.test(firstText(gMh)) && !/zvakanaka|ndinotaura/i.test(firstText(gHi)+firstText(gMh)), firstText(gHi)+' | '+firstText(gMh));
expect('asked shona', askedLanguage('speak Shona') === 'sn' && askedLanguage('hi') === null && askedLanguage('mhoro') === null, '');
const pStreak = '263771000301';
bumpStreak(pStreak);
const s1 = getLearner(pStreak).streak;
bumpStreak(pStreak);
expect('streak same day', s1 === 1 && getLearner(pStreak).streak === 1, String(getLearner(pStreak).streak));
appendChat(pStreak, 'user', 'pythagoras yesterday');
expect('chat saved', (savedChat(pStreak) || []).some(m => /pythagoras/.test(m.content)), '');
const longA = 'The marker wants working. '.repeat(40);
expect('speech long', speechScript(longA, 'Rudo').length > 700, String(speechScript(longA, 'Rudo').length));
expect('chunks more', chunkSpeech(longA + ' End.', 80).length >= 5, String(chunkSpeech(longA + ' End.', 80).length));

if (fail.length) {
  console.error('FAIL', fail.length);
  fail.forEach(f => console.error(' -', f));
  process.exit(1);
}
console.log('ALL PASS');
