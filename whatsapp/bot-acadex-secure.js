// ACADEX - SECURE WhatsApp Bot (Trigger-Only + Admin Locked) — +263716987183
import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  loadBank, handleTurn, solveLinear, incrementUse,
  getUser, isPaid, canUse, listUsers, sessionPhones,
  activateUser, resetFree, FREE_LIMIT,
} from './tutor.js';
import { inboxStats } from './inbox.js';
import { startKeepAlive, keepaliveState } from './keepalive.js';
import { restoreLearners, schedulePersist, sessionStoreMode } from './session-store.js';
import { visionOn } from './vision.js';
import { getSupabaseStatus, initSupabase } from './supabase-sync.js';
import { getAvailablePapersMenu } from './papers.js';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.join(__dirname, '..');

const app = express();
app.use(express.json({
  verify: (req, res, buf) => { req.rawBody = buf; }
}));
app.use(express.urlencoded({ extended: true }));

app.get('/download/pdfs/:file', (req, res) => {
  const file = path.basename(req.params.file || '');
  if (!/^[A-Za-z0-9_.-]+\.pdf$/.test(file)) return res.status(400).send('bad filename');
  const fp = path.join(workspaceRoot, 'pdfs', file);
  if (!fp.startsWith(path.join(workspaceRoot, 'pdfs'))) return res.sendStatus(400);
  res.download(fp, file, err => {
    if (err && !res.headersSent) res.status(404).send('PDF not found');
  });
});
app.use(express.static(workspaceRoot));
app.use('/audio', express.static(path.join(workspaceRoot, 'audio')));
app.use('/manifest.json', (req,res)=>res.sendFile(path.join(workspaceRoot, 'manifest.json')));
app.use('/sw.js', (req,res)=>res.sendFile(path.join(workspaceRoot, 'sw.js')));

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'acadex-verify-2026';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || '';
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID || '';
const PUBLIC_URL = process.env.PUBLIC_URL || 'https://acadex-r6z0.onrender.com';
const ADMIN_PHONE = (process.env.ADMIN_PHONE || '263716987183').replace(/\D/g,'');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const TRIGGER_PHRASE = (process.env.TRIGGER_PHRASE || 'mhoro acadex').toLowerCase();
const SESSION_MINUTES = parseInt(process.env.SESSION_MINUTES || '10080');
const APP_SECRET = process.env.APP_SECRET || '';
const BANK = loadBank(workspaceRoot);
const learnersFile = path.join(workspaceRoot, 'data', 'learners.json');

// Initialize cloud sync
initSupabase().catch(() => {});

restoreLearners(learnersFile).then((r) => {
  if (r?.restored) loadBank(workspaceRoot);
}).catch(() => {});

console.log(`Acadex Secure Bot | Trigger: "${TRIGGER_PHRASE}" | Session: ${SESSION_MINUTES}min | Admin: ${ADMIN_PHONE || 'NOT SET'} | Papers: ${(BANK.papers||[]).length}`);

let phoneLink = null;
let linkStarted = false;
function skipPhoneLink() {
  return process.env.PHONE_LINK === '0' || Boolean(WHATSAPP_TOKEN && PHONE_NUMBER_ID);
}
function getLinkStatus() {
  return phoneLink ? phoneLink.getLinkStatus() : { status: 'idle', connected: false, pairingCode: null, qrDataUrl: null, me: null, error: null, since: null };
}
function isLinked() {
  return !!(phoneLink && phoneLink.isLinked());
}
async function ensurePhoneLink() {
  if (skipPhoneLink() || linkStarted) return phoneLink;
  linkStarted = true;
  try {
    phoneLink = await import('./phone-link.js');
    await phoneLink.startPhoneLink({
      authDir: path.join(__dirname, 'session'),
      learnersFile,
      phone: ADMIN_PHONE,
      onMessage: async ({ from, jid, text, mediaPath, mediaKind, mediaMime }) => {
        const result = await runTurn(from, text, { mediaPath, mediaKind, mediaMime });
        if (result.ignored) return;
        await dispatchReplies(jid, result.replies);
        schedulePersist(path.join(__dirname, 'session'), learnersFile);
      },
    });
  } catch (e) {
    console.error('phone-link failed', e.message);
    linkStarted = false;
  }
  return phoneLink;
}

function localPdf(filename){
  const file = path.basename(filename || '');
  if (!/^[A-Za-z0-9_.-]+\.pdf$/.test(file)) return null;
  const fp = path.join(workspaceRoot, 'pdfs', file);
  return fs.existsSync(fp) ? fp : null;
}
function localFromPublicUrl(url){
  try {
    const u = String(url || '');
    const idx = u.indexOf('/audio/');
    if (idx >= 0) {
      const fp = path.join(workspaceRoot, u.slice(idx + 1));
      return fs.existsSync(fp) ? fp : null;
    }
  } catch { /* ignore */ }
  return null;
}

