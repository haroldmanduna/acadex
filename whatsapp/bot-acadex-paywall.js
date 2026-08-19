// ACADEX - WhatsApp Bot with PAYWALL + CUTOFF (drop-in for bot.js)
// Add this checkSubscription block at top of your POST /webhook

import { createClient } from '@supabase/supabase-js'; // or use Firebase/Mongo - same idea
// Supabase free: supabase.com -> create project -> copy URL + KEY
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// --- PAYWALL CONFIG ---
const FREE_LIMIT = 10;
const WEEK_PRICE = 0.75; // USD
const MONTH_PRICE = 3;
const GRACE_DAYS = 2; // after expiry, still allow 1 Q/day for 2 days to nudge

async function getUser(phone){
  const { data } = await supabase.from('users').select('*').eq('phone', phone).single();
  return data;
}
async function upsertUser(phone, patch){
  await supabase.from('users').upsert({ phone, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'phone' });
}
async function checkSubscription(phone){
  const user = await getUser(phone);
  if(!user) return { allowed: true, freeLeft: FREE_LIMIT, isFree: true, reason: 'NEW' };
  // 1. Paid active?
  if(user.expiry_date && new Date(user.expiry_date) > new Date()){
    const days = Math.ceil((new Date(user.expiry_date) - new Date())/86400000);
    return { allowed: true, isPaid: true, daysLeft: days };
  }
  // 2. Grace period?
  if(user.expiry_date){
    const graceEnd = new Date(user.expiry_date); graceEnd.setDate(graceEnd.getDate()+GRACE_DAYS);
    if(new Date() < graceEnd && (user.grace_used||0) < GRACE_DAYS){
      return { allowed: true, isGrace: true, graceLeft: GRACE_DAYS - (user.grace_used||0) };
    }
  }
  // 3. Free trial left?
  if((user.free_used||0) < FREE_LIMIT) return { allowed: true, isFree: true, freeLeft: FREE_LIMIT - (user.free_used||0) };
  // 4. BLOCKED
  return { allowed: false, reason: 'EXPIRED' };
}

async function sendPaywall(to, lang){
  const msgs = {
    sn: `😊 Wapfuura 10 FREE. Kuti uenderere mberi ne Acadex:\n💰 $0.75 / vhiki  kana  $3 / mwedzi\nBhadhara:\n1️⃣ EcoCash: *151*2*1*12345*${WEEK_PRICE}#\n2️⃣ InnBucks: tumira code\nMushure mekubhadhara tumira *PAID*`,
    nd: `😊 Udlule 10 FREE. Ukuze uqhubeke ne Acadex:\n💰 $0.75 / iviki  kumbe $3 / ngenyanga\nBhadhara:\n1️⃣ EcoCash: *151*2*1*12345*${WEEK_PRICE}#\nNgemva kokubhadhara thumela *PAID*`,
    en: `😊 You've used 10 FREE. To continue Acadex:\n💰 $0.75 / week or $3 / month\nPay:\n1️⃣ EcoCash: *151*2*1*12345*${WEEK_PRICE}#\n2️⃣ InnBucks: send code\nAfter payment send *PAID*`
  };
  const text = msgs[lang] || msgs.sn;
  await sendWhatsAppText(to, text);
  await sendWhatsAppButtons(to, 'Choose:', [
    {id:'pay_ecocash', title:'EcoCash $0.75'},
    {id:'pay_month', title:'$3 Month'},
    {id:'help_paid', title:'Ndatenda PAID'}
  ]);
}

// In your webhook, BEFORE solving, add:
 /*
  const sub = await checkSubscription(from);
  if(!sub.allowed){
    await sendPaywall(from, lang);
    return res.sendStatus(200);
  }
  // If allowed but isFree, increment after solving
  // If isGrace, increment grace_used
  // If isPaid, do nothing
 */

// Activate after payment (call from Paynow webhook or admin)
export async function activateUser(phone, days=7){
  const expiry = new Date(); expiry.setDate(expiry.getDate()+days);
  await upsertUser(phone, { expiry_date: expiry.toISOString(), status: 'active' });
  await sendWhatsAppText(phone, `✅ Acadex yatambirwa! Wava ne ${days} mazuva unlimited. Tumira mufananidzo wemubvunzo.`);
}

// Paynow webhook example (automatic)
app.post('/paynow/callback', async (req,res)=>{
  const { phone, amount, status } = req.body; // Paynow sends this
  if(status==='paid'){
    const days = Number(amount) >= 3 ? 30 : 7;
    await activateUser(phone, days);
  }
  res.sendStatus(200);
});

// Admin command (only from YOUR number)
const ADMIN_PHONE = process.env.ADMIN_PHONE; // your number 26377...
app.post('/webhook', async (req,res)=>{
  // ... after extracting 'from' and 'text' ...
  // if(from===ADMIN_PHONE && text.startsWith('admin activate')){
  //   const [, , target, days] = text.split(' ');
  //   await activateUser(target, Number(days)||7);
  //   await sendWhatsAppText(from, `Activated ${target} for ${days} days`);
  // }
});
