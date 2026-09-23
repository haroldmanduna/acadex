/** Dynamic ACADEX Master Tutor Brain — Deep Multi-Subject ZIMSEC Solver & Examiner
 *  Primary (Grade 7), O-Level (Forms 1–4) & A-Level (Forms 5–6)
 */

const STOP = new Set('help please what whats what\'s the a an of to is are was were be been being and or for from with without about into onto over under how why when where who whom which that this those these your my our their it its you we they them i me us can could would should will just also any some more most many much very really kind type send tell give show explain describe state define calculate solve find work out evaluate compute ndapota mhinduro impendulo question mubvunzo'.split(' '));

export function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { const t = b; b = a % b; a = t; }
  return a || 1;
}

export function cleanQuery(text) {
  let t = String(text || '');
  t = t.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  t = t.replace(/help\s*/i, ' ');
  t = t.replace(/\b(please|ndapota|what is|what's|whats|calculate|compute|evaluate|solve|find|work out|equals)\b/gi, ' ');
  return t.replace(/\s+/g, ' ').trim();
}

function niceNum(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return String(n);
  if (Number.isInteger(n)) return String(n);
  const r = Math.round(n * 1e10) / 1e10;
  if (Number.isInteger(r)) return String(r);
  const s = r.toFixed(6).replace(/\.?0+$/, '');
  return s;
}

function evalArithmetic(expr) {
  let s = String(expr || '').replace(/\s+/g, '');
  s = s.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/–/g, '-');
  s = s.replace(/(\d)\(/g, '$1*(').replace(/\)(\d)/g, ')*$1');
  if (!s || s.length > 80) return null;
  if (!/^[0-9+\-*/().^%]+$/.test(s)) return null;
  const js = s.replace(/\^/g, '**');
  try {
    const fn = new Function(`"use strict"; return (${js});`);
    const v = fn();
    if (typeof v !== 'number' || !Number.isFinite(v)) return null;
    return v;
  } catch {
    return null;
  }
}

function fmtSteps(steps) {
  return steps.map((s, i) => `${i + 1}. ${s.t}${s.d ? ': ' + s.d : ''}`).join('\n');
}

export function solveMath(raw) {
  const original = String(raw || '').trim();
  let t = cleanQuery(original);
  t = t.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/–/g, '-');
  t = t.replace(/\bplus\b/gi, '+').replace(/\bminus\b/gi, '-').replace(/\btimes\b/gi, '*').replace(/\bdivided by\b/gi, '/');
  if (!t.includes('=') && /\d\s*[x×]\s*\d/.test(t) && !/[a-wyz]/i.test(t.replace(/\d\s*[x×]\s*\d/gi, ''))) {
    t = t.replace(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)/gi, '$1*$2');
  }
  const low = t.toLowerCase();

  // 1. Percentages
  let m = low.match(/(-?\d+(?:\.\d+)?)\s*%\s*(?:of|×|\*)\s*(-?\d+(?:\.\d+)?)/);
  if (m) {
    const p = +m[1], n = +m[2], a = p / 100 * n;
    return { kind: 'percent', answer: niceNum(a), steps: [
      { t: 'Percent means /100 [Method M1]', d: `${p}% = ${p}/100` },
      { t: 'Multiply [Accuracy A1]', d: `${p}/100 × ${n} = ${niceNum(a)}` },
    ] };
  }
  m = low.match(/(?:express\s+)?(-?\d+(?:\.\d+)?)\s+(?:as\s+a\s+percentage\s+of|out\s+of|\/)\s*(-?\d+(?:\.\d+)?)/);
  if (m && /percent/.test(low)) {
    const a = +m[1], b = +m[2], p = (a / b) * 100;
    return { kind: 'percent', answer: niceNum(p) + '%', steps: [
      { t: '(part/whole) × 100% [Method M1]', d: `${a}/${b} × 100% = ${niceNum(p)}%` },
    ] };
  }
  m = low.match(/increase\s+(-?\d+(?:\.\d+)?)\s+by\s+(-?\d+(?:\.\d+)?)\s*%/);
  if (m) {
    const n = +m[1], p = +m[2], a = n * (1 + p / 100);
    return { kind: 'percent', answer: niceNum(a), steps: [
      { t: 'Multiplier [M1]', d: `1 + ${p}/100 = ${niceNum(1 + p / 100)}` },
      { t: 'New value [A1]', d: `${n} × ${niceNum(1 + p / 100)} = ${niceNum(a)}` },
    ] };
  }
  m = low.match(/decrease\s+(-?\d+(?:\.\d+)?)\s+by\s+(-?\d+(?:\.\d+)?)\s*%/);
  if (m) {
    const n = +m[1], p = +m[2], a = n * (1 - p / 100);
    return { kind: 'percent', answer: niceNum(a), steps: [
      { t: 'Multiplier [M1]', d: `1 − ${p}/100 = ${niceNum(1 - p / 100)}` },
      { t: 'New value [A1]', d: `${n} × ${niceNum(1 - p / 100)} = ${niceNum(a)}` },
    ] };
  }

  // 2. Fractions a/b ± c/d
  m = t.replace(/\s/g, '').match(/^(-?\d+)\/(-?\d+)\s*([+\-])\s*(-?\d+)\/(-?\d+)$/);
  if (m) {
    const a = +m[1], b = +m[2], op = m[3], c = +m[4], d = +m[5];
    const den = b * d;
    const num = op === '+' ? a * d + c * b : a * d - c * b;
    const g = gcd(num, den);
    const n2 = num / g, d2 = den / g;
    const ans = d2 === 1 ? String(n2) : `${n2}/${d2}`;
    return { kind: 'fraction', answer: ans, steps: [
      { t: 'Find common denominator [M1]', d: `${b} × ${d} = ${den}` },
      { t: 'Express equivalent numerators [M1]', d: op === '+' ? `${a}×${d} + ${c}×${b} = ${num}` : `${a}×${d} − ${c}×${b} = ${num}` },
      { t: 'Simplify to lowest terms [A1]', d: ans },
    ] };
  }
  m = low.match(/(-?\d+)\s*\/\s*(-?\d+)\s+of\s+(-?\d+(?:\.\d+)?)/);
  if (m) {
    const a = +m[1], b = +m[2], n = +m[3], v = a / b * n;
    return { kind: 'fraction', answer: niceNum(v), steps: [
      { t: 'Of means multiply [M1]', d: `${a}/${b} × ${n} = ${niceNum(v)}` },
    ] };
  }

  // 3. Circle Theorems & Geometry Rules
  if (/circle theorem|angle at (the )?centre|cyclic quad|alternate segment|tangent to/i.test(low)) {
    return {
      kind: 'geometry',
      answer: 'Circle Theorem Application',
      steps: [
        { t: 'Angle at Centre [Theorem 1]', d: 'The angle subtended by an arc at the centre is TWICE the angle subtended at the circumference.' },
        { t: 'Angles in Same Segment [Theorem 2]', d: 'Angles subtended by the same arc in the same segment are EQUAL.' },
        { t: 'Angle in a Semicircle [Theorem 3]', d: 'The angle subtended by a diameter at the circumference is always 90°.' },
        { t: 'Cyclic Quadrilateral [Theorem 4]', d: 'Opposite angles of a cyclic quad sum to 180° (supplementary). Exterior angle equals opposite interior angle.' },
        { t: 'Tangent & Radius [Theorem 5]', d: 'A tangent to a circle is perpendicular (90°) to the radius at the point of contact.' },
        { t: 'Alternate Segment Theorem [Theorem 6]', d: 'The angle between a tangent and a chord equals the angle subtended by the chord in the alternate segment.' }
      ]
    };
  }

  // 4. Statistics: Mean, Median, Mode, Range
  m = low.match(/mean\s+(?:of\s+)?([0-9.,\s]+)/);
  if (m) {
    const nums = m[1].split(/[,\s]+/).filter(Boolean).map(Number).filter(n => Number.isFinite(n));
    if (nums.length >= 2) {
      const sum = nums.reduce((x, y) => x + y, 0);
      const avg = sum / nums.length;
      return { kind: 'stats', answer: niceNum(avg), steps: [
        { t: 'Sum all values [M1]', d: `${nums.join(' + ')} = ${niceNum(sum)}` },
        { t: 'Divide by frequency (n) [A1]', d: `${niceNum(sum)} ÷ ${nums.length} = ${niceNum(avg)}` },
      ] };
    }
  }

  // 5. Ratio & Proportion
  m = low.match(/ratio\s+(-?\d+)\s*:\s*(-?\d+)\s+(?:of|share(?:d)?\s+into)?\s*(-?\d+)/);
  if (m) {
    const a = +m[1], b = +m[2], total = +m[3], parts = a + b;
    const s1 = total * a / parts, s2 = total * b / parts;
    return { kind: 'ratio', answer: `${niceNum(s1)} : ${niceNum(s2)}`, steps: [
      { t: 'Calculate total parts [M1]', d: `${a} + ${b} = ${parts}` },
      { t: 'Find value of 1 part [M1]', d: `${total} ÷ ${parts} = ${niceNum(total / parts)}` },
      { t: 'Multiply by ratio shares [A1]', d: `${a} parts = ${niceNum(s1)}, ${b} parts = ${niceNum(s2)}` },
    ] };
  }

  // 6. Simple & Compound Interest
  if (/simple interest|s\.i\.|si\s*=/i.test(low) || (/interest/.test(low) && /rate|principal|time/.test(low))) {
    const P = +(low.match(/p(?:rincipal)?\s*=\s*(\d+(?:\.\d+)?)/) || [])[1];
    const R = +(low.match(/r(?:ate)?\s*=\s*(\d+(?:\.\d+)?)/) || [])[1];
    const T = +(low.match(/t(?:ime)?\s*=\s*(\d+(?:\.\d+)?)/) || [])[1];
    if (P && R && T) {
      const si = P * R * T / 100;
      return { kind: 'interest', answer: niceNum(si), steps: [
        { t: 'State Formula [M1]', d: 'SI = (P × R × T) / 100' },
        { t: 'Substitute values [M1]', d: `(${P} × ${R} × ${T}) / 100` },
        { t: 'Calculate final interest [A1]', d: `$${niceNum(si)}` }
      ] };
    }
  }

  // 7. Speed, Distance, Time
  m = low.match(/(-?\d+(?:\.\d+)?)\s*(km|m|miles)?\s*(?:in|\/)\s*(-?\d+(?:\.\d+)?)\s*(h|hr|hours|s|sec|min)/);
  if (m && /speed|velocity|how fast/.test(low) || (m && /km/.test(low) && /h/.test(low))) {
    const d = +m[1], tim = +m[3], sp = d / tim;
    return { kind: 'speed', answer: `${niceNum(sp)} ${m[2] || 'km'}/${m[4] || 'h'}`, steps: [
      { t: 'Speed = Distance ÷ Time [M1]', d: `${d} ÷ ${tim}` },
      { t: 'Final speed with units [A1]', d: `${niceNum(sp)} ${m[2] || 'km'}/${m[4] || 'h'}` }
    ] };
  }

  // 8. Pythagoras & Trigonometry
  m = low.match(/pythag|hypotenuse|right.?angled/);
  const sides = [...low.matchAll(/(\d+(?:\.\d+)?)/g)].map(x => +x[1]);
  if (m && sides.length >= 2) {
    if (sides.length === 2) {
      const hyp = Math.sqrt(sides[0] ** 2 + sides[1] ** 2);
      return { kind: 'pythag', answer: niceNum(hyp), steps: [
        { t: 'State Pythagoras theorem [M1]', d: 'a² + b² = c² (c = hypotenuse)' },
        { t: 'Substitute side lengths [M1]', d: `${sides[0]}² + ${sides[1]}² = ${sides[0]**2} + ${sides[1]**2} = ${niceNum(sides[0] ** 2 + sides[1] ** 2)}` },
        { t: 'Take square root [A1]', d: `c = √${niceNum(sides[0] ** 2 + sides[1] ** 2)} = ${niceNum(hyp)}` },
      ] };
    }
  }

  // 9. Quadratic ax^2 + bx + c = 0
  let eq = t.replace(/\s+/g, '').replace(/X/g, 'x');
  m = eq.match(/^([+-]?\d*)x\^2([+-]\d*)x([+-]\d+)=0$/);
  if (m) {
    const a = m[1] === '' || m[1] === '+' ? 1 : m[1] === '-' ? -1 : +m[1];
    const b = m[2] === '+' || m[2] === '' ? 1 : m[2] === '-' ? -1 : +m[2];
    const c = +m[3];
    const disc = b * b - 4 * a * c;
    if (disc < 0) return { kind: 'quad', answer: 'no real roots', steps: [{ t: 'Discriminant [M1]', d: `b²−4ac = ${b}²−4(${a})(${c}) = ${disc} < 0 (No real roots)` }] };
    const r1 = (-b + Math.sqrt(disc)) / (2 * a);
    const r2 = (-b - Math.sqrt(disc)) / (2 * a);
    return { kind: 'quad', answer: disc === 0 ? `x = ${niceNum(r1)}` : `x = ${niceNum(r1)} or x = ${niceNum(r2)}`, steps: [
      { t: 'State Quadratic Formula [M1]', d: 'x = (−b ± √(b² − 4ac)) / (2a)' },
      { t: 'Substitute coefficients [M1]', d: `x = (−(${b}) ± √(${b}² − 4(${a})(${c}))) / (2(${a}))` },
      { t: 'Compute discriminant [M1]', d: `b² − 4ac = ${disc}` },
      { t: 'Final roots (3 s.f.) [A1]', d: disc === 0 ? `x = ${niceNum(r1)}` : `x = ${niceNum(r1)} or x = ${niceNum(r2)}` },
    ] };
  }

  // 10. Linear Equation Solver
  const lin = solveLinearEq(t);
  if (lin) return lin;

  // 11. Two-point gradient
  m = original.match(/\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\).{0,40}\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/);
  if (m && /gradient|slope|m\s*=|through/.test(low)) {
    const x1 = +m[1], y1 = +m[2], x2 = +m[3], y2 = +m[4];
    const den = x2 - x1;
    if (den !== 0) {
      const g = (y2 - y1) / den;
      return { kind: 'gradient', answer: niceNum(g), steps: [
        { t: 'Gradient Formula [M1]', d: 'm = (y₂ − y₁) / (x₂ − x₁)' },
        { t: 'Substitute coordinate points [M1]', d: `(${y2} − ${y1}) / (${x2} − ${x1}) = ${niceNum(y2 - y1)} / ${niceNum(den)}` },
        { t: 'Evaluate gradient m [A1]', d: `m = ${niceNum(g)}` },
      ] };
    }
  }

  // 12. Simultaneous Equations
  const eqs = original.match(/([+-]?\d*)\s*x\s*([+-]\s*\d*)\s*y\s*=\s*([+-]?\d+)/gi);
  if (eqs && eqs.length >= 2) {
    const parse = (s) => {
      const mm = s.replace(/\s+/g, '').match(/^([+-]?\d*)x([+-]\d*)y=([+-]?\d+)$/i);
      if (!mm) return null;
      return { a: coef(mm[1]), b: coef(mm[2]), c: +mm[3] };
    };
    const e1 = parse(eqs[0]), e2 = parse(eqs[1]);
    if (e1 && e2) {
      const det = e1.a * e2.b - e2.a * e1.b;
      if (det) {
        const x = (e1.c * e2.b - e2.c * e1.b) / det;
        const y = (e1.a * e2.c - e2.a * e1.c) / det;
        return { kind: 'simultaneous', answer: `x = ${niceNum(x)}, y = ${niceNum(y)}`, steps: [
          { t: 'Set up system of equations [M1]', d: `Eq 1: ${eqs[0]} | Eq 2: ${eqs[1]}` },
          { t: 'Eliminate one variable [M1]', d: `Elimination yields x = ${niceNum(x)}` },
          { t: 'Substitute back to find y [M1]', d: `Substitution yields y = ${niceNum(y)}` },
          { t: 'Final paired solution [A1]', d: `x = ${niceNum(x)}, y = ${niceNum(y)}` }
        ] };
      }
    }
  }

  // 13. Arithmetic Evaluation
  const arithSrc = t.replace(/=\s*\??\s*$/, '').replace(/\?$/, '').trim();
  const looksArith = /^[\d\s+\-*/().^%×÷]+$/.test(arithSrc) && /[+\-*/^%×÷]/.test(arithSrc);
  if (looksArith) {
    const v = evalArithmetic(arithSrc);
    if (v !== null) {
      return { kind: 'arith', answer: niceNum(v), steps: [
        { t: 'Order of Operations (BODMAS) [M1]', d: `${arithSrc.replace(/\s+/g, ' ')} = ${niceNum(v)}` },
      ] };
    }
  }

  return null;
}

