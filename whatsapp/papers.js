/** ACADEX ZIMSEC Question Paper Dispatcher — Primary, O-Level & A-Level
 *  Searches, formats, and serves 88 original practice papers directly into WhatsApp.
 */
import fs from 'fs';
import path from 'path';

export const SYLLABUS_INFO = {
  // Primary (Grade 7)
  '702': { name: 'Grade 7 Mathematics', level: 'Primary (Grade 7)', calc: false, p1_mins: 90, p2_mins: 120, p1_marks: 50, p2_marks: 50 },
  // O-Level (Forms 1-4)
  '4004': { name: 'Mathematics', level: 'O-Level (Forms 1–4)', calc: false, p1_mins: 150, p2_mins: 150, p1_marks: 100, p2_marks: 100, p1_rules: 'No calculator allowed.', p2_rules: 'Calculator allowed. Sec A (52) all + Sec B (48) choose 4 of 7.' },
  '5006': { name: 'Combined Science', level: 'O-Level (Forms 1–4)', calc: true, p1_mins: 60, p2_mins: 120, p1_marks: 40, p2_marks: 80, p1_rules: '40 MCQs. Eliminate 2 options first.', p2_rules: '8 structured Bio/Chem/Phys questions, all compulsory.' },
  '1122': { name: 'English Language', level: 'O-Level (Forms 1–4)', calc: false, p1_mins: 90, p2_mins: 120, p1_marks: 50, p2_marks: 50, p1_rules: 'Sec A: 1 Composition 350–450 words (30m). Sec B: Guided writing (20m).', p2_rules: 'Comprehension (20m) + Summary (20m) + Register (10m).' },
  // A-Level (Forms 5-6)
  '6042': { name: 'Pure Mathematics', level: 'A-Level (Forms 5–6)', calc: true, p1_mins: 180, p2_mins: 180, p1_marks: 100, p2_marks: 100, p1_rules: 'Pure Maths 1: Algebra, Coordinate Geometry, Trigonometry, Calculus.', p2_rules: 'Pure Maths 2: Vectors, Complex Numbers, Differential Equations, Mechanics/Stats.' },
  '9164': { name: 'Mathematics', level: 'A-Level (Forms 5–6)', calc: true, p1_mins: 180, p2_mins: 180, p1_marks: 100, p2_marks: 100, p1_rules: 'Paper 1: Pure Maths core.', p2_rules: 'Paper 2: Applied Statistics & Mechanics.' },
  '9187': { name: 'Further Mathematics', level: 'A-Level (Forms 5–6)', calc: true, p1_mins: 180, p2_mins: 180, p1_marks: 100, p2_marks: 100, p1_rules: 'Advanced Pure Mathematics & Matrices.', p2_rules: 'Advanced Applied Mathematics.' },
};

/** Detect if an incoming message is requesting past papers / question papers */
export function isPaperRequest(text) {
  const tl = String(text || '').toLowerCase().trim();
  if (/^(past\s*papers?|papers?|question\s*papers?|all\s*papers?|exam\s*papers?|paper\s*list|list\s*papers?)$/i.test(tl)) return true;
  if (/^(grade\s*7\s*papers?|primary\s*papers?|o\s*level\s*papers?|a\s*level\s*papers?)$/i.test(tl)) return true;
  if (/^(download|send|get|give\s*me|share)\b/i.test(tl) && /\b(paper|pdf|exam|past|4004|5006|1122|702|6042|9164|9187|grade\s*7|primary|maths?|science|english|pure\s*maths?|p1|p2)\b/i.test(tl)) return true;
  if (/\b(pdf|past\s*paper|question\s*paper|exam\s*paper)\b/i.test(tl)) return true;
  if (/\b(4004|5006|1122|6042|9164|9187|702|grade\s*7|primary)\s*(p1|p2|paper\s*[12])\b/i.test(tl)) return true;
  if (/\b(maths?|science|english|pure\s*maths?|further\s*maths?)\s*(paper\s*[12]|p[12])\b/i.test(tl)) return true;
  return false;
}

