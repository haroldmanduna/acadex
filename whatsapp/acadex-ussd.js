// ACADEX USSD - Works with ZERO data (*384*12345#)
// Africa's Talking / Econet gateway → POST here
import express from 'express';
const app = express();
app.use(express.urlencoded({ extended: true })); // USSD sends x-www-form-urlencoded
app.use(express.json());

const FREE_LIMIT = 10;
const users = new Map(); // phone -> { free_used, expiry, lang }

function getUser(phone){ return users.get(phone) || { free_used:0, expiry:null, lang:'sn' }; }
function isPaid(phone){
  const u=getUser(phone);
  return u.expiry && new Date(u.expiry) > new Date();
}
function canUse(phone){
  const u=getUser(phone);
  if(isPaid(phone)) return true;
  return (u.free_used||0) < FREE_LIMIT;
}

// Language detection from USSD input (same 16)
function detectLang(text){
  const t=(text||'').toLowerCase();
  if(t.includes('ndebele')) return 'nd';
  if(t.includes('english')) return 'en';
  return 'sn';
}

// USSD handler - Africa's Talking spec
app.post('/ussd', (req,res)=>{
  const { sessionId, phoneNumber, text } = req.body; // text = "1*2*2x+3=11"
  const parts = (text||'').split('*');
  const last = parts[parts.length-1] || '';
  const level = parts.length;
  const phone = (phoneNumber||'').replace(/\D/g,'');

  let response = '';

  // Level 1: Main menu
  if(text === ''){
    response = `CON Acadex - Pasina Data 🇿🇼
1. Gadzirisa Mubvunzo (Solve)
2. Mibvunzo Yekare (Past Papers)
3. Mock Exam
4. Chinja Mutauro (Language)
5. Akaundi Yangu (Account)
6. Mudzidzisi Anotaura (Voice Call)`;
  }
  // 1. Solve
  else if(parts[0]==='1' && level===1){
    response = `CON Nyora mubvunzo wako:\nMuenzaniso: 2x+3=11\nNyora wabva wadzvanya Send`;
  }
  else if(parts[0]==='1' && level===2){
    const q = parts[1] || '';
    if(!canUse(phone)){
      response = `END Wapfuura 10 FREE. Bhadhara $0.75:\n*151*2*1*12345*0.75#\nMushure tumira PAID ku 5. Akaundi`;
      return res.send(response);
    }
    // Simple solve demo (real: call AI)
    const lang = getUser(phone).lang;
    const answers = {
      sn: `Danho1 Bvisa3→2x=8\nDanho2 /2→x=4\nMhinduro ndi 4`,
      nd: `Isiny1 Susa3→2x=8\nIsiny2 /2→x=4\nImpendulo ngu4`,
      en: `Step1 -3→2x=8\nStep2 /2→x=4\nAnswer 4`
    };
    const ans = answers[lang]||answers.sn;
    // increment
    const u=getUser(phone); u.free_used=(u.free_used||0)+1; users.set(phone,u);
    const left = FREE_LIMIT - u.free_used;
    response = `CON ${ans}\n${left>0?`Zasara ${left} FREE`: `Wapfuura - Bhadhara *151#`}\n1. Mubvunzo Unotevera\n2. Dzokera`;
  }
  // 4. Language
  else if(parts[0]==='4'){
    if(level===1){
      response = `CON Sarudza Mutauro:\n1. Shona\n2. Ndebele\n3. English\n4. Venda\n5. Tonga`;
    } else {
      const map={ '1':'sn','2':'nd','3':'en','4':'ven','5':'toi' };
      const lang=map[parts[1]]||'sn';
      const u=getUser(phone); u.lang=lang; users.set(phone,u);
      response = `END Mutauro wachinjwa ✅\nDzokerai *384*12345#`;
    }
  }
  // 5. Account
  else if(parts[0]==='5'){
    const u=getUser(phone);
    const paid = isPaid(phone) ? `PAID kusvika ${new Date(u.expiry).toLocaleDateString()}` : `FREE ${u.free_used||0}/10`;
    response = `CON Akaundi: ${phone}\n${paid}\n1. Ndatenda PAID (after EcoCash)\n2. Dzokera`;
  }
  else if(text==='5*1'){
    const u=getUser(phone); const exp=new Date(); exp.setDate(exp.getDate()+7); u.expiry=exp.toISOString(); users.set(phone,u);
    response = `END ✅ Yatambirwa! Wava ne 7 mazuva. Dzokerai *384*12345#`;
  }
  // 2. Past Papers
  else if(parts[0]==='2'){
    response = `CON Past Papers (Pasina Data):\n1. 2024 Maths P1\n2. 2023 Science\n3. Nyora: PAPER 2023 MATHS\nTumira chikumbiro, tichakutumira ne SMS`;
  }
  else {
    response = `END Ndatenda ne kushandisa Acadex.\nDzvanya *384*12345# zvakare.`;
  }

  res.set('Content-Type','text/plain');
  res.send(response);
});

app.get('/ussd/test', (req,res)=>{
  res.send(`<form method="POST" action="/ussd">
  phoneNumber: <input name="phoneNumber" value="263771234567"><br>
  text: <input name="text" value=""><br>
  <button>Send USSD</button></form>`);
});

const PORT=process.env.PORT||3001;
app.listen(PORT, ()=>console.log(`Acadex USSD live :${PORT} → POST /ussd  (Africa's Talking)`));
