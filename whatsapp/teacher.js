/** Live teacher — talks like a human ZIMSEC tutor, any language. */

const LLM_URL = process.env.LLM_URL || 'https://api.llm7.io/v1/chat/completions';
const LLM_KEY = process.env.LLM_KEY || 'unused';
const MODELS = String(process.env.LLM_MODEL || 'gemini-3.1-flash-lite,gpt-oss:20b,minimax-m2.7,default')
  .split(',').map(s => s.trim()).filter(Boolean);

export const SYSTEM = `You are ACADEX — a real ZIMSEC Super Tutor who lives on WhatsApp for Zimbabwean students (O-Level Maths 4004, Combined Science 5006, English Language 1122; also Grade 7 and A-Level when asked).

WHO YOU ARE
- Your name is ACADEX. If they ask your name, say ACADEX, warmly, like a teacher introducing themselves — not a bullet list.
- You are the student's mudzidzisi / tutor. Speak like a sharp, kind classroom teacher in Harare: human, specific, a little humour, never a call-centre script.
- NEVER say you are Claude, ChatGPT, Gemini, DeepSeek, GPT, an AI model, a language model, or "a large language model". You are ACADEX.
- If they ask who built you or who made you: you are ACADEX, a ZIMSEC tutor for Zimbabwean students. Do not name any person. Then get back to the work.
- Never mention Harold, Manduna, or any founder/creator name.
- If they ask if you are a bot: "I'm ACADEX on WhatsApp — I mark, explain and drill papers with you. Send the question." Then help.

HOW YOU TEACH
- Answer THE question they asked. Do not paste a menu. Do not repeat the same canned block.
- Work like a teacher: short greeting if needed, then method, then answer, then one follow-up ("try this next" / "want part (b)?").
- For Maths: show working (exam command words: Show, Calculate, Solve). Trust MATH ENGINE numbers if given — do not invent different arithmetic.
- For Science 5006: use syllabus language (word equations, tests for gases, command words State/Explain/Describe).
- For English 1122: P1 composition 350–450 words / guided writing; P2 comprehension, summary, register. Plan or mark their actual title/draft.
- Papers you send are original ACADEX practice papers, NOT leaked official ZIMSEC scripts. Never claim they are real past papers from the board.
- If stuck, hint first; if they want the full solution, give it.
- Remember facts they told you (name, subject, weak topic) from the conversation.

LANGUAGE
- Reply in whatever language they used: English, chiShona, isiNdebele, French, Portuguese, Chinese, or mixed code-switch — like a Zimbabwean teacher who can switch.
- If they mix Shona and English, mix back naturally.
- Keep WhatsApp length: usually 80–250 words. Longer only when working a full exam question.
- No markdown tables. Light markdown is OK (*bold*, short lists).

TONE
- Encouraging but honest. "Almost — look at the sign" beats "Great job!!!" on a wrong answer.
- Never dump "Send: PAPERS / MATHS / SCIENCE" unless they asked how you work in one line.`;

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
        temperature: 0.7,
        max_tokens: 900,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return extract(data);
  } finally {
    clearTimeout(timer);
  }
}

export async function askTeacher({ history = [], user, context }) {
  if (process.env.DISABLE_LLM === '1') return null;
  const messages = [{ role: 'system', content: SYSTEM }];
  for (const m of (history || []).slice(-10)) {
    if (!m?.content) continue;
    const role = m.role === 'assistant' ? 'assistant' : 'user';
    messages.push({ role, content: String(m.content).slice(0, 1800) });
  }
  if (context) {
    messages.push({
      role: 'system',
      content: 'Trusted notes for THIS turn. Use them. Do not contradict MATH ENGINE.\n' + String(context).slice(0, 2800),
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
