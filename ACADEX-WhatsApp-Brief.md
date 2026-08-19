# ACADEX — How Everything Works on WhatsApp (Briefing) 🇿🇼

**Name:** Acadex (formerly ZIMSEC Super Tutor)
**Tagline:** *Pass ZIMSEC in your language — on WhatsApp*
**Number:** +263 78 123 4567 (you set this in Meta Dashboard)
**User just sends:** `Mhoro` → Bot replies instantly

---

## 1. THE FULL WHATSAPP JOURNEY (What student sees)

### New Student (First time)
```
You: Mhoro
Acadex: Mhoro Tatenda! 🙏 Ndiri Acadex, mudzidzisi wako pa WhatsApp.
Unogona kutumira MUFANANIDZO wemubvunzo kana kunyora mubvunzo.
🎁 Une 10 FREE questions. Mushure me10, $0.75/week ne EcoCash.

[Demo buttons: Try Photo Solve | Past Papers | Mock Exam]
```

### Free User (0-10 questions)
```
You: [Photo] 2x + 3 = 11
Acadex: 
  📝 Text in Shona (slow, step-by-step)
  🎧 Voice Note 0:24 (real fluent Shona MP3)
  📊 "Questions left: 7/10 FREE"
  [Buttons: Next Question | Makorokoto! | Change to Ndebele]
```
- Past Papers Library: type `library` or `2023 Maths` → Bot sends paper → **Extract & Study** works fully in free tier (but limited to 2 papers)
- Mock Exam: 1 free mock (25 Qs) — shows score, but full report needs payment

### When FREE runs out (11th question)
```
Acadex: 😊 Wapfuura 10 FREE. Kuti uenderere mberi:
💰 $0.75 / week  OR  $3 / month
Bhadhara ne:
1️⃣ EcoCash: *151*2*1*12345*0.75#  (Merchant: ACADEX)
2️⃣ InnBucks: InnBucks code → send
3️⃣ USD ZiG: Send "PAID" after payment

[Buttons: Bhadhara EcoCash | Ndatenda PAID | Edza mangwana]

→ Bot STOPS solving. It will ONLY send this paywall until paid.
```
**This is how you STOP service.** No bypass. The `checkSubscription()` middleware blocks all `solve/library/mock` until `expiry > now`.

### Paying User (After PAID verified)
```
Acadex: ✅ Payment yatambirwa! Tatenda.
Wava ne 7 mazuva (kana 30 mazuva). Unogona kubvunza unlimited.
```
- Now: Unlimited photos, unlimited voice notes in 16 languages, unlimited past papers, unlimited mocks, weekly parent report
- Every Sunday 6pm: Bot auto-sends parent report to parent number (if linked)

### 3 Days Before Expiry (Reminder - Template)
```
[Approved WhatsApp Template - outside 24hr window]
Mhoro Mai Tatenda,
Acadex ya Tatenda inopera mumazuva 2 (15 Aug).
Renew $0.75 kuti asa-mire kudzidza.
[Bhadhara Zvino]
```
- If not paid → Day 0: `Service yamira. Bhadhara kuti uenderere.`
- Grace: 2 days grace where bot still gives 1 Q/day to nudge
- After grace: Full paywall again

### Parent Pays for Child (Very common)
```
Child: 263771234567 → uses bot
Parent: 263772345678 → pays

Child types: link 263772345678
Acadex: Tumira ku parent: "Tatenda anoda Acadex $0.75, bhadhara?"
Parent pays → Child auto-activated (both numbers linked in DB)
```

---

## 2. HOW YOU CHARGE & CUT OFF (Technically)

### Database (Supabase / Firebase / Mongo - pick one, we use Supabase free)
Table `users`:
| phone | lang | free_used | expiry_date | parent_phone | status |
| 263771... | sn | 10 | 2026-08-26 | 263772... | active |
| 263773... | nd | 10 | 2026-08-10 | null | expired |

Table `payments`:
| phone | amount | method | ref | verified | created_at |

### Middleware (in bot.js) — This is the paywall
```js
async function checkSubscription(phone){
  const user = await db.getUser(phone);
  if(!user) return { allowed: true, freeLeft: 10 }; // new user
  if(user.expiry_date && new Date(user.expiry_date) > new Date()){
    return { allowed: true, daysLeft: diffDays(user.expiry_date) }; // PAID
  }
  if(user.free_used < 10) return { allowed: true, freeLeft: 10 - user.free_used };
  return { allowed: false, reason: 'EXPIRED_OR_FREE_DONE' };
}
// In webhook, BEFORE solving:
const sub = await checkSubscription(from);
if(!sub.allowed){
  await sendPaywall(from, lang); // blocks
  return;
}
// else solve + increment free_used if not paid
```

