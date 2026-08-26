/** ACADEX ZIMSEC Question Paper Dispatcher — Primary, O-Level & A-Level
 *  Searches, formats, and serves 118+ original practice papers directly into WhatsApp.
 */
import fs from 'fs';
import path from 'path';

export const SYLLABUS_INFO = {
  // Primary (Grade 7)
  '701': { name: 'Grade 7 English Language', level: 'Primary (Grade 7)', calc: false, p1_mins: 90, p2_mins: 90, p1_marks: 40, p2_marks: 40, p1_rules: 'Section A: Comprehension. Section B: Language structures.' },
  '702': { name: 'Grade 7 Mathematics', level: 'Primary (Grade 7)', calc: false, p1_mins: 90, p2_mins: 120, p1_marks: 50, p2_marks: 50, p1_rules: 'No calculator allowed. Show all working.' },
  '703': { name: 'Grade 7 General Paper', level: 'Primary (Grade 7)', calc: false, p1_mins: 90, p2_mins: 90, p1_marks: 50, p2_marks: 50, p1_rules: 'Agriculture, Science & Technology, Social Sciences, Heritage.' },

  // O-Level (Forms 1–4)
  '4004': { name: 'Mathematics', level: 'O-Level (Forms 1–4)', calc: false, p1_mins: 150, p2_mins: 150, p1_marks: 100, p2_marks: 100, p1_rules: 'No calculator allowed.', p2_rules: 'Calculator allowed. Sec A (52) all + Sec B (48) choose 4 of 7.' },
  '5006': { name: 'Combined Science', level: 'O-Level (Forms 1–4)', calc: true, p1_mins: 60, p2_mins: 120, p1_marks: 40, p2_marks: 80, p1_rules: '40 MCQs. Eliminate 2 options first.', p2_rules: '8 structured Bio/Chem/Phys questions, all compulsory.' },
  '1122': { name: 'English Language', level: 'O-Level (Forms 1–4)', calc: false, p1_mins: 90, p2_mins: 120, p1_marks: 50, p2_marks: 50, p1_rules: 'Sec A: 1 Composition 350–450 words (30m). Sec B: Guided writing (20m).', p2_rules: 'Comprehension (20m) + Summary (20m) + Register (10m).' },
  '5008': { name: 'Biology', level: 'O-Level (Forms 1–4)', calc: true, p1_mins: 60, p2_mins: 120, p1_marks: 40, p2_marks: 80, p1_rules: 'Section A compulsory structured theory + Section B essays.' },
  '5070': { name: 'Chemistry', level: 'O-Level (Forms 1–4)', calc: true, p1_mins: 60, p2_mins: 120, p1_marks: 40, p2_marks: 80, p1_rules: 'Show state symbols in chemical equations and step-by-step mole working.' },
  '5054': { name: 'Physics', level: 'O-Level (Forms 1–4)', calc: true, p1_mins: 60, p2_mins: 120, p1_marks: 40, p2_marks: 80, p1_rules: 'Formula → substitution with units → 3 s.f. answer.' },
  '7110': { name: 'Principles of Accounts', level: 'O-Level (Forms 1–4)', calc: true, p1_mins: 60, p2_mins: 120, p1_marks: 40, p2_marks: 100, p1_rules: 'Double entry ledgers, journals, trial balance, income statement, balance sheet.' },
  '7103': { name: 'Commerce', level: 'O-Level (Forms 1–4)', calc: false, p1_mins: 60, p2_mins: 120, p1_marks: 40, p2_marks: 100, p1_rules: 'Trade, Banking, Transport, Insurance, Advertising, Communication.' },
  '2167': { name: 'History', level: 'O-Level (Forms 1–4)', calc: false, p1_mins: 120, p2_mins: 120, p1_marks: 100, p2_marks: 100, p1_rules: 'Zimbabwe Heritage (Mutapa/Rozvi) & Southern Africa.' },
  '2248': { name: 'Geography', level: 'O-Level (Forms 1–4)', calc: true, p1_mins: 120, p2_mins: 120, p1_marks: 100, p2_marks: 100, p1_rules: 'Physical Geography, Weather, Climatology, Geomorphology, Economic Geography.' },
  '4021': { name: 'Computer Science', level: 'O-Level (Forms 1–4)', calc: false, p1_mins: 90, p2_mins: 120, p1_marks: 50, p2_marks: 70, p1_rules: 'Hardware, Binary Logic, Security, Algorithms, Pseudocode.' },

  // A-Level (Forms 5–6)
  '6042': { name: 'Pure Mathematics', level: 'A-Level (Forms 5–6)', calc: true, p1_mins: 180, p2_mins: 180, p1_marks: 100, p2_marks: 100, p1_rules: 'Pure Maths 1: Algebra, Coordinate Geometry, Trigonometry, Calculus.', p2_rules: 'Pure Maths 2: Vectors, Complex Numbers, Differential Equations, Numerical Methods.' },
  '9164': { name: 'Mathematics', level: 'A-Level (Forms 5–6)', calc: true, p1_mins: 180, p2_mins: 180, p1_marks: 100, p2_marks: 100, p1_rules: 'Paper 1: Pure Maths core.', p2_rules: 'Paper 2: Applied Statistics & Mechanics.' },
  '9187': { name: 'Further Mathematics', level: 'A-Level (Forms 5–6)', calc: true, p1_mins: 180, p2_mins: 180, p1_marks: 100, p2_marks: 100, p1_rules: 'Advanced Pure Mathematics & Matrices.', p2_rules: 'Advanced Applied Mathematics.' },
  '6032': { name: 'Physics', level: 'A-Level (Forms 5–6)', calc: true, p1_mins: 75, p2_mins: 135, p1_marks: 40, p2_marks: 100, p1_rules: 'Mechanics, Fields, Waves, Thermal, Nuclear, Capacitance.' },
  '6027': { name: 'Chemistry', level: 'A-Level (Forms 5–6)', calc: true, p1_mins: 75, p2_mins: 135, p1_marks: 40, p2_marks: 100, p1_rules: 'Physical, Inorganic, Organic Chemistry & Equilibria derivations.' },
  '6030': { name: 'Biology', level: 'A-Level (Forms 5–6)', calc: true, p1_mins: 75, p2_mins: 135, p1_marks: 40, p2_marks: 100, p1_rules: 'Cellular physiology, Genetics, Respiration, Photosynthesis, Homeostasis.' },
  '6001': { name: 'Accounting', level: 'A-Level (Forms 5–6)', calc: true, p1_mins: 75, p2_mins: 180, p1_marks: 30, p2_marks: 120, p1_rules: 'Financial Statements, Manufacturing, Partnerships, Costing & Standard Budgeting.' },
  '6073': { name: 'Economics', level: 'A-Level (Forms 5–6)', calc: false, p1_mins: 75, p2_mins: 135, p1_marks: 30, p2_marks: 100, p1_rules: 'Data Response & Macroeconomic Essay Evaluation (AD/AS, Monetary/Fiscal).' },
  '6025': { name: 'Business Studies', level: 'A-Level (Forms 5–6)', calc: false, p1_mins: 75, p2_mins: 135, p1_marks: 40, p2_marks: 100, p1_rules: 'Strategic Management, Ansoff Matrix, Porter 5 Forces, Financial Ratio Analysis.' },
  '6006': { name: 'History', level: 'A-Level (Forms 5–6)', calc: false, p1_mins: 180, p2_mins: 180, p1_marks: 100, p2_marks: 100, p1_rules: 'African & Zimbabwean History (1800–present), Historiography & State Formation.' },
  '6002': { name: 'Geography', level: 'A-Level (Forms 5–6)', calc: true, p1_mins: 180, p2_mins: 180, p1_marks: 100, p2_marks: 100, p1_rules: 'Physical & Human Systems, Hydrology, Geomorphology, Development.' },
};

