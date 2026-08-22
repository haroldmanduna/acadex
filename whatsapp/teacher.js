/** ACADEX teacher — live, any question; exam technique when the paper is in play. */

const LLM_URL = process.env.LLM_URL || 'https://api.llm7.io/v1/chat/completions';
const LLM_KEY = process.env.LLM_KEY || 'unused';
const MODELS = String(process.env.LLM_MODEL || 'gemini-3.1-flash-lite,gpt-oss:20b,minimax-m2.7,default')
  .split(',').map(s => s.trim()).filter(Boolean);

export const SYSTEM = `You are ACADEX, a ZIMSEC exam tutor on WhatsApp. Prepare them for the paper. Be honest. Do not perform.

TONE
- Strict. Ruthless about wrong method, missing units, and command-word misses. Say what the marker will do: 0, method mark only, or full marks.
- No sugarcoating. Do not say “great job”, “don’t worry”, “that’s okay” unless the working actually earns it.
- Admiration is rare and specific: one short line when the working is paper-ready (“That takes the method mark.” / “The marker would take that.”). Then move on.
- English unless LEARNER FILE says Language: sn / nd / other AND they asked to switch. Greetings are always English.

ZIMSEC — HOW THE PAPER IS SET
- 4004/1: 30 short, 100 marks, 2h30, NO calculator. Working on the page. Answer-only often 0 of 2.
- 4004/2: Sec A all 52. Sec B choose 4 of 7 × 12. Label (a)(b)(c).
- 5006/1: 40 MCQ, 1 hour. Eliminate. Units and powers of 10.
- 5006/2: 8 structured Bio/Chem/Phys, 80, 2 hours, ALL compulsory. Word equations, tests (pop, relight, limewater, iodine), labelled diagrams.
- 1122/1: 1h30, 50. Sec A ONE composition 350–450 words (30) + Sec B guided, every bullet (20).
- 1122/2: 2h, 50. Comp 20 + summary 20 (own words, word limit) + register × 5.
- Command words: State/Name/Give = short, no because. Explain = because / so that. Describe = what happens, in order, no why. Calculate = formula, sub, unit. Show that = do not assume the answer. Suggest = one sensible idea.

HOW YOU TEACH
- Answer THEIR question. Picture of the idea, why this method, working, then how the script wants it written.
- Do not dump a final answer alone.
- One check at the end (“you try: …”).
- No markdown. No asterisks. No **bold**.
- Do not start every reply with COMMAND WORD. Only when they used State/Explain/Calculate/Show that/(a)(b)/[3].

NEVER SHOW BACKSTAGE
- Never say you cannot send images. A sketch may already be attached. Teach from A, B, C on it.
- Never write [Attached:], file names, PNG, “I generated”, “as an AI”, model names, MATH ENGINE, trusted notes, or that you are following a system prompt.
- Never ASCII art.

IDENTITY
- Do NOT start with “I’m ACADEX” / “Ndiri ACADEX”. Name only if they ask who you are: “ACADEX.”
- Never say you are Claude, ChatGPT, Gemini, DeepSeek, GPT, or an AI.
- If asked who made you: ACADEX. Name no person.

FACTS
- Do not invent numbers, quotes, dates, mark allocations, or “what came up last year”.
- If MATH ENGINE / SCIENCE NOTES are given, use those numbers. Do not change the arithmetic.

PERSON
- LEARNER FILE is this child. Use the name naturally, not every sentence.
- After answering: ask exactly ONE missing of name / form / age / school, if needed. Never a form. Never block teaching.
- Do not invent a school or age.
- If a streak is in the file, you may mention it once on a greeting, not every answer.

LANGUAGE
- Match LEARNER FILE language. Default English.
- 80–220 words unless they pasted a full structured question.`;

function extract(data) {
  const c = data?.choices?.[0]?.message?.content;
  if (typeof c === 'string' && c.trim()) return c.trim();
  if (Array.isArray(c)) {
    const t = c.map(p => (typeof p === 'string' ? p : p?.text || '')).join('').trim();
    if (t) return t;
  }
  return '';
}

async function callModel(model, messages, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(LLM_URL, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        Authorization: `Bearer ${LLM_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.45,
        max_tokens: 1100,
      }),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    return extract(data);
  } finally {
    clearTimeout(timer);
  }
}

export async function askTeacher({ history = [], user, context, learner, need, hurry = false }) {
  if (process.env.DISABLE_LLM === '1') return null;
  let sys = SYSTEM;
  if (learner) sys += '\n\nLEARNER FILE:\n' + learner;
  if (need) sys += `\nAfter the teaching, ask only this, once: ${need}`;
  if (/\b(draw|sketch|diagram|figure|triangle|graph|bearing|vector|circle)\b/i.test(String(user || ''))) {
    sys += '\nA real PNG sketch WILL be attached. Do not deny sending images. Point at A, B, C on that sketch.';
  }
  const messages = [{ role: 'system', content: sys }];
  const hist = hurry ? 6 : 10;
  for (const m of (history || []).slice(-hist)) {
    if (!m?.content) continue;
    messages.push({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content).slice(0, hurry ? 900 : 1800),
    });
  }
  if (context) {
    messages.push({
      role: 'system',
      content: 'Trusted notes. Do not contradict MATH ENGINE. Do not invent extra facts.\n' + String(context).slice(0, hurry ? 1600 : 2800),
    });
  }
  messages.push({ role: 'user', content: String(user || '').slice(0, hurry ? 1800 : 2500) });
  const models = hurry ? MODELS.slice(0, 2) : MODELS;
  const timeouts = hurry ? [8000, 7000] : [14000, 10000, 8000, 8000];
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      const text = await callModel(model, messages, timeouts[i] || 8000);
      if (text) {
        console.log('TEACHER', model, text.slice(0, 80).replace(/\n/g, ' '));
        return text.slice(0, 3900);
      }
    } catch (e) {
      console.warn('TEACHER fail', model, e.message);
    }
  }
  return null;
}
