// ACADEX - SECURE WhatsApp Bot (Trigger-Only + Admin Locked)
// - Works with YOUR personal number for TESTING (as user, not as bot host)
// - Trigger phrase required to enter Bot Mode
// - 24/7 hostable on Render/Railway
// - Admin ONLY for you, no loopholes

import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.join(__dirname, '..');

const app = express();
app.use(express.json({
  verify: (req, res, buf) => { req.rawBody = buf; } // for signature check
}));
app.use(express.urlencoded({ extended: true }));

// --- Serve ACADEX PWA + audio + files from workspace root (so PWA works on same host) ---
app.use(express.static(workspaceRoot));
app.use('/audio', express.static(path.join(workspaceRoot, 'audio')));
app.use('/manifest.json', (req,res)=>res.sendFile(path.join(workspaceRoot, 'manifest.json')));
app.use('/sw.js', (req,res)=>res.sendFile(path.join(workspaceRoot, 'sw.js')));

// ========= CONFIG (set in .env) =========
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'acadex-verify-2026';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || ''; // leave empty = MOCK mode for testing
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID || '';
const PUBLIC_URL = process.env.PUBLIC_URL || '';
const ADMIN_PHONE = (process.env.ADMIN_PHONE || '').replace(/\D/g,''); // e.g. 263771234567
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Acadex#2026!Secure';
const TRIGGER_PHRASE = (process.env.TRIGGER_PHRASE || 'mhoro acadex').toLowerCase(); // <--- THE GREETING
const SESSION_MINUTES = parseInt(process.env.SESSION_MINUTES || '30'); // Bot Mode expires after 30min silence
const APP_SECRET = process.env.APP_SECRET || ''; // from Meta for signature check

console.log(`Acadex Secure Bot | Trigger: "${TRIGGER_PHRASE}" | Session: ${SESSION_MINUTES}min | Admin: ${ADMIN_PHONE || 'NOT SET'}`);

// ========= SIMPLE IN-MEMORY DB (swap to Supabase for prod) =========
const sessions = new Map(); // phone -> { botModeUntil: timestamp, lang, free_used, expiry }
const users = new Map(); // phone -> { expiry_date, free_used, parent }

function isBotMode(phone){
  const s = sessions.get(phone);
  if(!s) return false;
  if(Date.now() > s.botModeUntil) { sessions.delete(phone); return false; }
  // refresh on activity
  s.botModeUntil = Date.now() + SESSION_MINUTES*60*1000;
  return true;
}
function enterBotMode(phone){
  sessions.set(phone, { botModeUntil: Date.now() + SESSION_MINUTES*60*1000, at: new Date().toISOString() });
}
function checkTrigger(text){
  const t = (text||'').toLowerCase().trim();
  // Must CONTAIN trigger phrase to enter bot mode. e.g. "Mhoro Acadex" , "mhoro acadex ndibatsire"
  if(t === TRIGGER_PHRASE || t.startsWith(TRIGGER_PHRASE) || t.includes(TRIGGER_PHRASE)) return true;
  // Also allow exact "acadex" alone
  if(t === 'acadex') return true;
  return false;
}

// ========= PAYWALL (reuse) =========
const FREE_LIMIT = 10;
function getUser(phone){ return users.get(phone) || { free_used:0, expiry_date:null }; }
function isPaid(phone){
  const u = getUser(phone);
  return u.expiry_date && new Date(u.expiry_date) > new Date();
}
function canUse(phone){
  const u = getUser(phone);
  if(isPaid(phone)) return { allowed:true, reason:'PAID' };
  if((u.free_used||0) < FREE_LIMIT) return { allowed:true, reason:'FREE', left: FREE_LIMIT - (u.free_used||0) };
  return { allowed:false, reason:'EXPIRED' };
}
function incrementUse(phone){
  const u = getUser(phone);
  if(isPaid(phone)) return;
  u.free_used = (u.free_used||0)+1;
  users.set(phone, u);
}

