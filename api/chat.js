import { askTeacher } from '../whatsapp/teacher.js';
import { solveMath, explainScience, helpEnglish, teachConcept, fallback } from '../whatsapp/brain.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { message, history = [], learner = {} } = req.body || {};
    const text = String(message || '').trim();
    if (!text) {
      return res.status(400).json({ ok: false, error: 'Empty message' });
    }

    // Build authoritative syllabus context
    let ctx = '';
    const math = solveMath(text);
    if (math) {
      const steps = (math.steps || []).map((s, i) => `${i + 1}. ${s.t}: ${s.d}`).join('; ');
      ctx += `\nMATH ENGINE: Result = ${math.answer}. Steps: ${steps}.`;
    }
    const sci = explainScience(text);
    if (sci) ctx += `\nSCIENCE ENGINE: ${sci.title}. Key Points: ${sci.answer}`;
    const eng = helpEnglish(text);
    if (eng) ctx += `\nENGLISH ENGINE: ${eng.title}. Points: ${eng.answer}`;
    const concept = teachConcept(text);
    if (concept) ctx += `\nCONCEPT ENGINE: ${concept.title}. Details: ${concept.answer}`;

    const learnerStr = learner?.name
      ? `Student Name: ${learner.name}, Grade: ${learner.grade || 'O-Level'}, School: ${learner.school || 'Zimbabwe'}`
      : '';

    const llmReply = await askTeacher({
      history: (history || []).slice(-10),
      user: text,
      context: ctx,
      learner: learnerStr,
      chat: true,
    });

    if (llmReply) {
      return res.status(200).json({ ok: true, source: 'teacher-llm', reply: llmReply });
    }

    // High quality offline fallback
    if (math) {
      const steps = (math.steps || []).map((s, i) => `${i + 1}. ${s.t}: ${s.d}`).join('\n');
      return res.status(200).json({
        ok: true,
        source: 'math-solver',
        reply: `📐 *Step-by-Step ZIMSEC Working:*\nEquation: \`${text}\`\n\n${steps}\n\n🏆 **Final Result:** \`${math.kind === 'linear' || math.kind === 'quad' ? 'x = ' : ''}${math.answer}\`\n\n📌 *Examiner Note:* Method marks (M1) awarded for correct substitution.`,
      });
    }
    if (sci) return res.status(200).json({ ok: true, source: 'science-engine', reply: `🔬 *${sci.title}:*\n\n${sci.answer}` });
    if (concept) return res.status(200).json({ ok: true, source: 'concept-engine', reply: concept.answer });

    return res.status(200).json({ ok: true, source: 'fallback', reply: fallback(text) });
  } catch (err) {
    console.warn('API /api/chat error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
