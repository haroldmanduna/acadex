/** Voice notes — full working for THIS learner. Never Tatenda stock files. */
import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';

export const VOICE = {
  sn: { tts: 'sn', name: 'Shona' },
  nd: { tts: 'zu', name: 'Ndebele' },
  en: { tts: 'en', name: 'English' },
  ny: { tts: 'ny', name: 'Chewa' },
  chewa: { tts: 'ny', name: 'Chewa' },
  ndau: { tts: 'sn', name: 'Ndau' },
  kalanga: { tts: 'sn', name: 'Kalanga' },
  nambya: { tts: 'sn', name: 'Nambya' },
  shangani: { tts: 'ts', name: 'Shangani' },
  ts: { tts: 'ts', name: 'Shangani' },
  st: { tts: 'st', name: 'Sotho' },
  sotho: { tts: 'st', name: 'Sotho' },
  tn: { tts: 'tn', name: 'Tswana' },
  tswana: { tts: 'tn', name: 'Tswana' },
  ve: { tts: 've', name: 'Venda' },
  venda: { tts: 've', name: 'Venda' },
  xh: { tts: 'xh', name: 'Xhosa' },
  xhosa: { tts: 'xh', name: 'Xhosa' },
  to: { tts: 'en', name: 'Tonga' },
  tonga: { tts: 'en', name: 'Tonga' },
  chibarwe: { tts: 'sn', name: 'Chibarwe' },
  koisan: { tts: 'en', name: 'Koisan' },
  fr: { tts: 'fr', name: 'French' },
  pt: { tts: 'pt', name: 'Portuguese' },
};

export function wantsVoice(text) {
  return /\b(voice|voice[- ]?note|audio|speak|read it|read out|send voice|itaizwi|verza|play voice)\b/i.test(String(text || ''));
}

export function stripVoiceAsk(text) {
  return String(text || '')
    .replace(/\b(voice[- ]?note|send voice|read it out|read it|read out|play voice|itaizwi|verza|audio|speak|voice)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function detectLang(text, fallback = 'en') {
  const t = String(text || '');
  if (/\b(bonjour|salut|merci|je suis)\b/i.test(t)) return 'fr';
  if (/\b(ola|obrigad|voce)\b/i.test(t)) return 'pt';
  if (/\b(sawubona|yebo|ngiyabonga|isindebele|ndebele)\b/i.test(t)) return 'nd';
  if (/\b(ndinonzi|ndapota|chishona|mashizha|nekuti)\b/i.test(t)) return 'sn';
  if (/^mhoro\b/i.test(t.trim()) && t.split(/\s+/).length <= 4) return 'sn';
  if (/\b(xhosa|molo)\b/i.test(t)) return 'xh';
  if (/\b(sotho|lumela)\b/i.test(t)) return 'st';
  if (/\b(tswana|dumela)\b/i.test(t)) return 'tn';
  if (/\b(venda|ndaa)\b/i.test(t)) return 've';
  if (/\b(chewa|nyanja|moni)\b/i.test(t)) return 'ny';
  if (/\b(english|chirungu)\b/i.test(t) && t.split(/\s+/).length < 8) return 'en';
  if (/^[A-Za-z0-9 ,.'’?!+\-=x/()]+$/.test(t) && t.split(/\s+/).length > 4) return 'en';
  return fallback;
}

export function speechScript(answer, name) {
  let t = String(answer || '')
    .replace(/[*_#`$]/g, ' ')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\bCOMMAND WORD:[^\n.]*/gi, ' ')
    .replace(/\b(I am ACADEX|I'm ACADEX|Ndiri ACADEX|Ndirí ACADEX)\b/gi, ' ')
    .replace(/\bACADEX\.?/gi, ' ')
    .replace(/\bhey\s+[a-z]+\b/gi, ' ')
    .replace(/good to see you[^.]*\./gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const boxed = t.match(/\bx\s*=\s*[-0-9./]+/i);
  const who = (name && String(name).trim()) ? String(name).trim() + '. ' : '';
  let core = t;
  if (boxed) core = 'x equals ' + boxed[0].split('=')[1].trim() + '. ' + t;
  core = core.replace(/\s+/g, ' ').trim();
  return (who + core).slice(0, 720);
}

export function chunkSpeech(s, max = 170) {
  const parts = [];
  let left = String(s || '').trim();
  while (left.length) {
    if (left.length <= max) { parts.push(left); break; }
    let cut = left.lastIndexOf('. ', max);
    if (cut < 50) cut = left.lastIndexOf(' ', max);
    if (cut < 40) cut = max;
    parts.push(left.slice(0, cut + 1).trim());
    left = left.slice(cut + 1).trim();
  }
  return parts.filter(Boolean).slice(0, 5);
}

export function ttsCodeForScript(script, langHint) {
  if (/\b(ndi|kuti|nekuti|shizha|mubvunzo|mhoro|ndinonzi)\b/i.test(script)) return 'sn';
  if (/\b(yebo|ukuthi|sawubona)\b/i.test(script)) return 'zu';
  if (/\b(bonjour|merci)\b/i.test(script)) return 'fr';
  const hint = VOICE[langHint];
  if (hint && !/^[A-Za-z0-9 ,.'’?!x=\-]+$/.test(script)) return hint.tts;
  return 'en';
}

async function fetchChunk(tl, spoken) {
  const url = 'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl='
    + encodeURIComponent(tl) + '&q=' + encodeURIComponent(spoken);
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 ACADEX' }, signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error('tts ' + res.status);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 400) throw new Error('tiny tts');
  return buf;
}

export async function ttsFile(workspaceRoot, text, lang, name) {
  const spoken = speechScript(text, name);
  if (spoken.length < 8) return null;
  const tl = ttsCodeForScript(spoken, lang);
  const chunks = chunkSpeech(spoken, 170);
  const dir = path.join(workspaceRoot, 'audio', 'spoken');
  fs.mkdirSync(dir, { recursive: true });
  const hash = createHash('sha1').update(tl + ':' + spoken).digest('hex').slice(0, 16);
  const dest = path.join(dir, `${hash}.mp3`);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 2000) return dest;
  const bufs = [];
  for (const c of chunks) bufs.push(await fetchChunk(tl, c));
  const all = Buffer.concat(bufs);
  fs.writeFileSync(dest, all);
  return dest;
}
