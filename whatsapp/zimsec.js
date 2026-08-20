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

export const PAPER_RULES = `
ZIMSEC PAPER LOCK (never break these)
Maths 4004/1: 30 short, 100 marks, 2 h 30, NO CALCULATOR. Show working; answers only often score 0 of 2.
Maths 4004/2: Section A all 52 marks; Section B choose 4 from 7 (12 each). Label (a)(b)(c).
Combined Science 5006/1: 40 MCQ, 1 hour. Units, powers of 10, eliminate two options.
Combined Science 5006/2: 8 structured Bio/Chem/Phys, 80 marks, 2 hours, ALL compulsory. Labelled diagrams, word equations, tests (pop, relight, limewater, iodine).
English 1122/1: 1 h 30, 50 marks. Sec A ONE composition 350–450 words from 7 titles (30). Sec B guided writing — hit every bullet (20).
English 1122/2: 2 hours, 50. Sec A comprehension 20 + summary 20 (own words, word limit). Sec B register × 5.

ACADEX items are original practice in this format — never call them leaked official scripts.
`;

export function examLock(text) {
  return PAPER_RULES + '\nTHIS QUESTION: ' + commandWord(text);
}
