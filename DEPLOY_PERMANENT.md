# ACADEX Permanent 24/7 Links — How to keep them forever

## Your CURRENT proper working links (tested, E2B — expires in ~2 hours, then we make permanent)

**UNIFIED HOST (1 link for everything):**
- **PWA Offline App:** https://3000-i6ysznyvn5kkb2s16kgoy.e2b.app/zimsec-super-tutor.html
- **USSD (offline, no data):** https://3000-i6ysznyvn5kkb2s16kgoy.e2b.app/ussd  (POST)
- **USSD Test Form:** https://3000-i6ysznyvn5kkb2s16kgoy.e2b.app/ussd/test
- **WhatsApp Webhook:** https://3000-i6ysznyvn5kkb2s16kgoy.e2b.app/webhook
- **Admin (only you):** https://3000-i6ysznyvn5kkb2s16kgoy.e2b.app/admin  (pwd: Acadex#2026!Secure)

All 5 tested: PWA 200, manifest 200, sw.js 200, audio 200, USSD CON..., webhook HELLO, admin locked 401 without pwd.

---

## To make PERMANENT 24/7 (never expire) — 3 minutes:

### Option A: Render (Free, recommended, 24/7)
1. Push this folder to GitHub (create repo `acadex`)
2. Go to **render.com** → Sign in with GitHub → New + → Blueprint → select repo (uses `render.yaml` included)
3. Add env vars in Render dashboard:
   ```
   ADMIN_PHONE=263771234567  (your personal number)
   ADMIN_PASSWORD=Acadex#2026!Secure (change it)
   WHATSAPP_TOKEN=EAAJ... (from developers.facebook.com later)
   PHONE_NUMBER_ID=123456... 
   VERIFY_TOKEN=acadex-verify-2026
   TRIGGER_PHRASE=mhoro acadex
   PUBLIC_URL=https://acadex.onrender.com
   ```
4. Deploy → Render gives you **https://acadex.onrender.com** — THIS NEVER EXPIRES, 24/7
5. In Meta Dashboard set Webhook to `https://acadex.onrender.com/webhook`
6. Add UptimeRobot ping to `https://acadex.onrender.com/health` every 5 min → never sleeps

### Option B: Railway / Fly.io (also free)
Same steps, just `railway.app` → Deploy from GitHub

### After permanent deploy, your links become:
- PWA: `https://acadex.onrender.com/zimsec-super-tutor.html`
- USSD: `https://acadex.onrender.com/ussd`
- Webhook: `https://acadex.onrender.com/webhook`
- Admin: `https://acadex.onrender.com/admin`

Replace `acadex.onrender.com` with whatever Render gives you.

---

## Test offline right now (before permanent):
1. **PWA offline:** Open PWA link on phone → Install → Turn on Airplane Mode → Refresh → still works
2. **USSD offline:** Turn Mobile Data OFF → Use USSD test form → still gets `CON Acadex...`
3. **WhatsApp trigger:** Send `mhoro acadex` from your personal number to bot test (mock mode logs in server, no WhatsApp token needed for now)

All logs live at Render → Logs.

Want me to push to GitHub for you? Give me your GitHub username.
