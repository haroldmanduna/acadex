/** ACADEX WhatsApp tutor — personal marker + mocks + voice. */
import fs from 'fs';
import path from 'path';
import {
  solveMath, solveLinearEq, explainScience, helpEnglish,
  searchBank, formatHit, formatMath, closer, fallback,
  teachConcept, isConfused,
} from './brain.js';
import { askTeacher } from './teacher.js';
import {
  initLearners, getLearner, touchLearner, rememberTopic,
  extractProfile, card, parentReport, allLearners, nextNeed,
  bumpStreak, appendChat, savedChat,
} from './learner.js';
import { startMock, formatMockQ, scoreAnswer, finishMock } from './mock.js';
import { parseNumbered, markAgainstPaper, markComposition, looksLikeEssay } from './marker.js';
import { detectLang, askedLanguage, ttsFile, wantsVoice, stripVoiceAsk, speechScript } from './voice.js';
import { examLock, looksLikeExam } from './zimsec.js';
import { wantsDiagram, renderDiagram, figureKind } from './diagrams.js';
import { isBusy } from './inbox.js';

const FREE_LIMIT = 10000;
const sessions = new Map();
const users = new Map();
let workspaceRoot = '';

export function loadBank(root) {
  workspaceRoot = root;
  initLearners(root);
  const p = path.join(root, 'data', 'acadex-maths.json');
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
  const L = getLearner(phone);
  touchLearner(phone, { asked: (L.asked || 0) + 1 });
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
    lang: prev.lang || getLearner(phone).lang || 'en',
    chat: (prev.chat && prev.chat.length) ? prev.chat : (savedChat(phone) || []),
    lastReply: prev.lastReply || getLearner(phone).lastReply || '',
    lastSpeak: prev.lastSpeak || getLearner(phone).lastSpeak || '',
    mock: prev.mock || null,
  });
}
export function exitBotMode(phone) { sessions.delete(phone); }
export function setLang(phone, lang) {
  const s = sessions.get(phone) || {};
  s.lang = lang;
  sessions.set(phone, s);
  touchLearner(phone, { lang });
}
export function getLang(phone) {
  return (sessions.get(phone) || {}).lang || getLearner(phone).lang || 'en';
}

function pushChat(phone, role, content) {
  const s = sessions.get(phone) || {};
  s.chat = (s.chat || []).concat({ role, content: String(content || '').slice(0, 1800) }).slice(-30);
  sessions.set(phone, s);
  appendChat(phone, role, content);
}

function buildContext(text, bank, phone) {
  const bits = [];
  const lc = card(phone);
  if (lc) bits.push('LEARNER FILE:\n' + lc);
  const math = solveMath(text);
  if (math) bits.push('MATH ENGINE (correct numbers):\n' + formatMath(math, 'en'));
  const sci = explainScience(text);
  if (sci) bits.push('SCIENCE NOTES:\n' + sci.title + '\n' + sci.answer);
  const eng = helpEnglish(text);
  if (eng) bits.push('ENGLISH 1122 NOTES:\n' + eng.title + '\n' + eng.answer);
  const hit = searchBank(bank, text);
  if (hit) bits.push('SIMILAR ACADEX PAPER ITEM (practice, not a leaked official script):\n' + formatHit(hit).slice(0, 1100));
  if (looksLikeExam(text)) bits.push(examLock(text));
  return bits.join('\n\n');
}

