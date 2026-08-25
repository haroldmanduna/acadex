/** ACADEX WhatsApp Tutor — Master Engine across Primary, O-Level & A-Level
 *  Multi-channel ZIMSEC examiner with live PDF past papers, timed mocks & Supabase sync.
 */
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
  extractProfile, extractLife, card, parentReport, allLearners, nextNeed,
  bumpStreak, appendChat, savedChat,
  awardMerit, maybeStreakPrize, prizeBook, prizeHow, meritSlip, examinerChallenge, rankOf,
} from './learner.js';
import { startMock, formatMockQ, scoreAnswer, finishMock } from './mock.js';
import { parseNumbered, markAgainstPaper, markComposition, looksLikeEssay } from './marker.js';
import { detectLang, askedLanguage, ttsFile, wantsVoice, stripVoiceAsk, speechScript } from './voice.js';
import { examLock, looksLikeExam, zimsecExplain } from './zimsec.js';
import { wantsDiagram, renderDiagram, figureKind } from './diagrams.js';
import { readVisual, visionOn, visionUserText } from './vision.js';
import { isBusy } from './inbox.js';
import {
  isPaperRequest, parsePaperDetails, formatPaperCaption,
  getAvailablePapersMenu, findPdfFile,
} from './papers.js';
import { syncStudent, syncGrade, initSupabase } from './supabase-sync.js';

const FREE_LIMIT = 10000;
const sessions = new Map();
const users = new Map();
let workspaceRoot = '';

