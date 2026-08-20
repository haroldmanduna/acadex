/** Link the owner's personal WhatsApp as a companion device (like WhatsApp Web).
 *  No Meta Cloud API tokens. Students message +263716987183 and ACADEX replies.
 *  Session files stay on disk — never commit them.
 */
import fs from 'fs';
import path from 'path';

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
let phoneDigits = '';
let restartTimer = null;
let lastPairAt = 0;
let connecting = false;

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
  await sock.sendMessage(toJid(to), { text: String(text || '').slice(0, 4000) });
}

export async function sendPhoneDocument(to, filePath, filename, caption) {
  if (!sock) throw new Error('WhatsApp not linked');
  const buf = fs.readFileSync(filePath);
  await sock.sendMessage(toJid(to), {
    document: buf,
    mimetype: 'application/pdf',
    fileName: filename || path.basename(filePath),
    caption: caption || undefined,
  });
}

export async function sendPhoneAudio(to, filePath) {
  if (!sock) throw new Error('WhatsApp not linked');
  const buf = fs.readFileSync(filePath);
  await sock.sendMessage(toJid(to), {
    audio: buf,
    mimetype: 'audio/mpeg',
    ptt: true,
  });
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
    || (inner.audioMessage ? '[audio]' : '')
    || (inner.documentMessage ? `[document ${inner.documentMessage.fileName || ''}]` : '')
    || ''
  );
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
    const text = extractText(msg).trim();
    if (!text) return;
    const from = senderPhone(msg) || String(jid).split('@')[0];
    console.log(`WA IN ${from}: ${text.slice(0, 120)}`);
    await onMessage({ from, jid, text, msg });
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
  const { state: authState, saveCreds } = await useMultiFileAuthState(authDir);

  let version;
  try {
    if (typeof fetchLatestBaileysVersion === 'function') {
      const v = await fetchLatestBaileysVersion();
      version = v.version;
    }
  } catch (e) {
    console.warn('baileys version fetch skipped', e.message);
  }

  const sockOpts = {
    auth: authState,
    logger: pino({ level: 'silent' }),
    markOnlineOnConnect: false,
    syncFullHistory: false,
    connectTimeoutMs: 60_000,
    defaultQueryTimeoutMs: 60_000,
  };
  if (version) sockOpts.version = version;
  if (Browsers?.ubuntu) sockOpts.browser = Browsers.ubuntu('Chrome');
  else sockOpts.browser = ['Ubuntu', 'Chrome', '22.04'];

  sock = makeWASocket(sockOpts);
  connecting = false;

  sock.ev.on('creds.update', saveCreds);

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
        try {
          await sock.sendMessage(`${phoneDigits}@s.whatsapp.net`, {
            text: '✅ ACADEX is now auto-replying on this WhatsApp.\n\nStudents send: *mhoro acadex*\nThen: HELP · 2x+3=11 · Download 2024 Maths Paper 1 · photosynthesis · composition\n\nTo unlink: WhatsApp → Linked devices → log out this device.',
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
          scheduleRestart(3000);
        } else {
          scheduleRestart(5000);
        }
      }
    } catch (e) {
      console.error('connection.update', e.message);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages || []) await handleIncoming(msg);
  });
}

export async function startPhoneLink(opts = {}) {
  authDir = opts.authDir;
  phoneDigits = String(opts.phone || '').replace(/\D/g, '');
  onMessage = opts.onMessage || onMessage;
  if (!authDir) throw new Error('authDir required');
  if (!phoneDigits) throw new Error('phone required');
  fs.mkdirSync(authDir, { recursive: true });
  console.log(`PHONE LINK starting for +${phoneDigits} (session ${authDir})`);
  await connect();
}