/** Detect if an incoming message is requesting past papers / question papers */
export function isPaperRequest(text) {
  const tl = String(text || '').toLowerCase().trim();
  if (/^(past\s*papers?|papers?|question\s*papers?|all\s*papers?|exam\s*papers?|paper\s*list|list\s*papers?)$/i.test(tl)) return true;
  if (/^(grade\s*7\s*papers?|primary\s*papers?|o\s*level\s*papers?|a\s*level\s*papers?)$/i.test(tl)) return true;
  if (/^(download|send|get|give\s*me|share)\b/i.test(tl) && /\b(paper|pdf|exam|past|4004|5006|1122|701|702|703|5008|5070|5054|7110|7103|2167|2248|4021|6042|9164|9187|6032|6027|6073|6025|6006|grade\s*7|primary|maths?|science|english|pure\s*maths?|biology|chemistry|physics|accounts?|commerce|history|geography|economics|business|p1|p2)\b/i.test(tl)) return true;
  if (/\b(pdf|past\s*paper|question\s*paper|exam\s*paper)\b/i.test(tl)) return true;
  if (/\b(4004|5006|1122|6042|9164|9187|701|702|703|5008|5070|5054|7110|7103|2167|2248|4021|6032|6027|6073|6025|6006|grade\s*7|primary)\s*(p1|p2|paper\s*[12])\b/i.test(tl)) return true;
  if (/\b(maths?|science|english|pure\s*maths?|further\s*maths?|biology|chemistry|physics|accounts?|commerce|history|geography|economics|business)\s*(paper\s*[12]|p[12])\b/i.test(tl)) return true;
  return false;
}