/** Identify requested syllabus code from user text */
export function pickSyllabusCode(text) {
  const tl = String(text || '').toLowerCase();
  if (/\b(english|1122|composition|comprehension|summary)\b/.test(tl)) return '1122';
  if (/\b(science|5006|combined|physics|chemistry|biology)\b/.test(tl)) return '5006';
  if (/\b(grade\s*7|702|primary)\b/.test(tl)) return '702';
  if (/\b(further\s*maths?|9187)\b/.test(tl)) return '9187';
  if (/\b(pure\s*maths?|6042)\b/.test(tl)) return '6042';
  if (/\b(a\s*level\s*maths?|9164)\b/.test(tl)) return '9164';
  if (/\b(maths?|4004|algebra|geometry|trigonometry)\b/.test(tl)) return '4004';
  return '4004'; // default to standard Maths
}

/** Parse full paper request details from user text */
export function parsePaperDetails(text) {
  const tl = String(text || '').toLowerCase();
  const yearMatch = tl.match(/20\d{2}/);
  const year = yearMatch ? yearMatch[0] : '2024';
  const paperNo = (tl.includes('paper 2') || /\bp2\b/i.test(tl) || /\b2\b/.test(tl.replace(/20\d{2}/g, ''))) ? 2 : 1;
  const session = tl.includes('june') ? 'June' : 'November';
  const code = pickSyllabusCode(tl);
  const fname = `${year}_${session}_${code}_Paper${paperNo}.pdf`;
  const info = SYLLABUS_INFO[code] || { name: code, level: 'ZIMSEC' };

  return {
    year,
    session,
    code,
    paperNo,
    fname,
    title: `${year} ${session} ${info.name} (${code}/${paperNo})`,
    level: info.level,
    info,
  };
}

/** Find PDF file in workspace root */
export function findPdfFile(workspaceRoot, filename) {
  const fname = path.basename(filename || '');
  if (!/^[A-Za-z0-9_.-]+\.pdf$/.test(fname)) return null;
  const fp = path.join(workspaceRoot, 'pdfs', fname);
  return fs.existsSync(fp) ? fp : null;
}

/** Format examination cover sheet / caption */
export function formatPaperCaption(details) {
  const { year, session, code, paperNo, info } = details;
  const mins = paperNo === 1 ? (info.p1_mins || 150) : (info.p2_mins || 150);
  const marks = paperNo === 1 ? (info.p1_marks || 100) : (info.p2_marks || 100);
  const rules = paperNo === 1 ? (info.p1_rules || (info.calc ? 'Calculator allowed.' : 'No calculator allowed.')) : (info.p2_rules || 'Calculator allowed.');

  return `🇿🇼 *ZIMSEC ${info.level} PRACTICE PAPER*
📖 *${info.name} (${code}/${paperNo})*
📅 Session: ${session} ${year}
⏱ Time: ${Math.floor(mins / 60)}h ${mins % 60 ? (mins % 60) + 'm' : ''} | 📝 Marks: ${marks}
📌 ${rules}

✍️ *Examiner Instructions:*
• Show all step-by-step working on your paper.
• Method marks are awarded for clear formulas and substitutions.
• When finished, snap a photo of your working or type your answers here for instant marking!`;
}

