/** How ZIMSEC actually awards marks — lock every answer to this. */

export function commandWord(text) {
  const t = ' ' + String(text || '').toLowerCase() + ' ';
  const rules = [
    ['show that', 'SHOW THAT: start from the given; end at the required result. Do not assume the answer. Full working. Method marks even if arithmetic slips.'],
    ['explain', 'EXPLAIN: linked reason. Use because / so that / therefore. A one-word “state” scores 0 on an explain.'],
    ['describe', 'DESCRIBE: what happens or what it looks like, in order. No “because” unless they also asked why.'],
    ['suggest', 'SUGGEST: a possible reason or improvement. Need not be in the passage/diagram. One sensible idea per mark.'],
    ['calculate', 'CALCULATE: formula → substitute with units → working → final answer with unit. 3 s.f. unless told. No calculator on 4004/1.'],
    ['determine', 'DETERMINE: working required, then a value. Not a guess.'],
    ['compare', 'COMPARE: both sides. Similarities AND differences unless the paper says only one.'],
    ['evaluate', 'EVALUATE: points for, points against, then a judgement tied to the data.'],
    ['discuss', 'DISCUSS: more than one side. Not a single fact.'],
    ['outline', 'OUTLINE: main points only, in order. No long story.'],
    ['predict', 'PREDICT: from the pattern/data in front of you, not general knowledge.'],
    ['state', 'STATE / GIVE / NAME / LIST: short. No because. Often 1 mark = 1 fact.'],
    ['give', 'GIVE / NAME / STATE: short fact. No explanation.'],
    ['name', 'NAME / IDENTIFY: the term or structure. Spelling must be recognisable.'],
    ['identify', 'IDENTIFY: name the structure/process from the diagram or description.'],
    ['define', 'DEFINE: meaning + essential feature. Not an example alone.'],
    ['solve', 'SOLVE: working on the page. Box the final value. Check by substitution if time.'],
    ['expand', 'EXPAND: FOIL / distribute. Simplify like terms. Show at least one line of working.'],
    ['factorise', 'FACTORISE: common factor first, then quadratic if needed. Completely means nothing left outside.'],
    ['sketch', 'SKETCH: shape, intercepts, asymptotes labelled. Not a scale drawing unless “draw”.'],
    ['draw', 'DRAW: ruler, labels, units. Graphs: axes named, even scale, points, line of best fit if asked.'],
    ['complete', 'COMPLETE: fill exactly what is missing. Do not rewrite the whole table.'],
    ['use the', 'USE THE graph/table/passage: the mark is for using THAT data, not a memorised fact.'],
  ];
  for (const [k, v] of rules) if (t.includes(' ' + k + ' ') || t.includes(k + ' ')) return v;
  return 'If no command word: still write as the paper would — working, units, one idea per mark. Do not waffle.';
}

export const OLEVEL_GRADES = ['A', 'B', 'C', 'D', 'E', 'U'];

export const PAPER_RULES = `
ZIMSEC PAPER LOCK (never break these)
O-Level grades: A, B, C, D, E, U (Ungraded). No Distinction. No A*. Thresholds change each June/November — do not invent a % for A.
Five subjects at C or better (often including English Language) is what most schools treat as a full O-Level set / A-Level entry. C is often called a credit.
Sessions: June and November.
Maths 4004/1: 30 short, 100 marks, 2 h 30, NO CALCULATOR. Show working; answers only often score 0 of 2.
Maths 4004/2: 2 h 30, calculator allowed. Section A all 52 marks; Section B choose 4 from 7 (12 each). Label (a)(b)(c).
Combined Science 5006/1: 40 MCQ, 1 hour. Units, powers of 10, eliminate two options.
Combined Science 5006/2: 8 structured Bio/Chem/Phys, 80 marks, 2 hours, ALL compulsory. Labelled diagrams, word equations, tests (pop, relight, limewater, iodine).
English 1122/1: 1 h 30, 50 marks. Sec A ONE composition 350–450 words from 7 titles (30). Sec B guided writing — hit every bullet (20).
English 1122/2: 2 hours, 50. Sec A comprehension 20 + summary 20 (own words, word limit). Sec B register × 5.

ACADEX items are original practice in this format — never call them leaked official scripts.
`;

