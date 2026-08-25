/** ACADEX ZIMSEC Master Syllabus & Senior National Examiner Marking Matrix
 *  Covers Primary (Grade 1–7), O-Level (Forms 1–4) & A-Level (Forms 5–6).
 *  Strictly adheres to ZIMSEC Heritage-Based Education 5.0 Standards.
 */

export const SYLLABUS_TREE = {
  primary: {
    title: 'Primary School (Grades 1–7)',
    subjects: {
      '702': { name: 'Mathematics', papers: ['Paper 1 (MCQ & Short)', 'Paper 2 (Problem Solving & Units)'], units: 'Units 1–9 (Unit 1 = Distinction)' },
      '701': { name: 'English Language', papers: ['Paper 1 (Comprehension & Language)', 'Paper 2 (Composition & Guided Writing)'] },
      '703': { name: 'General Paper', papers: ['Paper 1 (Science, Tech & Agriculture)', 'Paper 2 (Social Sciences & Heritage)'] },
      '704': { name: 'Indigenous Languages', papers: ['Shona (ChiShona)', 'Ndebele (isiNdebele)'] },
    },
    grading: 'Grade 7 uses Units 1 to 9 per subject. Best aggregate is 4 (or 5), with Unit 1 being the highest distinction and Unit 9 ungraded.',
  },
  olevel: {
    title: 'O-Level (Forms 1–4)',
    subjects: {
      '4004': { name: 'Mathematics', papers: ['Paper 1 (100m, 2h30, NO Calculator)', 'Paper 2 (100m, 2h30, Calculator Allowed, Sec A 52 compulsory + Sec B choose 4 of 7)'] },
      '5006': { name: 'Combined Science', papers: ['Paper 1 (40 MCQ, 1h)', 'Paper 2 (80m, 2h, 8 structured Bio/Chem/Phys questions, all compulsory)'] },
      '1122': { name: 'English Language', papers: ['Paper 1 (50m, 1h30, 1 Composition 350–450w + Guided Writing)', 'Paper 2 (50m, 2h, Comprehension 20m + Summary 20m + Register 10m)'] },
      '5008': { name: 'Biology', papers: ['Paper 1 (MCQ)', 'Paper 2 (Theory)', 'Paper 3 (Practical/Alternative)'] },
      '5070': { name: 'Chemistry', papers: ['Paper 1 (MCQ)', 'Paper 2 (Theory)', 'Paper 3 (Practical/Alternative)'] },
      '5054': { name: 'Physics', papers: ['Paper 1 (MCQ)', 'Paper 2 (Theory)', 'Paper 3 (Practical/Alternative)'] },
      '4021': { name: 'Computer Science', papers: ['Paper 1 (Theory)', 'Paper 2 (Programming & Algorithms)'] },
      '4033': { name: 'Additional Mathematics', papers: ['Paper 1 (Pure Core)', 'Paper 2 (Calculus & Mechanics)'] },
      '7110': { name: 'Principles of Accounts', papers: ['Paper 1 (MCQ)', 'Paper 2 (Ledgers, Journals, Balance Sheets)'] },
      '7103': { name: 'Commerce', papers: ['Paper 1 (MCQ)', 'Paper 2 (Structured Trade, Banking, Insurance, Transport)'] },
      '2167': { name: 'History', papers: ['Paper 1 (Zimbabwean & Regional Heritage)', 'Paper 2 (World Affairs)'] },
      '2248': { name: 'Geography', papers: ['Paper 1 (Mapwork & Physical)', 'Paper 2 (Human & Economic)'] },
      '3159': { name: 'Shona', papers: ['Paper 1 (Rondedzero & Nzwisiso)', 'Paper 2 (Mhenenguro & Tsika)'] },
      '3155': { name: 'Ndebele', papers: ['Paper 1 (Indatshana & Ukuzwisisa)', 'Paper 2 (Uhlahlelo & Isiko)'] },
    },
    grading: 'O-Level grades are strictly A, B, C, D, E, U (Ungraded). No Distinction, no A*. Five subjects at Grade C or better (including English and Maths) is standard requirement for A-Level and tertiary entry.',
  },
  alevel: {
    title: 'A-Level (Forms 5–6)',
    subjects: {
      '6042': { name: 'Pure Mathematics', papers: ['Paper 1 (Algebra, Coord Geometry, Trig, Differentiation, Integration)', 'Paper 2 (Vectors, Complex Numbers, Differential Equations, Numerical Methods)'] },
      '9164': { name: 'Mathematics', papers: ['Paper 1 (Pure Mathematics Core)', 'Paper 2 (Applied Statistics & Mechanics)'] },
      '9187': { name: 'Further Mathematics', papers: ['Paper 1 (Advanced Pure & Matrices)', 'Paper 2 (Advanced Applied & Probability)'] },
      '6032': { name: 'Physics', papers: ['Paper 1 (Multiple Choice)', 'Paper 2 (Structured Theory)', 'Paper 3 (Advanced Practical)'] },
      '6027': { name: 'Chemistry', papers: ['Paper 1 (Multiple Choice)', 'Paper 2 (Structured Theory)', 'Paper 3 (Advanced Practical)'] },
      '6030': { name: 'Biology', papers: ['Paper 1 (Multiple Choice)', 'Paper 2 (Structured Theory)', 'Paper 3 (Advanced Practical)'] },
      '6021': { name: 'Computer Science', papers: ['Paper 1 (Theory & Architectures)', 'Paper 2 (Data Structures & OOP)'] },
      '6001': { name: 'Accounting', papers: ['Paper 1 (Financial Accounting)', 'Paper 2 (Cost & Management Accounting)'] },
      '6073': { name: 'Economics', papers: ['Paper 1 (Microeconomics)', 'Paper 2 (Macroeconomics & International Trade)'] },
      '6025': { name: 'Business Studies', papers: ['Paper 1 (Short Answer & Data Response)', 'Paper 2 (Case Study & Essays)'] },
      '6002': { name: 'Geography', papers: ['Paper 1 (Physical Geography)', 'Paper 2 (Human Geography)'] },
      '6006': { name: 'History', papers: ['Paper 1 (African & Zimbabwean History)', 'Paper 2 (European & World History)'] },
      '6039': { name: 'Literature in English', papers: ['Paper 1 (Drama & Shakespeare)', 'Paper 2 (Prose & Poetry)'] },
      '6019': { name: 'Family & Religious Studies', papers: ['Paper 1 (Indigenous Religion & Heritage)', 'Paper 2 (Christianity, Islam & Contemporary Issues)'] },
    },
    grading: 'A-Level grades are A, B, C, D, E, O (Subsidiary Pass), and U. Points allocation: A=5, B=4, C=3, D=2, E=1, O=0, U=0. Maximum is 15 points across 3 principal subjects.',
  },
};