function cleanWhatsApp(s) {
  return String(s || '')
    .replace(/\*\*/g, '')
    .replace(/__/g, '')
    .replace(/`/g, '')
    .replace(/(^|[^\w])\*([^*\n]{1,80})\*(?=[^\w]|$)/g, '$1$2')
    .replace(/^\s*\*\s/gm, '• ')
    .replace(/I cannot send image files[^.!?\n]*/gi, '')
    .replace(/I can'?t send (images?|pictures?|diagrams?|files?)[^.!?\n]*/gi, '')
    .replace(/I am (not |un)?able to send (images?|pictures?|diagrams?)[^.!?\n]*/gi, '')
    .replace(/but I can describe how to draw one[^.!?\n]*/gi, '')
    .replace(/I can describe how to draw[^.!?\n]*/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function storeLast(phone, text, speak) {
  const s = sessions.get(phone) || {};
  s.lastReply = String(text || '').slice(0, 2000);
  if (speak) s.lastSpeak = String(speak).slice(0, 1400);
  else s.lastSpeak = s.lastReply;
  sessions.set(phone, s);
  touchLearner(phone, { lastReply: s.lastReply, lastSpeak: s.lastSpeak });
}

async function attachVoice(replies, phone, spoken) {
  if (process.env.DISABLE_VOICE === '1') return false;
  const lang = getLang(phone);
  const name = getLearner(phone).name || '';
  const root = workspaceRoot || path.join(path.dirname(new URL(import.meta.url).pathname), '..');
  try {
    const fp = await ttsFile(root, spoken, lang, name);
    if (fp && fs.existsSync(fp) && fs.statSync(fp).size > 400 && !/solve\.mp3$/i.test(fp)) {
      replies.push({ type: 'audio', filePath: fp, url: fp, script: speechScript(spoken, name) });
      return true;
    }
  } catch (e) {
    console.warn('voice', e.message);
  }
  return false;
}

async function attachDiagram(replies, text) {
  if (!wantsDiagram(text)) return false;
  try {
    const fp = await renderDiagram(workspaceRoot, text);
    if (fp && fs.existsSync(fp)) {
      const k = figureKind(text);
      const cap = k === 'triangle'
        ? 'Right-angled triangle. Right angle at B (the little square). Hypotenuse is AC. Not to scale unless lengths are marked.'
        : k === 'pythagoras'
        ? 'Squares on the three sides. a² + b² = c². Not to scale unless lengths are marked.'
        : 'Diagram. Not to scale unless lengths are marked.';
      replies.push({ type: 'image', filePath: fp, caption: cap });
      return true;
    }
  } catch (e) {
    console.warn('diagram', e.message);
  }
  return false;
}

async function teach(digits, text, bank, say, replies) {
  const s = sessions.get(digits) || {};
  const taught = await askTeacher({
    history: s.chat || [],
    user: text,
    context: buildContext(text, bank, digits),
    learner: card(digits),
    need: nextNeed(digits),
    hurry: isBusy(),
  });
  if (!taught) return false;
  const math = solveMath(text);
  say(taught);
  if (math) storeLast(digits, taught, `x equals ${math.answer}. ${math.steps.map(s => s.t + ' ' + (s.d || '')).join('. ')}`);
  pushChat(digits, 'user', text);
  pushChat(digits, 'assistant', taught);
  incrementUse(digits);
  const topic = (explainScience(text) || helpEnglish(text) || {}).title || (solveMath(text) ? 'Algebra' : '');
  if (topic) rememberTopic(digits, topic, true);
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

function personality(text, phone) {
  const L = getLearner(phone);
  const t = String(text || '').toLowerCase();
  const streakBit = L.streak ? ` Day ${L.streak} streak.` : '';
  if (/your name|who are you|who r u|who is this|zita rako|unonzi ani|comment tu t.?appelles|whats your name|what.?s your name|ninani|ngubani/.test(t)) {
    return L.name
      ? `${L.name}, ACADEX. Last topic: ${L.lastTopic || 'none yet'}.${streakBit} Send the question.`
      : 'ACADEX. What should I call you? Then send the question.';
  }
  if (/^(hi|hello|hey|hie|yo|mhoro|salut|bonjour|sawubona|hola|sup|morning|evening|good morning|good evening)\b/.test(t) && t.split(/\s+/).length <= 6) {
    if (L.name && L.lastTopic) {
      return `${L.name}.${streakBit} Last time: ${L.lastTopic}. Send the next question or type mock.`;
    }
    if (L.name) return `${L.name}.${streakBit} Send the question — equation, topic, or a full exam sentence.`;
    return 'Hello. ACADEX. Send the question. English until you ask for another language.';
  }
  return null;
}

function helpText() {
  return `ACADEX — ZIMSEC teacher. I answer the way the marker wants (command word → working → final answer).

Send the question. Say VOICE only if you want a voice note of that working.
mock / full mock / mark 1. … / Download 2024 Maths Paper 1

Original ACADEX practice — not leaked scripts.`;
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

function pushMockQ(mock, say) {
  const fmt = formatMockQ(mock);
  if (fmt.expired) return { expired: true };
  if (fmt.done) return { done: true };
  say(fmt.text);
  return { ok: true };
}

export async function handleTurn({ from, text: incoming, bank, publicUrl, adminPhone, trigger, sessionMinutes }) {
  let text = incoming;
  const replies = [];
  const digits = String(from || '').replace(/\D/g, '');
  const say = (t) => {
    let clean = cleanWhatsApp(t);
    if (!clean && wantsDiagram(incoming)) {
      clean = 'Here is the sketch. The little square is the right angle. The longest side opposite that square is the hypotenuse.';
    }
    if (!clean) return;
    replies.push({ type: 'text', text: clean });
    storeLast(digits, clean);
  };
  let work = String(text || '');
  const askVoice = wantsVoice(work);
  if (askVoice) {
    const stripped = stripVoiceAsk(work);
    const langOnly = work.toLowerCase().match(/^voice\s+(\w+)$/);
    if (langOnly) setLang(digits, langOnly[1].toLowerCase());
    if (!stripped || langOnly) {
      enterBotMode(digits, sessionMinutes);
      const sess0 = sessions.get(digits) || {};
      const last = sess0.lastSpeak || sess0.lastReply;
      if (!last) {
        say('Send the question first. Then say VOICE and I will speak that working only.');
        return { replies };
      }
      const ok = await attachVoice(replies, digits, last);
      say(ok ? 'Voice note of the last working.' : 'Audio failed — say VOICE again in a moment.');
      return { replies };
    }
    work = stripped;
  }
  const tl = work.toLowerCase().trim();
  text = work;

  if (!tl) return { replies: [], ignored: true };
  enterBotMode(digits, sessionMinutes);
  bumpStreak(digits);

  const prof = extractProfile(text);
  if (prof.name || prof.grade || prof.parent) touchLearner(digits, prof);
  const asked = askedLanguage(text);
  if (asked) setLang(digits, asked);
  if (asked && tl.split(/\s+/).length <= 8 && /^(speak|reply|switch|use|in|chi ?shona|shona|ndebele|english|chirungu)\b/i.test(tl)) {
    if (asked === 'sn') say('Zvakanaka. Kubva zvino ndinotaura chiShona. Tumira mubvunzo.');
    else if (asked === 'nd') say('Kulungile. Ngizophendula ngesiNdebele. Thumela umbuzo.');
    else say('Switched to English. Send the question.');
    return { replies };
  }

  if (tl.startsWith('admin') && adminPhone && digits === adminPhone) {
    const parts = text.trim().split(/\s+/);
    if (parts[1] === 'activate' && parts[2]) {
      const target = parts[2].replace(/\D/g, '');
      const days = parseInt(parts[3] || '7', 10);
      const exp = activateUser(target, days);
      say(`Activated ${target} for ${days} days until ${exp.toDateString()}`);
      replies.push({ type: 'text', text: `ACADEX is unlocked for ${days} days. Send a question or MOCK.`, to: target });
    } else if (parts[1] === 'status') {
      const target = (parts[2] || digits).replace(/\D/g, '');
      say(card(target) || 'No file yet.');
    } else if (parts[1] === 'class' || parts[1] === 'report') {
      const rows = allLearners().slice(0, 20).map(u =>
        `${u.name || u.phone} · asked ${u.asked || 0} · mock ${u.lastMock ? u.lastMock.score + '/' + u.lastMock.total : '—'} · weak ${(u.weak || [])[0] || '—'}`
      );
      say(rows.length ? `Class snapshot\n${rows.join('\n')}` : 'No learners yet.');
    } else {
      say('Admin: activate <phone> <days>\nstatus <phone>\nclass');
    }
    return { replies };
  }

  const sess = sessions.get(digits) || {};

  if (sess.mock) {
    if (/^stop mock|end mock|cancel mock$/i.test(tl)) {
      const fin = finishMock(sess.mock);
      sess.mock = null;
      sessions.set(digits, sess);
      touchLearner(digits, { lastMock: { score: fin.score, total: fin.total, subject: fin.text.slice(0, 40) } });
      say(fin.text);
      return { replies };
    }
    if (Date.now() > sess.mock.endsAt) {
      const fin = finishMock(sess.mock);
      sess.mock = null;
      sessions.set(digits, sess);
      say('Time. ' + fin.text);
      return { replies };
    }
    const q = sess.mock.qs[sess.mock.i];
    const sc = scoreAnswer(q, text);
    sess.mock.answers.push(sc);
    rememberTopic(digits, sc.topic, sc.ok);
    sess.mock.i += 1;
    if (sess.mock.i >= sess.mock.qs.length) {
      const fin = finishMock(sess.mock);
      sess.mock = null;
      sessions.set(digits, sess);
      touchLearner(digits, { lastMock: { score: fin.score, total: fin.total, subject: 'mock' } });
      say((sc.skip ? 'Skipped.\n' : (sc.ok ? '✓\n' : `✗ Answer was ${sc.correct}\n`)) + fin.text);
      incrementUse(digits);
      return { replies, increment: true };
    }
    sessions.set(digits, sess);
    say(sc.skip ? 'Skipped.' : (sc.ok ? '✓ Keep going.' : `✗ It was ${String(sc.correct).slice(0, 80)}. Next:`));
    const nxt = pushMockQ(sess.mock, say);
    if (nxt.expired) {
      const fin = finishMock(sess.mock);
      sess.mock = null;
      say(fin.text);
    }
    incrementUse(digits);
    return { replies, increment: true };
  }

  if (/^(mock|start mock|full mock|mock science|mock maths|mock english|start maths p1)\b/i.test(tl) || /^start mock/.test(tl)) {
    const mock = startMock(bank, tl);
    if (mock.error) { say(mock.error); return { replies }; }
    sess.mock = mock;
    sessions.set(digits, sess);
    say(`Starting: ${mock.title}\nI will send one question at a time. No calculator on 4004/1.`);
    pushMockQ(mock, say);
    return { replies };
  }

  if (/^parent\s+/i.test(tl)) {
    const num = tl.replace(/[^\d]/g, '');
    if (num.length >= 9) {
      touchLearner(digits, { parent: num });
      say(`Parent number saved. Send REPORT to generate the note.`);
    } else say('Send: parent 2637…');
    return { replies };
  }
  if (/^report$|^parent report$/i.test(tl)) {
    const note = parentReport(digits);
    say(note);
    const L = getLearner(digits);
    if (L.parent && L.parent !== digits) {
      replies.push({ type: 'text', text: note, to: L.parent });
    }
    return { replies };
  }

  if (/^mark\b/i.test(tl) || parseNumbered(text).length >= 3) {
    const nums = parseNumbered(text.replace(/^mark\s*/i, ''));
    const req = parsePaperRequest(text);
    const paper = findPaper(bank, req.year, req.session, req.code, req.paperNo)
      || findPaper(bank, '2024', 'November', '4004', 1);
    if (nums.length && paper) {
      const marked = markAgainstPaper(paper, nums);
      if (marked) {
        say(marked.text);
        marked.weak.forEach(w => rememberTopic(digits, w, false));
        incrementUse(digits);
        return { replies, increment: true };
      }
    }
  }

  if (looksLikeEssay(text) || /^mark (essay|composition)/i.test(tl)) {
    const m = markComposition(text);
    say(m.text);
    rememberTopic(digits, 'Composition', m.words >= 280);
    incrementUse(digits);
    if (askVoice) await attachVoice(replies, digits, m.text);
    return { replies, increment: true };
  }

  if (/download|pdf|past paper/.test(tl)) {
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

  if (/^(predictor|forecast|predict)$/i.test(tl) || /\bpredictor\b/.test(tl)) {
    const L = getLearner(digits);
    let extra = '';
    if (L.weak?.length) extra = `\n\nFor you${L.name ? ', ' + L.name : ''}: drill ${L.weak[0]} first.`;
    say(predictorText(bank) + extra);
    incrementUse(digits);
    return { replies, increment: true };
  }

  if (tl === '[photo]' || tl.startsWith('[image]')) {
    say('Put the question as the photo caption, or type it. I mark working best when I can see the numbers.');
    return { replies };
  }

  if (/^(help|menu|\?)$/i.test(tl)) {
    say(helpText());
    return { replies };
  }

  const sub = canUse(digits);
  if (!sub.allowed) {
    say('Free drill is used up. $0.75/week or $3/month. Admin activates after EcoCash.');
    return { replies };
  }

  if (await teach(digits, text, bank, say, replies)) {
    if (askVoice) {
      const last = (sessions.get(digits) || {}).lastReply;
      if (last) await attachVoice(replies, digits, last);
    }
    await attachDiagram(replies, incoming);
    return { replies, increment: true };
  }

  const person = personality(text, digits);
  if (person) {
    say(person);
    pushChat(digits, 'user', text);
    pushChat(digits, 'assistant', person);
    return { replies };
  }

  const concept = teachConcept(text);
  if (concept) {
    say(`${concept.title}\n\n${concept.answer}`);
    rememberTopic(digits, concept.title, true);
    incrementUse(digits);
    await attachDiagram(replies, incoming);
    return { replies, increment: true };
  }

  const lang = getLang(digits);
  const solved = solveMath(text);
  if (solved) {
    const body = formatMath(solved, lang);
    say(body);
    rememberTopic(digits, 'Algebra', true);
    incrementUse(digits);
    if (askVoice) await attachVoice(replies, digits, body);
    await attachDiagram(replies, incoming);
    return { replies, increment: true };
  }
  const sci = explainScience(text);
  if (sci) {
    say(`${sci.title}\n\n${sci.answer}`);
    rememberTopic(digits, sci.title, true);
    incrementUse(digits);
    if (askVoice) await attachVoice(replies, digits, sci.answer);
    return { replies, increment: true };
  }
  const eng = helpEnglish(text);
  if (eng) {
    say(`${eng.title}\n\n${eng.answer}`);
    rememberTopic(digits, eng.title, true);
    incrementUse(digits);
    return { replies, increment: true };
  }
  const hit = (!isConfused(text) && searchBank(bank, text));
  if (hit) {
    say(formatHit(hit));
    rememberTopic(digits, hit.qu.topic, true);
    incrementUse(digits);
    await attachDiagram(replies, incoming);
    return { replies, increment: true };
  }
  say(fallback(text));
  await attachDiagram(replies, incoming);
  return { replies };
}

export { FREE_LIMIT, users, sessions, closer };
