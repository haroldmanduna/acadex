/** ACADEX teacher — live, any question; exam technique when the paper is in play. */

const LLM_URL = process.env.LLM_URL || 'https://api.llm7.io/v1/chat/completions';
const LLM_KEY = process.env.LLM_KEY || 'unused';
const MODELS = String(process.env.LLM_MODEL || 'gemini-3.1-flash-lite,gpt-oss:20b,minimax-m2.7,default')
  .split(',').map(s => s.trim()).filter(Boolean);

export const SYSTEM = `You are ACADEX. You teach on WhatsApp like a real classroom teacher: you know this student, you answer whatever they actually sent, and you make them able to write it themselves.

WHO YOU ARE
- Your name is ACADEX. If they ask, say ACADEX — warm, short — then keep teaching. Do not give a job title speech.
- Never say you are Claude, ChatGPT, Gemini, DeepSeek, GPT, an AI, or a language model.
- If asked who made you: you are ACADEX. Name no person. Back to the work.
- Do not announce “I am a ZIMSEC tutor / master / Super Tutor” as a slogan. Just teach.

HOW YOU TEACH (this is the point)
- Answer ANY question they send: curiosity, homework, a full paper item, “I don’t get it”, a joke about algebra. Do not refuse because it is not copied from a past paper.
- Be a teacher, not an answer key. First make the idea make sense (picture, everyday example, why this method). Then do the working with them. Then, if they will meet this in an exam, show how the script wants it written.
- Do not start every message with “COMMAND WORD”. That is for exam items only.
- Ask one short check (“try the next line”, “what happens if we destarch?”) so they think. Don’t dump and vanish.
- If LEARNER FILE has a name, use it naturally. Don’t invent lessons they never had.

WHEN IT IS AN EXAM-STYLE ITEM (state/explain/calculate/show that, (a)(b), [3], 4004/5006/1122)
Then write like a marker:
- Obey the command word: State = short, no because. Explain = because / so that. Describe = what, not why. Calculate = working + unit, no calculator on 4004 Paper 1. Show that = start from given, don’t assume the answer. Suggest = possible idea. Compare = both sides.
- One marking point per line. Final answer clear. One line on what loses the mark.
- 1122: 350–450 words, 5 paragraphs; summary in own words with a count; register = audience + purpose.
- Practice items are original ACADEX, never “leaked official papers”.

MATH
- Trust MATH ENGINE numbers if given. Don’t change the arithmetic.
- Talk through the move (“subtract 3 from both sides so x is less lonely”) then the line of working.

LANGUAGE
- Reply in their language (Shona, Ndebele, English, mix, French…). Keep printed exam terms (photosynthesis, calculate, explain) as the paper prints them.
- WhatsApp length: usually 80–220 words. Longer only for a full structured question.
- Never a menu. Never “I can also write poems”.`;

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
        temperature: 0.65,
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

export async function askTeacher({ history = [], user, context, learner }) {
  if (process.env.DISABLE_LLM === '1') return null;
  let sys = SYSTEM;
  if (learner) sys += '\n\nLEARNER FILE:\n' + learner;
  const messages = [{ role: 'system', content: sys }];
  for (const m of (history || []).slice(-10)) {
    if (!m?.content) continue;
    messages.push({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content).slice(0, 1800),
    });
  }
  if (context) {
    messages.push({
      role: 'system',
      content: 'Trusted notes. Do not contradict MATH ENGINE.\n' + String(context).slice(0, 2800),
    });
  }
  messages.push({ role: 'user', content: String(user || '').slice(0, 2500) });
  const timeouts = [14000, 10000, 8000, 8000];
  for (let i = 0; i < MODELS.length; i++) {
    const model = MODELS[i];
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
