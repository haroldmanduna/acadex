/** Link the owner's personal WhatsApp as a companion device (like WhatsApp Web).
 *  No Meta Cloud API tokens. Students message +263716987183 and ACADEX replies.
 *  Session files stay on disk — never commit them.
 */
import fs from 'fs';
import path from 'path';
import { enqueue, splitWhatsApp } from './inbox.js';
import { restoreSession, schedulePersist, clearRemoteSession } from './session-store.js';

const state = {
  status: 'idle',
  pairingCode: null,
  pairingRaw: null,
  qrDataUrl: null,
  me: null,
  error: null,
  since: null,
};

let sock = null;
let onMessage = async () => {};
let authDir = '';
let learnersFile = '';
let phoneDigits = '';
let restartTimer = null;
let lastPairAt = 0;
let connecting = false;
let sendLock = Promise.resolve();
const lastDropAt = new Map();

function withSendLock(fn) {
  const run = sendLock.then(fn, fn);
  sendLock = run.then(
    () => new Promise((r) => setTimeout(r, 80)),
    () => new Promise((r) => setTimeout(r, 80)),
  );
  return run;
}

export function getLinkStatus() {
  return {
    status: state.status,
    pairingCode: state.pairingCode,
    qrDataUrl: state.qrDataUrl,
    me: state.me,
    error: state.error,
    since: state.since,
    connected: state.status === 'connected',
  };
}

export function isLinked() {
  return state.status === 'connected' && !!sock;
}

function toJid(to) {
  const s = String(to || '');
  if (s.includes('@')) return s;
  const d = s.replace(/\D/g, '');
  return d ? `${d}@s.whatsapp.net` : s;
}

export async function sendPhoneText(to, text) {
  if (!sock) throw new Error('WhatsApp not linked');
  const parts = splitWhatsApp(String(text || ''), 3500);
  for (const part of parts) {
    await withSendLock(() => sock.sendMessage(toJid(to), { text: part }));
  }
}

export async function sendPhoneDocument(to, filePath, filename, caption) {
  if (!sock) throw new Error('WhatsApp not linked');
  const buf = fs.readFileSync(filePath);
  await withSendLock(() => sock.sendMessage(toJid(to), {
    document: buf,
    mimetype: 'application/pdf',
    fileName: filename || path.basename(filePath),
    caption: caption || undefined,
  }));
}

export async function sendPhoneImage(to, filePath, caption) {
  if (!sock) throw new Error('WhatsApp not linked');
  if (!fs.existsSync(filePath)) throw new Error('image missing');
  const buf = fs.readFileSync(filePath);
  await withSendLock(() => sock.sendMessage(toJid(to), {
    image: buf,
    caption: caption || undefined,
  }));
}

export async function sendPhoneAudio(to, filePath) {
  if (!sock) throw new Error('WhatsApp not linked');
  if (!fs.existsSync(filePath)) throw new Error('audio missing ' + filePath);
  const buf = fs.readFileSync(filePath);
  if (buf.length < 400) throw new Error('audio too small');
  // ptt:true + mpeg-24kHz often shows as a silent/grey note on WhatsApp. Send as a normal audio clip.
  await withSendLock(() => sock.sendMessage(toJid(to), {
    audio: buf,
    mimetype: 'audio/mpeg',
    ptt: false,
    fileName: 'ACADEX.mp3',
  }));
}

function pickBaileys(mod) {
  const merged = (mod.default && typeof mod.default === 'object')
    ? { ...mod, ...mod.default }
    : { ...mod };
  const makeWASocket = (typeof merged.default === 'function' ? merged.default : null)
    || merged.makeWASocket
    || (typeof mod.default === 'function' ? mod.default : null);
  return {
    makeWASocket,
    useMultiFileAuthState: merged.useMultiFileAuthState,
    DisconnectReason: merged.DisconnectReason || { loggedOut: 401 },
    fetchLatestBaileysVersion: merged.fetchLatestBaileysVersion,
    Browsers: merged.Browsers,
  };
}

function extractText(msg) {
  const m = msg.message || {};
  const inner = m.ephemeralMessage?.message || m.viewOnceMessageV2?.message || m;
  return (
    inner.conversation
    || inner.extendedTextMessage?.text
    || inner.imageMessage?.caption
    || inner.videoMessage?.caption
    || inner.documentMessage?.caption
    || inner.buttonsResponseMessage?.selectedButtonId
    || inner.templateButtonReplyMessage?.selectedId
    || inner.listResponseMessage?.singleSelectReply?.selectedRowId
    || (inner.imageMessage ? '[photo]' : '')
    || (inner.videoMessage ? '[video]' : '')
    || (inner.audioMessage ? '[audio]' : '')
    || (inner.documentMessage ? `[document ${inner.documentMessage.fileName || ''}]` : '')
    || ''
  );
}

function innerMessage(msg) {
  const m = msg?.message || {};
  return m.ephemeralMessage?.message || m.viewOnceMessageV2?.message || m;
}