export function zimsecExplain(text) {
  const t = String(text || '').toLowerCase();
  const about = /zimsec|o-?level|a-?level|grading|grades?|symbols?|distinction|a\*|command word|4004|5006|1122|how is the paper|paper\s*[12]/.test(t);
  const asking = /what (are|is)|how (does|do|is|are|long|many)|tell me|explain|does zimsec|grading|symbols?|distinction|a\*|pass|structure|set the paper|command words?/.test(t)
    || /^(grades?|zimsec|zimsec grades?|command words?)$/.test(t.trim());
  if (!about || !asking) return null;
  if (/=/.test(t) || /\b(2x|photosynth|pythag|bearing)\b/.test(t)) return null;
  if (/distinction|a\*|grading|grades?|symbols?|what is a pass|is [cde] a pass/.test(t)) {
    return {
      title: 'ZIMSEC O-Level grades',
      answer: 'O-Level grades are A, B, C, D, E, U (Ungraded). There is no Distinction and no A* on the ZIMSEC O-Level certificate.\nDo not invent a percentage for A — the threshold changes each June and November.\nMost schools treat five subjects at C or better (often including English Language) as a full O-Level set / A-Level entry. C is often called a credit.\nA-Level (Forms 5–6) is a different exam.',
    };
  }
  if (/4004|math/.test(t) && /paper|calculator|how long|structure|marks/.test(t)) {
    return {
      title: 'Maths 4004',
      answer: 'Paper 1: about 30 short questions, 100 marks, 2 hours 30 minutes, no calculator. Working on the page — answer-only is often 0 of 2.\nPaper 2: 2 hours 30 minutes, calculator allowed. Section A all 52 marks. Section B choose 4 from 7 (12 marks each). Label (a)(b)(c).',
    };
  }
  if (/5006|combined science|science paper/.test(t)) {
    return {
      title: 'Combined Science 5006',
      answer: 'Paper 1: 40 multiple-choice, 1 hour. Watch units and powers of 10. Eliminate two options first.\nPaper 2: 8 structured questions across Biology, Chemistry and Physics, 80 marks, 2 hours, all compulsory. Word equations, tests (pop, relight, limewater, iodine), labelled diagrams.',
    };
  }
  if (/1122|english/.test(t) && /paper|compos|summar|register|how long|structure|marks/.test(t)) {
    return {
      title: 'English Language 1122',
      answer: 'Paper 1: 1 hour 30 minutes, 50 marks. Section A: ONE composition, 350–450 words, 30 marks. Section B: guided writing — hit every bullet, 20 marks.\nPaper 2: 2 hours, 50 marks. Comprehension 20 + summary 20 (own words, word limit) + register, five items.',
    };
  }
  if (/command word/.test(t)) {
    return {
      title: 'ZIMSEC command words',
      answer: 'State / Name / Give: short fact, no because.\nExplain: because / so that / therefore.\nDescribe: what happens, in order, no why.\nCalculate: formula, substitute, unit. No calculator on 4004/1.\nShow that: do not assume the answer. Full working.\nSuggest: one sensible idea per mark.',
    };
  }
  return {
    title: 'ZIMSEC',
    answer: 'O-Level grades: A, B, C, D, E, U. No Distinction. No A*.\nWe drill 4004 Maths, 5006 Combined Science, 1122 English Language, June and November style.\nSend the question, or ask about a paper (4004, 5006, 1122) or a command word.',
  };
}

export function looksLikeExam(text) {
  const t = String(text || '');
  if (t.split(/\s+/).length < 3 && !/=/.test(t)) return false;
  return /\b(state|explain|describe|suggest|calculate|determine|show that|solve|expand|factorise|define|compare|evaluate|discuss|outline|predict|identify|give|name|list|complete|sketch|draw)\b/i.test(t)
    || /\(\s*[a-d]\s*\)/.test(t)
    || /\[\s*\d+\s*\]/.test(t)
    || /\b(4004|5006|1122|paper\s*[12]|section [ab])\b/i.test(t);
}

export function examLock(text) {
  return PAPER_RULES + '\nTHIS QUESTION: ' + commandWord(text);
}
