/** ACADEX Timed WhatsApp Mocks & Exam Rooms — Primary, O-Level & A-Level
 *  Dynamic question delivery, OCR handwriting support, and Senior Examiner mark slips.
 */

function strip(html) {
  return String(html || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Find best matching paper from question bank */
function pickPaper(bank, syllabus, paperNo, year = '2024') {
  const list = (bank.papers || []).filter(p =>
    String(p.syllabus) === String(syllabus) && Number(p.paperNo) === Number(paperNo)
  );
  if (!list.length) return null;
  const matchYear = list.find(p => String(p.year) === String(year));
  return matchYear || list[list.length - 1];
}

/** Start interactive exam / mock drill */
export function startMock(bank, kind = 'maths') {
  const k = String(kind || 'maths').toLowerCase();
  let syllabus = '4004';
  let paperNo = 1;
  let n = 10;
  let minutes = 25;
  let level = 'O-Level';
  let title = 'Maths 4004/1 Sprint (10 short questions, ~25 min, NO calculator)';

  if (/grade\s*7|primary|702/i.test(k)) {
    syllabus = '702';
    paperNo = 1;
    n = 10;
    minutes = 20;
    level = 'Grade 7 (Primary)';
    title = 'Grade 7 Mathematics (702/1) Exam Drill (10 questions, ~20 min)';
  } else if (/pure\s*maths?|6042|a\s*level\s*pure/i.test(k)) {
    syllabus = '6042';
    paperNo = 1;
    n = 6;
    minutes = 35;
    level = 'A-Level (Form 5–6)';
    title = 'A-Level Pure Maths (6042/1) Drill (Calculus & Functions, ~35 min)';
  } else if (/a\s*level\s*maths?|9164/i.test(k)) {
    syllabus = '9164';
    paperNo = 1;
    n = 6;
    minutes = 35;
    level = 'A-Level (Form 5–6)';
    title = 'A-Level Mathematics (9164/1) Drill (~35 min)';
  } else if (/further\s*maths?|9187/i.test(k)) {
    syllabus = '9187';
    paperNo = 1;
    n = 5;
    minutes = 35;
    level = 'A-Level (Form 5–6)';
    title = 'A-Level Further Mathematics (9187/1) Drill (~35 min)';
  } else if (/science|5006/i.test(k)) {
    syllabus = '5006';
    paperNo = 1;
    n = 10;
    minutes = 20;
    level = 'O-Level (Form 1–4)';
    title = 'Combined Science 5006/1 Drill (10 MCQ, ~20 min)';
    if (/full/i.test(k)) {
      n = 40; minutes = 60;
      title = 'Combined Science 5006/1 FULL Mock (40 MCQ, 1 Hour)';
    }
  } else if (/english|1122/i.test(k)) {
    syllabus = '1122';
    paperNo = 1;
    n = 1;
    minutes = 90;
    level = 'O-Level (Form 1–4)';
    title = 'English Language 1122/1 Composition Drill (350–450 words, 1h30)';
  } else if (/full|p1\s*30|paper\s*1\s*full/i.test(k) || /full\s*mock/i.test(k)) {
    n = 30;
    minutes = 150;
    level = 'O-Level (Form 1–4)';
    title = 'Maths 4004/1 FULL Exam (30 short questions, 2h30, NO calculator)';
  }

  const paper = pickPaper(bank, syllabus, paperNo);
  if (!paper) {
    return { error: `No ACADEX practice paper found in the bank for syllabus ${syllabus}. Try "Mock Maths" or "Mock Science".` };
  }

  const qs = (paper.questions || []).filter(q => q.kind !== 'passage').slice(0, n);
  if (!qs.length) {
    return { error: 'That examination paper has no drill questions loaded.' };
  }

  return {
    title,
    level,
    syllabus,
    paperNo,
    code: paper.code || `${syllabus}/${paperNo}`,
    year: paper.year,
    session: paper.session,
    minutes,
    endsAt: Date.now() + minutes * 60 * 1000,
    i: 0,
    answers: [],
    qs,
  };
}

/** Format current question in live exam */
export function formatMockQ(mock) {
  const left = Math.max(0, Math.round((mock.endsAt - Date.now()) / 60000));
  if (Date.now() > mock.endsAt) return { expired: true };
  const q = mock.qs[mock.i];
  if (!q) return { done: true };

  const opts = (q.options || []).join('\n');
  const marksStr = q.marks ? `[${q.marks} Mark${q.marks > 1 ? 's' : ''}]` : '[2 Marks]';
  
  let body = `⏱️ *${mock.title}*\n📝 *Question ${mock.i + 1} of ${mock.qs.length}* · _${q.topic || 'General'}_ ${marksStr}\n⏳ *Time Remaining:* ${left} min\n\n${strip(q.text).slice(0, 950)}`;
  if (opts) body += `\n\n${opts}`;
  if (mock.syllabus === '4004' && mock.paperNo === 1) body += '\n\n🚫 _No calculator allowed on this paper._';
  
  body += '\n\n👉 *Send your answer* (or snap a photo of your working). Reply *SKIP* to move on or *STOP MOCK* to finish.';
  return { text: body.slice(0, 3500), q };
}

/** Score student response against answer key */
export function scoreAnswer(q, given, visionExtracted = '') {
  const g = String(given || visionExtracted || '').trim();
  if (!g || /^skip$/i.test(g)) {
    return { ok: false, skip: true, correct: q.answer, topic: q.topic || 'Syllabus Item', given: 'Skipped' };
  }

  const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9.%+-/]+/g, '');
  const a = norm(q.answer);
  const b = norm(g);

  // Exact or contains match
  let ok = !!(a && b && (a === b || a.includes(b) || b.includes(a) || b === norm(String(q.answer).split(';')[0])));

  // Check numeric equivalence (e.g. 0.5 vs 1/2 vs 50%)
  if (!ok && /^[0-9./%]+$/.test(a) && /^[0-9./%]+$/.test(b)) {
    try {
      const numA = evalFraction(a);
      const numB = evalFraction(b);
      if (numA !== null && numB !== null && Math.abs(numA - numB) < 0.001) ok = true;
    } catch { /* ignore */ }
  }

  return { ok, skip: false, correct: q.answer, topic: q.topic || 'Syllabus Item', given: g };
}