/** Generate an organized menu of all available papers across Primary, O-Level & A-Level */
export function getAvailablePapersMenu(filter = '') {
  const f = String(filter || '').toLowerCase();
  
  if (f.includes('grade 7') || f.includes('primary') || f.includes('702')) {
    return `📚 *ACADEX GRADE 7 (PRIMARY) PAST PAPERS*

• *2024 November Grade 7 Maths P1* → Send \`Send 2024 Grade 7 P1\`
• *2024 November Grade 7 Maths P2* → Send \`Send 2024 Grade 7 P2\`
• *2023 November Grade 7 Maths P1* → Send \`Send 2023 Grade 7 P1\`
• *2023 November Grade 7 Maths P2* → Send \`Send 2023 Grade 7 P2\`
• *2022 November Grade 7 Maths P1* → Send \`Send 2022 Grade 7 P1\`
• *2021 November Grade 7 Maths P1* → Send \`Send 2021 Grade 7 P1\`
• *2020 November Grade 7 Maths P1* → Send \`Send 2020 Grade 7 P1\`

💡 *How to download:* Reply with any line above (e.g. *Send 2024 Grade 7 P1*) to receive the PDF instantly!`;
  }

  if (f.includes('a level') || f.includes('a-level') || f.includes('form 6') || f.includes('6042') || f.includes('9164') || f.includes('9187')) {
    return `📚 *ACADEX A-LEVEL (FORMS 5–6) PAST PAPERS*

*Pure Mathematics (6042):*
• 2024 Nov Pure Maths P1 & P2 → \`Send 2024 Pure Maths P1\` / \`Send 2024 Pure Maths P2\`
• 2024 June Pure Maths P1 & P2 → \`Send 2024 June Pure Maths P1\`
• 2023 Nov Pure Maths P1 & P2 → \`Send 2023 Pure Maths P1\`
• 2022 Nov Pure Maths P1 & P2 → \`Send 2022 Pure Maths P1\`

*Mathematics & Further Maths (9164 / 9187):*
• 2024 Nov Maths 9164 P1 & P2 → \`Send 2024 Maths 9164 P1\`
• 2024 Nov Further Maths 9187 P1 & P2 → \`Send 2024 Further Maths P1\`
• 2023 Nov Maths 9164 P1 & P2 → \`Send 2023 Maths 9164 P1\`
• 2022 Nov Maths 9164 P1 & P2 → \`Send 2022 Maths 9164 P1\`

💡 *How to download:* Reply with e.g. *Send 2024 Pure Maths P1* to get the PDF!`;
  }

  // General Master Menu covering all 3 tiers
  return `📚 *ACADEX ZIMSEC PRACTICE PAPERS (88 PAPERS AVAILABLE)*

🌟 *1. PRIMARY (GRADE 7)*
• *Grade 7 Maths (702/1 & 702/2)* (2020–2024)
  👉 Trigger: \`Send 2024 Grade 7 P1\` or \`Grade 7 Papers\`

🌟 *2. O-LEVEL (FORMS 1–4)*
• *Maths (4004/1 & 4004/2)* (2018–2024 June & Nov)
  👉 Trigger: \`Send 2024 Maths P1\` or \`Send 2024 Maths P2\`
• *Combined Science (5006/1 & 5006/2)* (2018–2024 June & Nov)
  👉 Trigger: \`Send 2024 Science P1\` or \`Send 2024 Science P2\`
• *English Language (1122/1 & 1122/2)* (2018–2024 June & Nov)
  👉 Trigger: \`Send 2024 English P1\` or \`Send 2024 English P2\`

🌟 *3. A-LEVEL (FORMS 5–6)*
• *Pure Maths (6042/1 & 6042/2)* (2022–2024)
  👉 Trigger: \`Send 2024 Pure Maths P1\`
• *Mathematics (9164/1 & 9164/2)* (2022–2024)
  👉 Trigger: \`Send 2024 Maths 9164 P1\`
• *Further Maths (9187/1 & 9187/2)* (2022–2024)
  👉 Trigger: \`Send 2024 Further Maths P1\`

📄 *To get any paper immediately:*
Type \`Send [Year] [Subject] P[1 or 2]\` (e.g. *Send 2024 Maths P1* or *Send 2023 Science P2*).

⏱️ *Want to take a live timed exam?*
Type \`Start Mock Maths\` or \`Mock Science\` or \`Mock Grade 7\`!`;
}
