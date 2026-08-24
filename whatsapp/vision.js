/** Ox Alpha (OpenRouter) — READ photos and short videos only.
 *  It cannot generate pictures or video. Chat stays on the existing tutor.
 *  Never send learner name, phone, or school to this endpoint.
 */
import fs from 'fs';
import path from 'path';

const OR_URL = process.env.OPENROUTER_URL || 'https://openrouter.ai/api/v1/chat/completions';
const OR_MODEL = process.env.OPENROUTER_VISION_MODEL || 'stealth/ox-alpha';
const MAX_IMAGE = 3_500_000;
const MAX_VIDEO = 8_000_000;

export const VISION = {
  readImage: true,
  readVideo: true,
  makeImage: false,
  makeVideo: false,
};

export function visionKey() {
  return process.env.OPENROUTER_KEY || process.env.OPENROUTER_API_KEY || '';
}

export function visionOn() {
  return process.env.DISABLE_VISION !== '1' && !!visionKey();
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

const READ_PROMPT = `Read this ZIMSEC O-Level exam photo or short clip for a marker.

Extract, in plain text only:
1. The full question (every number, unit, command word, part (a)(b)(c)).
2. Diagram labels (A, B, C, lengths, angles) if any.
3. Any working the learner already wrote.
4. Subject if clear: 4004 Maths, 5006 Combined Science, or 1122 English.

Rules:
- Do not invent a number you cannot see. If blurry, say BLURRY and what you can still read.
- No markdown. No asterisks. No "as an AI". Do not name any model.
- Start with a one-line QUESTION: then the rest.`;

function extractContent(data) {
  const c = data?.choices?.[0]?.message?.content;
  if (typeof c === 'string' && c.trim()) return c.trim();
  if (Array.isArray(c)) {
    const t = c.map(p => (typeof p === 'string' ? p : p?.text || '')).join('').trim();
    if (t) return t;
  }
  return '';
}

async function callOpenRouter(body, timeoutMs) {
  const key = visionKey();
  if (!key) throw new Error('no openrouter key');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(OR_URL, {
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
    if (res.status === 429) throw new Error('vision HTTP 429 rate-limited');
    if (!res.ok) throw new Error('vision HTTP ' + res.status + ' ' + String(data.error?.message || raw).slice(0, 180));
    const text = extractContent(data);
    if (!text) throw new Error('vision empty');
    return text;
  } finally {
    clearTimeout(timer);
  }
}

async function callOpenRouterRetry(body, timeoutMs) {
  let last = new Error('vision fail');
  for (let i = 0; i < 3; i++) {
    try {
      return await callOpenRouter(body, timeoutMs);
    } catch (e) {
      last = e;
      if (!/429|rate|timeout|abort/i.test(e.message) || i === 2) break;
      await new Promise(r => setTimeout(r, 1500 * (i + 1)));
    }
  }
  throw last;
}

export async function readVisual({ filePath, kind = 'image', mime, caption = '' } = {}) {
  if (process.env.DISABLE_VISION === '1') return null;
  if (!visionKey()) return null;
  if (!filePath || !fs.existsSync(filePath)) return { ok: false, reason: 'missing' };
  const st = fs.statSync(filePath);
  const isVideo = kind === 'video' || /^video\//.test(mime || '') || /\.(mp4|mov|webm)$/i.test(filePath);
  const max = isVideo ? MAX_VIDEO : MAX_IMAGE;
  if (st.size < 80) return { ok: false, reason: 'tiny' };
  if (st.size > max) {
    return {
      ok: false,
      reason: 'too-big',
      text: isVideo
        ? 'That video is too large to read here. Send a still photo of the question.'
        : 'That photo is too large. Send a clearer, closer shot of the question.',
    };
  }
  const buf = fs.readFileSync(filePath);
  const mt = mimeOf(isVideo ? 'video' : 'image', mime, filePath);
  const dataUrl = `data:${mt};base64,${buf.toString('base64')}`;
  const hint = String(caption || '').replace(/^\[(photo|image|video)\]$/i, '').trim();
  const textPart = hint
    ? READ_PROMPT + '\nLearner caption: ' + hint.slice(0, 400)
    : READ_PROMPT;
  const mediaPart = isVideo
    ? { type: 'video_url', video_url: { url: dataUrl } }
    : { type: 'image_url', image_url: { url: dataUrl } };
  const body = {
    model: OR_MODEL,
    temperature: 0.15,
    max_tokens: 1400,
    reasoning: { effort: 'low' },
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: textPart },
        mediaPart,
      ],
    }],
  };
  try {
    const text = await callOpenRouterRetry(body, isVideo ? 90000 : 50000);
    const clean = String(text)
      .replace(/\*\*/g, '')
      .replace(/stealth\/ox-alpha|ox-?alpha|openrouter|as an AI/gi, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .slice(0, 3500);
    const q = (clean.match(/QUESTION:\s*([^\n]+)/i) || [])[1] || '';
    return { ok: true, kind: isVideo ? 'video' : 'image', text: clean, question: q.slice(0, 500) };
  } catch (e) {
    console.warn('vision', e.message);
    if (isVideo && /video|invalid|unsupported|400/i.test(e.message)) {
      return { ok: false, reason: 'video-format', text: 'I cannot read that video clip. Send a still photo of the question.' };
    }
    return { ok: false, reason: e.message.slice(0, 80) };
  }
}

export function visionUserText(seen, incoming) {
  const cap = String(incoming || '').replace(/^\[(photo|image|video)\]$/i, '').trim();
  if (cap && !/^\[/.test(cap)) return cap;
  if (seen?.question) return seen.question;
  return 'Read the exam question and any working in this picture. Teach it as ZIMSEC marks.';
}
