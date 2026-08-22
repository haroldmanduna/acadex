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
    stars: 0,
    housePoints: 0,
    rank: 'new',
    badges: [],
    prizes: [],
    lastPrize: '',
    justEarned: '',
    prizeDay: '',
    lastMistake: '',
    challengeReady: false,
    updated: new Date().toISOString(),
  };
}

/** School-style ranks. Stars are ticks in the book — not coins. */
export const RANKS = [
  { min: 0, id: 'new', title: 'New book' },
  { min: 6, id: 'monitor', title: 'Monitor' },
  { min: 15, id: 'prefect', title: 'Prefect' },
  { min: 30, id: 'head', title: 'Head Prefect' },
  { min: 55, id: 'acandidate', title: 'A-candidate' },
  { min: 90, id: 'distinction', title: 'Distinction' },
];

export function rankOf(u) {
  const stars = Number(u?.stars) || 0;
  let r = RANKS[0];
  for (const row of RANKS) if (stars >= row.min) r = row;
  return r;
}

export function nextRank(u) {
  const stars = Number(u?.stars) || 0;
  return RANKS.find(row => row.min > stars) || null;
}

export function getLearner(phone) {
  const p = String(phone || '').replace(/\D/g, '');
  if (!cache.has(p)) cache.set(p, blankLearner(p));
  const u = cache.get(p);
  if (!u.lang) u.lang = 'en';
  if (!u.chat) u.chat = [];
  if (u.streak == null) u.streak = 0;
  if (u.stars == null) u.stars = 0;
  if (u.housePoints == null) u.housePoints = 0;
  if (!Array.isArray(u.badges)) u.badges = [];
  if (!Array.isArray(u.prizes)) u.prizes = [];
  if (!u.rank) u.rank = rankOf(u).id;
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
    u.lastMistake = t;
  } else if (ok === true) {
    u.strong = [t, ...(u.strong || []).filter(x => x !== t)].slice(0, 8);
  }
  return touchLearner(phone, { lastTopic: u.lastTopic, weak: u.weak, strong: u.strong, lastMistake: u.lastMistake || '' });
}

export function awardMerit(phone, { stars = 0, house = 0, badge = '', reason = '', announce = 'auto' } = {}) {
  const u = getLearner(phone);
  const prevRank = rankOf(u);
  const nextStars = Math.max(0, (u.stars || 0) + (Number(stars) || 0));
  const nextHouse = Math.max(0, (u.housePoints || 0) + (Number(house) || 0));
  const badges = [...(u.badges || [])];
  const badgesAdded = [];
  if (badge && !badges.includes(badge)) {
    badges.push(String(badge).slice(0, 40));
    badgesAdded.push(String(badge).slice(0, 40));
  }
  const newRank = rankOf({ stars: nextStars });
  const rankUp = newRank.min > prevRank.min;
  const today = harareDay();
  const firstToday = u.prizeDay !== today && (Number(stars) || 0) > 0;
  const milestone = (Number(stars) || 0) > 0 && nextStars > 0 && nextStars % 5 === 0;
  const should = announce === true
    || rankUp
    || badgesAdded.length > 0
    || (announce !== false && (firstToday || milestone));
  const who = u.name || '';
  const starWord = nextStars === 1 ? 'star' : 'stars';
  let line = '';
  if (rankUp) {
    line = `${who ? who + '. ' : ''}You are ${newRank.title} now. Small prize for work that would take marks. Distinction is still the target. Type PRIZES.`;
  } else if (badgesAdded.length) {
    line = `${who ? who + '. ' : ''}Badge: ${badgesAdded[0]}. ${nextStars} ${starWord}. I still mark as the paper marks.`;
  } else if (should && (Number(stars) || 0) > 0) {
    line = `Merit star. ${nextStars} ${starWord}. Rank: ${newRank.title}. A is the target, not a pass.`;
  }
  const just = [u.justEarned, line || reason].filter(Boolean).join(' ').slice(0, 200);
  touchLearner(phone, {
    stars: nextStars,
    housePoints: nextHouse,
    rank: newRank.id,
    badges: badges.slice(-12),
    lastPrize: (line || reason || u.lastPrize || '').slice(0, 160),
    justEarned: should ? just : (u.justEarned || ''),
    prizeDay: (Number(stars) || 0) > 0 ? today : u.prizeDay,
    challengeReady: u.challengeReady || rankUp || nextStars >= 6,
    prizes: [...(u.prizes || []), (should && line) ? { at: new Date().toISOString(), line, stars: nextStars } : null]
      .filter(Boolean)
      .slice(-20),
  });
  return {
    stars: nextStars,
    housePoints: nextHouse,
    rank: newRank,
    prevRank,
    rankUp,
    badgesAdded,
    announce: should,
    line: should ? line : '',
  };
}

export function maybeStreakPrize(phone) {
  const u = getLearner(phone);
  const s = u.streak || 0;
  const have = u.badges || [];
  if (s >= 30 && !have.includes('Month at the desk')) {
    return awardMerit(phone, { stars: 5, house: 1, badge: 'Month at the desk', announce: true });
  }
  if (s >= 14 && !have.includes('14-day desk')) {
    return awardMerit(phone, { stars: 3, badge: '14-day desk', announce: true });
  }
  if (s >= 7 && !have.includes('7-day desk')) {
    return awardMerit(phone, { stars: 2, badge: '7-day desk', announce: true });
  }
  return null;
}