export function loadBank(root) {
  workspaceRoot = root;
  initLearners(root);
  initSupabase().catch(() => {});
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
  syncStudent(phone, L).catch(() => {});
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

function buildContext(text, bank, phone, visionNotes) {
  const bits = [];
  if (visionNotes) bits.push(`VISION READ FROM ATTACHED PHOTO/VIDEO:\n${visionNotes}`);
  const solved = solveMath(text);
  if (solved) {
    bits.push(`MATH ENGINE (do not contradict these numbers): ${solved.kind}. Result: ${solved.latex || solved.sol || ''}. Working: ${solved.steps.join('; ')}`);
  }
  const sci = explainScience(text);
  if (sci) bits.push(`SCIENCE NOTES: ${sci.title}. Key idea: ${sci.answer.slice(0, 300)}`);
  const eng = helpEnglish(text);
  if (eng) bits.push(`ENGLISH NOTES: ${eng.title}. Rule: ${eng.answer.slice(0, 300)}`);
  const hit = searchBank(bank, text);
  if (hit) {
    const pcode = hit.paper?.code || hit.paper?.syllabus || '4004';
    const qtop = hit.qu?.topic || 'General';
    const qans = hit.qu?.answer || '';
    const qsch = hit.qu?.markscheme || '';
    bits.push(`ACADEX QUESTION BANK HIT (${pcode}): ${qtop}. Answer: ${qans}. Scheme: ${qsch}`);
  }
  if (looksLikeExam(text)) bits.push(examLock(text));
  return bits.join('\n\n');
}

function cleanWhatsApp(raw) {
  if (!raw) return '';
  return String(raw)
    .replace(/\r/g, '')
    .replace(/\\\[/g, '').replace(/\\\]/g, '')
    .replace(/\\\(/g, '').replace(/\\\)/g, '')
    .replace(/(\*\*|__)/g, '*')
    .replace(/#{1,6}\s+/g, '')
    .replace(/```[a-z]*\n?/gi, '')
    .replace(/\[Attached:[^\]]+\]/gi, '')
    .replace(/\[Image:[^\]]+\]/gi, '')
    .replace(/\[Audio:[^\]]+\]/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function storeLast(phone, reply) {
  const s = sessions.get(phone) || {};
  s.lastReply = reply;
  s.lastSpeak = speechScript(reply, getLang(phone));
  sessions.set(phone, s);
  touchLearner(phone, { lastReply: reply, lastSpeak: s.lastSpeak });
}

async function attachVoice(replies, phone, text) {
  if (!text) return false;
  const lang = getLang(phone);
  const script = speechScript(text, lang);
  if (!script) return false;
  const voice = await ttsFile(script, lang, workspaceRoot);
  if (voice?.filePath && fs.existsSync(voice.filePath)) {
    replies.push({ type: 'audio', filePath: voice.filePath, url: voice.url, lang });
    return true;
  }
  return false;
}

async function attachDiagram(replies, text) {
  if (!wantsDiagram(text)) return false;
  const fig = figureKind(text);
  if (!fig) return false;
  try {
    const png = await renderDiagram(fig, workspaceRoot);
    if (png?.filePath && fs.existsSync(png.filePath)) {
      replies.push({ type: 'image', filePath: png.filePath, caption: png.caption || 'ZIMSEC Diagram' });
      return true;
    }
  } catch (e) {
    console.warn('diagram render failed', e.message);
  }
  return false;
}

function isGreeting(text) {
  const t = String(text || '').toLowerCase().trim();
  return /^(hi|hello|hey|mhoro|masikati|mangwanani|manheru|salibonani|sawubona|good\s*(morning|afternoon|day|evening)|hie|holla|xup|morning|afternoon|evening)\b/i.test(t);
}

function isChat(raw) {
  const t = String(raw || '').toLowerCase().trim();
  if (solveMath(raw) || looksLikeExam(raw)) return false;
  if (isConfused(raw)) return false;
  if (explainScience(raw) && !/\bi (don'?t|hate|love|failed)\b/.test(t)) return false;
  if (helpEnglish(raw) && /composition|summary|register|comprehension|essay/.test(t)) return false;
  if (isGreeting(raw)) return true;
  if (/how are you|how'?s (it|school|the week)|how is (it|school)|i('?m| am) (tired|sad|scared|worried|fine|ok|okay|lost|back)|i failed|i got a [a-eu]\b|thank(s| you)|ndatenda|see you|good ?night|good ?day|missed you|my teacher|at school|in hostel|can we talk|i want to talk|i need to talk|i'?m struggling|eish/.test(t)) return true;
  if (raw.split(/\s+/).length <= 12 && !/\d/.test(raw) && !/(download|mock|prize|pdf|predictor|challenge|slip|voice|send paper|past paper|exam)/i.test(t)) {
    if (/^(ok|okay|yes|yeah|yebo|ehe|no|nope|hmm|lol|haha|sure|thanks|cool|alright|right|wow|eish|shame|fine)\b/.test(t)) return true;
  }
  return false;
}

function greetingFallback(phone) {
  const L = getLearner(phone);
  const first = !L.heardPrizes;
  if (first) touchLearner(phone, { heardPrizes: true });
  const prizes = first ? '\n\n' + prizeHow() : '';
  const streakBit = L.streak ? ` Day ${L.streak}.` : '';
  if (L.name && L.lastTopic) {
    return `${L.name}.${streakBit} Last time we drilled ${L.lastTopic}. I'm here — tell me how school is going, or send your next question.` + prizes;
  }
  if (L.name) {
    return `${L.name}.${streakBit} Good to have you. What would you like to drill today? (Maths, Science, English, Grade 7, A-Level, or type "Past Papers")` + prizes;
  }
  return `Hello. I'm ACADEX — your ZIMSEC tutor across Primary, O-Level & A-Level.\nSend any question, or type *Past Papers* to download exams, or *Start Mock* to practice!` + prizes;
}

async function teach(digits, text, bank, say, replies) {
  const s = sessions.get(digits) || {};
  const chatting = isChat(text) && !s.visionNotes;
  const L0 = getLearner(digits);
  const academic = !chatting && (solveMath(text) || looksLikeExam(text) || explainScience(text) || helpEnglish(text) || Boolean(s.visionNotes));
  if (academic && !L0.name) touchLearner(digits, { nameAskPending: true });
  const L = getLearner(digits);
  const need = nextNeed(digits);
  const hist = (s.chat || []).slice(-10);
  const ctx = buildContext(text, bank, digits, s.visionNotes);
  const learnerStr = card(digits);
  const busy = isBusy();
  const reply = await askTeacher({
    history: hist,
    user: text,
    context: ctx,
    learner: learnerStr,
    need,
    hurry: busy,
    chat: chatting,
  });
  if (!reply) return false;
  say(reply);
  pushChat(digits, 'user', text);
  pushChat(digits, 'assistant', reply);
  s.visionNotes = '';
  sessions.set(digits, s);
  return true;
}

function personality(text, phone) {
  const L = getLearner(phone);
  const tl = String(text || '').toLowerCase();
  const streakBit = L.streak ? ` Day ${L.streak} streak.` : '';
  const r = rankOf(L);
  const rankBit = r.id !== 'new' ? ` ${r.title}.` : '';
  if (/your name|who are you|who r u|who is this|zita rako|unonzi ani|comment tu t.?appelles|whats your name|what.?s your name|ninani|ngubani/.test(tl)) {
    return L.name
      ? `${L.name}, I am ACADEX.${rankBit} Last topic: ${L.lastTopic || 'general drill'}.${streakBit} I'm ready — send any exam question or mock topic.`
      : 'I am ACADEX — your ZIMSEC tutor. What is your name and form?';
  }
  return null;
}

function helpText() {
  return `🎓 *ACADEX ZIMSEC TUTOR & EXAM DESK*

📚 *1. Send Any Question:*
Type or snap a photo of your Maths, Science, English, Grade 7, or A-Level question.

📄 *2. Download Past Question Papers (88 Available):*
• Type *Past Papers* to view the library.
• Or type e.g. *Send 2024 Maths P1* or *Send 2023 Science P2* to receive the PDF immediately.

⏱️ *3. Interactive Timed Exam Room:*
• Type *Start Mock Maths* (4004/1, no calculator)
• Type *Start Mock Science* (5006/1)
• Type *Start Mock Grade 7* (702/1)
• Type *Start Mock Pure Maths* (6042/1)

🏆 *4. Badges & Progress:*
• Type *PRIZES* to see your stars and rank.
• Type *SLIP* for your ACADEX merit certificate.
• Type *VOICE* if you want the working spoken as an audio note.`;
}

function isProfileOnly(text, prof) {
  if (!prof || !(prof.name || prof.grade || prof.age || prof.school)) return false;
  const raw = String(text || '').trim();
  if (/^(mock|start|exam|download|send|get|give|explain|what|how|why|solve|calculate|past|paper|pdf)\b/i.test(raw)) return false;
  if (/\b(mock|exam|past\s*paper|paper\s*[12]|p[12]|calculate|solve|show that|units?|grading|grades?)\b/i.test(raw)) return false;
  const rest = raw
    .replace(/(?:ndinonzi|zita rangu(?: ndi)?|ngingu|i(?:'?m| am)|my name is|ndini)\s+[A-Za-zÀ-ÿ]{2,20}/ig, ' ')
    .replace(/\b(?:form|giredhi|grade)\s*[1-7]\b/ig, ' ')
    .replace(/\bo-?level\b/ig, ' ')
    .replace(/\ba-?level\b/ig, ' ')
    .replace(/\b(?:i(?:'?m| am)|ndine|ndiri)\s*\d{1,2}\b/ig, ' ')
    .replace(/\b\d{1,2}\s*(?:years? old|yrs?|makore)\b/ig, ' ')
    .replace(/\b(?:school|chikoro)\s*(?:is|:)?\s*[A-Za-z][A-Za-z0-9 .'-]{2,40}/ig, ' ')
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim();
  return rest.split(/\s+/).filter(Boolean).length <= 2;
}

function glue(text, award) {
  if (!award?.line) return text;
  return String(text || '').trim() + '\n\n' + award.line;
}

function awardPractice(phone) {
  return awardMerit(phone, { stars: 1, reason: 'desk work' });
}

function awardMockScore(phone, pct) {
  if (pct >= 80) return awardMerit(phone, { stars: 5, house: 2, badge: 'Mock Grade A', announce: true });
  if (pct >= 70) return awardMerit(phone, { stars: 3, house: 1, badge: 'Mock pass', announce: true });
  if (pct >= 50) return awardMerit(phone, { stars: 1, announce: true });
  return null;
}

function predictorText(bank) {
  const blocks = [
    ['4004 Maths', bank.predictor],
    ['5006 Combined Science', bank.sciencePredictor],
    ['1122 English', bank.englishPredictor],
  ];
  return blocks.map(([title, list]) => {
    const lines = (list || []).slice(0, 5).map(t => `• ${t.topic} (${t.pct}%)`).join('\n');
    return `🔮 ${title} Exam Predictor\n${lines}`;
  }).join('\n\n');
}

function pushMockQ(mock, say) {
  const fmt = formatMockQ(mock);
  if (fmt.expired) return { expired: true };
  if (fmt.done) return { done: true };
  say(fmt.text);
  return { ok: true };
}

export async function handleTurn({ from, text: incoming, bank, publicUrl, adminPhone, trigger, sessionMinutes, mediaPath, mediaKind, mediaMime }) {
  let text = incoming;
  const replies = [];
  const digits = String(from || '').replace(/\D/g, '');
  let pendingPrize = null;
  const say = (t) => {
    let clean = cleanWhatsApp(t);
    if (!clean && wantsDiagram(incoming)) {
      clean = 'Here is the sketch. The right-angle marker indicates 90°. The side opposite is the hypotenuse.';
    }
    if (!clean) return;
    if (pendingPrize?.line) {
      clean = clean + '\n\n' + pendingPrize.line;
      pendingPrize = null;
    }
    replies.push({ type: 'text', text: clean });
    storeLast(digits, clean);
  };

  const incomingAsk = askedLanguage(incoming);
  const langRest = String(incoming || '').toLowerCase()
    .replace(/\b(speak|reply|answer|teach|switch|use|in|please|ndapota|chi ?shona|shona|ndebele|isindebele|english|chirungu)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  if (incomingAsk && !langRest) {
    enterBotMode(digits, sessionMinutes);
    bumpStreak(digits);
    pendingPrize = maybeStreakPrize(digits);
    setLang(digits, incomingAsk);
    if (incomingAsk === 'sn') say('Zvakanaka. Kubva zvino ndinokutsanangurira neChiShona. Tumira mubvunzo wako.');
    else if (incomingAsk === 'nd') say('Kulungile. Ngizokuchasisela ngesiNdebele. Thumela umbuzo wakho.');
    else say('Switched to English. Send the question.');
    return { replies };
  }

  let work = String(text || '');
  const askVoice = wantsVoice(work) && !incomingAsk;
  if (askVoice) {
    const stripped = stripVoiceAsk(work);
    const langOnly = work.toLowerCase().match(/^voice\s+(\w+)$/);
    if (langOnly) setLang(digits, langOnly[1].toLowerCase());
    if (!stripped || langOnly) {
      enterBotMode(digits, sessionMinutes);
      const sess0 = sessions.get(digits) || {};
      const last = sess0.lastSpeak || sess0.lastReply;
      if (!last) {
        say('Send the question first. Then say VOICE and I will record the step-by-step working.');
        return { replies };
      }
      const ok = await attachVoice(replies, digits, last);
      say(ok ? '🎙️ Voice note of the working.' : 'Audio synthesis unavailable — say VOICE again in a moment.');
      return { replies };
    }
    work = stripped;
  }
  let tl = work.toLowerCase().trim();
  text = work;

  if (!tl) return { replies: [], ignored: true };
  enterBotMode(digits, sessionMinutes);
  bumpStreak(digits);
  pendingPrize = maybeStreakPrize(digits);

  let visionNotes = '';
  if (mediaPath) {
    const seen = await readVisual({ filePath: mediaPath, kind: mediaKind || 'image', mime: mediaMime, caption: incoming });
    if (seen?.ok && seen.text) {
      visionNotes = seen.text;
      text = visionUserText(seen, incoming);
      const sessV = sessions.get(digits) || {};
      sessV.visionNotes = visionNotes;
      sessions.set(digits, sessV);
      tl = String(text || '').toLowerCase().trim();
    } else if (seen?.text) {
      visionNotes = '';
    }
  }

  const prof = extractProfile(text);
  if (Object.keys(prof).length) {
    touchLearner(digits, prof);
    syncStudent(digits, getLearner(digits)).catch(() => {});
  }
  const life = extractLife(text);
  if (life) touchLearner(digits, { lastLife: life });
  const asked = askedLanguage(text);
  if (asked) setLang(digits, asked);
  if (asked && tl.split(/\s+/).length <= 8 && /^(speak|reply|switch|use|in|chi ?shona|shona|ndebele|english|chirungu)\b/i.test(tl)) {
    if (asked === 'sn') say('Zvakanaka. Ndinotsanangura neChiShona. Tumira mubvunzo.');
    else if (asked === 'nd') say('Kulungile. Ngizophendula ngesiNdebele. Thumela umbuzo.');
    else say('Switched to English. Send the question.');
    return { replies };
  }

  if (isProfileOnly(text, prof) && tl.split(/\s+/).length <= 12) {
    if (await teach(digits, text, bank, say, replies)) {
      return { replies, increment: true };
    }
    const L = getLearner(digits);
    const bits = [L.name || 'Alright'].filter(Boolean);
    if (L.grade) bits.push(L.grade);
    if (L.school) bits.push(L.school);
    const ack = `${bits.join('. ')}. Noted on your learner file! How has school been — or which topic do you want to master today?`;
    say(ack);
    pushChat(digits, 'user', text);
    pushChat(digits, 'assistant', ack);
    return { replies };
  }

  if (/^(prizes|prize|stars|rank|merit book)$/i.test(tl)) {
    say(prizeBook(digits));
    return { replies };
  }
  if (/^(slip|merit slip|certificate)$/i.test(tl)) {
    say(meritSlip(digits));
    return { replies };
  }
  if (/^(challenge|examiner|harder)$/i.test(tl)) {
    const L = getLearner(digits);
    if (!L.challengeReady && (L.stars || 0) < 1 && (L.asked || 0) < 1) {
      say((L.name ? L.name + '. ' : '') + 'Solve one question first to warm up. Then you can tackle the examiner challenge!');
      return { replies };
    }
    say(examinerChallenge(digits));
    return { replies };
  }

  if (tl.startsWith('admin') && adminPhone && digits === adminPhone) {
    const parts = text.trim().split(/\s+/);
    if (parts[1] === 'activate' && parts[2]) {
      const target = parts[2].replace(/\D/g, '');
      const days = parseInt(parts[3] || '7', 10);
      const exp = activateUser(target, days);
      say(`Activated ${target} for ${days} days until ${exp.toDateString()}`);
      replies.push({ type: 'text', text: `ACADEX is unlocked for ${days} days. Send any question, past paper, or MOCK.`, to: target });
    } else if (parts[1] === 'status') {
      const target = (parts[2] || digits).replace(/\D/g, '');
      say(card(target) || 'No file yet.');
    } else if (parts[1] === 'class' || parts[1] === 'report') {
      const rows = allLearners().slice(0, 20).map(u =>
        `${u.name || u.phone} · ${rankOf(u).title} · ${u.stars || 0}★ · asked ${u.asked || 0} · mock ${u.lastMock ? u.lastMock.score + '/' + u.lastMock.total : '—'} · weak ${(u.weak || [])[0] || '—'}`
      );
      say(rows.length ? `Class snapshot:\n${rows.join('\n')}` : 'No learners registered yet.');
    } else {
      say('Admin commands:\n• activate <phone> <days>\n• status <phone>\n• class');
    }
    return { replies };
  }

  const sess = sessions.get(digits) || {};

  // 1. LIVE INTERACTIVE MOCK EXAM ROOM
  if (sess.mock) {
    if (/^stop mock|end mock|cancel mock$/i.test(tl)) {
      const fin = finishMock(sess.mock);
      sess.mock = null;
      sessions.set(digits, sess);
      touchLearner(digits, { lastMock: { score: fin.score, total: fin.total, subject: fin.subject } });
      syncGrade(digits, { subject: fin.subject, score: fin.score, pct: fin.pct, grade_letter: fin.gradeLetter }).catch(() => {});
      say(glue(fin.text, awardMockScore(digits, fin.pct)));
      return { replies };
    }
    if (Date.now() > sess.mock.endsAt) {
      const fin = finishMock(sess.mock);
      sess.mock = null;
      sessions.set(digits, sess);
      touchLearner(digits, { lastMock: { score: fin.score, total: fin.total, subject: fin.subject } });
      syncGrade(digits, { subject: fin.subject, score: fin.score, pct: fin.pct, grade_letter: fin.gradeLetter }).catch(() => {});
      say(glue('⏳ Time is up!\n\n' + fin.text, awardMockScore(digits, fin.pct)));
      return { replies };
    }

    const q = sess.mock.qs[sess.mock.i];
    const sc = scoreAnswer(q, text, visionNotes);
    sess.mock.answers.push(sc);
    rememberTopic(digits, sc.topic, sc.ok);
    sess.mock.i += 1;

    if (sess.mock.i >= sess.mock.qs.length) {
      const fin = finishMock(sess.mock);
      sess.mock = null;
      sessions.set(digits, sess);
      touchLearner(digits, { lastMock: { score: fin.score, total: fin.total, subject: fin.subject } });
      syncGrade(digits, { subject: fin.subject, score: fin.score, pct: fin.pct, grade_letter: fin.gradeLetter }).catch(() => {});
      if (sc.ok) awardMerit(digits, { stars: 1, announce: false });
      const verdict = sc.skip ? '⏭️ Skipped.\n\n' : (sc.ok ? '✅ Correct!\n\n' : `❌ Correct answer was: *${sc.correct}*\n\n`);
      say(glue(verdict + fin.text, awardMockScore(digits, fin.pct)));
      incrementUse(digits);
      return { replies, increment: true };
    }

    sessions.set(digits, sess);
    if (sc.ok) awardMerit(digits, { stars: 1, announce: false });
    const interim = sc.skip ? '⏭️ Skipped.' : (sc.ok ? '✅ Correct! Next question:' : `❌ Expected: *${String(sc.correct).slice(0, 80)}*. Next:`);
    say(interim);
    const nxt = pushMockQ(sess.mock, say);
    if (nxt.expired) {
      const fin = finishMock(sess.mock);
      sess.mock = null;
      say(fin.text);
    }
    incrementUse(digits);
    return { replies, increment: true };
  }

  // 2. TRIGGER NEW MOCK DRILL
  if (/^(mock|start mock|full mock|mock science|mock maths|mock english|start maths p1|mock grade 7|mock pure maths|mock a level)\b/i.test(tl) || /^start\s*(mock|exam)/i.test(tl)) {
    const mock = startMock(bank, tl);
    if (mock.error) { say(mock.error); return { replies }; }
    sess.mock = mock;
    sessions.set(digits, sess);
    say(`🚀 *Starting Exam Session:* ${mock.title}\nI will send questions one-by-one. Reply directly or send a photo of your working.`);
    pushMockQ(mock, say);
    return { replies };
  }

  // 3. PARENT REPORTS
  if (/^parent\s+/i.test(tl)) {
    const num = tl.replace(/[^\d]/g, '');
    if (num.length >= 9) {
      touchLearner(digits, { parent: num });
      say(`Parent number saved (+${num}). Type REPORT to generate the official progress slip.`);
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

  // 4. NUMBERED ANSWER SCRIPTS
  if (/^mark\b/i.test(tl) || parseNumbered(text).length >= 3) {
    const nums = parseNumbered(text.replace(/^mark\s*/i, ''));
    const details = parsePaperDetails(text);
    const paper = (bank.papers || []).find(p => String(p.year) === String(details.year) && String(p.syllabus) === String(details.code) && Number(p.paperNo) === Number(details.paperNo))
      || (bank.papers || []).find(p => String(p.syllabus) === '4004' && Number(p.paperNo) === 1);
    if (nums.length && paper) {
      const marked = markAgainstPaper(paper, nums);
      if (marked) {
        say(glue(marked.text, awardMockScore(digits, marked.pct)));
        marked.weak.forEach(w => rememberTopic(digits, w, false));
        syncGrade(digits, { subject: `${paper.subject || 'Maths'} ${paper.code}`, score: marked.right, pct: marked.pct, grade_letter: marked.pct >= 75 ? 'A' : marked.pct >= 50 ? 'C' : 'U' }).catch(() => {});
        incrementUse(digits);
        return { replies, increment: true };
      }
    }
  }

  // 5. ESSAYS & 1122 COMPOSITIONS
  if (looksLikeEssay(text) || /^mark (essay|composition)/i.test(tl)) {
    const m = markComposition(text);
    const essayAward = /A/.test(m.band) ? awardMerit(digits, { stars: 2, house: 1, badge: '1122 band', announce: true }) : null;
    say(glue(m.text, essayAward));
    rememberTopic(digits, 'Composition', m.words >= 280);
    incrementUse(digits);
    if (askVoice) await attachVoice(replies, digits, m.text);
    return { replies, increment: true };
  }

  // 6. QUESTION PAPERS & PDF DISPATCHER
  if (isPaperRequest(text)) {
    if (/^(past\s*papers?|papers?|question\s*papers?|all\s*papers?|exam\s*papers?|paper\s*list|list\s*papers?|grade\s*7\s*papers?|a\s*level\s*papers?)$/i.test(tl)) {
      say(getAvailablePapersMenu(tl));
      return { replies };
    }

    const details = parsePaperDetails(text);
    const fp = findPdfFile(workspaceRoot, details.fname);
    const base = publicUrl || 'https://acadex-r6z0.onrender.com';
    const url = `${base}/pdfs/${details.fname}`;

    if (!fp) {
      say(`📄 *Paper Not in Local Index:* ${details.title}\n\nType *Past Papers* to view the complete list of 88 available ZIMSEC papers.`);
      return { replies };
    }

    const caption = formatPaperCaption(details);
    replies.push({
      type: 'document',
      filePath: fp,
      url,
      filename: details.fname,
      caption,
    });
    incrementUse(digits);
    return { replies, increment: true };
  }

  // 7. PREDICTOR PAPERS
  if (/^(predictor|forecast|predict)$/i.test(tl) || /\bpredictor\b/.test(tl)) {
    const L = getLearner(digits);
    let extra = '';
    if (L.weak?.length) extra = `\n\n📌 *Personal Priority for ${L.name || 'you'}:* Drill ${L.weak[0]} first.`;
    say(predictorText(bank) + extra);
    incrementUse(digits);
    return { replies, increment: true };
  }

  if ((tl === '[photo]' || tl.startsWith('[image]') || tl === '[video]') && !visionNotes) {
    say(visionOn()
      ? 'I could not extract the text from that picture clearly. Send a closer snapshot of the question with good lighting, or type it out.'
      : 'Type your question or add a short caption to the photo. I mark step-by-step working best when numbers are visible.');
    return { replies };
  }

  if (/^(help|menu|\?)$/i.test(tl)) {
    say(helpText());
    return { replies };
  }

  const personFirst = personality(text, digits);
  if (personFirst) {
    say(personFirst);
    pushChat(digits, 'user', text);
    pushChat(digits, 'assistant', personFirst);
    return { replies };
  }

  const zFacts = zimsecExplain(text);
  if (zFacts) {
    say(`📖 *${zFacts.title}*\n\n${zFacts.answer}`);
    incrementUse(digits);
    return { replies, increment: true };
  }

  const sub = canUse(digits);
  if (!sub.allowed) {
    say('Free drill limit reached. Unlimited access is $0.75/week or $3/month via EcoCash/Innbucks. Admin unlocks upon confirmation.');
    return { replies };
  }

  // 8. SENIOR TEACHER & MULTI-SUBJECT SOLVER
  if (await teach(digits, text, bank, say, replies)) {
    if (askVoice) {
      const last = (sessions.get(digits) || {}).lastReply;
      if (last) await attachVoice(replies, digits, last);
    }
    await attachDiagram(replies, incoming);
    return { replies, increment: true };
  }

  if (isChat(text) || isGreeting(text)) {
    const g = greetingFallback(digits);
    say(g);
    pushChat(digits, 'user', text);
    pushChat(digits, 'assistant', g);
    return { replies };
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
    say(glue(`📚 *${concept.title}*\n\n${concept.answer}`, awardPractice(digits)));
    rememberTopic(digits, concept.title, true);
    incrementUse(digits);
    await attachDiagram(replies, incoming);
    return { replies, increment: true };
  }

  const lang = getLang(digits);
  const solved = solveMath(text);
  if (solved) {
    const body = formatMath(solved, lang);
    const L = getLearner(digits);
    const who = L.name ? L.name + '. ' : '';
    say(glue(who + body, awardPractice(digits)));
    rememberTopic(digits, 'Algebra & Equations', true);
    incrementUse(digits);
    if (askVoice) await attachVoice(replies, digits, body);
    await attachDiagram(replies, incoming);
    return { replies, increment: true };
  }

  const sci = explainScience(text);
  if (sci) {
    say(glue(`🔬 *${sci.title}*\n\n${sci.answer}\n\n📌 *ZIMSEC Science Tip:* Remember command words — State requires a short fact, Explain requires cause-and-effect ("because").`, awardPractice(digits)));
    rememberTopic(digits, sci.title, true);
    incrementUse(digits);
    if (askVoice) await attachVoice(replies, digits, sci.answer);
    return { replies, increment: true };
  }

  const eng = helpEnglish(text);
  if (eng) {
    say(glue(`✍️ *${eng.title}*\n\n${eng.answer}\n\n📌 *ZIMSEC English 1122 Tip:* Command words dictate mark allocation. Keep summary within strict word limits.`, awardPractice(digits)));
    rememberTopic(digits, eng.title, true);
    incrementUse(digits);
    return { replies, increment: true };
  }

  const hit = (!isConfused(text) && searchBank(bank, text));
  if (hit) {
    say(glue(formatHit(hit), awardPractice(digits)));
    rememberTopic(digits, hit.qu.topic, true);
    incrementUse(digits);
    await attachDiagram(replies, incoming);
    return { replies, increment: true };
  }

  say(fallback(text));
  await attachDiagram(replies, incoming);
  return { replies };
}

export { FREE_LIMIT, users, sessions, closer, solveLinearEq as solveLinear };