function coef(s) {
  if (s === '' || s === '+') return 1;
  if (s === '-') return -1;
  return +s;
}

export function solveLinearEq(input) {
  let t = String(input || '').toLowerCase().replace(/×/g, '*').replace(/−/g, '-');
  t = t.replace(/x\s+(\d+)\s*=/g, 'x+$1=');
  t = t.replace(/\s+/g, '');
  t = t.replace(/equals/g, '=');
  if (!t.includes('=') || !t.includes('x')) return null;

  let m = t.match(/^(-?\d+)\(x([+-]\d+)\)=(-?\d+)$/);
  if (m) {
    const a = +m[1], b = +m[2], c = +m[3];
    const ax = c - a * b;
    if (!a) return null;
    const x = ax / a;
    return { kind: 'linear', answer: niceNum(x), steps: [
      { t: 'Expand brackets [M1]', d: `${a}x + ${a * b} = ${c}` },
      { t: 'Transpose constant term [M1]', d: `${a}x = ${c} − (${a * b}) = ${ax}` },
      { t: 'Divide by coefficient of x [A1]', d: `x = ${ax} / ${a} = ${niceNum(x)}` },
    ] };
  }
  m = t.match(/^(-?\d*)x([+-]\d+)=(-?\d+)$/);
  if (m) {
    const a = (m[1] === '' || m[1] === '-') ? Number(m[1] + '1') : +m[1];
    const b = +m[2], c = +m[3];
    const x = (c - b) / a;
    return { kind: 'linear', answer: niceNum(x), steps: [
      { t: `Transpose constant term (${b}) [M1]`, d: `${a}x = ${c} − (${b}) = ${c - b}` },
      { t: `Divide by coefficient (${a}) [A1]`, d: `x = ${c - b} / ${a} = ${niceNum(x)}` },
    ] };
  }
  m = t.match(/^(-?\d*)x=(-?\d+)$/);
  if (m) {
    const a = (m[1] === '' || m[1] === '-') ? Number(m[1] + '1') : +m[1];
    const x = (+m[2]) / a;
    return { kind: 'linear', answer: niceNum(x), steps: [
      { t: `Divide both sides by ${a} [A1]`, d: `x = ${m[2]} / ${a} = ${niceNum(x)}` },
    ] };
  }
  return null;
}

