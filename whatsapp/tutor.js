/** ACADEX WhatsApp tutor — Maths 4004, Combined Science 5006, English 1122. */
import fs from 'fs';
import path from 'path';

const FREE_LIMIT = 10;
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

export function checkTrigger(text, phrase) {
  const t = (text || '').toLowerCase().trim();
  const p = (phrase || 'mhoro acadex').toLowerCase();
  if (t === p || t.startsWith(p) || t.includes(p)) return true;
  if (t === 'acadex' || t === 'mhoro' || t === 'hi acadex' || t === 'hello acadex') return true;
  return false;
}

export function solveLinear(input) {
  let t = String(input || '').toLowerCase().replace(/×/g, '*').replace(/−/g, '-');
  t = t.replace(/x\s+(\d+)\s*=/g, 'x+$1=');
  t = t.replace(/\s+/g, '');
  let m = t.match(/^(-?\d+)\(x([+-]\d+)\)=(-?\d+)$/);
  if (m) {
    const a = +m[1], b = +m[2], c = +m[3];
    const ax = c - a * b;
    if (!a) return null;
    const x = ax / a;
    return { answer: String(x), steps: [
      { t: 'Expand', d: `${a}x + ${a * b} = ${c}` },
      { t: 'Isolate', d: `${a}x = ${ax}` },
      { t: 'Divide', d: `x = ${x}` },
    ] };
  }
  m = t.match(/^(-?\d*)x([+-]\d+)=(-?\d+)$/);
  if (m) {
    const a = (m[1] === '' || m[1] === '-') ? Number(m[1] + '1') : +m[1];
    const b = +m[2], c = +m[3];
    const x = (c - b) / a;
    return { answer: String(x), steps: [
      { t: `Subtract ${b}`, d: `${a}x = ${c - b}` },
      { t: `Divide by ${a}`, d: `x = ${x}` },
    ] };
  }
  m = t.match(/^(-?\d*)x=(-?\d+)$/);
  if (m) {
    const a = (m[1] === '' || m[1] === '-') ? Number(m[1] + '1') : +m[1];
    const x = (+m[2]) / a;
    return { answer: String(x), steps: [{ t: 'Divide', d: `x = ${x}` }] };
  }
  return null;
}