/** Identify requested syllabus code from user text */
export function pickSyllabusCode(text) {
  const tl = String(text || '').toLowerCase();
  
  // 1. Grade 7 / Primary specifics (Check first if 'grade 7' or 'primary' present)
  if (/grade\s*7|primary/i.test(tl)) {
    if (/english|eng|701/i.test(tl)) return '701';
    if (/general|agri|tech|science|703/i.test(tl)) return '703';
    if (/math|702/i.test(tl)) return '702';
    return '702'; // default grade 7 to maths
  }

  // 2. A-Level specifics (Check if 'a level', 'form 6', or A-Level codes present)
  if (/a[\s-]*level|form\s*[56]|advanced/i.test(tl)) {
    if (/phys|6032/i.test(tl)) return '6032';
    if (/chem|6027/i.test(tl)) return '6027';
    if (/bio|6030/i.test(tl)) return '6030';
    if (/econ|6073/i.test(tl)) return '6073';
    if (/business|6025/i.test(tl)) return '6025';
    if (/hist|6006/i.test(tl)) return '6006';
    if (/geog|6002/i.test(tl)) return '6002';
    if (/acc|6001/i.test(tl)) return '6001';
    if (/comp|6021/i.test(tl)) return '6021';
    if (/further|9187/i.test(tl)) return '9187';
    if (/pure|6042/i.test(tl)) return '6042';
    if (/math|9164/i.test(tl)) return '6042';
    return '6042';
  }

  // Direct A-Level subject codes & names
  if (/\b(6032|6027|6030|6001|6073|6025|6006|6002|6021|6039|6019)\b/.test(tl)) {
    const m = tl.match(/\b(6032|6027|6030|6001|6073|6025|6006|6002|6021|6039|6019)\b/);
    if (m) return m[1];
  }
  if (/economics/i.test(tl)) return '6073';
  if (/business\s*studies/i.test(tl)) return '6025';
  if (/further\s*math/i.test(tl) || /\b9187\b/.test(tl)) return '9187';
  if (/pure\s*math/i.test(tl) || /\b6042\b/.test(tl)) return '6042';
  if (/\b9164\b/.test(tl)) return '9164';

  // 3. O-Level & Primary specifics
  if (/\b(general\s*paper|703)\b/i.test(tl)) return '703';
  if (/\b(biology|5008)\b/i.test(tl)) return '5008';
  if (/\b(chemistry|5070)\b/i.test(tl)) return '5070';
  if (/\b(physics|5054)\b/i.test(tl)) return '5054';
  if (/\b(accounts?|accounting|7110)\b/i.test(tl)) return '7110';
  if (/\b(commerce|7103)\b/i.test(tl)) return '7103';
  if (/\b(history|2167)\b/i.test(tl)) return '2167';
  if (/\b(geography|2248)\b/i.test(tl)) return '2248';
  if (/\b(computer\s*science|4021)\b/i.test(tl)) return '4021';
  if (/\b(science|5006|combined)\b/i.test(tl)) return '5006';
  if (/\b(english|1122)\b/i.test(tl)) return '1122';
  if (/\b(701)\b/i.test(tl)) return '701';
  if (/\b(702)\b/i.test(tl)) return '702';

  // General default to 4004 Maths
  if (/\b(maths?|4004|algebra|geometry|trigonometry)\b/i.test(tl)) return '4004';
  return '4004';
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
  const mins = paperNo === 1 ? (info.p1_mins || 120) : (info.p2_mins || 120);
  const marks = paperNo === 1 ? (info.p1_marks || 100) : (info.p2_marks || 100);
  const rules = paperNo === 1 ? (info.p1_rules || (info.calc ? 'Calculator allowed.' : 'No calculator allowed.')) : (info.p2_rules || 'Calculator allowed.');

  return `🇿🇼 *ZIMSEC ${info.level} PRACTICE PAPER*
📖 *${info.name} (${code}/${paperNo})*
📅 Session: ${session} ${year}
⏱ Time: ${Math.floor(mins / 60)}h ${mins % 60 ? (mins % 60) + 'm' : ''} | 📝 Marks: ${marks}
📌 ${rules}

✍️ *Examiner Instructions:*
• Show all step-by-step working on your script.
• Method marks (M) are awarded for clear formulas and substitutions.
• When finished, snap a photo of your working or type your answers here for instant marking!`;
}