const SCIENCE = [
  { 
    k: ['blast furnace', 'iron extraction', 'hematite', 'haematite', 'limestone slag'], 
    t: 'Extraction of Iron (Blast Furnace - ZIMSEC 5006/5070)', 
    a: `🔬 *Extraction of Iron in the Blast Furnace:*\n
• **Raw Materials:** 
  1. Iron Ore (Haematite, Fe₂O₃) — source of iron.
  2. Coke (C) — fuel and reducing agent.
  3. Limestone (CaCO₃) — removes acidic silica/sand impurities.
  4. Hot Air Blast — provides oxygen for combustion.

• **Key Chemical Reactions & Marking Scheme:**
  1. *Combustion of Coke:* \`C + O₂ → CO₂\` (exothermic heat generation).
  2. *Formation of Carbon Monoxide:* \`CO₂ + C → 2CO\` (reducing agent).
  3. *Reduction of Haematite:* \`Fe₂O₃ + 3CO → 2Fe + 3CO₂\` [Molten iron sinks to the bottom].
  4. *Thermal Decomposition of Limestone:* \`CaCO₃ → CaO + CO₂\`.
  5. *Slag Formation (Neutralisation):* \`CaO + SiO₂ → CaSiO₃\` [Calcium silicate slag floats on molten iron].

📌 *ZIMSEC Exam Tip:* Slag floats above molten iron preventing it from re-oxidising.` 
  },
  { 
    k: ['electrolysis', 'cathode', 'anode', 'electrolyte', 'electroplating'], 
    t: 'Electrolysis & Redox (ZIMSEC 5006/5070)', 
    a: `⚡ *Electrolysis Principles & Mark Scheme:*\n
• **Electrolysis:** Decomposition of an ionic compound (molten or aqueous) by the passage of electricity.
• **CATHODE (−):** 
  - Attracts positively charged Cations.
  - **Reduction** takes place (Gain of Electrons: \`Mⁿ⁺ + ne⁻ → M\`).
  - Hydrogen or metal is discharged.
• **ANODE (+):** 
  - Attracts negatively charged Anions.
  - **Oxidation** takes place (Loss of Electrons: \`2X⁻ → X₂ + 2e⁻\`).
  - Halogen or Oxygen gas is discharged.

• **Electroplating Rules:**
  - Object to be coated is placed at the **CATHODE (−)**.
  - Plating metal (e.g. Copper/Silver) is placed at the **ANODE (+)**.
  - Electrolyte contains ions of the plating metal (e.g. \`CuSO₄\`).` 
  },
  { 
    k: ['photosynthesis'], 
    t: 'Photosynthesis (ZIMSEC 5006/5008)', 
    a: `🌱 *Photosynthesis (ZIMSEC 5006 & 5008):*\n
• **Word Equation:** Carbon dioxide + Water --(Light & Chlorophyll)--> Glucose + Oxygen.
• **Balanced Chemical Equation:** \`6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂\` [M1, A1].
• **Site:** Chloroplasts (specifically chlorophyll in palisade mesophyll cells).
• **Limiting Factors:** Light intensity, Carbon dioxide concentration, Temperature (optimum ~25°C–35°C; enzymes denature above 45°C).
• **Destarching:** Placing the plant in darkness for 24–48 hours to ensure leaves are free of pre-existing starch before testing.` 
  },
  { 
    k: ['respiration', 'aerobic', 'anaerobic'], 
    t: 'Respiration (ZIMSEC 5006/5008)', 
    a: `🫁 *Respiration vs Breathing:*\n
• **Aerobic Respiration:** Release of large amounts of energy from glucose in the presence of oxygen.
  - \`C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + Energy (38 ATP)\` [Mitochondria].
• **Anaerobic Respiration (Humans):** 
  - \`Glucose → Lactic Acid + Energy (2 ATP)\` [Causes muscle fatigue/oxygen debt].
• **Anaerobic Respiration (Yeast / Fermentation):**
  - \`Glucose → Ethanol + Carbon Dioxide + Energy\`.` 
  },
  { 
    k: ['osmosis'], 
    t: 'Osmosis (ZIMSEC 5006/5008)', 
    a: `🔬 *Osmosis Definition & ZIMSEC Marking Rubric:*\n
• **Definition:** Net movement of *water molecules* from a region of higher water potential (dilute solution) to a region of lower water potential (concentrated solution) down a water potential gradient through a **partially permeable membrane**.
• **In Plant Cells:**
  - In Pure Water: Absorbs water → becomes **turgid** (cell wall prevents bursting).
  - In Concentrated Sugar/Salt Solution: Loses water → cytoplasm shrinks from cell wall → becomes **plasmolysed / flaccid**.` 
  },
  { 
    k: ['diffusion'], 
    t: 'Diffusion (ZIMSEC 5006/5008)', 
    a: `💨 *Diffusion (ZIMSEC 5006):*\n
• **Definition:** Net movement of particles from a region of *higher concentration* to a region of *lower concentration* down a concentration gradient (does not require a membrane or energy).
• **Factors affecting rate:**
  1. Concentration gradient (steeper = faster).
  2. Temperature (higher kinetic energy = faster).
  3. Surface area to volume ratio (larger = faster).
  4. Diffusion distance (shorter = faster).` 
  },
  { 
    k: ['heart', 'circulation', 'double circulation', 'artery', 'vein'], 
    t: 'Human Circulatory System (ZIMSEC 5006/5008)', 
    a: `❤️ *Heart & Double Circulation:*\n
• **Double Circulation:** Blood passes through the heart TWICE during one complete circuit (Pulmonary circulation to lungs + Systemic circulation to body).
• **Left Ventricle:** Has much thicker muscular wall than right ventricle because it must pump blood at higher pressure to the entire body.
• **Blood Vessels:**
  - *Arteries:* Thick elastic muscular walls, narrow lumen, carry blood under high pressure AWAY from heart (no valves, except aorta/pulmonary artery).
  - *Veins:* Thin walls, wide lumen, carry blood under low pressure TOWARDS heart, contain **semi-lunar valves** to prevent backflow.
  - *Capillaries:* One cell thick for rapid diffusion.` 
  },
  { 
    k: ['acid', 'alkali', 'ph', 'neutralisation', 'salt preparation'], 
    t: 'Acids, Bases & Salts (ZIMSEC 5006/5070)', 
    a: `🧪 *Acids, Bases and Salts:*\n
• **Acid:** Proton (H⁺) donor. Produces H⁺ ions in aqueous solution. pH < 7.
• **Base/Alkali:** Proton acceptor. Alkalis produce OH⁻ ions in solution. pH > 7.
• **Universal Indicator Colors:** pH 1–3 Red (Strong acid), pH 4–6 Yellow/Orange (Weak acid), pH 7 Green (Neutral), pH 8–11 Blue (Weak alkali), pH 12–14 Purple (Strong alkali).
• **Core Word Equations:**
  1. \`Acid + Metal → Salt + Hydrogen Gas\` [Pop test with lighted splint].
  2. \`Acid + Base → Salt + Water\` [Neutralisation: H⁺ + OH⁻ → H₂O].
  3. \`Acid + Carbonate → Salt + Water + Carbon Dioxide\` [Turns limewater milky].` 
  },
  { 
    k: ['force', 'newton', 'f=ma', 'hooke', 'friction'], 
    t: 'Forces & Newton’s Laws (ZIMSEC 5006/5054)', 
    a: `⚙️ *Forces & Motion (Physics 5006/5054):*\n
• **Newton’s Second Law:** \`F = ma\` (Force = mass × acceleration).
• **Weight:** \`W = mg\` (on Earth g ≈ 9.8 or 10 N/kg).
• **Hooke’s Law:** \`F = kx\` (Force = spring constant × extension), valid up to the **limit of proportionality**.
• **Moments (Turning Effect):** \`Moment = Force × Perpendicular Distance from pivot\`.
• **Principle of Moments:** In equilibrium, Clockwise Moments = Anticlockwise Moments.` 
  },
  { 
    k: ['electricity', 'ohm', 'v=ir', 'parallel', 'series circuit'], 
    t: 'Current Electricity (ZIMSEC 5006/5054)', 
    a: `💡 *Electricity & Circuits:*\n
• **Ohm’s Law:** Current is directly proportional to potential difference across a conductor at constant temperature: \`V = IR\`.
• **Series Circuits:** Same current throughout (\`I = I₁ = I₂\`); Voltages add up (\`V = V₁ + V₂\`); Total resistance \`R_total = R₁ + R₂\`.
• **Parallel Circuits:** Same voltage across branches (\`V = V₁ = V₂\`); Currents add up; \`1/R_total = 1/R₁ + 1/R₂\`.
• **Electrical Power:** \`P = VI = I²R = V²/R\`. Energy \`E = P × t = VIt\`.` 
  }
];

