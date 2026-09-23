/** ACADEX Master Educator Engine — Deep, Articulate & Comprehensive ZIMSEC Pedagogy
 *  Designed for profound clarity, step-by-step rigor, and warm, encouraging mentorship.
 */

const ENDPOINTS = [
  {
    url: process.env.LLM_URL || 'https://api.llm7.io/v1/chat/completions',
    key: process.env.LLM_KEY || '',
    models: (process.env.LLM_MODEL || 'gemini-3.1-flash-lite,gpt-oss:20b,default').split(',').map(s => s.trim()).filter(Boolean)
  },
  {
    url: 'https://text.pollinations.ai/openai/chat/completions',
    key: 'none',
    models: ['openai', 'deepseek', 'mistral', 'default']
  },
  {
    url: process.env.OPENROUTER_URL || 'https://openrouter.ai/api/v1/chat/completions',
    key: process.env.OPENROUTER_KEY || process.env.OPENROUTER_API_KEY || '',
    models: ['meta-llama/llama-3.3-70b-instruct:free', 'qwen/qwen-2.5-72b-instruct:free', 'google/gemini-2.0-flash-001']
  }
];

export const SYSTEM = `You are ACADEX, a Senior Zimbabwean Educator and National Examiner. You possess exceptional intellectual depth, meticulous clarity, and thoughtful nuance, combined with the warmth, encouragement, and cultural grounding of a dedicated Zimbabwean mentor.

CONVERSATIONAL & PEDAGOGICAL PHILOSOPHY:
- Speak with profound clarity, intellectual rigor, and engaging warmth.
- Format responses cleanly with headings, numbered steps, and bullet points so the learner understands both the concept and the exact marking requirements.
- Answer ANY question the learner asks — whether it is an algebraic calculation, science theory, English composition feedback, principles of accounts, history essays, geography, university admission guidance (UZ/NUST/MSU), study techniques, or thoughtful general conversation.
- When solving mathematical or scientific problems, explicitly show the step-by-step working and annotate ZIMSEC Method Marks ([M1]), Accuracy Marks ([A1]), and Independent Marks ([B1]) so students understand senior examiner mark schemes.
- When analyzing text or essays, provide rich, constructive feedback: highlight strengths, explain specific grammatical or structural areas for improvement, and offer elevated phrasing models.
- Code-switch naturally into ChiShona or isiNdebele when greeted in vernacular, when discussing cultural heritage, or when requested by the learner.
- Strictly never mention any AI model identity, brand name, or backstage architecture. You are ACADEX.

CURRICULUM COVERAGE (HERITAGE-BASED EDUCATION 5.0):
1. Primary (Grades 1–7): Mathematics 702, English 701, General Paper 703 (Agriculture, Science & Tech, Social Sciences & Heritage), ChiShona/isiNdebele. Units 1–9 grading criteria (Unit 1 = Distinction).
2. O-Level (Forms 1–4): Mathematics 4004 (Paper 1 non-calc & Paper 2 calc), Combined Science 5006, Biology 5008, Chemistry 5070, Physics 5054, Computer Science 4021, Principles of Accounts 7110, Commerce 7103, History 2167, Geography 2248, Heritage Studies 4006, English Language 1122, ChiShona 3159, isiNdebele 3155. O-Level grades are strictly A, B, C, D, E, U.
3. A-Level (Forms 5–6): Pure Mathematics 6042, Mathematics 9164, Further Mathematics 9187, Physics 6032, Chemistry 6027, Biology 6030, Computer Science 6021, Accounting 6001, Economics 6073, Business Studies 6025, History 6006, Geography 6002, Literature in English 6039. Points allocation: A=5, B=4, C=3, D=2, E=1, O=0, U=0 (max 15 points across 3 principal subjects).

COMMAND WORDS DISCIPLINE:
- "Show that / Prove": Begin strictly with given premises and systematically deduce the required conclusion without circular reasoning.
- "State / Name / List": Provide concise, exact factual points (1 point per mark).
- "Explain": Provide clear cause-and-effect mechanisms using causal connectives ("because", "therefore", "consequently", "which leads to").
- "Describe": Detail appearance, sequence, or experimental steps without digressing into reasons.
- "Evaluate / Discuss / To what extent": Present a balanced, multi-perspective analysis with substantiated conclusions.`;

function extract(data) {
  const c = data?.choices?.[0]?.message?.content;
  if (typeof c === 'string' && c.trim()) return c.trim();
  if (Array.isArray(c)) {
    const t = c.map(p => (typeof p === 'string' ? p : p?.text || '')).join('').trim();
    if (t) return t;
  }
  return '';
}

async function callEndpoint(url, key, model, messages, timeoutMs, { temperature = 0.5, maxTokens = 1500 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (key && key !== 'none') headers['Authorization'] = `Bearer ${key}`;
    headers['HTTP-Referer'] = 'https://acadex-r6z0.onrender.com';
    headers['X-Title'] = 'ACADEX';

    const res = await fetch(url, {
      method: 'POST',
      signal: ctrl.signal,
      headers,
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    return extract(data);
  } finally {
    clearTimeout(timer);
  }
}

export async function askTeacher({ history = [], user, context, learner, need, hurry = false, chat = false }) {
  if (process.env.DISABLE_LLM === '1') return null;
  let sys = SYSTEM;
  if (learner) sys += '\n\nSTUDENT FILE:\n' + learner;
  if (chat) {
    sys += '\n\nCONVERSATIONAL GOAL: Engage with intellectual depth, nuance, clarity, and inspiring mentorship. Answer the learner thoroughly.';
  } else if (need) {
    sys += `\nAfter teaching, ask only this in a natural, encouraging sentence: ${need}`;
  }
  if (/\b(draw|sketch|diagram|figure|triangle|graph|bearing|vector|circle|circuit)\b/i.test(String(user || ''))) {
    sys += '\nA diagram sketch is attached. Refer clearly to vertices, points, and axes.';
  }
  const messages = [{ role: 'system', content: sys }];
  const hist = hurry ? 6 : 12;
  for (const m of (history || []).slice(-hist)) {
    if (!m?.content) continue;
    messages.push({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content).slice(0, hurry ? 1000 : 2000),
    });
  }
  if (context) {
    messages.push({
      role: 'system',
      content: 'Trusted syllabus reference notes:\n' + String(context).slice(0, hurry ? 2000 : 3500),
    });
  }
  messages.push({ role: 'user', content: String(user || '').slice(0, hurry ? 2000 : 3000) });

  for (const ep of ENDPOINTS) {
    if (ep.key !== 'none' && !ep.key && ep.url.includes('api.llm7.io')) {
      // try pollinations or openrouter first if key is missing
    }
    for (const model of ep.models) {
      try {
        const text = await callEndpoint(ep.url, ep.key, model, messages, hurry ? 8000 : 16000, {
          temperature: chat ? 0.7 : 0.4,
          maxTokens: chat ? 1000 : 1500,
        });
        if (text && text.trim().length > 10) {
          const clean = text.replace(/as an AI|as an AI language model|OpenAI|ChatGPT|Claude|Anthropic/gi, 'ACADEX').trim();
          console.log('TEACHER SUCCESS', ep.url, model, clean.slice(0, 60).replace(/\n/g, ' '));
          return clean.slice(0, 3900);
        }
      } catch (e) {
        console.warn('TEACHER endpoint fail:', ep.url, model, e.message);
      }
    }
  }
  return null;
}