async function sendText(to, text){
  if (isLinked()) {
    await phoneLink.sendPhoneText(to, text);
    return { phone: true };
  }
  if(!WHATSAPP_TOKEN || !PHONE_NUMBER_ID){
    console.log(`[MOCK SEND to ${to}]: ${String(text).slice(0,120)}...`);
    return { mock:true };
  }
  await axios.post(`https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`, {
    messaging_product:'whatsapp', to, type:'text', text:{ body:text }
  }, { headers:{ Authorization:`Bearer ${WHATSAPP_TOKEN}` }});
}
async function sendAudio(to, url){
  if (isLinked()) {
    const fp = localFromPublicUrl(url);
    if (fp) { await phoneLink.sendPhoneAudio(to, fp); return; }
    console.log(`[PHONE LINK skip audio, no local file] ${url}`);
    return;
  }
  if(!WHATSAPP_TOKEN) { console.log(`[MOCK AUDIO to ${to}]: ${url}`); return; }
  await axios.post(`https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`, {
    messaging_product:'whatsapp', to, type:'audio', audio:{ link:url }
  }, { headers:{ Authorization:`Bearer ${WHATSAPP_TOKEN}` }});
}
async function sendDocument(to, url, filename, caption, filePath){
  const fp = filePath || localPdf(filename);
  if (isLinked()) {
    if (fp && fs.existsSync(fp)) {
      await phoneLink.sendPhoneDocument(to, fp, filename, caption);
      return;
    }
    await phoneLink.sendPhoneText(to, `📄 ${filename}\n\n${caption || ''}\n\n📥 Direct download: ${url}`);
    return;
  }
  if(!WHATSAPP_TOKEN || !PHONE_NUMBER_ID){
    console.log(`[MOCK DOCUMENT to ${to}]: ${filename} -> ${url}`);
    await sendText(to, `📄 ${filename}\n\n${caption}\n\nDirect download: ${url}`);
    return;
  }
  await axios.post(`https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`, {
    messaging_product:'whatsapp', to, type:'document', document:{ link:url, filename, caption }
  }, { headers:{ Authorization:`Bearer ${WHATSAPP_TOKEN}` }});
}

function verifySignature(req){
  if(!APP_SECRET) return true;
  const sig = req.headers['x-hub-signature-256'] || '';
  const expected = 'sha256='+crypto.createHmac('sha256', APP_SECRET).update(req.rawBody).digest('hex');
  try { return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)); } catch { return false; }
}

function adminAuth(req,res,next){
  const fromPhone = (req.headers['x-admin-phone'] || '').replace(/\D/g,'');
  const pwd = req.headers['x-admin-password'] || req.query.pwd || req.body?.pwd;
  const isPhoneAdmin = ADMIN_PHONE && fromPhone===ADMIN_PHONE;
  const isPwdAdmin = Boolean(ADMIN_PASSWORD) && pwd && pwd===ADMIN_PASSWORD;
  if(isPhoneAdmin || isPwdAdmin) return next();
  return res.status(401).json({ error:'Unauthorized - Acadex admin only' });
}

const hits = new Map();
const SKIP_LIMIT = new Set(['/ping', '/health', '/awake', '/link/status', '/api/supabase/status', '/api/papers']);
function rateLimit(req,res,next){
  if (SKIP_LIMIT.has(req.path)) return next();
  const ip = req.ip || req.headers['x-forwarded-for'] || 'local';
  const now = Date.now();
  const arr = (hits.get(ip)||[]).filter(t=>now-t<60000);
  arr.push(now);
  hits.set(ip, arr);
  if(arr.length>60) return res.status(429).json({error:'Too many requests'});
  next();
}
app.use(rateLimit);
function noCacheCors(res) {
  res.set('Cache-Control', 'no-store');
  res.set('Access-Control-Allow-Origin', '*');
}

app.get('/', (req,res)=>res.sendFile(path.join(workspaceRoot, 'zimsec-super-tutor.html')));
function whatsappMode(){
  if (WHATSAPP_TOKEN && PHONE_NUMBER_ID) return 'cloud-api';
  const st = getLinkStatus();
  if (st.connected) return 'phone-link';
  if (st.status && st.status !== 'idle') return 'phone-link-'+st.status;
  return 'mock';
}

app.get('/health', (req,res)=>{
  noCacheCors(res);
  res.json({
    status: 'ACADEX live',
    alwaysOn: true,
    replyTo: 'any message',
    admin: ADMIN_PHONE ? 'set' : 'not set',
    whatsapp: whatsappMode(),
    wa: ADMIN_PHONE ? '+'+ADMIN_PHONE : null,
    papers: (BANK.papers||[]).length,
    link: getLinkStatus().status,
    queue: inboxStats(),
    keepalive: keepaliveState(),
    sessionStore: sessionStoreMode(),
    vision: visionOn() ? 'ox-alpha-read' : 'off',
    supabase: getSupabaseStatus(),
    time: new Date().toISOString()
  });
});

app.get('/api/supabase/status', (req, res) => {
  noCacheCors(res);
  res.json(getSupabaseStatus());
});