/** Generate an organized menu of all available papers across Primary, O-Level & A-Level */
export function getAvailablePapersMenu(filter = '') {
  const f = String(filter || '').toLowerCase();
  
  if (f.includes('grade 7') || f.includes('primary') || f.includes('701') || f.includes('702') || f.includes('703')) {
    return `📚 *ACADEX GRADE 7 (PRIMARY) PAST PAPERS*

• *Grade 7 Maths (702/1 & 702/2)* → \`Send 2024 Grade 7 P1\` / \`Send 2024 Grade 7 P2\`
• *Grade 7 English (701/1)* → \`Send 2024 Grade 7 English P1\`
• *Grade 7 General Paper (703/1)* → \`Send 2024 General Paper P1\`
• (Sessions available: 2020 to 2024)

💡 *How to download:* Reply with any command above (e.g. *Send 2024 Grade 7 P1*) to receive the PDF instantly!`;
  }

  if (f.includes('a level') || f.includes('a-level') || f.includes('form 6') || f.includes('6042') || f.includes('6032') || f.includes('6027') || f.includes('6073') || f.includes('6025') || f.includes('6006')) {
    return `📚 *ACADEX A-LEVEL (FORMS 5–6) PAST PAPERS*

*Sciences & Mathematics:*
• *Pure Maths (6042/1 & P2)* → \`Send 2024 Pure Maths P1\` / \`Send 2024 Pure Maths P2\`
• *Mathematics (9164/1 & P2)* → \`Send 2024 Maths 9164 P1\`
• *Further Maths (9187/1 & P2)* → \`Send 2024 Further Maths P1\`
• *Physics (6032/2)* → \`Send 2024 A Level Physics P2\`
• *Chemistry (6027/2)* → \`Send 2024 A Level Chemistry P2\`

*Commercials & Humanities:*
• *Economics (6073/2)* → \`Send 2024 Economics P2\`
• *Business Studies (6025/2)* → \`Send 2024 Business Studies P2\`
• *History (6006/1)* → \`Send 2024 A Level History P1\`

💡 *How to download:* Reply with e.g. *Send 2024 Pure Maths P1* or *Send 2024 Economics P2*!`;
  }

  // General Master Menu covering all 3 tiers
  return `📚 *ACADEX ZIMSEC PRACTICE PAPERS (118+ PAPERS AVAILABLE)*

🌟 *1. PRIMARY (GRADE 7)*
• *Grade 7 Maths (702/1 & P2)* → \`Send 2024 Grade 7 P1\`
• *Grade 7 English (701/1)* → \`Send 2024 Grade 7 English P1\`
• *Grade 7 General Paper (703/1)* → \`Send 2024 General Paper P1\`

🌟 *2. O-LEVEL (FORMS 1–4)*
• *Maths (4004/1 & P2)* → \`Send 2024 Maths P1\` / \`Send 2024 Maths P2\`
• *Combined Science (5006/1 & P2)* → \`Send 2024 Science P1\` / \`Send 2024 Science P2\`
• *English Language (1122/1 & P2)* → \`Send 2024 English P1\` / \`Send 2024 English P2\`
• *Biology (5008/2)* → \`Send 2024 Biology P2\`
• *Chemistry (5070/2)* → \`Send 2024 Chemistry P2\`
• *Physics (5054/2)* → \`Send 2024 Physics P2\`
• *Accounts (7110/2)* → \`Send 2024 Accounts P2\`
• *Commerce (7103/2)* → \`Send 2024 Commerce P2\`
• *History (2167/1)* → \`Send 2024 History P1\`
• *Geography (2248/1)* → \`Send 2024 Geography P1\`
• *Computer Science (4021/1)* → \`Send 2024 Computer Science P1\`

🌟 *3. A-LEVEL (FORMS 5–6)*
• *Pure Maths (6042/1 & P2)* → \`Send 2024 Pure Maths P1\`
• *Mathematics (9164/1 & P2)* → \`Send 2024 Maths 9164 P1\`
• *Physics (6032/2)* → \`Send 2024 A Level Physics P2\`
• *Chemistry (6027/2)* → \`Send 2024 A Level Chemistry P2\`
• *Economics (6073/2)* → \`Send 2024 Economics P2\`
• *Business Studies (6025/2)* → \`Send 2024 Business Studies P2\`
• *History (6006/1)* → \`Send 2024 A Level History P1\`

📄 *To get any paper immediately:*
Type \`Send [Year] [Subject] P[1 or 2]\` (e.g. *Send 2024 Biology P2* or *Send 2024 Economics P2*).

⏱️ *Want to take a timed exam?*
Type \`Start Mock Maths\` or \`Mock Science\` or \`Mock Grade 7\`!`;
}
