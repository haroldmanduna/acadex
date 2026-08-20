/** ACADEX WhatsApp tutor — Maths 4004, Combined Science 5006, English 1122. */
import fs from 'fs';
import path from 'path';
import {
  solveMath, solveLinearEq, explainScience, helpEnglish,
  searchBank, formatHit, formatMath, closer, fallback,
} from './brain.js';
import { askTeacher } from './teacher.js';

const FREE_LIMIT = 10000;
const sessions = new Map();
const users = new Map();

export function loadBank(workspaceRoot) {
  const p = path.join(workspaceRoot, 'data', 'acadex-maths.json');
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return { papers: [], featured: [], predictor: [], sciencePredictor: [], englishPredictor: [], counts: {} };
  }
}

export function getUser(phone) {
  if (!users.has(phone)) users.set(phone, { free_used: 0, expiry_date: null });
  return users.get(phone);
}
export function isPaid(phone) {
  const u = getUser(phone);
  return u.expiry_date && new Date(u.expiry_date) > new Date();
}
export function canUse(phone) {
  const u = getUser(phone);
  if (isPaid(phone)) return { allowed: true, reason: 'PAID' };
  if ((u.free_used || 0) < FREE_LIMIT) return { allowed: true, reason: 'FREE', left: FREE_LIMIT - (u.free_used || 0) };
  return { allowed: false, reason: 'EXPIRED' };
}
export function incrementUse(phone) {
  const u = getUser(phone);
  if (isPaid(phone)) return;
  u.free_used = (u.free_used || 0) + 1;
  users.set(phone, u);
}
export function activateUser(phone, days) {
  const exp = new Date();
  exp.setDate(exp.getDate() + days);
  const u = getUser(phone);
  u.expiry_date = exp.toISOString();
  users.set(phone, u);
  return exp;
}
export function resetFree(phone) {
  const u = getUser(phone);
  u.free_used = 0;
  users.set(phone, u);
}
export function listUsers() {
  return Array.from(users.entries()).map(([phone, v]) => ({ phone, ...v }));
}
export function sessionPhones() {
  return Array.from(sessions.keys());
}

export function isBotMode(phone, minutes) {
  const s = sessions.get(phone);
  if (!s) return false;
  if (Date.now() > s.botModeUntil) { sessions.delete(phone); return false; }
  s.botModeUntil = Date.now() + minutes * 60 * 1000;
  return true;
}
export function enterBotMode(phone, minutes) {
  const prev = sessions.get(phone) || {};
  sessions.set(phone, {
    ...prev,
    botModeUntil: Date.now() + minutes * 60 * 1000,
    at: new Date().toISOString(),
    lang: prev.lang || 'sn',
    chat: prev.chat || [],
  });
}
export function exitBotMode(phone) {
  sessions.delete(phone);
}
export function setLang(phone, lang) {
  const s = sessions.get(phone) || {};
  s.lang = lang;
  sessions.set(phone, s);
}
export function getLang(phone) {
  return (sessions.get(phone) || {}).lang || 'sn';
}

function pushChat(phone, role, content) {
  const s = sessions.get(phone) || {};
  s.chat = (s.chat || []).concat({ role, content: String(content || '').slice(0, 1800) }).slice(-12);
  sessions.set(phone, s);
}

function buildContext(text, bank) {
  const bits = [];
  const math = solveMath(text);
  if (math) bits.push('MATH ENGINE (correct numbers):\n' + formatMath(math, 'en'));
  const sci = explainScience(text);
  if (sci) bits.push('SCIENCE NOTES:\n' + sci.title + '\n' + sci.answer);
  const eng = helpEnglish(text);
  if (eng) bits.push('ENGLISH 1122 NOTES:\n' + eng.title + '\n' + eng.answer);
  const hit = searchBank(bank, text);
  if (hit) bits.push('SIMILAR ACADEX PAPER ITEM (practice, not a leaked ZIMSEC script):\n' + formatHit(hit).slice(0, 1100));
  return bits.join('\n\n');
}

async function teach(digits, text, bank, say) {
  const s = sessions.get(digits) || {};
  const taught = await askTeacher({
    history: s.chat || [],
    user: text,
    context: buildContext(text, bank),
  });
  if (!taught) return false;
  say(taught);
  pushChat(digits, 'user', text);
  pushChat(digits, 'assistant', taught);
  incrementUse(digits);
  return true;
}