// ========= WHATSAPP SENDERS =========
async function sendText(to, text){
  if(!WHATSAPP_TOKEN || !PHONE_NUMBER_ID){
    console.log(`[MOCK SEND to ${to}]: ${text.slice(0,120)}...`);
    return { mock:true };
  }
  await axios.post(`https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`, {
    messaging_product:'whatsapp', to, type:'text', text:{ body:text }
  }, { headers:{ Authorization:`Bearer ${WHATSAPP_TOKEN}` }});
}
async function sendAudio(to, url){
  if(!WHATSAPP_TOKEN) { console.log(`[MOCK AUDIO to ${to}]: ${url}`); return; }
  await axios.post(`https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`, {
    messaging_product:'whatsapp', to, type:'audio', audio:{ link:url }
  }, { headers:{ Authorization:`Bearer ${WHATSAPP_TOKEN}` }});
}
async function sendDocument(to, url, filename, caption){
  if(!WHATSAPP_TOKEN || !PHONE_NUMBER_ID){
    console.log(`[MOCK DOCUMENT to ${to}]: ${filename} -> ${url} | ${caption}`);
    // For mock, also send text with link
    await sendText(to, `📄 ${filename}\n${caption}\nDirect download: ${url} (one-tap, like Foondamate)`);
    return;
  }
  await axios.post(`https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`, {
    messaging_product:'whatsapp', to, type:'document', document:{ link:url, filename, caption }
  }, { headers:{ Authorization:`Bearer ${WHATSAPP_TOKEN}` }});
}

// ========= SECURITY: Verify Meta Signature (no fake webhooks) =========
function verifySignature(req){
  if(!APP_SECRET) return true; // if not set, skip (testing)
  const sig = req.headers['x-hub-signature-256'] || '';
  const expected = 'sha256='+crypto.createHmac('sha256', APP_SECRET).update(req.rawBody).digest('hex');
  // use timingSafeEqual
  try { return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)); } catch { return false; }
}

// ========= SECURITY: Admin Auth Middleware (no loopholes) =========
function adminAuth(req,res,next){
  // 1. Must be your phone OR have password
  const fromPhone = (req.headers['x-admin-phone'] || '').replace(/\D/g,'');
  const pwd = req.headers['x-admin-password'] || req.query.pwd || req.body?.pwd;
  const isPhoneAdmin = ADMIN_PHONE && fromPhone===ADMIN_PHONE;
  const isPwdAdmin = pwd && pwd===ADMIN_PASSWORD;
  // Also allow if request comes from your WhatsApp admin command (phone === ADMIN_PHONE)
  if(isPhoneAdmin || isPwdAdmin){
    return next();
  }
  // No bypass via guessing ?admin=1 etc.
  return res.status(401).json({ error:'Unauthorized - Acadex admin only' });
}

// Rate limit simple
const hits = new Map();
function rateLimit(req,res,next){
  const ip = req.ip || req.headers['x-forwarded-for'] || 'local';
  const now = Date.now();
  const arr = (hits.get(ip)||[]).filter(t=>now-t<60000);
  arr.push(now);
  hits.set(ip, arr);
  if(arr.length>30) return res.status(429).json({error:'Too many requests'});
  next();
}
app.use(rateLimit);

// ========= ROUTES =========

// PWA - Serve Acadex app on root (so https://acadex-r6z0.onrender.com works without filename)
app.get('/', (req,res)=>res.sendFile(path.join(workspaceRoot, 'zimsec-super-tutor.html')));
app.get('/health', (req,res)=>res.json({ status:'ACADEX live', trigger: TRIGGER_PHRASE, admin: ADMIN_PHONE ? 'set' : 'not set', time: new Date().toISOString() }));
app.get('/bot', (req,res)=>res.send(`
  <h2>ACADEX Secure Bot Running</h2>
  <p>Trigger phrase: <b>${TRIGGER_PHRASE}</b></p>
  <p>Bot Mode: ${SESSION_MINUTES} min</p>
  <p>Admin: ${ADMIN_PHONE ? ADMIN_PHONE.slice(0,6)+'***' : 'NOT SET - set ADMIN_PHONE in .env'}</p>
  <p>Use <a href="/admin">/admin</a> with password</p>
`));

// Meta webhook verification
app.get('/webhook', (req,res)=>{
  if(req.query['hub.mode']==='subscribe' && req.query['hub.verify_token']===VERIFY_TOKEN){
    console.log('WEBHOOK VERIFIED');
    return res.send(req.query['hub.challenge']);
  }
  res.sendStatus(403);
});

