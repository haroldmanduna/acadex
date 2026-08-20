/** Dynamic ACADEX tutor brain — solve the actual question, do not dump the same menu. */

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
  if (/[+\-*/.^%]{2,}/.test(s.replace(/\*\*/g, '*'))) {
    /* allow ** via ^ only */
  }
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

  // 15% of 80
  let m = low.match(/(-?\d+(?:\.\d+)?)\s*%\s*(?:of|×|\*)\s*(-?\d+(?:\.\d+)?)/);
  if (m) {
    const p = +m[1], n = +m[2], a = p / 100 * n;
    return { kind: 'percent', answer: niceNum(a), steps: [
      { t: 'Percent means /100', d: `${p}% = ${p}/100` },
      { t: 'Multiply', d: `${p}/100 × ${n} = ${niceNum(a)}` },
    ] };
  }
  // express 30 as a percentage of 60
  m = low.match(/(?:express\s+)?(-?\d+(?:\.\d+)?)\s+(?:as\s+a\s+percentage\s+of|out\s+of|\/)\s*(-?\d+(?:\.\d+)?)/);
  if (m && /percent/.test(low)) {
    const a = +m[1], b = +m[2], p = (a / b) * 100;
    return { kind: 'percent', answer: niceNum(p) + '%', steps: [
      { t: '(part/whole)×100%', d: `${a}/${b} × 100% = ${niceNum(p)}%` },
    ] };
  }
  m = low.match(/increase\s+(-?\d+(?:\.\d+)?)\s+by\s+(-?\d+(?:\.\d+)?)\s*%/);
  if (m) {
    const n = +m[1], p = +m[2], a = n * (1 + p / 100);
    return { kind: 'percent', answer: niceNum(a), steps: [
      { t: 'Multiplier', d: `1 + ${p}/100 = ${niceNum(1 + p / 100)}` },
      { t: 'New value', d: `${n} × ${niceNum(1 + p / 100)} = ${niceNum(a)}` },
    ] };
  }
  m = low.match(/decrease\s+(-?\d+(?:\.\d+)?)\s+by\s+(-?\d+(?:\.\d+)?)\s*%/);
  if (m) {
    const n = +m[1], p = +m[2], a = n * (1 - p / 100);
    return { kind: 'percent', answer: niceNum(a), steps: [
      { t: 'Multiplier', d: `1 − ${p}/100 = ${niceNum(1 - p / 100)}` },
      { t: 'New value', d: `${n} × ${niceNum(1 - p / 100)} = ${niceNum(a)}` },
    ] };
  }

  // fractions a/b ± c/d
  m = t.replace(/\s/g, '').match(/^(-?\d+)\/(-?\d+)\s*([+\-])\s*(-?\d+)\/(-?\d+)$/);
  if (m) {
    const a = +m[1], b = +m[2], op = m[3], c = +m[4], d = +m[5];
    const den = b * d;
    const num = op === '+' ? a * d + c * b : a * d - c * b;
    const g = gcd(num, den);
    const n2 = num / g, d2 = den / g;
    const ans = d2 === 1 ? String(n2) : `${n2}/${d2}`;
    return { kind: 'fraction', answer: ans, steps: [
      { t: 'Common denominator', d: `${b}×${d} = ${den}` },
      { t: 'Numerators', d: op === '+' ? `${a}×${d} + ${c}×${b} = ${num}` : `${a}×${d} − ${c}×${b} = ${num}` },
      { t: 'Simplify', d: ans },
    ] };
  }
  m = low.match(/(-?\d+)\s*\/\s*(-?\d+)\s+of\s+(-?\d+(?:\.\d+)?)/);
  if (m) {
    const a = +m[1], b = +m[2], n = +m[3], v = a / b * n;
    return { kind: 'fraction', answer: niceNum(v), steps: [
      { t: 'Of means multiply', d: `${a}/${b} × ${n} = ${niceNum(v)}` },
    ] };
  }

  // mean
  m = low.match(/mean\s+(?:of\s+)?([0-9.,\s]+)/);
  if (m) {
    const nums = m[1].split(/[,\s]+/).filter(Boolean).map(Number).filter(n => Number.isFinite(n));
    if (nums.length >= 2) {
      const sum = nums.reduce((x, y) => x + y, 0);
      const avg = sum / nums.length;
      return { kind: 'stats', answer: niceNum(avg), steps: [
        { t: 'Sum', d: `${nums.join(' + ')} = ${niceNum(sum)}` },
        { t: 'Divide by how many', d: `${niceNum(sum)} ÷ ${nums.length} = ${niceNum(avg)}` },
      ] };
    }
  }

  // ratio 2:3 of 50
  m = low.match(/ratio\s+(-?\d+)\s*:\s*(-?\d+)\s+(?:of|share(?:d)?\s+into)?\s*(-?\d+)/);
  if (m) {
    const a = +m[1], b = +m[2], total = +m[3], parts = a + b;
    const s1 = total * a / parts, s2 = total * b / parts;
    return { kind: 'ratio', answer: `${niceNum(s1)} : ${niceNum(s2)}`, steps: [
      { t: 'Parts', d: `${a}+${b} = ${parts}` },
      { t: 'One part', d: `${total} ÷ ${parts} = ${niceNum(total / parts)}` },
      { t: 'Shares', d: `${a} parts = ${niceNum(s1)}, ${b} parts = ${niceNum(s2)}` },
    ] };
  }

  // simple interest
  m = low.match(/interest|s\.?i\.?/i) && low.match(/p\s*=\s*(\d+(?:\.\d+)?)/i);
  if (/simple interest|s\.i\.|si\s*=/i.test(low) || ( /interest/.test(low) && /rate|principal|time/.test(low) )) {
    const P = +(low.match(/p(?:rincipal)?\s*=\s*(\d+(?:\.\d+)?)/) || [])[1];
    const R = +(low.match(/r(?:ate)?\s*=\s*(\d+(?:\.\d+)?)/) || [])[1];
    const T = +(low.match(/t(?:ime)?\s*=\s*(\d+(?:\.\d+)?)/) || [])[1];
    if (P && R && T) {
      const si = P * R * T / 100;
      return { kind: 'interest', answer: niceNum(si), steps: [
        { t: 'SI = PRT/100', d: `${P}×${R}×${T} / 100 = ${niceNum(si)}` },
      ] };
    }
  }

  // speed distance time
  m = low.match(/(-?\d+(?:\.\d+)?)\s*(km|m|miles)?\s*(?:in|\/)\s*(-?\d+(?:\.\d+)?)\s*(h|hr|hours|s|sec|min)/);
  if (m && /speed|velocity|how fast/.test(low) || (m && /km/.test(low) && /h/.test(low))) {
    const d = +m[1], tim = +m[3], sp = d / tim;
    return { kind: 'speed', answer: `${niceNum(sp)} ${m[2] || 'km'}/${m[4] || 'h'}`, steps: [
      { t: 'Speed = distance ÷ time', d: `${d} ÷ ${tim} = ${niceNum(sp)}` },
    ] };
  }

  // area rectangle
  m = low.match(/area\s+(?:of\s+)?(?:a\s+)?rect(?:angle)?\s+(\d+(?:\.\d+)?)\s*(?:by|x|×|\*)\s*(\d+(?:\.\d+)?)/);
  if (m) {
    const a = +m[1], b = +m[2];
    return { kind: 'area', answer: niceNum(a * b), steps: [
      { t: 'Area of rectangle = l × w', d: `${a} × ${b} = ${niceNum(a * b)}` },
    ] };
  }
  m = low.match(/area\s+(?:of\s+)?(?:a\s+)?triangle\s+(?:base\s+)?(\d+(?:\.\d+)?)\s*(?:by|x|×|height|h)?\s*(\d+(?:\.\d+)?)/);
  if (m && /triangle/.test(low)) {
    const b = +m[1], h = +m[2];
    return { kind: 'area', answer: niceNum(0.5 * b * h), steps: [
      { t: 'Area of triangle = ½bh', d: `½ × ${b} × ${h} = ${niceNum(0.5 * b * h)}` },
    ] };
  }
  m = low.match(/circle.*?radius\s+(\d+(?:\.\d+)?)|radius\s+(\d+(?:\.\d+)?).*circle/);
  if (m && /circle|area/.test(low)) {
    const r = +(m[1] || m[2]);
    const a = Math.PI * r * r;
    return { kind: 'area', answer: niceNum(a) + ` (or ${r}²π = ${niceNum(r * r)}π)`, steps: [
      { t: 'Area of circle = πr²', d: `π × ${r}² = ${niceNum(a)}` },
    ] };
  }

  // pythagoras
  m = low.match(/pythag|hypotenuse|right.?angled/);
  const sides = [...low.matchAll(/(\d+(?:\.\d+)?)/g)].map(x => +x[1]);
  if (m && sides.length >= 2) {
    if (sides.length === 2) {
      const hyp = Math.sqrt(sides[0] ** 2 + sides[1] ** 2);
      return { kind: 'pythag', answer: niceNum(hyp), steps: [
        { t: 'a² + b² = c²', d: `${sides[0]}² + ${sides[1]}² = ${niceNum(sides[0] ** 2 + sides[1] ** 2)}` },
        { t: 'c = √', d: niceNum(hyp) },
      ] };
    }
  }

  // F = ma
  m = low.match(/f\s*=\s*ma|force\s*=|f=ma/i);
  const mm = low.match(/m\s*=\s*(\d+(?:\.\d+)?)/);
  const aa = low.match(/a\s*=\s*(-?\d+(?:\.\d+)?)/);
  if ((m || /\bf\s*=\s*ma\b/.test(low.replace(/\s/g, ''))) && mm && aa) {
    const F = +mm[1] * +aa[1];
    return { kind: 'physics', answer: niceNum(F) + ' N', steps: [
      { t: 'F = ma', d: `${mm[1]} × ${aa[1]} = ${niceNum(F)} N` },
    ] };
  }
  m = low.match(/\bf\s*=\s*(\d+(?:\.\d+)?)\s*[,;]?\s*m\s*=\s*(\d+(?:\.\d+)?)/i);
  if (m && /a\s*=|find a|acceleration/.test(low)) {
    const a = +m[1] / +m[2];
    return { kind: 'physics', answer: niceNum(a) + ' m/s²', steps: [{ t: 'a = F/m', d: `${m[1]}/${m[2]} = ${niceNum(a)}` }] };
  }

  // quadratic ax^2+bx+c=0
  let eq = t.replace(/\s+/g, '').replace(/X/g, 'x');
  m = eq.match(/^([+-]?\d*)x\^2([+-]\d*)x([+-]\d+)=0$/);
  if (m) {
    const a = m[1] === '' || m[1] === '+' ? 1 : m[1] === '-' ? -1 : +m[1];
    const b = m[2] === '+' || m[2] === '' ? 1 : m[2] === '-' ? -1 : +m[2];
    const c = +m[3];
    const disc = b * b - 4 * a * c;
    if (disc < 0) return { kind: 'quad', answer: 'no real roots', steps: [{ t: 'Discriminant', d: `${b}²−4(${a})(${c}) = ${disc} < 0` }] };
    const r1 = (-b + Math.sqrt(disc)) / (2 * a);
    const r2 = (-b - Math.sqrt(disc)) / (2 * a);
    return { kind: 'quad', answer: disc === 0 ? `x = ${niceNum(r1)}` : `x = ${niceNum(r1)} or x = ${niceNum(r2)}`, steps: [
      { t: 'Quadratic formula', d: 'x = (−b ± √(b²−4ac)) / 2a' },
      { t: 'Discriminant', d: `${b}² − 4(${a})(${c}) = ${disc}` },
      { t: 'Roots', d: disc === 0 ? niceNum(r1) : `${niceNum(r1)} and ${niceNum(r2)}` },
    ] };
  }

  // linear: general-ish
  const lin = solveLinearEq(t);
  if (lin) return lin;

  // expand (ax+b)(cx+d)
  m = t.replace(/\s+/g, '').match(/expand\(?\(?([+-]?\d*)x([+-]\d+)\)\(([+-]?\d*)x([+-]\d+)\)\)?/i)
    || t.replace(/\s+/g, '').match(/\(([+-]?\d*)x([+-]\d+)\)\(([+-]?\d*)x([+-]\d+)\)/);
  if (m && /expand|simplify|\(/.test(low)) {
    const a = coef(m[1]), b = +m[2], c = coef(m[3]), d = +m[4];
    const A = a * c, B = a * d + b * c, C = b * d;
    const poly = `${A}x² ${B >= 0 ? '+' : '−'} ${Math.abs(B)}x ${C >= 0 ? '+' : '−'} ${Math.abs(C)}`.replace(/1x/g, 'x');
    return { kind: 'expand', answer: poly, steps: [
      { t: 'FOIL', d: `(${a}x)(${c}x) + (${a}x)(${d}) + (${b})(${c}x) + (${b})(${d})` },
      { t: 'Simplify', d: poly },
    ] };
  }

  // arithmetic 2+2, (3+4)*2 — last, after algebra so 2x+3 is not eaten
  const arithSrc = t.replace(/=\s*\??\s*$/, '').replace(/\?$/, '').trim();
  const looksArith = /^[\d\s+\-*/().^%×÷]+$/.test(arithSrc) && /[+\-*/^%×÷]/.test(arithSrc);
  if (looksArith) {
    const v = evalArithmetic(arithSrc);
    if (v !== null) {
      return { kind: 'arith', answer: niceNum(v), steps: [
        { t: 'Work left to right, ×÷ before +−', d: `${arithSrc.replace(/\s+/g, ' ')} = ${niceNum(v)}` },
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
      { t: 'Expand', d: `${a}x + ${a * b} = ${c}` },
      { t: 'Isolate', d: `${a}x = ${ax}` },
      { t: 'Divide', d: `x = ${niceNum(x)}` },
    ] };
  }
  m = t.match(/^(-?\d*)x([+-]\d+)=(-?\d+)$/);
  if (m) {
    const a = (m[1] === '' || m[1] === '-') ? Number(m[1] + '1') : +m[1];
    const b = +m[2], c = +m[3];
    const x = (c - b) / a;
    return { kind: 'linear', answer: niceNum(x), steps: [
      { t: `Move ${b}`, d: `${a}x = ${c - b}` },
      { t: `Divide by ${a}`, d: `x = ${niceNum(x)}` },
    ] };
  }
  m = t.match(/^(-?\d+)([+-])x=(-?\d+)$/); // 5+x=12
  if (m) {
    const b = +m[1], sign = m[2], c = +m[3];
    const x = sign === '+' ? c - b : b - c;
    return { kind: 'linear', answer: niceNum(x), steps: [
      { t: 'Collect x', d: sign === '+' ? `x = ${c} − ${b}` : `x = ${b} − ${c}` },
      { t: 'Answer', d: `x = ${niceNum(x)}` },
    ] };
  }
  m = t.match(/^x([+-]\d+)=(-?\d+)$/);
  if (m) {
    const b = +m[1], c = +m[2], x = c - b;
    return { kind: 'linear', answer: niceNum(x), steps: [
      { t: `Subtract ${b}`, d: `x = ${c - b}` },
    ] };
  }
  m = t.match(/^(-?\d*)x=(-?\d+)$/);
  if (m) {
    const a = (m[1] === '' || m[1] === '-') ? Number(m[1] + '1') : +m[1];
    const x = (+m[2]) / a;
    return { kind: 'linear', answer: niceNum(x), steps: [
      { t: `Divide by ${a}`, d: `x = ${niceNum(x)}` },
    ] };
  }
  m = t.match(/^x\/(-?\d+)=(-?\d+)$/);
  if (m) {
    const a = +m[1], c = +m[2], x = c * a;
    return { kind: 'linear', answer: niceNum(x), steps: [
      { t: `Multiply both sides by ${a}`, d: `x = ${niceNum(x)}` },
    ] };
  }
  m = t.match(/^(-?\d+)\/x=(-?\d+)$/);
  if (m) {
    const a = +m[1], c = +m[2], x = a / c;
    return { kind: 'linear', answer: niceNum(x), steps: [
      { t: 'x = left ÷ right', d: `${a} ÷ ${c} = ${niceNum(x)}` },
    ] };
  }
  return null;
}

const SCIENCE = [
  { k: ['photosynthesis'], t: 'Photosynthesis (5006)', a: 'Green plants make glucose using light.\nWord equation: carbon dioxide + water → glucose + oxygen (chlorophyll, light).\nSymbol: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂.\nHappens in chloroplasts. Tests: starch (iodine, leaf turns blue-black); oxygen (glowing splint relights).\nLimiting factors: light intensity, CO₂ concentration, temperature.\nExam: “Explain why a destarched leaf is used” — so any starch found was made in the experiment.' },
  { k: ['respiration', 'aerobic'], t: 'Respiration (5006)', a: 'Respiration releases energy from glucose in mitochondria.\nAerobic: glucose + oxygen → carbon dioxide + water + energy. C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O.\nAnaerobic in animals: glucose → lactic acid (+ little energy). Yeast: glucose → ethanol + CO₂.\nDo not confuse with breathing (ventilation).' },
  { k: ['osmosis'], t: 'Osmosis (5006)', a: 'Osmosis is the net movement of water from a high water potential to a low water potential through a partially permeable membrane.\nPotato in strong sugar solution: loses water, floppy. Distilled water: gains water, firm.\nExam command “explain” needs water potential + membrane, not just “water moves”.' },
  { k: ['diffusion'], t: 'Diffusion (5006)', a: 'Diffusion: net movement of particles from high to low concentration (down the gradient). No membrane required, no energy.\nExamples: O₂ into blood, CO₂ out of leaf, perfume in a room.\nFaster if: higher temperature, steeper gradient, larger surface area, shorter distance.' },
  { k: ['enzyme'], t: 'Enzymes (5006)', a: 'Enzymes are biological catalysts (usually protein). They lower activation energy and are unchanged at the end.\nSpecific: lock and key (active site fits substrate).\nTemperature: rate rises then falls as the enzyme denatures (active site shape changes). pH: each enzyme has an optimum (pepsin ~2, amylase ~7).' },
  { k: ['chloroplast', 'chlorophyll'], t: 'Chloroplasts', a: 'Chloroplasts contain chlorophyll, which absorbs light for photosynthesis. Found in palisade mesophyll in large numbers. Not in animal cells or root cells (no light).' },
  { k: ['stomata', 'stoma', 'guard cell'], t: 'Stomata', a: 'Stomata are pores, mainly on the lower leaf surface, for gas exchange (CO₂ in, O₂ and water vapour out).\nGuard cells open in light (photosynthesis lowers CO₂ / raises turgor) and close in dark / drought to reduce transpiration.' },
  { k: ['xylem'], t: 'Xylem', a: 'Xylem carries water and mineral ions from roots to leaves. Dead lignified tubes, no cytoplasm. Also supports the plant. Transpiration pull moves the water.' },
  { k: ['phloem'], t: 'Phloem', a: 'Phloem translocates sucrose and amino acids from sources (leaves) to sinks (roots, fruits). Living sieve tubes with companion cells.' },
  { k: ['cell', 'nucleus', 'mitochondria'], t: 'Cells (5006)', a: 'Animal cell: nucleus, cytoplasm, cell membrane, mitochondria, ribosomes.\nPlant cell also: cell wall (cellulose), chloroplasts (green parts), permanent vacuole.\nNucleus: DNA/chromosomes, controls the cell. Mitochondria: aerobic respiration.' },
  { k: ['blood', 'plasma', 'haemoglobin'], t: 'Blood (5006)', a: 'Plasma: transports CO₂, urea, hormones, digested food, heat.\nRed cells: haemoglobin binds oxygen; biconcave, no nucleus — more Hb.\nWhite cells: phagocytes engulf pathogens; lymphocytes make antibodies.\nPlatelets: clotting (fibrin mesh).' },
  { k: ['heart', 'circulat'], t: 'Heart / circulation', a: 'Double circulation: pulmonary (heart–lungs) and systemic (heart–body).\nRight side: deoxygenated to lungs. Left side: oxygenated to body (thicker wall — higher pressure).\nValves stop backflow. Arteries: thick, pulse, away from heart. Veins: valves, to heart. Capillaries: one cell thick, exchange.' },
  { k: ['acid', 'alkali', 'alkalis', 'bases', 'neutralisation', 'neutralization', 'universal indicator'], t: 'Acids and bases (5006)', a: 'Acid: produces H⁺ in water (HCl, H₂SO₄, HNO₃). Alkali: produces OH⁻ (NaOH, KOH).\nIndicators: litmus red/blue; universal indicator — pH 1 red, 7 green, 14 purple.\nNeutralisation: acid + base → salt + water. Acid + metal → salt + hydrogen (pop test). Acid + carbonate → salt + water + CO₂ (limewater milky).' },
  { k: ['electrolysis'], t: 'Electrolysis (5006)', a: 'Electrolysis: splitting an ionic compound with electricity when molten or in solution.\nCathode (−): cations gain electrons (reduction), metals/hydrogen. Anode (+): anions lose electrons (oxidation).\nExample molten PbBr₂: Pb at cathode, Br₂ at anode. Copper sulfate with copper electrodes: anode dissolves, cathode gains copper (purification).' },
  { k: ['periodic', 'group 1', 'group 7', 'halogen', 'alkali metal'], t: 'Periodic Table (5006)', a: 'Groups: vertical, same outer electrons, similar chemistry. Periods: horizontal, shells filling.\nGroup 1: alkali metals, 1 outer e⁻, more reactive down the group, stored in oil, react with water → hydroxide + H₂.\nGroup 7: halogens, 7 outer e⁻, less reactive down the group, displacement: more reactive halogen displaces less reactive from a salt.' },
  { k: ['ionic', 'covalent', 'bonding'], t: 'Bonding (5006)', a: 'Ionic: metal + non-metal, electrons transferred, giant lattice, high m.p., conduct when molten/aqueous (ions free).\nCovalent: non-metals share pairs. Simple molecules (CO₂, H₂O): low m.p., do not conduct. Giant covalent (diamond, graphite, SiO₂): very high m.p.' },
  { k: ['electric', 'ohm', 'current', 'voltage', 'resistance'], t: 'Electricity (5006)', a: 'Current I = charge/time. Voltage = energy/charge. Ohm: V = IR.\nSeries: same current, voltages add, R_total = R1+R2. Parallel: same voltage, currents add, lower total R.\nLive, neutral, earth. Fuse on live. Power P = VI = I²R.' },
  { k: ['force', 'newton', 'moment', 'hooke'], t: 'Forces (5006)', a: 'F = ma. Weight W = mg (g ≈ 10 N/kg in 5006).\nMoment = force × perpendicular distance from pivot. Equilibrium: sum of clockwise moments = sum of anticlockwise.\nHooke: F = kx (elastic limit — after that it does not return to original length).' },
  { k: ['density', 'pressure'], t: 'Density and pressure', a: 'Density ρ = m/V (g/cm³ or kg/m³). Floating: less dense than the fluid.\nPressure P = F/A. Liquids: P = ρgh. Atmospheric pressure ~100 kPa. Manometer / barometer questions: height difference × density × g.' },
  { k: ['wave', 'sound', 'light', 'frequency', 'amplitude'], t: 'Waves (5006)', a: 'v = fλ. Frequency: waves per second (Hz). Amplitude: maximum displacement (related to loudness/brightness).\nSound: longitudinal, needs a medium. Light: transverse, electromagnetic, vacuum OK.\nReflection: i = r. Refraction: towards normal into denser medium. Total internal reflection if angle > c in denser medium.' },
  { k: ['energy', 'work', 'power', 'kinetic', 'potential'], t: 'Energy (5006)', a: 'Work W = Fd (force and distance in the same line). Power P = W/t = E/t.\nKE = ½mv². GPE = mgh.\nConservation: energy is transferred, not destroyed. Efficiency = useful/total × 100%.' },
  { k: ['digest', 'enzyme amylase', 'stomach', 'ileum'], t: 'Digestion (5006)', a: 'Mouth: teeth + amylase (starch→maltose). Stomach: pepsin + HCl (protein→peptides). Small intestine: bile emulsifies fat; lipase, protease, maltase; ileum adapted (villi, microvilli, rich blood supply, thin wall). Large intestine: water absorption.' },
  { k: ['hiv', 'immune', 'pathogen', 'antibody'], t: 'Disease / HIV (5006)', a: 'Pathogen: disease-causing microorganism. White cells: phagocytosis and antibodies (specific).\nHIV destroys lymphocytes → AIDS (immune system fails). Spread: sexual contact, blood, mother to child. Prevent: condoms, tested blood, not sharing needles. No vaccine in the 5006 course as a “cure”.' },
  { k: ['ecology', 'food chain', 'producer', 'trophic'], t: 'Ecology (5006)', a: 'Producer (plant) → primary consumer → secondary consumer.\nArrows mean “energy flows to”. Only ~10% energy to next trophic level (heat, waste, not eaten) — pyramids of energy/biomass.\nCarbon cycle: photosynthesis, respiration, combustion, decomposition.' },
  { k: ['water treatment', 'chlorine', 'filter'], t: 'Water treatment', a: 'Screening → sedimentation → filtration → chlorination (kills microbes). Do not boil as the industrial method in this answer — exam wants the works sequence.' },
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
  if (!best || score < 4) return null;
  return { kind: 'science', title: best.t, answer: best.a };
}

export function helpEnglish(text) {
  const low = String(text || '').toLowerCase();
  const topic = cleanQuery(text)
    .replace(/composition|essay|story|letter|speech|article|summary|register|comprehension|english|1122|write|about/gi, ' ')
    .replace(/\s+/g, ' ').trim();

  if (/summary|summarise|summarize/.test(low)) {
    return { kind: 'english', title: '1122 Summary (20 marks)', answer: `P2 summary is 20 marks — own words, within the word limit they set.\n1. Read the passage; underline only points that answer the exact question.\n2. Group similar points; drop examples, names, repetition, and extra adjectives.\n3. Write in continuous prose (not bullets) unless told otherwise.\n4. Count words. Over the limit = you stop scoring.\n5. Do not copy whole sentences (own words).\n${topic ? 'Focus this time on: ' + topic + '.' : 'Paste the passage lines or the summary question and I will pick the points.'}` };
  }
  if (/register/.test(low)) {
    return { kind: 'english', title: '1122 Register (P2 Sec B)', a: null, answer: `Register = matching language to audience, purpose and situation.\nFormal (headmaster, job, complaint): no slang, full sentences, “I would be grateful…”, no texting abbreviations.\nInformal (friend, diary): contractions OK, but still clear English — not chaos.\nEach item is usually 2 marks: pick the sentence that fits.\nSend the five options or the situation (e.g. “letter to the head”) and I will choose and say why.` };
  }
  if (/comprehension/.test(low)) {
    return { kind: 'english', title: '1122 Comprehension (20)', answer: `Command words:\n• State / Give / Name — short, from the text.\n• Explain — reason, often “because…”.\n• In your own words — do not lift a whole phrase.\n• Quotation — use inverted commas, exactly as printed.\n• Infer — the idea is there but not spelled out; start from evidence in the line they name.\nPaste the question + the line numbers and I will answer it like a mark scheme.` };
  }
  if (/composition|essay|story|write about|letter to|speech/.test(low)) {
    const seed = topic || 'your title';
    const isLetter = /letter/.test(low);
    const isSpeech = /speech/.test(low);
    const isStory = /story|narrative|night|accident|journey/.test(low) || !isLetter;
    if (isLetter) {
      return { kind: 'english', title: '1122 Guided / letter', answer: `Letter about “${seed}” — 20 or 30 marks depending on paper.\nLayout: your address + date → Dear Sir/Madam or named person → intro purpose → 3 body paragraphs each = one bullet from the question → polite close (Yours faithfully if Dear Sir).\nDo not invent a different task. Cover EVERY bullet. 350–450 words for P1 composition; guided writing follows the given points.\nSend the 7 titles or the guided points and I will outline paragraph by paragraph.` };
    }
    if (isSpeech) {
      return { kind: 'english', title: '1122 Speech', answer: `Speech on “${seed}”.\nHook (rhetorical question or startling fact) → who you are / why it matters → 3 arguments each with a local Zimbabwe example (school, kombi, clinic, harvest) → one counter-argument then rebut → call to action.\nRegister: spoken but respectful. Repeat a short refrain once. 350–450 words if this is P1.` };
    }
    return { kind: 'english', title: '1122 Composition (350–450 words, 30 marks)', answer: `Title/topic: ${seed}\nPlan (5 minutes, then write):\nP1 Opening: drop us in a moment — a sound, a heat, a queue in Mbare / a classroom clock — not “I am going to write about”.\nP2 Rising: what the person wants, and the first obstacle.\nP3 Turning point: a choice or a shock. Use one of: dialogue, a short sentence, a sensory detail.\nP4 Consequence: who is hurt or helped. Keep tense consistent (past for narrative).\nP5 Ending: change in the person, not “then I woke up” unless the title forces a dream.\nAccuracy marks: paragraphs, full stops, there/their, its/it’s, no text-speak.\nIf you paste your draft (even 8 lines), I will mark it: 2 strengths, 2 errors, one better sentence.` };
  }
  if (/verb|noun|adjective|adverb|tense|punctuation|comma|apostrophe/.test(low)) {
    return { kind: 'english', title: 'Language point', answer: `A verb is a doing/being word (run, is, became). A noun names (Harare, hunger, team). An adjective describes a noun (dusty road). An adverb describes a verb (ran quickly).\nApostrophe: it’s = it is; its = belonging to it. They’re = they are; their = belonging to them; there = place.\nPaste the sentence you want corrected and I will rewrite it for 1122.` };
  }
  return null;
}

export function tokensOf(text) {
  return String(text || '').toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w && w.length > 2 && !STOP.has(w));
}

