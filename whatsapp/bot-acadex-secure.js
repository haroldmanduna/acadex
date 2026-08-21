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
      phone: ADMIN_PHONE,
      onMessage: async ({ from, jid, text }) => {
        const result = await runTurn(from, text);
        if (result.ignored) return;
        await dispatchReplies(jid, result.replies);
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
async function sendDocument(to, url, filename, caption){
  const fp = localPdf(filename);
  if (isLinked()) {
    if (fp) { await phoneLink.sendPhoneDocument(to, fp, filename, caption); return; }
    await phoneLink.sendPhoneText(to, `📄 ${filename}\n${caption || ''}\n${url}`);
    return;
  }
  if(!WHATSAPP_TOKEN || !PHONE_NUMBER_ID){
    console.log(`[MOCK DOCUMENT to ${to}]: ${filename} -> ${url}`);
    await sendText(to, `📄 ${filename}\n${caption}\nDirect download: ${url}`);
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
function rateLimit(req,res,next){
  const ip = req.ip || req.headers['x-forwarded-for'] || 'local';
  const now = Date.now();
  const arr = (hits.get(ip)||[]).filter(t=>now-t<60000);
  arr.push(now);
  hits.set(ip, arr);
  if(arr.length>60) return res.status(429).json({error:'Too many requests'});
  next();
}
app.use(rateLimit);

app.get('/', (req,res)=>res.sendFile(path.join(workspaceRoot, 'zimsec-super-tutor.html')));
function whatsappMode(){
  if (WHATSAPP_TOKEN && PHONE_NUMBER_ID) return 'cloud-api';
  const st = getLinkStatus();
  if (st.connected) return 'phone-link';
  if (st.status && st.status !== 'idle') return 'phone-link-'+st.status;
  return 'mock';
}
app.get('/health', (req,res)=>res.json({
  status: 'ACADEX live',
  alwaysOn: true,
  replyTo: 'any message',
  admin: ADMIN_PHONE ? 'set' : 'not set',
  whatsapp: whatsappMode(),
  wa: ADMIN_PHONE ? '+'+ADMIN_PHONE : null,
  papers: (BANK.papers||[]).length,
  link: getLinkStatus().status,
  time: new Date().toISOString()
}));
app.get('/ping', (req,res)=>res.type('text').send('ok'));
app.get('/link', (req,res)=>{
  ensurePhoneLink();
  res.sendFile(path.join(__dirname, 'link.html'));
});
app.get('/link/status', (req,res)=>{
  ensurePhoneLink();
  res.json(getLinkStatus());
});
app.get('/bot', (req,res)=>res.send(`
  <h2>ACADEX Secure Bot Running</h2>
  <p>WhatsApp: <b>+${ADMIN_PHONE}</b></p>
  <p>Trigger phrase: <b>${TRIGGER_PHRASE}</b></p>
  <p>Bot Mode: ${SESSION_MINUTES} min</p>
  <p>Papers in bank: ${(BANK.papers||[]).length}</p>
  <p>WhatsApp mode: <b>${whatsappMode()}</b></p>
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
    if (r.type === 'document') await sendDocument(to, r.url, r.filename, r.caption || '');
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
        await sendText(to, 'Audio failed to send. Say VOICE again.');
      }
    } else await sendText(to, r.text);
  }
}

function runTurn(from, text){
  return handleTurn({
    from, text, bank: BANK,
    publicUrl: PUBLIC_URL,
    adminPhone: ADMIN_PHONE,
    trigger: TRIGGER_PHRASE,
    sessionMinutes: SESSION_MINUTES,
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
  }catch(e){
    console.error('webhook err', e.message);
  }
  res.sendStatus(200);
});

app.post('/bot/simulate', async (req,res)=>{
  if (WHATSAPP_TOKEN) return res.status(403).json({ error: 'simulate off when Cloud API is live — use real WhatsApp' });
  const from = String(req.body?.from || ADMIN_PHONE || '263716987183').replace(/\D/g,'');
  const text = String(req.body?.text || '');
  const result = await runTurn(from, text);
  res.json({ from, text, ignored: !!result.ignored, replies: result.replies || [] });
});

app.post('/ussd', (req,res)=>{
  const { phoneNumber, text } = req.body;
  const parts = (text||'').split('*');
  const phone = (phoneNumber||'').replace(/\D/g,'');
  let response='';
  if(text===''){
    response=`CON Acadex - Pasina Data 🇿🇼\n1. Gadzirisa Mubvunzo\n2. Past Papers\n3. Mock Exam\n4. Chinja Mutauro\n5. Akaundi Yangu`;
  } else if(parts[0]==='1' && parts.length===1){
    response=`CON Nyora mubvunzo:\nMuenzaniso: 2x+3=11`;
  } else if(parts[0]==='1' && parts.length===2){
    const q=parts[1];
    const can = canUse(phone);
    if(!can.allowed){
      response=`END Wapfuura 10 FREE. Bhadhara $0.75.`;
    } else {
      incrementUse(phone);
      const u=getUser(phone);
      const solved = solveLinear(q);
      if(solved){
        response=`CON x=${solved.answer}\n${solved.steps.map(s=>s.t+': '+s.d).join('\n')}\nZasara ${FREE_LIMIT-u.free_used} FREE`;
      } else {
        response=`CON Handina kuzvinzwisisa. Nyora se 2x+3=11\nZasara ${FREE_LIMIT-u.free_used} FREE`;
      }
    }
  } else if(parts[0]==='2'){
    response=`END Maths 4004/1:\n/pdfs/2024_November_4004_Paper1.pdf\nScience 5006/1:\n/pdfs/2024_November_5006_Paper1.pdf\nEnglish 1122/1:\n/pdfs/2024_November_1122_Paper1.pdf`;
  } else if(parts[0]==='3'){
    response=`END Mock: open the website Mock Exam tab.`;
  } else if(parts[0]==='4'){
    response=`CON Sarudza: 1.Shona 2.Ndebele 3.English`;
  } else if(parts[0]==='5'){
    const u=getUser(phone);
    const paid=isPaid(phone)?`PAID kusvika ${new Date(u.expiry_date).toLocaleDateString()}`:`FREE ${u.free_used||0}/10`;
    response=`CON Akaundi: ${phone}\n${paid}`;
  } else {
    response=`END Ndatenda - Acadex.`;
  }
  res.set('Content-Type','text/plain');
  res.send(response);
});
app.get('/ussd/test', (req,res)=>res.send(`<form method="POST" action="/ussd"><input name="phoneNumber" value="263716987183"><input name="text" value=""><button>Send USSD</button></form>`));

app.get('/admin', (req,res)=>{
  res.send(`
<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{font-family:system-ui;padding:20px;max-width:800px;margin:auto}
input,button{padding:10px;margin:4px;border-radius:8px;border:1px solid #ccc}
button{background:#0a7a3c;color:white;font-weight:800;cursor:pointer}
.card{border:1px solid #e2e8f0;border-radius:12px;padding:14px;margin:10px 0}
.badge{padding:3px 8px;border-radius:999px;font-size:11px;font-weight:800}
</style>
</head><body>
<h2>🔒 ACADEX Admin — ONLY YOU</h2>
<p>WhatsApp bot number: <b>+${ADMIN_PHONE}</b></p>
<input id="pwd" type="password" placeholder="Admin password">
<button onclick="load()">Unlock</button>
<div id="out"></div>
<script>
async function load(){
  const pwd=document.getElementById('pwd').value;
  const r=await fetch('/admin/api/users',{ headers:{ 'x-admin-password': pwd }});
  if(r.status===401){ alert('Wrong password - blocked'); return; }
  const j=await r.json();
  let h='';
  j.users.forEach(u=>{
    const paid = u.expiry_date && new Date(u.expiry_date) > new Date();
    h+=\`<div class="card">
      <b>\${u.phone}</b> <span class="badge" style="background:\${paid?'#0a7a3c':'#ef4444'};color:white">\${paid?'PAID until '+new Date(u.expiry_date).toLocaleDateString():'EXPIRED/FREE '+ (u.free_used||0)+'/10'}</span>
      <div style="margin-top:8px">
        <button onclick="activate('\${u.phone}',7)">+7 days $0.75</button>
        <button onclick="activate('\${u.phone}',30)">+30 days $3</button>
        <button onclick="resetFree('\${u.phone}')" style="background:#f59e0b">Reset Free</button>
      </div>
    </div>\`;
  });
  document.getElementById('out').innerHTML = h || '<p>No users yet - send "mhoro acadex" from WhatsApp.</p>';
}
async function activate(phone,days){
  const pwd=document.getElementById('pwd').value;
  const r=await fetch('/admin/api/activate',{method:'POST',headers:{'Content-Type':'application/json','x-admin-password':pwd},body:JSON.stringify({phone,days})});
  alert(await r.text()); load();
}
async function resetFree(phone){
  const pwd=document.getElementById('pwd').value;
  await fetch('/admin/api/reset',{method:'POST',headers:{'Content-Type':'application/json','x-admin-password':pwd},body:JSON.stringify({phone})});
  load();
}
</script>
<p style="font-size:11px;color:#64748b">Admin WhatsApp: admin activate 263... 7</p>
</body></html>
  `);
});

app.get('/admin/api/users', adminAuth, (req,res)=>{
  res.json({ users: listUsers(), sessions: sessionPhones() });
});
app.post('/admin/api/activate', adminAuth, async (req,res)=>{
  const { phone, days } = req.body;
  const target = (phone||'').replace(/\D/g,'');
  if(!target) return res.status(400).send('phone required');
  const exp = activateUser(target, parseInt(days)||7);
  await sendText(target, `✅ Acadex yatambirwa! Wava ne ${days} mazuva unlimited. Tumira mubvunzo.`);
  res.send(`Activated ${target} for ${days} days until ${exp.toDateString()}`);
});
app.post('/admin/api/reset', adminAuth, (req,res)=>{
  const { phone } = req.body;
  const target = (phone||'').replace(/\D/g,'');
  resetFree(target);
  res.send('Reset free count');
});

const PORT=process.env.PORT||3000;
app.listen(PORT, '0.0.0.0', ()=>{
  console.log(`ACADEX Secure Bot live :${PORT} | always-on | WA +${ADMIN_PHONE}`);
  if (skipPhoneLink()) {
    console.log(WHATSAPP_TOKEN ? 'Cloud API tokens set — phone-link off' : 'PHONE_LINK=0');
    return;
  }
  setTimeout(() => ensurePhoneLink(), 2000);
  const wake = (PUBLIC_URL || '').replace(/\/$/, '') + '/ping';
  setInterval(() => {
    if (wake.startsWith('http')) fetch(wake).catch(() => {});
  }, 8 * 60 * 1000);
});