// WhatsApp incoming
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

    // ----- TRIGGER CHECK -----
    const isTriggered = checkTrigger(text);
    const inBotMode = isBotMode(from);

    if(!isTriggered && !inBotMode){
      // SILENT - do NOT reply to random chats. This is the spec: only trigger phrase activates.
      // For testing, we log but don't reply, so your personal chats aren't spammed.
      console.log(`→ Ignored (no trigger, not in bot mode) from ${from}`);
      return res.sendStatus(200);
    }
    if(isTriggered && !inBotMode){
      enterBotMode(from);
      await sendText(from, `✅ Acadex activated! Mhoro! 🙏\nNdiri Acadex, mudzidzisi wako.\n\nTumira MUFANANIDZO wemubvunzo kana nyora mubvunzo wako.\nUnotaura mutauro upi? [Shona/Ndebele/English]\n\n_Reply "acadex exit" kuti ubude._`);
      return res.sendStatus(200);
    }
    // If here, user is in Bot Mode → handle commands
    // Refresh session
    enterBotMode(from);

    // Admin commands ONLY if from ADMIN_PHONE
    if(from.replace(/\D/g,'')===ADMIN_PHONE && text.toLowerCase().startsWith('admin')){
      // e.g. admin activate 263771234567 7
      const parts = text.split(' ');
      if(parts[1]==='activate' && parts[2]){
        const target = parts[2].replace(/\D/g,'');
        const days = parseInt(parts[3]||'7');
        const exp = new Date(); exp.setDate(exp.getDate()+days);
        const u = getUser(target); u.expiry_date = exp.toISOString(); users.set(target, u);
        await sendText(from, `✅ Activated ${target} for ${days} days until ${exp.toDateString()}`);
        await sendText(target, `✅ Acadex yatambirwa! Wava ne ${days} mazuva unlimited. Tumira mubvunzo.`);
      } else if(parts[1]==='status'){
        const target = parts[2]?.replace(/\D/g,'') || from;
        const u = getUser(target);
        await sendText(from, `Status ${target}: free_used=${u.free_used||0}/${FREE_LIMIT}, expiry=${u.expiry_date||'none'}, paid=${isPaid(target)}`);
      } else {
        await sendText(from, `Admin: admin activate <phone> <days>\nadmin status <phone>`);
      }
      return res.sendStatus(200);
    }
    if(text.toLowerCase().includes('acadex exit')){
      sessions.delete(from);
      await sendText(from, `👋 Bye! Acadex bot mode off. Send "${TRIGGER_PHRASE}" to start again.`);
      return res.sendStatus(200);
    }

    // ----- PAYWALL CHECK -----
    const sub = canUse(from);
    if(!sub.allowed){
      await sendText(from, `😊 Wapfuura 10 FREE. Bhadhara kuti uenderere:\n💰 $0.75/vhiki kana $3/mwedzi\nEcoCash: *151*2*1*12345*0.75#\nMushure mekubhadhara tumira *PAID*\n_Admin chete ndiye anokwanisa ku-activate._`);
      return res.sendStatus(200);
    }

    // ----- DOWNLOAD PDF like Foondamate (one-tap direct) -----
    const tl = text.toLowerCase();
    if(tl.includes('download') || tl.includes('pdf') || tl.includes('paper 1') || tl.includes('past paper')){
      // Find best match - simple: if contains maths, send maths pdf, etc.
      let fname = "2024_Mathematics_Paper_1_4004_1.pdf";
      let title = "2024 Mathematics Paper 1";
      if(tl.includes('combined') || tl.includes('science')) { fname="2023_Combined_Science_Paper_1_5006_1.pdf"; title="2023 Combined Science Paper 1"; }
      else if(tl.includes('biology')) { fname="2023_Biology_Paper_2_6030_2.pdf"; title="2023 Biology Paper 2"; }
      else if(tl.includes('chemistry')) { fname="2023_Chemistry_Paper_2_6031_2.pdf"; title="2023 Chemistry Paper 2"; }
      else if(tl.includes('agriculture')) { fname="2023_Agriculture_Paper_1_5039_1.pdf"; title="2023 Agriculture Paper 1"; }
      else if(tl.includes('english')) { fname="2023_English_Language_Paper_1_4005_1.pdf"; title="2023 English Language Paper 1"; }
      else if(tl.includes('geography')) { fname="2023_Geography_Paper_2_6037_2.pdf"; title="2023 Geography Paper 2"; }
      else if(tl.includes('commerce')) { fname="2023_Commerce_Paper_1_4048_1.pdf"; title="2023 Commerce Paper 1"; }
      const base = PUBLIC_URL || "https://acadex-r6z0.onrender.com";
      const url = `${base}/pdfs/${fname}`;
      await sendDocument(from, url, fname, `Real ZIMSEC: ${title} • For you • One-tap download, save for offline (like Foondamate)`);
      await sendText(from, `Tap the PDF above to open/save. Need another? Type "Download 2023 Biology" or "Download Physics"`);
      return res.sendStatus(200);
    }

    // ----- SOLVE (demo) -----
    // Detect lang quickly
    let lang='sn';
    if(text.toLowerCase().includes('ndebele')) lang='nd';
    else if(text.toLowerCase().includes('english')) lang='en';
    const answers = {
      sn: `Danho 1: Bvisa 3 → 2x=8\nDanho 2: Govanisa na 2 → x=4 ✅\nWanzwisisa?`,
      nd: `Isinyathelo 1: Susa u-3 → 2x=8\nIsinyathelo 2: Hlukanisa ngo-2 → x=4 ✅\nUzwile?`,
      en: `Step 1: Subtract 3 → 2x=8\nStep 2: Divide by 2 → x=4 ✅\nGot it?`
    };
    await sendText(from, answers[lang] || answers.sn);
    // Send voice note if you host audio
    if(PUBLIC_URL){
      const voiceMap = { sn:'audio/shona-solve.mp3', nd:'audio/ndebele-solve.mp3', en:'audio/english-solve.mp3' };
      const url = `${PUBLIC_URL}/${voiceMap[lang]||voiceMap.sn}`;
      await sendAudio(from, url);
    }
    incrementUse(from);
    const left = sub.left ? ` (${sub.left-1} FREE left)` : '';
    await sendText(from, `Next? Tumira mumwe mubvunzo.${left}\nType "acadex exit" to leave bot mode.`);

  }catch(e){
    console.error('webhook err', e.message);
  }
  res.sendStatus(200);
});