async function saveIncomingMedia(msg) {
  const inner = innerMessage(msg);
  const img = inner.imageMessage;
  const vid = inner.videoMessage;
  if (!img && !vid) return null;
  const kind = img ? 'image' : 'video';
  const mime = (img || vid).mimetype || (kind === 'image' ? 'image/jpeg' : 'video/mp4');
  let buf = null;
  try {
    const baileys = await import('@whiskeysockets/baileys');
    const downloadMediaMessage = baileys.downloadMediaMessage || baileys.default?.downloadMediaMessage;
    if (typeof downloadMediaMessage === 'function') {
      buf = await downloadMediaMessage(msg, 'buffer', {});
    } else {
      const downloadContentFromMessage = baileys.downloadContentFromMessage || baileys.default?.downloadContentFromMessage;
      const media = img || vid;
      if (typeof downloadContentFromMessage !== 'function' || !media) return null;
      const stream = await downloadContentFromMessage(media, kind);
      const chunks = [];
      for await (const c of stream) chunks.push(c);
      buf = Buffer.concat(chunks);
    }
  } catch (e) {
    console.warn('media download', e.message);
    return null;
  }
  if (!buf || buf.length < 80) return null;
  const ext = /png/i.test(mime) ? 'png' : /webp/i.test(mime) ? 'webp' : kind === 'video' ? 'mp4' : 'jpg';
  const dir = path.join(path.dirname(authDir), '..', 'data', 'vision');
  fs.mkdirSync(dir, { recursive: true });
  const fp = path.join(dir, `${Date.now()}-${kind}.${ext}`);
  fs.writeFileSync(fp, buf);
  return { kind, mime, filePath: fp, bytes: buf.length };
}

function senderPhone(msg) {
  const jid = msg.key.remoteJid || '';
  const alt = msg.key.remoteJidAlt || msg.key.senderPn || msg.key.participant || '';
  const raw = (String(alt).includes('@s.whatsapp.net') ? alt : jid);
  return String(raw).split('@')[0].split(':')[0].replace(/\D/g, '');
}

function shouldIgnoreJid(jid) {
  if (!jid) return true;
  if (jid === 'status@broadcast') return true;
  if (jid.endsWith('@g.us') || jid.endsWith('@newsletter') || jid.endsWith('@broadcast')) return true;
  return false;
}

function wipeSessionKeepQr() {
  try {
    for (const f of fs.readdirSync(authDir)) {
      if (f === 'qr.png' || f === 'pairing.txt') continue;
      fs.rmSync(path.join(authDir, f), { recursive: true, force: true });
    }
  } catch { /* empty */ }
}

function scheduleRestart(ms) {
  if (restartTimer) return;
  state.status = 'reconnecting';
  restartTimer = setTimeout(() => {
    restartTimer = null;
    connect().catch((e) => {
      state.error = e.message;
      state.status = 'error';
      scheduleRestart(15000);
    });
  }, ms);
}

async function handleIncoming(msg) {
  try {
    if (!msg?.message || msg.key?.fromMe) return;
    if (msg.messageStubType) return;
    const jid = msg.key.remoteJid;
    if (shouldIgnoreJid(jid)) return;
    let text = extractText(msg).trim();
    if (!text) return;
    if (text.length > 60000) text = text.slice(0, 60000);
    const from = senderPhone(msg) || String(jid).split('@')[0];
    console.log(`WA IN ${from}: ${text.slice(0, 120)}`);
    try { if (sock?.readMessages) await sock.readMessages([msg.key]); } catch { /* ticks */ }
    const q = enqueue({
      from,
      jid,
      run: async () => {
        try { if (sock?.sendPresenceUpdate) await sock.sendPresenceUpdate('composing', jid); } catch { /* typing */ }
        let media = null;
        try { media = await saveIncomingMedia(msg); } catch (e) { console.warn('save media', e.message); }
        await onMessage({
          from,
          jid,
          text,
          msg,
          mediaPath: media?.filePath || '',
          mediaKind: media?.kind || '',
          mediaMime: media?.mime || '',
        });
      },
      onBusy: async ({ jid: to }) => {
        try {
          await sendPhoneText(to, 'Got you. A few students are ahead of you — stay in this chat, I will answer.');
        } catch { /* ignore */ }
      },
    });
    if (!q.accepted) {
      const phone = String(from || '').replace(/\D/g, '');
      const now = Date.now();
      if (now - (lastDropAt.get(phone) || 0) > 60000) {
        lastDropAt.set(phone, now);
        try { await sendPhoneText(jid, 'One question at a time. I am on it.'); } catch { /* ignore */ }
      }
    }
  } catch (e) {
    console.error('phone-link incoming', e.message);
  }
}

