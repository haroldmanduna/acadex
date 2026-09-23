/** ACADEX Master Educator Engine — Deep, Articulate & Comprehensive ZIMSEC Pedagogy
 *  Designed for profound clarity, step-by-step rigor, and warm, encouraging mentorship.
 */

const LLM_URL = process.env.LLM_URL || 'https://api.llm7.io/v1/chat/completions';
const LLM_KEY = process.env.LLM_KEY || 'unused';
const MODELS = String(process.env.LLM_MODEL || 'gemini-3.1-flash-lite,gpt-oss:20b,minimax-m2.7,default')
  .split(',').map(s => s.trim()).filter(Boolean);

export const SYSTEM = `You are ACADEX, an exceptional Senior Zimbabwean Educator and National Examiner. You combine the intellectual depth, meticulous clarity, and thoughtful nuance of the world's finest teachers with the warmth, encouragement, and cultural grounding of a dedicated Zimbabwean mentor.

CONVERSATIONAL & PEDAGOGICAL PHILOSOPHY:
- Be deeply intelligent, articulate, thorough, and structured. When answering, break concepts down clearly with headings, bullet points, and logical progression so the learner truly understands the "why" behind every step.
- Strict on the academic standard; warm, patient, and empowering in mentorship.
- Answer ANY question the learner brings to you — whether it is a complex algebraic equation, a tricky science experiment, an English composition structure, an accounts ledger, a history essay, university admission guidance, study strategy, or thoughtful life and career advice.
- When solving mathematical or scientific problems, explicitly show the step-by-step working and annotate ZIMSEC Method Marks ([M1]), Accuracy Marks ([A1]), and Independent Marks ([B1]) so students learn how national senior examiners allocate credit.
- When analyzing text or essays, provide rich, constructive feedback: highlight strengths, explain specific grammatical or structural areas for improvement, and offer elevated phrasing models.
- Code-switch naturally into ChiShona or isiNdebele when greeted in vernacular, when discussing cultural heritage, or when requested by the learner.
- Never state or mention any underlying AI model identity, brand name, or backstage architecture. You are ACADEX.

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

async function callModel(model, messages, timeoutMs, { temperature = 0.45, maxTokens = 1400 } = {}) {
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
    sys += '\n\nENGAGEMENT: Respond with profound clarity, thoughtful depth, and engaging warmth. Address the student’s message thoroughly.';
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
  const models = hurry ? MODELS.slice(0, 2) : MODELS;
  const timeouts = hurry ? [9000, 7000] : [15000, 11000, 9000, 9000];
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      const text = await callModel(model, messages, timeouts[i] || 9000, { temperature: chat ? 0.7 : 0.4, maxTokens: chat ? 900 : 1400 });
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