function hasTerm(low, k) {
  const esc = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[^a-z0-9])${esc}(?:[^a-z0-9]|$)`, 'i').test(low);
}

export function explainScience(text) {
  const low = String(text || '').toLowerCase();
  let best = null, score = 0;
  for (const row of SCIENCE) {
    let n = 0;
    for (const k of row.k) if (hasTerm(low, k)) n += k.length;
    if (n > score) { score = n; best = row; }
  }
  if (!best || score < 3) return null;
  return { kind: 'science', title: best.t, answer: best.a };
}

export function helpEnglish(text) {
  const low = String(text || '').toLowerCase();
  if (/\bexplain\b/.test(low) && /\bdescribe\b/.test(low)) {
    return { 
      kind: 'english', 
      title: 'Explain vs Describe (ZIMSEC Command Words)', 
      answer: `📋 *Explain vs Describe Command Words:*\n
• **Describe:** Detail *what happens* or *what it looks like* in step-by-step chronological order. Do NOT write "because".
  - *Example:* "The leaf is broad, thin, and green with veins."
• **Explain:** Give the *scientific reason* or *cause-and-effect*. Must use words like **"because"**, **"therefore"**, **"so that"**, or **"leading to"**.
  - *Example:* "The leaf is thin **so that** gases have a short diffusion distance."