export function checkTrigger(text, phrase) {
  const t = (text || '').toLowerCase().trim();
  const p = (phrase || 'mhoro acadex').toLowerCase();
  if (t === p || t.startsWith(p) || t.includes(p)) return true;
  if (t === 'acadex' || t === 'mhoro' || t === 'hi acadex' || t === 'hello acadex') return true;
  return false;
}

export function solveLinear(input) {
  const r = solveLinearEq(input);
  return r ? { answer: r.answer, steps: r.steps } : null;
}

function pickSyllabus(tl) {
  if (/\b(english|1122|essay|composition|summary|register|comprehension)\b/.test(tl)) return '1122';
  if (/\b(science|5006|combined|bio|chem|phys|photosynth|acid|cell)\b/.test(tl)) return '5006';
  if (/\b(grade\s*7|702)\b/.test(tl)) return '702';
  if (/\b(further|9187)\b/.test(tl)) return '9187';
  if (/\b(pure|6042)\b/.test(tl)) return '6042';
  if (/\b(9164)\b/.test(tl)) return '9164';
  if (/\b(math|4004|algebra|trig)\b/.test(tl)) return '4004';
  return null;
}

export function parsePaperRequest(text) {
  const tl = text.toLowerCase();
  const year = (tl.match(/20\d{2}/) || ['2024'])[0];
  const paperNo = (tl.includes('paper 2') || /\bp2\b/.test(tl)) ? 2 : 1;
  let code = pickSyllabus(tl) || '4004';
  const session = tl.includes('june') ? 'June' : 'November';
  const fname = `${year}_${session}_${code}_Paper${paperNo}.pdf`;
  const names = { '4004': 'Maths', '5006': 'Combined Science', '1122': 'English Language', '702': 'Grade 7 Maths', '6042': 'Pure Maths', '9164': 'Mathematics', '9187': 'Further Maths' };
  return { year, session, code, paperNo, fname, title: `${year} ${session} ${names[code] || code} ${code} Paper ${paperNo}` };
}

export function findPaper(bank, year, session, code, paperNo) {
  return (bank.papers || []).find(p =>
    String(p.year) === String(year) && p.session === session &&
    String(p.syllabus) === String(code) && Number(p.paperNo) === Number(paperNo)
  );
}

export function findQuestion(bank, text) {
  return searchBank(bank, text);
}

function personality(text) {
  const t = String(text || '').toLowerCase();
  if (/your name|who are you|who r u|who is this|zita rako|unonzi ani|comment tu t.?appelles|como te llamas|what.?s your name|whats your name|ninani|ngubani/.test(t)) {
    return "I'm ACADEX — your ZIMSEC tutor on WhatsApp. Maths 4004, Combined Science 5006 and English 1122. Talk to me in any language. Send the question.";
  }
  if (/^(hi|hello|hey|hie|yo|mhoro|salut|bonjour|sawubona|hola|sup|morning|evening|good morning|good evening)\b/.test(t) && t.split(/\s+/).length <= 6) {
    return "Hey — ACADEX here. What are we working on today? Maths, Science or English, any language.";
  }
  return null;
}

function helpText() {
  return `I'm ACADEX — send the question and I'll work it with you like class.

Maths, Combined Science 5006, English 1122. Any language.
Papers: Download 2024 Maths Paper 1`;
}

function predictorText(bank) {
  const blocks = [
    ['4004 Maths', bank.predictor],
    ['5006 Combined Science', bank.sciencePredictor],
    ['1122 English', bank.englishPredictor],
  ];
  return blocks.map(([title, list]) => {
    const lines = (list || []).slice(0, 5).map(t => `• ${t.topic} (${t.pct}%)`).join('\n');
    return `🔮 ${title}\n${lines}`;
  }).join('\n\n');
}

/**
 * Pure tutor turn. Returns { replies, enter, exit, increment }
 */
