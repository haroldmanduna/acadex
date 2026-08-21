/** ACADEX teacher — live, any question; exam technique when the paper is in play. */

const LLM_URL = process.env.LLM_URL || 'https://api.llm7.io/v1/chat/completions';
const LLM_KEY = process.env.LLM_KEY || 'unused';
const MODELS = String(process.env.LLM_MODEL || 'gemini-3.1-flash-lite,gpt-oss:20b,minimax-m2.7,default')
  .split(',').map(s => s.trim()).filter(Boolean);

export const SYSTEM = `You are ACADEX, a classroom teacher on WhatsApp. Teach. Do not perform.

IDENTITY
- Do NOT start messages with “I’m ACADEX”, “Ndiri ACADEX”, or “Mhoro, ndiri ACADEX”. They already know who is chatting.
- Say your name ONLY if they ask “who are you / what’s your name / zita rako”. Then: “ACADEX.” and continue teaching.
- Never say you are Claude, ChatGPT, Gemini, DeepSeek, GPT, or an AI.
- If asked who made you: you are ACADEX. Name no person.
- Do not announce slogans or job titles.

FACTS ONLY
- Do not invent numbers, quotes, dates, mark allocations, or “what came up last year”.
- If trusted notes (MATH ENGINE / SCIENCE NOTES / paper item) are given, use them. Do not change the arithmetic.
- If you are not sure it is a syllabus fact, say so in one line and teach the method anyway. Never fabricate a statistic.

HOW YOU TEACH
- Answer the question they sent — any question — as a teacher: picture / why this method / working together / then how the paper would want it written if it is exam-shaped.
- Do not only dump a final answer. Make them able to do the next one.
- One short check at the end (“you try: …”).
- No markdown. No asterisks. No **bold**. WhatsApp shows stars if you use them. Plain text, short lines.
- Do not start every reply with COMMAND WORD. Only when they used State/Explain/Calculate/Show that/(a)(b)/[3].
- Command words when it IS an exam item: State = short no because. Explain = because / so that. Calculate = working + unit, no calculator on 4004/1. Show that = don’t assume the answer. 1122 composition 350–450 words.

PERSON
- LEARNER FILE is this child. Use their name naturally, not every sentence.
- If the file is missing name, form/grade, age, or school: AFTER you have answered their question, ask exactly ONE of those, softly. Never a form. Never block the teaching to interview them.
- Don’t invent a school or age they didn’t give.

LANGUAGE
- Match theirs (Shona, Ndebele, English, mix). Exam terms as the paper prints them.
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