📌 *ZIMSEC Rule:* Writing a descriptive statement on an "Explain" question earns 0 marks.` 
    };
  }

  if (/summary|summarise|summarize/.test(low)) {
    return { 
      kind: 'english', 
      title: 'English 1122 Paper 2: Summary Writing (20 Marks)', 
      answer: `📝 *Summary Writing Strategy (20 Marks):*\n
1. **Identify the exact focus:** Underline only the points requested in the prompt.
2. **Select 10–12 distinct points:** Group similar ideas together.
3. **Use Own Words:** Paraphrase original expressions; direct lifting loses marks.
4. **Omit Superfluous Details:** Remove examples, dialogue, names, repetitions, and descriptive adjectives.
5. **Continuous Prose:** Write in a single or two well-connected paragraphs with transitional words (e.g. *Furthermore, Consequently, Additionally*).
6. **Strict Word Count:** Adhere strictly to the word limit (usually 160 words). Penalties apply for exceeding limits.` 
    };
  }

  if (/composition|essay|story|letter|speech|guided writing/.test(low)) {
    return { 
      kind: 'english', 
      title: 'English 1122 Paper 1: Composition & Guided Writing', 
      answer: `✍️ *1122 Paper 1 Composition Masterclass (50 Marks):*\n
• **Section A: Continuous Writing (30 Marks, 350–450 words):**
  - *Narrative:* Clear plot arc (Exposition → Rising action → Climax → Resolution), sensory details, realistic dialogue.
  - *Descriptive:* Vivid imagery, figurative devices (metaphor, simile, personification), mood.
  - *Discursive/Argumentative:* Balanced analysis, clear thesis, well-reasoned paragraphs, strong conclusion.