export function prizeBook(phone) {
  const u = getLearner(phone);
  const r = rankOf(u);
  const nxt = nextRank(u);
  const who = u.name || 'Student';
  const badges = (u.badges || []).length ? u.badges.join(', ') : 'none yet';
  const need = nxt
    ? `${nxt.min - (u.stars || 0)} more stars to ${nxt.title}`
    : 'Distinction held. Do not drop the standard.';
  return `${who} — merit book
Rank: ${r.title}
Stars: ${u.stars || 0}
House points: ${u.housePoints || 0}
Streak: Day ${u.streak || 0} (best ${u.bestStreak || 0})
Badges: ${badges}
${need}

Prizes are earned: correct mock items, marked scripts, days at the desk, work that would take marks.
Not for saying hi. Not for guessing.
Type SLIP for a parent merit slip. Type CHALLENGE for the examiner question.
I want A / Distinction. A pass is not the finish.`;
}

export function meritSlip(phone) {
  const u = getLearner(phone);
  const r = rankOf(u);
  return `ACADEX merit slip
${u.name || 'Student'}${u.grade ? ' · ' + u.grade : ''}${u.school ? ' · ' + u.school : ''}
Rank: ${r.title}
Stars: ${u.stars || 0} · House points: ${u.housePoints || 0}
Streak: Day ${u.streak || 0}
Last topic: ${u.lastTopic || '—'}
Weak: ${(u.weak || []).slice(0, 2).join(', ') || 'none logged'}

This is earned work, not a sticker for turning up.
Screenshot for your parent if you want. Next lesson: drill the weak topic.`;
}

export function examinerChallenge(phone) {
  const u = getLearner(phone);
  const who = u.name ? u.name + '. ' : '';
  const weak = (u.weak && u.weak[0]) || '';
  const last = (u.lastTopic || '').toLowerCase();
  let q;
  if (/photo|chloro|destarch|bio|cell|5006|science/.test(weak + ' ' + last)) {
    q = 'STATE the word equation for photosynthesis. Then EXPLAIN why a destarched leaf is used before a starch test. [2 + 2]';
  } else if (/1122|compos|summar|register|english/.test(weak + ' ' + last)) {
    q = 'EXPLAIN, in two sentences, the difference between describe and explain. Then write the opening 40 words of a composition set at a kombi rank.';
  } else if (/bearing/.test(weak + ' ' + last)) {
    q = 'Point B is on a bearing of 060° from A. What is the bearing of A from B? Show the North lines. No calculator.';
  } else {
    q = 'Show that (x + 4)^2 = x^2 + 8x + 16. Then, without a calculator, find the value when x = 3. Working on the page.';
  }
  return `${who}Examiner question. This is the prize — harder work, not a toy.

${q}

Send your working. I mark as ZIMSEC marks: command word, method, units. A is the target.`;
}

export function extractProfile(text) {
  const t = String(text || '').trim();
  const out = {};
  const name = t.match(/(?:ndinonzi|zita rangu(?: ndi)?|ngingu|ngingu|i(?:'?m| am)|my name is|ndini)\s+([A-Za-zÀ-ÿ]{2,20})/i)
    || t.match(/^([A-Z][a-z]{2,20})$/);
  const blocked = /^(shona|chishona|ndebele|isindebele|english|chirungu|french|portuguese|sotho|tswana|venda|xhosa|chewa|nyanja|voice|acadex|hello|hi|form)$/i;
  if (name && !blocked.test(name[1])) out.name = name[1].replace(/[^A-Za-zÀ-ÿ]/g, '');
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
  if (u.lastMistake) bits.push(`Last leak: ${u.lastMistake}`);
  if (u.lastMock) bits.push(`Last mock: ${u.lastMock.score}/${u.lastMock.total} (${u.lastMock.subject})`);
  const rk = rankOf(u);
  bits.push(`Rank: ${rk.title}`);
  bits.push(`Stars: ${u.stars || 0}`);
  if (u.housePoints) bits.push(`House points: ${u.housePoints}`);
  if (u.streak) bits.push(`Streak: Day ${u.streak} (best ${u.bestStreak || u.streak})`);
  if (u.badges?.length) bits.push(`Badges: ${u.badges.slice(0, 6).join(', ')}`);
  if (u.lastPrize) bits.push(`Last prize: ${u.lastPrize}`);
  bits.push(`Questions this term: ${u.asked || 0}`);
  bits.push('Target: A / Distinction. A pass is not the finish.');
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
  const r = rankOf(u);
  return `ACADEX parent note for ${who}

${mock}
Work done: ${u.asked || 0} questions.
Rank: ${r.title} · Stars: ${u.stars || 0} · Streak: Day ${u.streak || 0}
Still shaky: ${weak}.
Last topic: ${u.lastTopic || '—'}.

This is practice (original ACADEX papers), not a leaked ZIMSEC script.
Target is A / Distinction, not a pass. Next: one short drill every day on the weak topic.`;
}

export function allLearners() {
  return Array.from(cache.values());
}