/** Senior National Examiner Command Words & Rubrics */
export function commandWord(text) {
  const t = ' ' + String(text || '').toLowerCase() + ' ';
  const rules = [
    ['show that', 'SHOW THAT / PROVE: Start strictly from given LHS/data and deduce RHS. Do NOT assume the conclusion or work backwards. Step-by-step working is mandatory — method marks (M) awarded even if minor calculation slips.'],
    ['prove', 'PROVE: Rigorous algebraic or geometric reasoning with explicit axioms/theorems cited.'],
    ['explain', 'EXPLAIN: Give linked cause-and-effect reasoning. Use connective words: "because", "as a result", "therefore", "leading to". A one-word "state" scores 0 on an explain.'],
    ['describe', 'DESCRIBE: Detail what happens, what it looks like, or step-by-step chronological process. No "why" or "because" unless explicitly asked.'],
    ['suggest', 'SUGGEST: Propose a plausible, sensible reason, hypothesis, or practical solution based on principles. 1 valid idea per mark.'],
    ['calculate', 'CALCULATE: Formula → Substitution with correct units → Working steps → Final value with correct unit to 3 significant figures. No calculator on 4004/1!'],
    ['determine', 'DETERMINE: Obtain by calculation or deduction from graph/data with full working shown.'],
    ['evaluate', 'EVALUATE: Balanced analysis — examine arguments for and against, then give a reasoned final judgment tied to the evidence/data.'],
    ['discuss', 'DISCUSS: Multi-perspective analysis covering advantages/disadvantages or differing historical/economic viewpoints.'],
    ['to what extent', 'TO WHAT EXTENT: Level 1 (isolated points), Level 2 (one-sided explanation), Level 3 (two-sided balanced analysis), Level 4 (supported historical/economic judgment).'],
    ['compare', 'COMPARE: Address BOTH similarities AND differences point-by-point unless instructed otherwise.'],
    ['differentiate', 'DIFFERENTIATE / DISTINGUISH: State clear contrasting points of difference side-by-side.'],
    ['outline', 'OUTLINE: Concise summary of key principles in logical sequence without unnecessary story.'],
    ['state', 'STATE / NAME / GIVE / LIST: 1 short, precise fact per mark. No explanation needed.'],
    ['give', 'GIVE / NAME / LIST: Concise fact or structure name.'],
    ['name', 'NAME / IDENTIFY: Scientific/technical term or structure with correct recognizable spelling.'],
    ['define', 'DEFINE: Formal textbook definition stating core meaning + essential distinguishing feature.'],
    ['solve', 'SOLVE: Algebraic steps visible on page. Clearly box the final value. Check solutions if quadratic.'],
    ['factorise', 'FACTORISE: Extract common factors first, then split middle term or difference of two squares. "Completely" means no common terms inside brackets.'],
    ['expand', 'EXPAND: Distribute terms systematically (FOIL) and collect like terms. Show at least one intermediate step.'],
    ['sketch', 'SKETCH: Draw clear shape with labeled key features (x-intercepts, y-intercept, turning points, asymptotes, coordinates). Does not need graph paper scale unless "draw".'],
    ['draw', 'DRAW: Use ruler and pencil. Axes labeled with quantity/unit, uniform scale, accurately plotted points, and line of best fit.'],
    ['complete', 'COMPLETE: Fill in missing cells or lines directly. Do not redraw the entire table.'],
    ['use the', 'USE THE graph/data/passage: Marks are awarded for extracting and citing that specific evidence, not general recall.'],
  ];

  for (const [k, v] of rules) {
    if (t.includes(' ' + k + ' ') || t.includes(k + ' ')) return v;
  }
  return 'ZIMSEC Marking Rule: Write as the examiner expects — formula, substitution, working, correct units, 1 distinct point per mark.';
}

