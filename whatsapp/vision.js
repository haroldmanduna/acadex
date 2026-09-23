/** ACADEX Master Vision & Multimodal OCR Engine
 *  Reads photos, flyers, handwritten exam scripts, and diagrams with high precision.
 *  Uses OpenRouter multimodal models + OCR Space API fallback.
 */
import fs from 'fs';
import path from 'path';

const OR_URL = process.env.OPENROUTER_URL || 'https://openrouter.ai/api/v1/chat/completions';
const VISION_MODELS = [
  'google/gemini-2.0-flash-001',
  'openai/gpt-4o-mini',
  'qwen/qwen-2.5-vl-72b-instruct:free',
  'anthropic/claude-3.5-haiku',
  'meta-llama/llama-3.2-11b-vision-instruct',
  'google/gemini-flash-1.5'
];

const MAX_IMAGE = 8_000_000;
const MAX_VIDEO = 15_000_000;

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
  return true;
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

const READ_PROMPT = `You are ACADEX, an intelligent Senior Educator and OCR analyst.
Read this image (which may be a ZIMSEC exam paper, handwritten student calculation, flyer, diagram, or document) accurately and thoroughly.

Transcribe all visible text, headings, bullet points, numbers, algebraic expressions, diagram labels, and details clearly.
Start with:
TRANSCRIPTION:
<complete text and contents of the image>`;

function extractContent(data) {
  const c = data?.choices?.[0]?.message?.content;
  if (typeof c === 'string' && c.trim()) return c.trim();
  if (Array.isArray(c)) {
    const t = c.map(p => (typeof p === 'string' ? p : p?.text || '')).join('').trim();
    if (t) return t;
  }
  return '';
}

async function callOCRSpace(dataUrl) {
  const form = new URLSearchParams();
  form.append("base64Image", dataUrl);
  form.append("language", "eng");
  form.append("isOverlayRequired", "false");
  form.append("detectOrientation", "true");
  form.append("scale", "true");
  form.append("OCREngine", "2");

  const keys = ["helloworld", "K87899142388957"];
  for (const k of keys) {
    try {
      const res = await fetch("https://api.ocr.space/parse/image", {
        method: "POST",
        headers: {
          "apikey": k,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: form.toString()
      });
      if (res.ok) {
        const data = await res.json();
        const text = data?.ParsedResults?.[0]?.ParsedText?.trim();
        if (text && text.length > 5) {
          return text;
        }
      }
    } catch (e) {
      console.warn("OCRSpace fail:", e.message);
    }
  }
  return null;
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

  // 1. Try OpenRouter vision if key is available
  const key = visionKey();
  if (key) {
    const textPart = hint ? `${READ_PROMPT}\nCaption: ${hint.slice(0, 400)}` : READ_PROMPT;
    const mediaPart = isVideo
      ? { type: 'video_url', video_url: { url: dataUrl } }
      : { type: 'image_url', image_url: { url: dataUrl } };

    for (const model of VISION_MODELS) {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), isVideo ? 50000 : 25000);
        const res = await fetch(OR_URL, {
          method: 'POST',
          signal: ctrl.signal,
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://acadex-r6z0.onrender.com',
            'X-Title': 'ACADEX',
          },
          body: JSON.stringify({
            model,
            temperature: 0.1,
            max_tokens: 1500,
            messages: [{
              role: 'user',
              content: [{ type: 'text', text: textPart }, mediaPart],
            }],
          }),
        });
        clearTimeout(timer);
        if (res.ok) {
          const data = await res.json();
          const clean = extractContent(data).trim();
          if (clean && clean.length > 5) {
            const q = clean.replace(/^TRANSCRIPTION:\s*/i, '').split('\n')[0] || '';
            return { ok: true, kind: isVideo ? 'video' : 'image', text: clean, question: q.slice(0, 600) };
          }
        }
      } catch (e) {
        console.warn(`Vision model ${model} error:`, e.message);
      }
    }
  }

  // 2. High-speed OCR Space Extraction Fallback (Works 100% without OpenRouter key)
  try {
    const ocrText = await callOCRSpace(dataUrl);
    if (ocrText && ocrText.length > 5) {
      const q = ocrText.split('\n')[0] || '';
      return {
        ok: true,
        kind: 'image',
        text: `TRANSCRIPTION FROM IMAGE:\n${ocrText}`,
        question: q.slice(0, 600)
      };
    }
  } catch (e) {
    console.warn("OCRSpace fallback error:", e.message);
  }

  return { ok: false, reason: 'unable to parse image' };
}

export function visionUserText(seen, incoming) {
  const cap = String(incoming || '').replace(/^\[(photo|image|video)\]$/i, '').trim();
  const textBody = seen?.text || seen?.question || '';
  if (cap && !/^\[/.test(cap)) {
    return `${cap}\n\n[Image Content]:\n${textBody}`;
  }
  return `I have shared this image. Here is the extracted content:\n\n${textBody}\n\nPlease analyze and explain this in a helpful, intelligent manner.`;
}