app.get('/api/papers', (req, res) => {
  noCacheCors(res);
  res.json({
    total: (BANK.papers || []).length,
    papers: (BANK.papers || []).map(p => ({
      id: p.id,
      year: p.year,
      session: p.session,
      level: p.level,
      subject: p.subject,
      code: p.code,
      syllabus: p.syllabus,
      paper: p.paper,
      paperNo: p.paperNo,
      qs: p.qs,
      pdf: p.realUrl,
    }))
  });
});

app.get('/ping', (req,res)=>{ noCacheCors(res); res.type('text').send('ok'); });
app.get('/awake', (req,res)=>{ noCacheCors(res); res.type('text').send('ok'); });
app.get('/link', (req,res)=>{
  ensurePhoneLink();
  res.sendFile(path.join(__dirname, 'link.html'));
});
app.get('/link/status', (req,res)=>{
  ensurePhoneLink();
  res.json(getLinkStatus());
});
app.get('/bot', (req,res)=>res.send(`
  <h2>ACADEX Master ZIMSEC Platform Running</h2>
  <p>WhatsApp: <b>+${ADMIN_PHONE}</b></p>
  <p>Trigger phrase: <b>${TRIGGER_PHRASE}</b></p>
  <p>Bot Mode: ${SESSION_MINUTES} min</p>
  <p>Papers in bank: ${(BANK.papers||[]).length} (Grade 7, O-Level, A-Level)</p>
  <p>WhatsApp mode: <b>${whatsappMode()}</b></p>
  <p>Supabase DB: <b>${getSupabaseStatus().connected ? 'Connected' : 'Syncing'}</b></p>
  <p>Link the phone (no Facebook): <a href="/link">/link</a></p>
  <p>Use <a href="/admin">/admin</a> with password</p>
`));

app.get('/webhook', (req,res)=>{
  if(req.query['hub.mode']==='subscribe' && req.query['hub.verify_token']===VERIFY_TOKEN){
    console.log('WEBHOOK VERIFIED');
    return res.send(req.query['hub.challenge']);
  }
  res.sendStatus(403);
});

async function dispatchReplies(defaultTo, replies){
  for (const r of replies || []) {
    const to = r.to || defaultTo;
    if (r.type === 'document') await sendDocument(to, r.url, r.filename, r.caption || '', r.filePath);
    else if (r.type === 'image') {
      if (r.filePath && isLinked() && fs.existsSync(r.filePath)) {
        await phoneLink.sendPhoneImage(to, r.filePath, r.caption || '');
      }
    }
    else if (r.type === 'audio') {
      try {
        if (r.filePath && isLinked() && fs.existsSync(r.filePath)) await phoneLink.sendPhoneAudio(to, r.filePath);
        else if (r.url) await sendAudio(to, r.url);
        else console.warn('audio skipped, no file', r.filePath || r.url);
      } catch (e) {
        console.error('audio send', e.message);
        await sendText(to, 'Audio synthesis failed. Say VOICE again.');
      }
    } else await sendText(to, r.text);
  }
}

function runTurn(from, text, media = {}){
  return handleTurn({
    from, text, bank: BANK,
    publicUrl: PUBLIC_URL,
    adminPhone: ADMIN_PHONE,
    trigger: TRIGGER_PHRASE,
    sessionMinutes: SESSION_MINUTES,
    mediaPath: media.mediaPath || '',
    mediaKind: media.mediaKind || '',
    mediaMime: media.mediaMime || '',
  });
}

app.post('/webhook', async (req,res)=>{
  if(!verifySignature(req)){
    console.warn('Bad signature - blocked fake webhook');
    return res.sendStatus(403);
  }
  try{
    const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if(!msg){ return res.sendStatus(200); }
    const from = msg.from;
    const type = msg.type;
    let text = '';
    if(type==='text') text = msg.text.body;
    else if(type==='image') text = msg.image.caption || '[photo]';
    else if(type==='interactive') text = msg.interactive?.button_reply?.id || '';
    else text = `[${type}]`;

    console.log(`IN ${from}: ${text}`);
    const result = await runTurn(from, text);
    if (result.ignored) {
      console.log(`→ Ignored (no trigger, not in bot mode) from ${from}`);
      return res.sendStatus(200);
    }
    await dispatchReplies(from, result.replies);
    return res.sendStatus(200);
  }catch(e){
    console.error('Webhook error:', e.message);
    return res.sendStatus(500);
  }
});

// Admin routes
app.get('/admin', adminAuth, (req,res)=>{
  const users = listUsers();
  const phones = sessionPhones();
  res.send(`
    <h2>ACADEX Admin Panel</h2>
    <p>Connected sessions: ${phones.length}</p>
    <p>Total users: ${users.length}</p>
    <p>Papers in bank: ${(BANK.papers||[]).length}</p>
    <p>Supabase Status: ${getSupabaseStatus().connected ? 'Connected' : 'Offline'}</p>
    <pre>${JSON.stringify(users, null, 2)}</pre>
  `);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, async () => {
  console.log(`ACADEX Master Live on :${PORT}`);
  if (!skipPhoneLink()) {
    try { await ensurePhoneLink(); } catch (e) { console.error('auto phone link', e.message); }
  }
  startKeepAlive(PUBLIC_URL);
});
