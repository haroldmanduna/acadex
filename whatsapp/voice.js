/** Voice notes — Zimbabwe languages + Google TTS for the actual working. */
import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';

export const VOICE = {
  sn: { tts: 'sn', file: 'shona-solve.mp3', name: 'Shona' },
  nd: { tts: 'zu', file: 'ndebele-solve.mp3', name: 'Ndebele' },
  en: { tts: 'en', file: 'english-solve.mp3', name: 'English' },
  ny: { tts: 'ny', file: 'chewa-solve.mp3', name: 'Chewa' },
  chewa: { tts: 'ny', file: 'chewa-solve.mp3', name: 'Chewa' },
  ndau: { tts: 'sn', file: 'ndau-solve.mp3', name: 'Ndau' },
  kalanga: { tts: 'sn', file: 'kalanga-solve.mp3', name: 'Kalanga' },
  nambya: { tts: 'sn', file: 'nambya-solve.mp3', name: 'Nambya' },
  shangani: { tts: 'ts', file: 'shangani-solve.mp3', name: 'Shangani' },
  ts: { tts: 'ts', file: 'shangani-solve.mp3', name: 'Shangani' },
  st: { tts: 'st', file: 'sotho-solve.mp3', name: 'Sotho' },
  sotho: { tts: 'st', file: 'sotho-solve.mp3', name: 'Sotho' },
  tn: { tts: 'tn', file: 'tswana-solve.mp3', name: 'Tswana' },
  tswana: { tts: 'tn', file: 'tswana-solve.mp3', name: 'Tswana' },
  ve: { tts: 've', file: 'venda-solve.mp3', name: 'Venda' },
  venda: { tts: 've', file: 'venda-solve.mp3', name: 'Venda' },
  xh: { tts: 'xh', file: 'xhosa-solve.mp3', name: 'Xhosa' },
  xhosa: { tts: 'xh', file: 'xhosa-solve.mp3', name: 'Xhosa' },
  to: { tts: 'en', file: 'tonga-solve.mp3', name: 'Tonga' },
  tonga: { tts: 'en', file: 'tonga-solve.mp3', name: 'Tonga' },
  chibarwe: { tts: 'sn', file: 'chibarwe-solve.mp3', name: 'Chibarwe' },
  koisan: { tts: 'en', file: 'koisan-solve.mp3', name: 'Koisan' },
  fr: { tts: 'fr', file: 'english-solve.mp3', name: 'French' },
  pt: { tts: 'pt', file: 'english-solve.mp3', name: 'Portuguese' },
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

export function detectLang(text, fallback = 'sn') {
  const t = String(text || '');
  if (/\b(bonjour|salut|merci|je suis)\b/i.test(t)) return 'fr';
  if (/\b(ola|obrigad|voce)\b/i.test(t)) return 'pt';
  if (/\b(sawubona|yebo|ngiyabonga|isiNdebele|ndebele)\b/i.test(t)) return 'nd';
  if (/\b(mhoro|ndinonzi|ndiri|maita|ndapota|chiShona|shona|mashizha)\b/i.test(t)) return 'sn';
  if (/\b(xhosa|molo)\b/i.test(t)) return 'xh';
  if (/\b(sotho|lumela)\b/i.test(t)) return 'st';
  if (/\b(tswana|dumela)\b/i.test(t)) return 'tn';
  if (/\b(venda|ndaa)\b/i.test(t)) return 've';
  if (/\b(chewa|nyanja|moni)\b/i.test(t)) return 'ny';
  if (/\b(english|chirungu)\b/i.test(t) && t.split(/\s+/).length < 8) return 'en';
  if (/^[A-Za-z0-9 ,.'’?!+\-=x/()]+$/.test(t) && !/[àáâãéêèíóôúũŵ]/i.test(t) && t.split(/\s+/).length > 6) return 'en';
  return fallback;
}

export function stockVoice(workspaceRoot, lang) {
  const meta = VOICE[lang] || VOICE.sn;
  const fp = path.join(workspaceRoot, 'audio', meta.file);
  return fs.existsSync(fp) ? fp : path.join(workspaceRoot, 'audio', 'shona-solve.mp3');
}

function speakable(text) {
  return String(text || '')
    .replace(/[*_#`]/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
}

export async function ttsFile(workspaceRoot, text, lang) {
  const meta = VOICE[lang] || VOICE.en;
  const spoken = speakable(text);
  if (spoken.length < 8) return stockVoice(workspaceRoot, lang);
  const dir = path.join(workspaceRoot, 'audio', 'spoken');
  fs.mkdirSync(dir, { recursive: true });
  const hash = createHash('sha1').update(lang + ':' + spoken).digest('hex').slice(0, 16);
  const dest = path.join(dir, `${hash}.mp3`);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) return dest;
  const url = 'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl='
    + encodeURIComponent(meta.tts) + '&q=' + encodeURIComponent(spoken);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 ACADEX' }, signal: AbortSignal.timeout(12000) });
    if (!res.ok) throw new Error('tts ' + res.status);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 500) throw new Error('tiny tts');
    fs.writeFileSync(dest, buf);
    return dest;
  } catch (e) {
    console.warn('tts', e.message);
    return stockVoice(workspaceRoot, lang);
  }
}
