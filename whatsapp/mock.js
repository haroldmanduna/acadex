/** Timed WhatsApp mocks — 4004/1, 5006/1 drill. Original ACADEX items only. */

function strip(html) {
  return String(html || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function pickPaper(bank, syllabus, paperNo) {
  const list = (bank.papers || []).filter(p =>
    String(p.syllabus) === String(syllabus) && Number(p.paperNo) === Number(paperNo)
  );
  if (!list.length) return null;
  const y24 = list.find(p => String(p.year) === '2024') || list[list.length - 1];
  return y24;
}

export function startMock(bank, kind) {
  const k = String(kind || 'maths').toLowerCase();
  let syllabus = '4004';
  let paperNo = 1;
  let n = 10;
  let minutes = 25;
  let title = 'Maths 4004/1 sprint (10 short, ~25 min, no calculator)';
  if (/full|p1 30|paper 1 full/.test(k) || /full mock/.test(k)) {
    n = 30; minutes = 150;
    title = 'Maths 4004/1 FULL (30 short, 2h30, no calculator)';
  }
  if (/science|5006/.test(k)) {
    syllabus = '5006'; paperNo = 1; n = 10; minutes = 20;
    title = 'Combined Science 5006/1 drill (10 MCQ, ~20 min)';
  }
  if (/english|1122/.test(k)) {
    syllabus = '1122'; paperNo = 1; n = 1; minutes = 90;
    title = 'English 1122/1 composition (350–450 words, 1h30)';
  }
  const paper = pickPaper(bank, syllabus, paperNo);
  if (!paper) return { error: 'No ACADEX paper in the bank for that mock.' };
  const qs = (paper.questions || []).filter(q => q.kind !== 'passage').slice(0, n);
  if (!qs.length) return { error: 'That paper has no drill items.' };
  return {
    title,
    syllabus,
    paperNo,
    code: paper.code,
    year: paper.year,
    session: paper.session,
    minutes,
    endsAt: Date.now() + minutes * 60 * 1000,
    i: 0,
    answers: [],
    qs,
  };
}

export function formatMockQ(mock) {
  const left = Math.max(0, Math.round((mock.endsAt - Date.now()) / 60000));
  if (Date.now() > mock.endsAt) return { expired: true };
  const q = mock.qs[mock.i];
  if (!q) return { done: true };
  const opts = (q.options || []).join('\n');
  let body = `⏱️ ${mock.title}\nQ${mock.i + 1}/${mock.qs.length} · ${q.topic} [${q.marks}] · ${left} min left\n\n${strip(q.text).slice(0, 900)}`;
  if (opts) body += `\n${opts}`;
  if (mock.syllabus === '4004' && mock.paperNo === 1) body += '\n\nNo calculator.';
  body += '\n\nSend your answer now (or SKIP / STOP MOCK).';
  return { text: body.slice(0, 3500), q };
}

export function scoreAnswer(q, given) {
  const g = String(given || '').trim();
  if (!g || /^skip$/i.test(g)) return { ok: false, skip: true, correct: q.answer, topic: q.topic };
  const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9.%-]+/g, '');
  const a = norm(q.answer);
  const b = norm(g);
  const ok = !!(a && b && (a === b || a.includes(b) || b.includes(a) || b === norm(String(q.answer).split(';')[0])));
  return { ok, skip: false, correct: q.answer, topic: q.topic, given: g };
}

export function finishMock(mock) {
  const total = mock.qs.length;
  const marked = mock.answers || [];
  const right = marked.filter(a => a.ok).length;
  const weak = marked.filter(a => !a.ok && !a.skip).map(a => a.topic);
  const lines = marked.slice(0, 12).map((a, i) =>
    `${i + 1}. ${a.ok ? '✓' : '✗'} ${a.topic}${a.ok ? '' : ' → ' + String(a.correct).slice(0, 40)}`
  );
  return {
    score: right,
    total,
    pct: Math.round(100 * right / (total || 1)),
    weak,
    text: `Mock closed: ${right}/${total} (${Math.round(100 * right / (total || 1))}%)\n${mock.title}\n\n${lines.join('\n')}\n\nWeak topics: ${[...new Set(weak)].slice(0, 5).join(', ') || '—'}\nThis is an ACADEX practice mock, not a leaked ZIMSEC script.\nSay MOCK to try another, or send a topic to drill.`,
  };
}