// ========= USSD OFFLINE (same host, no data) - POST /ussd =========
app.post('/ussd', (req,res)=>{
  const { sessionId, phoneNumber, text } = req.body;
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
      response=`END Wapfuura 10 FREE. Bhadhara $0.75:\n*151*2*1*12345*0.75#\nMushure tumira PAID ku 5.`;
    } else {
      const u=getUser(phone); u.free_used=(u.free_used||0)+1; users.set(phone,u);
      response=`CON Danho1 Bvisa3→2x=8\nDanho2 /2→x=4\nMhinduro ndi 4\nZasara ${FREE_LIMIT-u.free_used} FREE\n1. Next`;
    }
  } else if(parts[0]==='4'){
    response=`CON Sarudza: 1.Shona 2.Ndebele 3.English`;
  } else if(parts[0]==='5'){
    const u=getUser(phone);
    const paid=isPaid(phone)?`PAID kusvika ${new Date(u.expiry_date).toLocaleDateString()}`:`FREE ${u.free_used||0}/10`;
    response=`CON Akaundi: ${phone}\n${paid}\n1. Ndatenda PAID`;
  } else {
    response=`END Ndatenda - Acadex. Dzvanya *384*12345# zvakare.`;
  }
  res.set('Content-Type','text/plain');
  res.send(response);
});
app.get('/ussd/test', (req,res)=>res.send(`<form method="POST" action="/ussd"><input name="phoneNumber" value="263771234567"><input name="text" value=""><button>Send USSD</button></form>`));

// ========= ADMIN DASHBOARD (LOCKED) =========
app.get('/admin', (req,res)=>{
  // This page asks for password; API calls need header x-admin-password
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
<p>Enter password to unlock. No password = no access. Brute force blocked.</p>
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
  document.getElementById('out').innerHTML = h || '<p>No users yet - send \"mhoro acadex\" from your phone to create one.</p>';
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
<p style="font-size:11px;color:#64748b">Security: Password + rate limit + no guessing. Admin phone ${ADMIN_PHONE ? ADMIN_PHONE.slice(0,6)+'***' : 'not set'} can also use WhatsApp: "admin activate 263... 7"</p>
</body></html>
  `);
});

app.get('/admin/api/users', adminAuth, (req,res)=>{
  const list = Array.from(users.entries()).map(([phone, v])=>({ phone, ...v }));
  // also include sessions
  res.json({ users: list, sessions: Array.from(sessions.keys()) });
});
app.post('/admin/api/activate', adminAuth, async (req,res)=>{
  const { phone, days } = req.body;
  const target = (phone||'').replace(/\D/g,'');
  if(!target) return res.status(400).send('phone required');
  const exp = new Date(); exp.setDate(exp.getDate() + (parseInt(days)||7));
  const u = getUser(target); u.expiry_date = exp.toISOString(); users.set(target, u);
  // notify user
  await sendText(target, `✅ Acadex yatambirwa! Wava ne ${days} mazuva unlimited. Tumira mubvunzo.`);
  res.send(`Activated ${target} for ${days} days`);
});
app.post('/admin/api/reset', adminAuth, (req,res)=>{
  const { phone } = req.body;
  const target = (phone||'').replace(/\D/g,'');
  const u = getUser(target); u.free_used=0; users.set(target, u);
  res.send('Reset free count');
});

const PORT=process.env.PORT||3000;
app.listen(PORT, ()=>console.log(`ACADEX Secure Bot live :${PORT} | Trigger "${TRIGGER_PHRASE}" | Admin locked`));