async function connect() {
  if (connecting) return;
  connecting = true;
  lastPairAt = 0;
  state.error = null;
  state.status = 'starting';

  const baileysMod = await import('@whiskeysockets/baileys');
  const QRCode = (await import('qrcode')).default;
  const pino = (await import('pino')).default;
  const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = pickBaileys(baileysMod);

  if (typeof makeWASocket !== 'function' || typeof useMultiFileAuthState !== 'function') {
    connecting = false;
    throw new Error('Baileys failed to load — run npm install --prefix whatsapp');
  }

  fs.mkdirSync(authDir, { recursive: true });
  try { await restoreSession(authDir); } catch (e) { console.warn('restore session', e.message); }
  const { state: authState, saveCreds } = await useMultiFileAuthState(authDir);

  let version;
  try {
    if (typeof fetchLatestBaileysVersion === 'function') {
      const v = await Promise.race([
        fetchLatestBaileysVersion(),
        new Promise((_, rej) => setTimeout(() => rej(new Error('version-timeout')), 8000)),
      ]);
      version = v.version;
    }
  } catch (e) {
    console.warn('baileys version fetch skipped', e.message);
  }

  const sockOpts = {
    auth: authState,
    logger: pino({ level: 'silent' }),
    markOnlineOnConnect: true,
    syncFullHistory: false,
    keepAliveIntervalMs: 25_000,
    connectTimeoutMs: 60_000,
    defaultQueryTimeoutMs: 60_000,
  };
  if (version) sockOpts.version = version;
  if (Browsers?.ubuntu) sockOpts.browser = Browsers.ubuntu('Chrome');
  else sockOpts.browser = ['Ubuntu', 'Chrome', '22.04'];

  sock = makeWASocket(sockOpts);
  connecting = false;

  sock.ev.on('creds.update', async () => {
    try { await saveCreds(); } catch (e) { console.warn('saveCreds', e.message); }
    schedulePersist(authDir, learnersFile);
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    try {
      if (qr) {
        state.status = 'waiting';
        try {
          state.qrDataUrl = await QRCode.toDataURL(qr, { margin: 1, width: 280, color: { dark: '#0a7a3c', light: '#ffffff' } });
          await QRCode.toFile(path.join(authDir, 'qr.png'), qr, { margin: 1, width: 360 });
        } catch (e) {
          console.warn('qr image', e.message);
        }
        const registered = !!sock?.authState?.creds?.registered;
        if (!registered && phoneDigits && Date.now() - lastPairAt > 15000) {
          lastPairAt = Date.now();
          try {
            const code = await sock.requestPairingCode(phoneDigits);
            const raw = String(code || '').replace(/\s/g, '').toUpperCase();
            state.pairingRaw = raw;
            state.pairingCode = raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : raw;
            fs.writeFileSync(path.join(authDir, 'pairing.txt'), state.pairingCode);
            console.log(`PHONE LINK code for +${phoneDigits}: ${state.pairingCode}`);
          } catch (e) {
            console.warn('pairing code', e.message);
            state.error = e.message;
          }
        }
      }

      if (connection === 'open') {
        state.status = 'connected';
        state.pairingCode = null;
        state.qrDataUrl = null;
        state.error = null;
        state.since = new Date().toISOString();
        const id = sock.user?.id || '';
        state.me = String(id).split(':')[0].split('@')[0] || phoneDigits;
        console.log(`PHONE LINK live as +${state.me}`);
        schedulePersist(authDir, learnersFile);
        try {
          await sock.sendMessage(`${phoneDigits}@s.whatsapp.net`, {
            text: '✅ ACADEX is live 24/7 on this WhatsApp. Students can just say hi — no code word. Keep this phone number; you do not need to stay in the chat.',
          });
        } catch (e) {
          console.warn('self-notify', e.message);
        }
      }

      if (connection === 'close') {
        sock = null;
        const err = lastDisconnect?.error;
        const code = err?.output?.statusCode || err?.status || 0;
        const loggedOut = code === (DisconnectReason.loggedOut || 401) || code === 401 || code === 440;
        console.warn('PHONE LINK closed', code, err?.message || '');
        if (loggedOut) {
          state.status = 'logged-out';
          state.pairingCode = null;
          wipeSessionKeepQr();
          clearRemoteSession(authDir).finally(() => scheduleRestart(8000));
        } else {
          scheduleRestart(code === 408 ? 20000 : 8000);
        }
      }
    } catch (e) {
      console.error('connection.update', e.message);
    }
  });

  sock.ev.on('messages.upsert', ({ messages }) => {
    for (const msg of messages || []) handleIncoming(msg);
  });
}

export async function startPhoneLink(opts = {}) {
  authDir = opts.authDir;
  learnersFile = opts.learnersFile || '';
  phoneDigits = String(opts.phone || '').replace(/\D/g, '');
  onMessage = opts.onMessage || onMessage;
  if (!authDir) throw new Error('authDir required');
  if (!phoneDigits) throw new Error('phone required');
  fs.mkdirSync(authDir, { recursive: true });
  console.log(`PHONE LINK starting for +${phoneDigits} (session ${authDir})`);
  await connect();
}