• **Section B: Guided Writing (20 Marks, 200–250 words):**
  - Must address **EVERY bullet point** given in the prompt.
  - Proper layout (Formal Letter, Report, Speech, Article, Memo).
  - Tone matching the target audience.` 
    };
  }

  return null;
}

export function teachConcept(text) {
  const t = String(text || '').toLowerCase();

  // Principles of Accounts 7110
  if (/accounting|ledger|trial balance|balance sheet|profit and loss|depreciation|suspense account/i.test(t)) {
    return {
      kind: 'concept',
      title: 'Principles of Accounts (7110 / 6001)',
      answer: `📊 *Principles of Accounts (7110) Master Framework:*\n
• **Golden Rules of Double Entry:**
  - *Debit (Dr):* Increase in Assets & Expenses; Decrease in Liabilities & Capital/Income.
  - *Credit (Cr):* Increase in Liabilities, Capital & Income; Decrease in Assets & Expenses.
• **Calculation Formulas:**
  - \`Gross Profit = Sales − Cost of Goods Sold\`
  - \`Cost of Sales = Opening Inventory + Purchases + Carriage Inwards − Closing Inventory\`
  - \`Net Profit = Gross Profit + Other Income − Operating Expenses\`
  - \`Owner’s Equity (Capital) = Assets − Liabilities\`
• **Straight-Line Depreciation:** \`Depreciation = (Cost − Scrap Value) / Useful Life\`
• **Suspense Account:** Used temporarily to balance the Trial Balance when errors affect trial balance agreement (e.g. single entry, unequal transposition).`
    };
  }

  // History 2167
  if (/great zimbabwe|munhumutapa|mutapa|rozvi|lobengula|mzilikazi|rudd concession|chimurenga/i.test(t)) {
    return {
      kind: 'concept',
      title: 'History 2167 — Heritage & Liberation',
      answer: `🏛️ *History 2167: Zimbabwe Heritage & Liberation Struggle:*\n
• **Great Zimbabwe (1200–1450 AD):**
  - Built by the Shona (Karanga) using stone without mortar.
  - *Economic:* Cattle pastoralism, gold mining, agriculture, international trade at Sofala (beads, porcelain, cloth).
  - *Decline:* Exhaustion of salt, grazing land, civil succession disputes.
• **First Chimurenga / Umvukela (1896–1897):**
  - Led by Mbuya Nehanda, Sekuru Kaguvi, and Mukwati.
  - Causes: Loss of land, cattle confiscation, hut taxes, and forced labour (*Chibaro*).
• **Second Chimurenga / Liberation War (1966–1979):**
  - Armed struggle spearheaded by ZANLA and ZIPRA forces.
  - Major milestones: Battle of Chinhoyi (1966), Mgagao Declaration (1975), Lancaster House Agreement (1979), Independence on 18 April 1980.`
    };
  }

  // Geography 2248
  if (/itcz|natural regions|farming regions|relief rainfall|convectional|kariba/i.test(t)) {
    return {
      kind: 'concept',
      title: 'Geography 2248 — Climate & Farming Regions',
      answer: `🌦️ *Geography 2248: Weather Systems & Natural Regions:*\n
• **ITCZ (Inter-Tropical Convergence Zone):** Thermal low-pressure belt where NE and SE Trade Winds converge, bringing main summer rains (November–March).
• **Zimbabwe Natural Farming Regions (I to V):**
  - **Region I (Eastern Highlands):** Rainfall > 1000mm. Tea, coffee, forestry, dairy, fruit.
  - **Region II (Northern Highveld):** Rainfall 750–1000mm. Intensive crop farming (Maize, tobacco, soyabeans, wheat).
  - **Region III (Semi-Intensive):** Rainfall 650–800mm. Maize, cotton, livestock.
  - **Region IV (Semi-Extensive):** Rainfall 450–650mm. Drought-resistant crops (sorghum, millet) and cattle ranching.
  - **Region V (Lowveld):** Rainfall < 450mm. Extensive cattle ranching, game ranching, sugarcane under irrigation (Chiredzi/Triangle).`
    };
  }

  // Pure Mathematics 6042 (A-Level)
  if (/differentiation|integration|calculus|complex number|binomial theorem|de moivre/i.test(t)) {
    return {
      kind: 'concept',
      title: 'Pure Mathematics 6042 (A-Level)',
      answer: `📐 *A-Level Pure Mathematics 6042 Key Rules:*\n
• **Calculus - Differentiation Rules:**
  - *Product Rule:* \`d/dx (uv) = u(dv/dx) + v(du/dx)\`
  - *Quotient Rule:* \`d/dx (u/v) = (v(du/dx) − u(dv/dx)) / v²\`
  - *Chain Rule:* \`dy/dx = (dy/du) × (du/dx)\`
• **Calculus - Integration by Parts:**
  - \`∫ u (dv/dx) dx = uv − ∫ v (du/dx) dx\`
• **Complex Numbers:**
  - Modulus-Argument form: \`z = r(cos θ + i sin θ) = r e^(iθ)\`
  - De Moivre’s Theorem: \`(cos θ + i sin θ)ⁿ = cos(nθ) + i sin(nθ)\``
    };
  }

  return null;
}