function evalFraction(str) {
  if (str.endsWith('%')) return parseFloat(str) / 100;
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 2 && Number(parts[1]) !== 0) return Number(parts[0]) / Number(parts[1]);
  }
  const n = Number(str);
  return isNaN(n) ? null : n;
}

/** Generate ZIMSEC Senior Examiner Mark Slip */
export function finishMock(mock) {
  const total = mock.qs.length;
  const marked = mock.answers || [];
  const right = marked.filter(a => a.ok).length;
  const pct = Math.round((100 * right) / (total || 1));
  const weak = marked.filter(a => !a.ok && !a.skip).map(a => a.topic);
  const uniqueWeak = [...new Set(weak)].filter(Boolean);

  let gradeLetter = 'U';
  let gradeComment = '';
  
  if (mock.syllabus === '702') {
    // Grade 7 Units 1 to 9
    const unit = pct >= 85 ? 1 : pct >= 75 ? 2 : pct >= 65 ? 3 : pct >= 55 ? 4 : pct >= 50 ? 5 : pct >= 45 ? 6 : 9;
    gradeLetter = `Unit ${unit}`;
    gradeComment = unit <= 2 ? '🌟 Distinction standard! Excellent Grade 7 candidate.' : unit <= 5 ? '👍 Credit pass. A few syllabus leak topics to revise.' : '⚠️ Below pass mark. Practice step-by-step arithmetic.';
  } else if (['6042', '9164', '9187'].includes(mock.syllabus)) {
    // A-Level A to U
    gradeLetter = pct >= 75 ? 'A (5 Pts)' : pct >= 65 ? 'B (4 Pts)' : pct >= 55 ? 'C (3 Pts)' : pct >= 45 ? 'D (2 Pts)' : pct >= 40 ? 'E (1 Pt)' : 'U (0 Pts)';
    gradeComment = pct >= 75 ? '🎓 A-Level Grade A standard! Crisp rigorous working.' : pct >= 55 ? '📚 Solid pass mark. Polish calculus & trig substitutions.' : '⚠️ Needs more drill on standard A-Level methods.';
  } else {
    // O-Level A to U
    gradeLetter = pct >= 75 ? 'A' : pct >= 65 ? 'B' : pct >= 50 ? 'C' : pct >= 40 ? 'E' : 'U';
    gradeComment = pct >= 75 ? '🌟 Grade A standard! Full method marks secured.' : pct >= 50 ? '✅ Grade C (Credit pass). Good foundation — aim for Grade A next!' : '⚠️ Below Grade C. Review the weak topics below.';
  }

  const lines = marked.slice(0, 15).map((a, idx) => {
    const symbol = a.ok ? '✅' : (a.skip ? '⏭️' : '❌');
    const note = a.ok ? '' : ` → Expected: _${String(a.correct).slice(0, 35)}_`;
    return `${idx + 1}. ${symbol} ${a.topic}${note}`;
  });

  const report = `📋 *ACADEX SENIOR EXAMINER MARK SLIP*
━━━━━━━━━━━━━━━━━━━━
🎓 *Exam:* ${mock.title}
📊 *Score:* ${right} / ${total} (${pct}%)
🏆 *ZIMSEC Grade:* *${gradeLetter}*
📝 *Examiner Note:* ${gradeComment}

*Question Breakdown:*
${lines.join('\n')}

🎯 *Syllabus Leak Topics to Revise:*
${uniqueWeak.length ? uniqueWeak.slice(0, 5).map(t => `• ${t}`).join('\n') : '• None! All tested concepts were solid.'}

📌 _Original ACADEX practice exam aligned with ZIMSEC standards._
Say *MOCK* to take another drill or send any question to get full working!`;

  return {
    score: right,
    total,
    pct,
    gradeLetter,
    weak: uniqueWeak,
    subject: mock.title,
    syllabus: mock.syllabus,
    text: report,
  };
}