export const MASTER_PAPER_RULES = `
🇿🇼 ZIMSEC NATIONAL EXAM RULES (HERITAGE-BASED EDUCATION 5.0)

1. GRADING STANDARDS:
- Grade 7 (Primary): Units 1 to 9 (Unit 1 = Distinction, 2 = High Credit, 3-5 = Credit, 6 = Pass, 7-9 = Ungraded). Aggregate 4–36.
- O-Level (Forms 1–4): Grades A, B, C, D, E, U (Ungraded). NO Distinction, NO A*. Grade C is standard credit/pass for A-Level entry. Thresholds adjust per session.
- A-Level (Forms 5–6): Grades A, B, C, D, E, O (Subsidiary), U. Points: A=5, B=4, C=3, D=2, E=1, O=0, U=0 (15 points max).

2. KEY SYLLABUS SPECIFICATIONS:
- Maths 4004/1: 30 short questions, 100 marks, 2h30, STRICTLY NO CALCULATOR. Method marks (M) + Accuracy marks (A).
- Maths 4004/2: 2h30, calculator allowed. Sec A (52 marks) all compulsory. Sec B (48 marks) choose 4 of 7 (12 marks each).
- Combined Science 5006/1: 40 MCQs, 1 hour. Eliminate 2 options first.
- Combined Science 5006/2: 8 structured Bio/Chem/Phys questions, 80 marks, 2 hours, ALL compulsory.
- English 1122/1: 1h30, 50 marks. Sec A: 1 composition 350–450 words (30m). Sec B: Guided writing (20m, hit every bullet point).
- English 1122/2: 2 hours, 50 marks. Comprehension (20m) + Summary (20m, strict word count in own words) + Register (10m).
- Pure Maths 6042: 3 hours, 100 marks each. Rigorous proofs, calculus, coordinate geometry, vectors, differential equations.

3. EXAMINER COMMAND WORD ENFORCEMENT:
- "Show that": Must start from given and deduce required result. Do NOT assume the answer.
- "State/Name": 1 fact, no explanation.
- "Explain": Linked cause and effect using "because/therefore".
- "Describe": Step-by-step sequence without "why".
`;

