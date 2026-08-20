/** Marker — scores numbered answers and 1122 compositions. */

function norm(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9.%-]+/g, '');
}

export function parseNumbered(text) {
  const lines = String(text || '').split(/\n+/);
  const out = [];
  for (const line of lines) {
    const m = line.match(/^\s*(?:q)?(\d{1,2})[.)\-:\s]+(.+)$/i);
    if (m) out.push({ n: +m[1], a: m[2].trim() });
  }
  return out;
}

export function markAgainstPaper(paper, numbered) {
  const qs = (paper.questions || []).filter(q => q.kind !== 'passage');
  if (!qs.length || !numbered.length) return null;
  let right = 0;
  const rows = [];
  for (const item of numbered) {
    const q = qs.find(x => Number(x.n) === item.n) || qs[item.n - 1];
    if (!q) continue;
    const ok = norm(item.a) && (norm(q.answer).includes(norm(item.a)) || norm(item.a).includes(norm(q.answer)) || norm(item.a) === norm(q.answer));
    if (ok) right++;
    rows.push({ n: item.n, ok, topic: q.topic, expect: q.answer, got: item.a });
  }
  const total = rows.length;
  const weak = rows.filter(r => !r.ok).map(r => r.topic);
  const lines = rows.map(r => `${r.n}. ${r.ok ? '✓' : '✗'} ${r.topic}${r.ok ? '' : ' — look at: ' + String(r.expect).slice(0, 50)}`);
  return {
    right,
    total,
    pct: Math.round(100 * right / (total || 1)),
    weak,
    text: `Marked ${total} answers: ${right}/${total} (${Math.round(100 * right / (total || 1))}%)\n${lines.join('\n')}\n\nCommand-word reminder: State = short fact. Explain = because. Show = working on the page.\nACADEX practice — not a leaked board script.`,
  };
}

export function markComposition(text) {
  const raw = String(text || '').trim();
  const words = raw.split(/\s+/).filter(Boolean);
  const n = words.length;
  const paras = raw.split(/\n\s*\n/).filter(p => p.trim().length > 40).length || (n > 80 ? 1 : 0);
  let band = 'U';
  const notes = [];
  if (n < 80) notes.push('Too short for 1122 P1 (need 350–450 words). This reads like a plan, not a composition.');
  else if (n < 280) notes.push(`Word count ${n} — under 350. Content marks will drop.`);
  else if (n > 520) notes.push(`Word count ${n} — over 450. Stop; extra words are not marked.`);
  else notes.push(`Word count ${n} — inside the 350–450 window.`);
  if (paras < 4 && n > 120) notes.push('Use 4–5 paragraphs (opening, rise, turning point, consequence, close).');
  if (/then i woke up|in conclusion i will|i am going to write about/i.test(raw)) {
    notes.push('Avoid “I am going to write about” / “then I woke up” — instant content-mark leak.');
  }
  const there = (raw.match(/\b(there|their|they're)\b/gi) || []).length;
  if (there > 8) notes.push('Check there/their/they’re under exam pressure.');
  if (n >= 350 && n <= 450 && paras >= 4) band = 'B/A aim';
  else if (n >= 200) band = 'C/D range unless accuracy is clean';
  else band = 'Not yet a full P1';
  return {
    words: n,
    band,
    text: `1122 composition check (${n} words) — rough band: ${band}\n\n${notes.map(x => '• ' + x).join('\n')}\n\nAccuracy: full stops, paragraphs, its/it’s.\nSend a title and I will plan 5 paragraphs, or paste 8 lines for a rewrite.`,
  };
}

export function looksLikeEssay(text) {
  const n = String(text || '').split(/\s+/).filter(Boolean).length;
  return n >= 80 && !/^\s*\d+[.)]/.test(text);
}