export async function handleTurn({ from, text, bank, publicUrl, adminPhone, trigger, sessionMinutes }) {
  const replies = [];
  const say = (t) => replies.push({ type: 'text', text: t });
  const tl = (text || '').toLowerCase().trim();
  const digits = String(from || '').replace(/\D/g, '');

  const triggered = checkTrigger(text, trigger);
  const inMode = isBotMode(digits, sessionMinutes);

  if (!triggered && !inMode) {
    return { replies: [], ignored: true };
  }
  if (triggered && !inMode) {
    enterBotMode(digits, sessionMinutes);
    const taught = await askTeacher({
      history: [],
      user: text,
      context: 'The student just opened ACADEX on WhatsApp. Greet them as ACADEX the ZIMSEC tutor. Invite any question in their language. Do not dump a menu.',
    });
    say(taught || 'Mhoro — I\'m ACADEX, your ZIMSEC tutor. Send me the question in any language. Maths, Science or English.');
    if (taught) {
      pushChat(digits, 'user', text);
      pushChat(digits, 'assistant', taught);
    }
    return { replies, enter: true };
  }
  enterBotMode(digits, sessionMinutes);

  if (tl.startsWith('admin') && adminPhone && digits === adminPhone) {
    const parts = text.trim().split(/\s+/);
    if (parts[1] === 'activate' && parts[2]) {
      const target = parts[2].replace(/\D/g, '');
      const days = parseInt(parts[3] || '7', 10);
      const exp = activateUser(target, days);
      say(`✅ Activated ${target} for ${days} days until ${exp.toDateString()}`);
      replies.push({ type: 'text', text: `✅ Acadex yatambirwa! Wava ne ${days} mazuva unlimited. Tumira mubvunzo.`, to: target });
    } else if (parts[1] === 'status') {
      const target = (parts[2] || digits).replace(/\D/g, '');
      const u = getUser(target);
      say(`Status ${target}: free_used=${u.free_used || 0}/${FREE_LIMIT}, expiry=${u.expiry_date || 'none'}, paid=${isPaid(target)}`);
    } else {
      say('Admin: admin activate <phone> <days>\nadmin status <phone>');
    }
    return { replies };
  }

  if (tl === 'acadex exit') {
    say('I’m still here whenever you send a message. What should we do next?');
    return { replies };
  }

  const sub = canUse(digits);
  if (!sub.allowed) {
    say('Wapfuura 10 FREE. Bhadhara $0.75/vhiki or $3/mwedzi. Admin activates after EcoCash.');
    return { replies };
  }

  if (/^(predictor|forecast|predict)$/i.test(tl) || /\bpredictor\b/.test(tl)) {
    say(predictorText(bank));
    incrementUse(digits);
    return { replies, increment: true };
  }

  const wantsPaper = /download|pdf|past paper/.test(tl) || /\bpaper\s*[12]\b/.test(tl);
  if (wantsPaper) {
    const req = parsePaperRequest(text);
    const base = publicUrl || 'https://acadex-r6z0.onrender.com';
    const url = `${base}/pdfs/${req.fname}`;
    const exists = findPaper(bank, req.year, req.session, req.code, req.paperNo);
    if (!exists) {
      say(`No ACADEX paper for ${req.title}. Try: Download 2024 Maths Paper 1`);
      return { replies };
    }
    replies.push({ type: 'document', url, filename: req.fname, caption: `${req.title} (original ACADEX, not a leaked ZIMSEC script)` });
    incrementUse(digits);
    return { replies, increment: true };
  }

  if (tl === '[photo]' || tl.startsWith('[image]')) {
    say('I cannot read handwriting yet — type the question and I will work it with you.');
    return { replies };
  }

  if (await teach(digits, text, bank, say)) {
    return { replies, increment: true };
  }

  const person = personality(text);
  if (person) {
    say(person);
    pushChat(digits, 'user', text);
    pushChat(digits, 'assistant', person);
    return { replies };
  }

  // Offline fallback if the teacher network is down
  const lang = getLang(digits);
  const solved = solveMath(text);
  if (solved) {
    say(formatMath(solved, lang));
    incrementUse(digits);
    say(closer(digits));
    return { replies, increment: true };
  }
  const sci = explainScience(text);
  if (sci) {
    say(`${sci.title}\n\n${sci.answer}`);
    incrementUse(digits);
    return { replies, increment: true };
  }
  const eng = helpEnglish(text);
  if (eng) {
    say(`${eng.title}\n\n${eng.answer}`);
    incrementUse(digits);
    return { replies, increment: true };
  }
  const hit = searchBank(bank, text);
  if (hit) {
    say(formatHit(hit));
    incrementUse(digits);
    return { replies, increment: true };
  }
  if (/^(help|menu|\?)$/i.test(tl)) {
    say(helpText());
    return { replies };
  }
  say(fallback(text));
  return { replies };
}

export { FREE_LIMIT, users, sessions };