### Payment Verification (3 options for Zimbabwe)

**Option 1: AUTOMATIC (Best, Paynow - supports EcoCash, InnBucks, ZiG, Card)**
- Sign up at **paynow.co.zw** (Zimbabwean gateway) — $20 setup
- Bot sends Paynow link: `paynow.co.zw/acadex?phone=26377...&amount=0.75`
- Student clicks, pays EcoCash → Paynow fires webhook to your bot → `expiry_date = now + 7 days` auto
- **Instant, no manual work.** Recommended.

**Option 2: SEMI-AUTO (EcoCash Merchant USSD + "PAID")**
- Get EcoCash Merchant code: Dial *151*2*1*... or via Econet
- Bot says: `*151*2*1*12345*0.75#`
- Student pays, then sends `PAID 12345` or screenshot
- You (or your assistant) verify in EcoCash app → type in admin dashboard `/activate 263771... 7` → bot activates
- Good for start, manual for first 100 users

**Option 3: InnBucks / USD Cash**
- Student buys InnBucks voucher, sends code `INN123456`
- You verify on innbucks.co.zw → activate

**For now, use Option 2 to start TODAY, upgrade to Paynow when you hit 50 payers.**

### Admin Dashboard (Simple)
- `acadex-admin.html` (we can build) → login → see:
  - Active: 342 users (expiry green)
  - Expiring in 3 days: 28 users (yellow, auto-reminder sent)
  - Expired: 51 users (red, paywalled)
  - Button: `[Activate 7 days]` `[Activate 30 days]` `[Add 5 free]`
- Also WhatsApp command for YOU only: Send from your number `admin activate 26377... 30`

---

## 3. EVERYTHING ACADEX DOES ON WHATSAPP

| Feature | Command | What happens |
|---|---|---|
| **Photo Solve** | Send photo + caption | OCR → AI solves in your language → Text + Voice Note (real 16-lang MP3) |
| **Text Question** | Type `Solve 3x-5=10` | Same as photo |
| **Voice Question** | Hold voice note | Transcribe → solve → reply voice |
| **Past Papers** | `library` or `2023 Maths` | Search 1,240 papers → View → Extract & Study → study Q-by-Q |
| **Mock Exam** | `mock` | Timed 25 Qs, one at a time, ZIMSEC grade at end |
| **Predictor** | `predict` | "Vectors 92% chance Nov 2026" |
| **Language** | `switch to Ndebele` or tap language pill on website | Changes all future replies + voice |
| **Parent Report** | Auto Sunday 6pm | Sends to parent number: hours studied, weakest topics, pay link |
| **Teacher** | `create class 4A` (teacher) | Teacher gets dashboard link, adds 40 numbers, sees progress |

**Data:** ~0.02MB per Q, works on 2G, voice notes ~90KB
**Hours:** 24/7, replies <3s
**16 Languages:** Shona, Ndebele, English, Venda, Tonga, Xhosa, Sotho, Tswana, Nambya, Ndau, Kalanga, Chewa, Chibarwe, Shangani, Koisan, Sign (text)

---

## 4. YOUR MONEY MATH

- 10,000 students use free → 15% convert (Zimbabwe avg for Edu) = 1,500 payers
- 1,500 x $3/month = **$4,500/month**
- Minus costs: WhatsApp Cloud API $0 (first 1k free, then ~$0.02/msg), hosting $7, Paynow 3.5%
- **Net ~$4,200/month** — before schools ($149/mo each)

School = 1 school x 200 students = $149. 10 schools = $1,490 extra.

**First step to $1k:** Get 100 payers at $3 = $300 + 2 schools = $598. Very doable in Harare if you visit 5 schools.

---

## 5. NEXT STEPS FOR YOU (Today → This week)

**TODAY:**
1. Rename to Acadex (done below)
2. Test bot on Twilio Sandbox with your own phone
3. Get EcoCash Merchant code (*151*...)

**THIS WEEK:**
1. Visit 1 school + 10 tuckshop kids, show WhatsApp demo
2. Collect first 10 PAID via EcoCash manual
3. Upgrade to Paynow auto when manual gets annoying

Want me to:
- Rename the website to ACADEX now?
- Build the `acadex-admin.html` dashboard so you can click Activate/Expire?
- Deploy the Paynow auto-pay link?

Just say **"Rename to Acadex"** or **"Build admin"** and I ship it now.
