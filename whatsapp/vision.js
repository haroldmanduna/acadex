/** ACADEX Master Vision & Multimodal OCR Engine
 *  Reads photos, handwritten exam scripts, geometric diagrams, and short clips with high accuracy.
 *  Uses multi-model fallback pipeline (Gemini 2.0 Flash, GPT-4o-mini, Claude 3.5 Haiku, Qwen 2.5 VL, Ox Alpha).
 */
import fs from 'fs';
import path from 'path';

const OR_URL = process.env.OPENROUTER_URL || 'https://openrouter.ai/api/v1/chat/completions';
const LLM_URL = process.env.LLM_URL || 'https://api.llm7.io/v1/chat/completions';
const LLM_KEY = process.env.LLM_KEY || '';

const VISION_MODELS = [
  process.env.OPENROUTER_VISION_MODEL,
  'google/gemini-2.0-flash-001',
  'google/gemini-flash-1.5',
  'openai/gpt-4o-mini',
  'qwen/qwen-2.5-vl-72b-instruct:free',
  'anthropic/claude-3-5-haiku',
  'meta-llama/llama-3.2-11b-vision-instruct',
  'stealth/ox-alpha'
].filter(Boolean);

const MAX_IMAGE = 5_000_000;
const MAX_VIDEO = 12_000_000;

export const VISION = {
  readImage: true,
  readVideo: true,
  makeImage: false,
  makeVideo: false,
};

export function visionKey() {
  return process.env.OPENROUTER_KEY || process.env.OPENROUTER_API_KEY || process.env.LLM_KEY || '';
}

export function visionOn() {
  return process.env.DISABLE_VISION !== '1' && (!!visionKey() || !!LLM_KEY);
}

function mimeOf(kind, given, filePath) {
  if (given && /^[a-z]+\/[a-z0-9.+-]+$/i.test(given)) return given;
  const ext = path.extname(String(filePath || '')).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.mp4') return 'video/mp4';
  if (ext === '.mov') return 'video/quicktime';
  if (ext === '.webm') return 'video/webm';
  return kind === 'video' ? 'video/mp4' : 'image/jpeg';
}

const READ_PROMPT = `You are a Senior ZIMSEC National Exam Examiner and OCR transcriber.
Read this ZIMSEC exam photo, handwritten student script, diagram, or textbook page accurately.

Accurately transcribe:
1. QUESTION: The full question text, including all numbers, algebraic expressions, fractions, powers, units, and sub-parts (a), (b), (c).
2. DIAGRAM_LABELS: All labels, points (A, B, C, D), angles (e.g. 90°, 35°), lengths, bearings, forces, or circuit components.
3. STUDENT_WORKING: Any handwritten working, steps, or answers written by the student.
4. SUBJECT: Identify the subject (e.g. Mathematics 4004, Combined Science 5006, English 1122, Grade 7 702/703, Pure Maths 6042, Accounts 7110, History 2167).

Format rules:
- Start directly with "QUESTION: <full transcription>"
- If the image is blurry, extract what is visible and note [blurry section].
- Transcribe mathematical notation clearly (e.g., 3x^2 + 5x - 7 = 0, 1/2 bh, sqrt(16)).`;

function extractContent(data) {
  const c = data?.choices?.[0]?.message?.content;
  if (typeof c === 'string' && c.trim()) return c.trim();
  if (Array.isArray(c)) {
    const t = c.map(p => (typeof p === 'string' ? p : p?.text || '')).join('').trim();
    if (t) return t;
  }
  return '';
}

async function callEndpoint(url, key, body, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        Authorization: 'Bearer ' + key,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.PUBLIC_URL || 'https://acadex-r6z0.onrender.com',
        'X-Title': 'ACADEX',
      },
      body: JSON.stringify(body),
    });
    const raw = await res.text();
    let data = {};
    try { data = JSON.parse(raw); } catch { data = { raw: raw.slice(0, 200) }; }
    if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + String(data.error?.message || raw).slice(0, 180));
    const text = extractContent(data);
    if (!text) throw new Error('empty vision response');
    return text;
  } finally {
    clearTimeout(timer);
  }
}

export async function readVisual({ filePath, kind = 'image', mime, caption = '' } = {}) {
  if (process.env.DISABLE_VISION === '1') return null;
  if (!filePath || !fs.existsSync(filePath)) return { ok: false, reason: 'missing' };
  
  const st = fs.statSync(filePath);
  const isVideo = kind === 'video' || /^video\//.test(mime || '') || /\.(mp4|mov|webm)$/i.test(filePath);
  const max = isVideo ? MAX_VIDEO : MAX_IMAGE;
  if (st.size < 50) return { ok: false, reason: 'tiny' };
  if (st.size > max) {
    return {
      ok: false,
      reason: 'too-big',
      text: isVideo
        ? 'That video is too large to process. Please send a clear still photo of the question.'
        : 'That photo is too large. Send a closer, clear photo of the question.',
    };
  }

  const buf = fs.readFileSync(filePath);
  const mt = mimeOf(isVideo ? 'video' : 'image', mime, filePath);
  const dataUrl = `data:${mt};base64,${buf.toString('base64')}`;
  const hint = String(caption || '').replace(/^\[(photo|image|video)\]$/i, '').trim();
  const textPart = hint
    ? `${READ_PROMPT}\nStudent Caption: ${hint.slice(0, 400)}`
    : READ_PROMPT;

  const mediaPart = isVideo
    ? { type: 'video_url', video_url: { url: dataUrl } }
    : { type: 'image_url', image_url: { url: dataUrl } };

  const key = visionKey();
  const endpoints = [
    { url: OR_URL, key: key || 'unused' },
    { url: LLM_URL, key: LLM_KEY || key || 'unused' }
  ];

  let lastErr = null;
  for (const model of VISION_MODELS) {
    for (const ep of endpoints) {
      if (!ep.key) continue;
      const body = {
        model: model,
        temperature: 0.1,
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: textPart },
            mediaPart,
          ],
        }],
      };

      try {
        const text = await callEndpoint(ep.url, ep.key, body, isVideo ? 60000 : 35000);
        if (text && text.length > 5) {
          const clean = String(text)
            .replace(/\*\*/g, '')
            .replace(/stealth\/ox-alpha|ox-?alpha|openrouter|as an AI/gi, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim()
            .slice(0, 3800);
          const q = (clean.match(/QUESTION:\s*([^\n]+)/i) || [])[1] || clean.split('\n')[0] || '';
          return { ok: true, kind: isVideo ? 'video' : 'image', text: clean, question: q.slice(0, 600) };
        }
      } catch (e) {
        lastErr = e;
        console.warn(`Vision model ${model} failed on ${ep.url}:`, e.message);
      }
    }
  }

  return { ok: false, reason: lastErr ? lastErr.message.slice(0, 100) : 'vision unavailable' };
}

export function visionUserText(seen, incoming) {
  const cap = String(incoming || '').replace(/^\[(photo|image|video)\]$/i, '').trim();
  if (cap && !/^\[/.test(cap)) return `${cap}\n\n[Transcribed Question]: ${seen?.question || seen?.text || ''}`;
  if (seen?.question) return seen.question;
  if (seen?.text) return seen.text;
  return 'Solve this ZIMSEC exam question step-by-step with full method marks.';
}