export function tokensOf(text) {
  return String(text || '').toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w && w.length > 2 && !STOP.has(w));
}

export function isConfused(text) {
  const t = String(text || '').toLowerCase();
  return /i (don'?t|do not|dont) (get|understand|know|see)|i am lost|confused|nobody (showed|taught)|what does .{0,48} mean|why do we|why not|i still don|help me understand/.test(t);
}

export function searchBank(bank, text) {
  if (isConfused(text)) return null;
  const words = tokensOf(text);
  if (words.length < 1) return null;
  const tl = String(text || '').toLowerCase();
  let syll = null;
  if (/\b(english|1122|essay|composition|summary|register|comprehension)\b/.test(tl)) syll = '1122';
  else if (/\b(science|5006|combined|bio|chem|phys|photosynth|acid|cell)\b/.test(tl)) syll = '5006';
  else if (/\b(math|4004|algebra|trig|equation)\b/.test(tl)) syll = '4004';

  const scored = [];
  for (const p of (bank?.papers || [])) {
    if (syll && String(p.syllabus) !== syll) continue;
    for (const qu of p.questions || []) {
      if (qu.kind === 'passage') continue;
      const topic = String(qu.topic || '').toLowerCase();
      const blob = `${topic} ${qu.text} ${qu.answer}`.toLowerCase();
      let n = 0;
      for (const w of words) {
        if (topic.split(/[^a-z0-9]+/).includes(w)) n += 3;
        else if (blob.includes(w)) n += 1;
      }
      if (n) scored.push({ n, p, qu });
    }
  }
  scored.sort((a, b) => b.n - a.n);
  const top = scored[0];
  if (!top) return null;
  if (words.length === 1 && String(top.qu.topic || '').toLowerCase().includes(words[0])) return top;
  if (words.length >= 3 && top.n < 3) return null;
  if (top.n >= 2) return top;
  return null;
}

export function formatHit(hit) {
  const q = hit.qu;
  const steps = (q.steps || []).map((s, i) => `${i + 1}. ${s.t}${s.d ? ': ' + s.d : ''}`).join('\n');
  const opts = (q.options || []).join('\n');
  const strip = (html) => String(html || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  let body = `From ${hit.p.code} ${hit.p.session} ${hit.p.year} Q${q.n} · ${q.topic} [${q.marks}]\n\n${strip(q.text).slice(0, 900)}`;
  if (opts) body += `\n${opts}`;
  if (steps) body += `\n\nWorking:\n${steps}`;
  if (q.answer) body += `\n\nAnswer: ${String(q.answer).slice(0, 600)}`;
  return body.slice(0, 3500);
}

export function formatMath(solved, lang) {
  const head = lang === 'nd' ? 'Impendulo' : lang === 'en' ? 'Answer' : 'Mhinduro';
  const body = fmtSteps(solved.steps || []);
  const xish = solved.kind === 'linear' || solved.kind === 'quad' ? `x = ${solved.answer}` : solved.answer;
  const stamp = (solved.kind === 'linear' || solved.kind === 'quad' || solved.kind === 'simultaneous' || solved.kind === 'expand')
    ? '📌 On 4004/1: Show full working on the page. Answer-only scores 0 on method questions. No calculator.'
    : '📌 Write the step-by-step working. ZIMSEC markers award Method Marks (M1) for correct substitution.';
  return `${head}: ${xish}\n\n*Step-by-Step Working:*\n${body}\n\n${stamp}`.slice(0, 3500);
}

const CLOSERS = [
  'Send the next question — equation, science concept, past paper topic, or essay title.',
  'Another one? Paste it exactly as it appears on the ZIMSEC paper.',
  'Next: try a different topic or the next structured question (b).',
];

export function closer(phone) {
  const n = Math.abs(Number(String(phone || '1').slice(-2))) % CLOSERS.length;
  return CLOSERS[n];
}

export function fallback(text) {
  const c = teachConcept(text) || explainScience(text) || helpEnglish(text);
  if (c) return c.answer;
  return `I am ready. Send any equation, syllabus concept, or past paper question. Maths: paste the equation. Science: name the reaction or process. Commercials: name the ledger or principle. Humanities: name the topic. I will provide step-by-step ZIMSEC working.`;
}
