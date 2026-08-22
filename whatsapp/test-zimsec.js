import { commandWord, PAPER_RULES, OLEVEL_GRADES, zimsecExplain, looksLikeExam, examLock } from './zimsec.js';
import { SYSTEM } from './teacher.js';
import { loadBank, handleTurn } from './tutor.js';
import { touchLearner } from './learner.js';
import path from 'path';
import { fileURLToPath } from 'url';

process.env.DISABLE_LLM = '1';
process.env.DISABLE_VOICE = '1';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const bank = loadBank(root);
const fail = [];
function expect(name, cond, detail) {
  if (!cond) fail.push(name + (detail ? ' :: ' + String(detail).slice(0, 200) : ''));
  else console.log('OK', name);
}

expect('letters A-U', OLEVEL_GRADES.join(',') === 'A,B,C,D,E,U', OLEVEL_GRADES.join(','));
expect('rules grades', /A, B, C, D, E, U/.test(PAPER_RULES) && /No Distinction/.test(PAPER_RULES) && /No A\*/.test(PAPER_RULES), '');
expect('rules no fake percent', !/80%|75% = A|A is 80/.test(PAPER_RULES), '');
expect('4004 p1', /4004\/1/.test(PAPER_RULES) && /NO CALCULATOR/i.test(PAPER_RULES) && /100 marks/.test(PAPER_RULES) && /2 h 30/.test(PAPER_RULES), '');
expect('4004 p2', /4004\/2/.test(PAPER_RULES) && /calculator allowed/i.test(PAPER_RULES) && /52/.test(PAPER_RULES) && /4 from 7/.test(PAPER_RULES), '');
expect('5006', /5006\/1/.test(PAPER_RULES) && /40 MCQ/.test(PAPER_RULES) && /5006\/2/.test(PAPER_RULES) && /80 marks/.test(PAPER_RULES) && /ALL compulsory/.test(PAPER_RULES), '');
expect('1122', /1122\/1/.test(PAPER_RULES) && /350–450/.test(PAPER_RULES) && /1122\/2/.test(PAPER_RULES) && /register/.test(PAPER_RULES), '');
expect('sessions', /June/.test(PAPER_RULES) && /November/.test(PAPER_RULES), '');
expect('five C', /five subjects at C/i.test(PAPER_RULES) && /credit/i.test(PAPER_RULES), '');

expect('state short', /short|no because/i.test(commandWord('State the function of chlorophyll')), commandWord('State the function of chlorophyll'));
expect('explain because', /because/i.test(commandWord('Explain why destarching is done')), '');
expect('describe no why', /no “because”|in order/i.test(commandWord('Describe the path of water')), '');
expect('show that', /do not assume/i.test(commandWord('Show that (x+3)^2 = x^2+6x+9')), '');
expect('calculate no calc', /no calculator/i.test(commandWord('Calculate the value of 2x+3')), '');

expect('looks exam', looksLikeExam('Calculate the gradient of the line [3]') && looksLikeExam('State the test for oxygen') && !looksLikeExam('hi'), '');
expect('exam lock grades', /A, B, C, D, E, U/.test(examLock('State one test')) && /No Distinction/.test(examLock('State one test')), '');

const g = zimsecExplain('Are there distinctions in ZIMSEC?');
expect('no distinction answer', g && /no Distinction/i.test(g.answer) && /A, B, C, D, E, U/.test(g.answer) && !/A\*/.test(g.answer.replace(/no A\*/i, '')), JSON.stringify(g));
const m = zimsecExplain('How is 4004 Paper 1 set? How long? Calculator?');
expect('4004 explain', m && /no calculator/i.test(m.answer) && /100/.test(m.answer) && /2 hours 30/i.test(m.answer), JSON.stringify(m));
const s = zimsecExplain('What is Combined Science 5006 paper 2?');
expect('5006 explain', s && /80/.test(s.answer) && /compulsory/i.test(s.answer) && /40/.test(zimsecExplain('What is Combined Science 5006 paper 1?')?.answer || ''), '');
const e = zimsecExplain('How is English 1122 paper 1 structured?');
expect('1122 explain', e && /350–450/.test(e.answer) && /guided/i.test(e.answer), JSON.stringify(e));
expect('not hijack maths', !zimsecExplain('Calculate 2x+3=11') && !zimsecExplain('explain photosynthesis'), '');

expect('system no distinction target', /A, B, C, D, E, U/.test(SYSTEM) && /Never say Distinction/.test(SYSTEM) && /not rude/i.test(SYSTEM), SYSTEM.slice(0, 220));
expect('system papers', /4004\/1/.test(SYSTEM) && /5006\/2/.test(SYSTEM) && /1122\/1/.test(SYSTEM) && /June and November/.test(SYSTEM), '');

async function ask(from, text) {
  const r = await handleTurn({ from, text, bank, publicUrl: '', adminPhone: '263716987183', trigger: 'x', sessionMinutes: 30 });
  return (r.replies || []).filter(x => x.type === 'text').map(x => x.text).join('\n');
}

const t1 = await ask('263771009901', 'Are there distinctions in ZIMSEC?');
expect('live no distinction', /A, B, C, D, E, U/.test(t1) && /no Distinction/i.test(t1) && !/A \/ Distinction/.test(t1), t1.slice(0, 200));
const t2 = await ask('263771009902', 'How is Maths 4004 Paper 1 set?');
expect('live 4004', /no calculator/i.test(t2) && /100/.test(t2), t2.slice(0, 200));
const prizePhone = '263771009925';
touchLearner(prizePhone, { heardPrizes: false, name: '', lastTopic: '', lastDay: '', streak: 0 });
const t3 = await ask(prizePhone, 'hi');
expect('live first prizes', /How prizes work/i.test(t3) && /Merit stars/i.test(t3) && /PRIZES/i.test(t3) && /Grade A/i.test(t3) && /hello|here|talk/i.test(t3), t3.slice(0, 280));
expect('live not rude', !/not a pass|lonely number|do not relax|not a toy|a pass is not enough/i.test(t3), t3.slice(0, 160));
const t4 = await ask(prizePhone, 'hi');
expect('second hi no prize dump', !/How prizes work/i.test(t4) && /here|talk|week|question|start/i.test(t4), t4.slice(0, 160));

if (fail.length) {
  console.error('ZIMSEC FAIL', fail.length);
  fail.forEach(f => console.error(' -', f));
  process.exit(1);
}
console.log('ZIMSEC ALL PASS');
