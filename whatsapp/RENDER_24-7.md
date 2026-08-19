# Make Acadex Live 24/7 (I host it, you don't worry)

## Your question: "Can we use my personal WhatsApp number?"
**Short answer:** Don't — use a 2nd number for the bot. Here's why:

- **Meta Cloud API** (what we use) requires a number that is NOT on normal WhatsApp. If you convert your personal number to a bot, you LOSE your personal chats and can't use WhatsApp app on that number anymore.
- **For TESTING:** You keep your personal number as the *USER*. The bot lives on a NEW number (buy Econet $1 SIM, or free Twilio Sandbox number +1 415...). You send `mhoro acadex` from your personal number to the bot number — bot replies. Your friends also send `mhoro acadex` to that same bot number.
- If you REALLY want your personal number to BE the bot, we can use **Whapi.cloud / Baileys** that clones your WhatsApp Web — but Meta can ban it. Not recommended for Acadex when charging money.

**Recommendation:** Get a new Econet number `078 XXXXXX` for Acadex Bot. Keep your personal for admin.

---

## How I host it 24/7 (you do nothing)

**Option 1: Render (Free, 24/7 with 1 click) — I will deploy:**
1. Push code to GitHub
2. Render.com → New Web Service → Connect GitHub → `whatsapp/bot-acadex-secure.js`
3. Add Environment Variables:
```
VERIFY_TOKEN=acadex-verify-2026
WHATSAPP_TOKEN=EAAJ... (from Meta)
PHONE_NUMBER_ID=123456...
ADMIN_PHONE=263771234567 (YOUR number)
ADMIN_PASSWORD=Acadex#2026!Secure (choose new)
TRIGGER_PHRASE=mhoro acadex
PUBLIC_URL=https://acadex.onrender.com
APP_SECRET=xxx (from Meta)
```
4. Deploy → URL: `https://acadex.onrender.com`
5. In Meta Dashboard → WhatsApp → Configuration → Webhook: `https://acadex.onrender.com/webhook` + Verify Token
6. ✅ Live 24/7. Render sleeps after 15min idle, but WhatsApp webhook wakes it instantly. To keep truly 24/7, add free **UptimeRobot** ping every 5min.

**Option 2: I host here temporarily for you:**
I can run `start_process` now and give you a live preview URL `https://3000-xxxx.e2b.app` — good for 2hr test. For permanent, do Render above.

---

## Trigger-Only Logic (No spam)

- Bot is **SILENT** until user sends `mhoro acadex` (or just `acadex`)
- Then that user enters **Bot Mode for 30 minutes** (configurable). Only they get replies.
- Others who never send trigger get nothing — so your bot doesn't annoy random people who message the number.
- User can exit anytime: `acadex exit`
- After 30min silence, bot auto-exits, needs trigger again. Prevents spam + saves costs.

---

## Admin Locked — No Loopholes

✅ **3 layers:**

1. **Webhook signature:** `x-hub-signature-256` checked with `APP_SECRET` — fake webhooks from hackers are rejected (403)
2. **Admin API:** `/admin/api/*` requires `x-admin-password: Acadex#2026!Secure` header + rate limit 30/min + timingSafeEqual. Wrong password = 401, no hint.
3. **WhatsApp admin commands:** Only phone == `ADMIN_PHONE` can do `admin activate 263... 7`. Anyone else sending `admin activate` gets ignored. No `?admin=1` bypass, no `pwd` in URL loophole — we check header only.

**Change password:** Edit `ADMIN_PASSWORD` in Render Env → Redeploy → old password instantly dead.

**Brute force:** After 30 tries/min, IP gets 429. After 5 wrong passwords, you get email alert (we can add).

---

## Test Flow With YOUR Personal Number (right now)

1. Bot lives on `+263 78 BOT NUMBER` (Twilio Sandbox for now: +1 415 523 8886)
2. From YOUR personal WhatsApp, send to that bot number: `mhoro acadex`
3. Bot replies: `✅ Acadex activated!...`
4. Then send photo `2x+3=11` → bot replies with Shona voice note
5. Your friend sends `hello` (without trigger) → **bot says nothing** (correct)
6. Your friend sends `mhoro acadex` → now friend gets bot mode too
7. You (admin) send `admin activate 263772345678 7` → friend instantly paid

---

## What to give me to make it LIVE:

Send me:
- `ADMIN_PHONE`: your personal number (263771...)
- `TRIGGER_PHRASE` you want (default `mhoro acadex` or `acadex`?)
- Do you have a 2nd Econet number for bot, or use Twilio Sandbox for test?

I will deploy to Render and give you the live webhook URL in 5 minutes.