export function searchBank(bank, text) {
  const words = tokensOf(text);
  if (words.length < 1) return null;
  const tl = String(text || '').toLowerCase();
  let syll = null;
  if (/\b(english|1122|essay|composition|summary|register|comprehension)\b/.test(tl)) syll = '1122';
  else if (/\b(science|5006|combined|bio|chem|phys|photosynth|acid|cell)\b/.test(tl)) syll = '5006';
  else if (/\b(math|4004|algebra|trig|equation)\b/.test(tl)) syll = '4004';

  const scored = [];
  for (const p of bank.papers || []) {
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
  return `${head}: ${xish}\n${body}`.slice(0, 3500);
}

const CLOSERS = [
  'Send the next question — equation, topic, or a full exam sentence.',
  'Another one? Paste it exactly as it appears on the paper.',
  'Next: try a different topic or the next part (b).',
];

export function closer(phone) {
  const n = Math.abs(Number(String(phone || '1').slice(-2))) % CLOSERS.length;
  return CLOSERS[n];
}

export function fallback(text) {
  const q = String(text || '').trim().slice(0, 140);
  return `I will not dump the menu again — I need the actual question.\n\nYou sent: “${q}”\n\nI can:\n• work Maths (2+2, 15% of 80, 2x+3=11, x²−5x+6=0, area, F=ma)\n• explain Science 5006 topics in exam language\n• plan English 1122 composition / summary / register\n• pull a worked item from the 1437-question bank\n\nPaste the full question (or a photo typed out), including numbers.`;
}