function strip(html) {
  return String(html || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
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
  const needle = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = needle.split(/\s+/).filter(w => w.length > 3);
  const syll = pickSyllabus(needle);
  const papers = bank.papers || [];
  const scored = [];
  for (const p of papers) {
    if (syll && String(p.syllabus) !== syll) continue;
    for (const qu of p.questions || []) {
      if (qu.kind === 'passage') continue;
      const blob = `${qu.topic} ${qu.text} ${qu.answer}`.toLowerCase();
      let n = 0;
      for (const w of words) if (blob.includes(w)) n++;
      if (n) scored.push({ n, p, qu });
    }
  }
  scored.sort((a, b) => b.n - a.n);
  return scored[0] || null;
}

function formatQuestion(hit) {
  const q = hit.qu;
  const steps = (q.steps || []).map((s, i) => `${i + 1}. ${s.t}${s.d ? ': ' + s.d : ''}`).join('\n');
  const opts = (q.options || []).join('\n');
  let body = `📌 ${hit.p.code} ${hit.p.session} ${hit.p.year} Q${q.n} · ${q.topic} [${q.marks}]\n\n${strip(q.text).slice(0, 900)}`;
  if (opts) body += `\n${opts}`;
  if (steps) body += `\n\n✅ Working:\n${steps}`;
  if (q.answer) body += `\n\n🎯 Answer: ${String(q.answer).slice(0, 500)}`;
  return body.slice(0, 3500);
}

function helpText() {
  return `🇿🇼 ACADEX Super Tutor — Maths · Science · English

Send:
📚 PAPERS
• Download 2024 Maths Paper 1
• Download 2024 Science Paper 2
• Download 2024 English Paper 1
• Download June 2024 English Paper 2

🧮 MATHS — 2x+3=11  or  algebra  vectors  trig
🔬 SCIENCE — photosynthesis  acids  F=ma  electricity
✍️ ENGLISH — composition  summary  register

⏱️ mock
🔮 predictor
🌐 shona / ndebele / english

Type HELP anytime. "acadex exit" to leave.`;
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
 * Pure tutor turn. Returns { replies: [{type, text, url, filename, caption}], enter, exit, increment }
 */
export function handleTurn({ from, text, bank, publicUrl, adminPhone, trigger, sessionMinutes }) {
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
    say(`✅ Acadex on! Mhoro 🙏\nNdiri mudzidzisi wako — Maths 4004, Combined Science 5006, English 1122.\n\n${helpText()}`);
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

  if (tl.includes('acadex exit') || tl === 'exit' || tl === 'stop') {
    exitBotMode(digits);
    say(`👋 Bye! Send "${trigger}" to start again.`);
    return { replies, exit: true };
  }

  if (/\b(shona|chiShona)\b/i.test(text)) { setLang(digits, 'sn'); say('Mutauro: Shona. Tumira mubvunzo.'); return { replies }; }
  if (/\bndebele\b/i.test(text)) { setLang(digits, 'nd'); say('Ulimi: isiNdebele. Thumela umbuzo.'); return { replies }; }
  if (/\benglish\b/i.test(text) && !/\b(1122|paper|download|composition)\b/.test(tl)) {
    setLang(digits, 'en'); say('Language: English. Send a question or HELP.'); return { replies };
  }

  if (tl === 'help' || tl === 'menu' || tl === '?' || tl.includes('help')) {
    say(helpText());
    return { replies };
  }

  const sub = canUse(digits);
  if (!sub.allowed) {
    say('😊 Wapfuura 10 FREE. Bhadhara kuti uenderere:\n💰 $0.75/vhiki kana $3/mwedzi\nEcoCash (set merchant in production).\nMushure mekubhadhara tumira *PAID*\n_Admin chete ndiye anokwanisa ku-activate._');
    return { replies };
  }

  if (tl.includes('predictor') || tl.includes('forecast') || tl === 'predict') {
    say(predictorText(bank));
    incrementUse(digits);
    return { replies, increment: true };
  }

  if (tl.includes('mock')) {
    say('⏱️ Mock exam is on the website (Mock tab).\nMaths 4004/1: 30 short, 2h30, no calculator.\nOr download a paper here and time yourself:\nDownload 2024 Maths Paper 1\nDownload 2024 Science Paper 1\nDownload 2024 English Paper 1');
    return { replies };
  }

  const wantsPaper = /download|pdf|past paper|\bpaper\s*[12]\b|\bp[12]\b/.test(tl);
  if (wantsPaper) {
    const req = parsePaperRequest(text);
    const base = publicUrl || 'https://acadex-r6z0.onrender.com';
    const url = `${base}/pdfs/${req.fname}`;
    const exists = findPaper(bank, req.year, req.session, req.code, req.paperNo);
    if (!exists) {
      say(`No ACADEX paper for ${req.title}. Try:\nDownload 2024 Maths Paper 1\nDownload 2024 Science Paper 2\nDownload 2024 English Paper 1`);
      return { replies };
    }
    replies.push({ type: 'document', url, filename: req.fname, caption: `${req.title} (original ACADEX, not a leaked ZIMSEC script)` });
    say(`Also on the site: Extract & Study for worked solutions.\nMaths 4004 · Science 5006 · English 1122`);
    incrementUse(digits);
    return { replies, increment: true };
  }

  const solved = solveLinear(text);
  if (solved) {
    const body = solved.steps.map((s, i) => `${i + 1}. ${s.t}: ${s.d}`).join('\n');
    const lang = getLang(digits);
    const head = lang === 'nd' ? 'Impendulo' : lang === 'en' ? 'Answer' : 'Mhinduro';
    say(`${head}: x = ${solved.answer}\n${body}`);
    if (publicUrl) {
      const voice = { sn: 'audio/shona-solve.mp3', nd: 'audio/ndebele-solve.mp3', en: 'audio/english-solve.mp3' };
      replies.push({ type: 'audio', url: `${publicUrl}/${voice[lang] || voice.sn}` });
    }
    incrementUse(digits);
    const left = sub.left ? ` (${sub.left - 1} FREE left)` : '';
    say(`Next? Tumira mumwe mubvunzo.${left}`);
    return { replies, increment: true };
  }

  if (tl === '[photo]' || tl.startsWith('[image]') || tl === '[photo]') {
    say('📸 Photo received. Type the equation (e.g. 2x+3=11) or a topic: algebra, photosynthesis, composition.\nFull handwriting OCR is not live yet.');
    return { replies };
  }

  const hit = findQuestion(bank, text);
  if (hit) {
    say(formatQuestion(hit));
    incrementUse(digits);
    const left = sub.left ? ` (${sub.left - 1} FREE left)` : '';
    say(`Next? Topic, equation, or Download 2024 Paper 1.${left}`);
    return { replies, increment: true };
  }

  say(`Ndinogona Maths, Combined Science, and English.\n\n${helpText()}`);
  return { replies };
}

export { FREE_LIMIT, users, sessions };
