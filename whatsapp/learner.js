/** Persistent learner file — personal connection, not a blank chat every time. */
import fs from 'fs';
import path from 'path';

let filePath = '';
const cache = new Map();

export function initLearners(workspaceRoot) {
  filePath = path.join(workspaceRoot, 'data', 'learners.json');
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    for (const [k, v] of Object.entries(raw || {})) cache.set(k, v);
  } catch { /* first run */ }
}

function save() {
  if (!filePath) return;
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const obj = Object.fromEntries(cache.entries());
    fs.writeFileSync(filePath, JSON.stringify(obj, null, 0));
  } catch (e) {
    console.warn('learner save', e.message);
  }
}

export function blankLearner(phone) {
  return {
    phone,
    name: '',
    lang: 'en',
    grade: '',
    age: '',
    school: '',
    subjects: [],
    parent: '',
    weak: [],
    strong: [],
    lastTopic: '',
    lastMock: null,
    mocks: [],
    asked: 0,
    namedAt: null,
    streak: 0,
    bestStreak: 0,
    lastDay: '',
    chat: [],
    lastReply: '',
    lastSpeak: '',
    updated: new Date().toISOString(),
  };
}

export function getLearner(phone) {
  const p = String(phone || '').replace(/\D/g, '');
  if (!cache.has(p)) cache.set(p, blankLearner(p));
  const u = cache.get(p);
  if (!u.lang) u.lang = 'en';
  if (!u.chat) u.chat = [];
  if (u.streak == null) u.streak = 0;
  return u;
}

export function harareDay(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Harare',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function bumpStreak(phone) {
  const u = getLearner(phone);
  const today = harareDay();
  if (u.lastDay === today) return u;
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yest = harareDay(y);
  const next = u.lastDay === yest ? (u.streak || 0) + 1 : 1;
  return touchLearner(phone, {
    streak: next,
    bestStreak: Math.max(u.bestStreak || 0, next),
    lastDay: today,
  });
}

export function appendChat(phone, role, content) {
  const u = getLearner(phone);
  const chat = (u.chat || []).concat({
    role,
    content: String(content || '').slice(0, 1600),
    at: new Date().toISOString(),
  }).slice(-30);
  return touchLearner(phone, { chat });
}

export function savedChat(phone) {
  return getLearner(phone).chat || [];
}

export function touchLearner(phone, patch) {
  const u = getLearner(phone);
  Object.assign(u, patch, { updated: new Date().toISOString() });
  cache.set(u.phone, u);
  save();
  return u;
}

export function rememberTopic(phone, topic, ok) {
  const u = getLearner(phone);
  if (!topic) return u;
  u.lastTopic = String(topic).slice(0, 80);
  const t = u.lastTopic;
  if (ok === false) {
    u.weak = [t, ...(u.weak || []).filter(x => x !== t)].slice(0, 8);
    u.strong = (u.strong || []).filter(x => x !== t);
  } else if (ok === true) {
    u.strong = [t, ...(u.strong || []).filter(x => x !== t)].slice(0, 8);
  }
  return touchLearner(phone, { lastTopic: u.lastTopic, weak: u.weak, strong: u.strong });
}

export function extractProfile(text) {
  const t = String(text || '').trim();
  const out = {};
  const name = t.match(/(?:ndinonzi|zita rangu(?: ndi)?|ngingu|ngingu|i(?:'?m| am)|my name is|ndini)\s+([A-Za-zÀ-ÿ]{2,20})/i)
    || t.match(/^([A-Z][a-z]{2,20})$/);
  if (name) out.name = name[1].replace(/[^A-Za-zÀ-ÿ]/g, '');
  const g = t.match(/\b(?:form|giredhi|grade)\s*([1-7])\b/i);
  if (g) out.grade = /grade/i.test(t) && g[1] === '7' ? 'Grade 7' : `Form ${g[1]}`;
  if (/\bo-?level\b/i.test(t)) out.grade = 'Form 4 (O-Level)';
  if (/\ba-?level\b/i.test(t)) out.grade = 'A-Level';
  const age = t.match(/\b(?:i(?:'?m| am)|ndine|ndiri)\s*(\d{1,2})\b/i) || t.match(/\b(\d{1,2})\s*(?:years? old|yrs?|makore)\b/i);
  if (age && +age[1] >= 8 && +age[1] <= 25) out.age = String(+age[1]);
  const sch = t.match(/\b(?:school|chikoro)\s*(?:is|:)?\s*([A-Za-z][A-Za-z0-9 .'-]{2,40})/i);
  if (sch) out.school = sch[1].trim();
  const parent = t.match(/parent(?:\s*(?:is|number|:))?\s*(\+?263\d{9}|\d{9,12})/i);
  if (parent) out.parent = parent[1].replace(/\D/g, '');
  return out;
}

export function card(phone) {
  const u = getLearner(phone);
  const bits = [];
  if (u.name) bits.push(`Name: ${u.name}`);
  if (u.age) bits.push(`Age: ${u.age}`);
  if (u.grade) bits.push(`Grade: ${u.grade}`);
  if (u.school) bits.push(`School: ${u.school}`);
  if (u.lang) bits.push(`Language: ${u.lang}`);
  if (u.lastTopic) bits.push(`Last topic: ${u.lastTopic}`);
  if (u.weak?.length) bits.push(`Weak: ${u.weak.slice(0, 4).join(', ')}`);
  if (u.strong?.length) bits.push(`Strong: ${u.strong.slice(0, 3).join(', ')}`);
  if (u.lastMock) bits.push(`Last mock: ${u.lastMock.score}/${u.lastMock.total} (${u.lastMock.subject})`);
  bits.push(`Questions this term: ${u.asked || 0}`);
  return bits.join('\n');
}

export function nextNeed(phone) {
  const u = getLearner(phone);
  if (!u.name) return 'What should I call you?';
  if (!u.grade) return 'Which form or grade are you in?';
  if (!u.age) return 'How old are you?';
  if (!u.school) return 'Which school?';
  return null;
}

export function parentReport(phone) {
  const u = getLearner(phone);
  const who = u.name || ('+' + u.phone);
  const weak = (u.weak || []).slice(0, 3).join(', ') || 'none logged yet';
  const mock = u.lastMock
    ? `Last mock: ${u.lastMock.score}/${u.lastMock.total} on ${u.lastMock.subject}.`
    : 'No timed mock yet this week.';
  return `ACADEX parent note for ${who}

${mock}
Work done: ${u.asked || 0} questions.
Still shaky: ${weak}.
Last topic: ${u.lastTopic || '—'}.

This is practice (original ACADEX papers), not a leaked ZIMSEC script.
Next: one short drill every day on the weak topic.`;
}

export function allLearners() {
  return Array.from(cache.values());
}