/** Explains ZIMSEC exam structures and syllabus requirements */
export function zimsecExplain(text) {
  const t = String(text || '').toLowerCase();
  const about = /zimsec|o-?level|a-?level|grade\s*7|primary|grading|grades?|symbols?|distinction|a\*|points?|command\s*words?|4004|5006|1122|6042|702|9164|9187|paper\s*[12]/.test(t);
  const asking = /what (are|is)|how (does|do|is|are|long|many)|tell me|explain|grading|symbols?|distinction|a\*|points?|pass|structure|set the paper|command words?/.test(t)
    || /^(grades?|zimsec|zimsec grades?|command words?|a level points|grade 7 units)$/.test(t.trim());

  if (!about && !asking) return null;
  if (/=/.test(t) || /\b(2x|photosynth|pythag|bearing|gradient)\b/.test(t)) return null;

  if (/grade\s*7|primary/i.test(t) && /\b(grades?|grading|symbols?|units?|how\s+are|how\s+do|pass\s*mark|explain\s+units?)\b/i.test(t)) {
    return {
      title: 'ZIMSEC Grade 7 Grading System',
      answer: `Grade 7 examination results are reported in Units 1 to 9 per subject:
• Unit 1: Distinction (Highest possible mark)
• Unit 2: High Credit
• Unit 3–5: Credit Pass
• Unit 6: Pass
• Unit 7–9: Ungraded / Unsatisfactory

The overall result is the Aggregate of the 4 or 5 subjects. A best aggregate score is 4 Units (four Unit 1s).`,
    };
  }

  if (/\b(a\s*level|points?|form\s*6)\b/i.test(t) && /\b(grades?|grading|symbols?|points?|how\s+are|how\s+many|calculate\s+points?)\b/i.test(t)) {
    return {
      title: 'ZIMSEC A-Level Grading & Points System',
      answer: `A-Level results (Forms 5–6) use the international letter grades and point allocations:
• Grade A = 5 Points
• Grade B = 4 Points
• Grade C = 3 Points
• Grade D = 2 Points
• Grade E = 1 Point
• Grade O = Subsidiary Pass (0 Points)
• Grade U = Ungraded (0 Points)

Maximum total for 3 principal subjects is 15 Points (3 As). Medicine, Law, Actuarial Science, and Engineering programs at UZ, NUST, and MSU typically demand 14–15 points.`,
    };
  }

  if (/\b(distinction|a\*|grading|grades?|symbols?|what is a pass|is [cde] a pass|o\s*level\s+grades?)\b/i.test(t)) {
    return {
      title: 'ZIMSEC O-Level Grading System',
      answer: `ZIMSEC O-Level grades are strictly: A, B, C, D, E, and U (Ungraded).
• Grade A: 75%+ Distinction level performance
• Grade B: 65–74% Merit level
• Grade C: 50–64% Standard Credit Pass (required for A-Level & College entry)
• Grade D & E: Below credit
• Grade U: Ungraded

📌 Note: There is NO "A*" and NO "Distinction" symbol on the official ZIMSEC O-Level certificate. Five subjects with Grade C or better (including English Language) constitutes a full O-Level certificate.`,
    };
  }

  if (/4004|math/.test(t) && /paper|calculator|how long|structure|marks/.test(t)) {
    return {
      title: 'ZIMSEC Maths 4004 Paper Structure',
      answer: `• Paper 1: 30 short questions, 100 marks, 2 hours 30 minutes, STRICTLY NO CALCULATOR. Working on the page is compulsory (answer only scores 0 on method questions).
• Paper 2: 2 hours 30 minutes, calculator allowed. Section A (52 marks) all compulsory. Section B (48 marks) choose 4 of 7 questions (12 marks each).`,
    };
  }

  if (/5006|combined science|science paper/.test(t)) {
    return {
      title: 'ZIMSEC Combined Science 5006 Paper Structure',
      answer: `• Paper 1: 40 multiple-choice questions, 1 hour, 40 marks. Focus on scientific units, powers of 10, and eliminate 2 options first.
• Paper 2: 8 structured questions across Biology, Chemistry, and Physics, 80 marks, 2 hours, ALL compulsory. Emphasizes word equations, experimental tests (pop, relight, limewater, iodine), and labelled biological/apparatus diagrams.`,
    };
  }

  if (/1122|english/.test(t) && /paper|compos|summar|register|how long|structure|marks/.test(t)) {
    return {
      title: 'ZIMSEC English Language 1122 Paper Structure',
      answer: `• Paper 1 (1h 30m, 50 marks): Section A: ONE Composition (350–450 words, 30 marks). Section B: Guided Writing (20 marks, must address every bullet point with appropriate tone).
• Paper 2 (2 hours, 50 marks): Comprehension (20 marks) + Summary (20 marks in own words under strict word limit) + Register (10 marks, 5 situational tone conversions).`,
    };
  }

  if (/6042|pure maths|a level math/.test(t) && /paper|structure|marks/.test(t)) {
    return {
      title: 'ZIMSEC Pure Mathematics 6042 Paper Structure',
      answer: `• Paper 1 (3 hours, 100 marks): Algebra, Functions, Coordinate Geometry, Trigonometry, Sequences & Series, Differentiation & Integration.
• Paper 2 (3 hours, 100 marks): Advanced Vectors, Complex Numbers, Differential Equations, Numerical Methods, Probability & Mechanics.`,
    };
  }

  if (/command word/.test(t)) {
    return {
      title: 'ZIMSEC Senior Examiner Command Words',
      answer: `• State / Name / Give: Short fact (1 mark = 1 fact, no because).
• Explain: Linked cause and effect ("because", "therefore", "so that").
• Describe: Step-by-step sequence or appearance (no "why").
• Calculate: Formula → Substitute with units → Step-by-step working → Final value (3 s.f.).
• Show that: Start from given LHS and prove RHS step-by-step (never assume the answer).
• Suggest: 1 sensible, plausible scientific/practical idea per mark.
• Evaluate / To what extent: Balanced 2-sided analysis + supported conclusion (Level 1–4 mark matrix).`,
    };
  }

  return {
    title: 'ACADEX ZIMSEC Knowledge Base',
    answer: `ACADEX covers all subjects across Primary (Grade 7), O-Level (Forms 1–4), and A-Level (Forms 5–6).
We drill ZIMSEC-aligned past papers, command words, calculation methods, and marking schemes in English, Shona, and Ndebele.
Send any exam question, or type "Past Papers" or "Start Mock" to begin!`,
  };
}

export function looksLikeExam(text) {
  const t = String(text || '');
  if (t.split(/\s+/).length < 3 && !/=/.test(t)) return false;
  return /\b(state|explain|describe|suggest|calculate|determine|show that|solve|expand|factorise|define|compare|evaluate|discuss|outline|predict|identify|give|name|list|complete|sketch|draw|prove|differentiate|distinguish)\b/i.test(t)
    || /\(\s*[a-d]\s*\)/i.test(t)
    || /\[\s*\d+\s*marks?\s*\]/i.test(t)
    || /\b(4004|5006|1122|6042|702|9164|9187|paper\s*[12]|section\s*[ab])\b/i.test(t);
}

export function examLock(text) {
  return MASTER_PAPER_RULES + '\n\nTHIS QUESTION COMMAND WORD REQUIREMENT:\n' + commandWord(text);
}
