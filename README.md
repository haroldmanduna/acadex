# ACADEX — Pass ZIMSEC Offline 🇿🇼
**Live Demo:** `https://acadex.onrender.com/zimsec-super-tutor.html` (after deploy)
**WhatsApp:** Trigger `mhoro acadex` → Bot Mode 30min → 16 languages
**Offline:** USSD `*384*12345#` + PWA (airplane mode) + SMS

## One-Click Deploy 24/7
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/HaroldManduna/acadex)

Or manual:
1. Fork this repo
2. Render.com → New → Blueprint → select repo (uses `render.yaml`)
3. Add env vars: `ADMIN_PHONE`, `ADMIN_PASSWORD`, `WHATSAPP_TOKEN`, `PHONE_NUMBER_ID`
4. Deploy → get `https://acadex.onrender.com`

## Local Test
```bash
npm install --prefix whatsapp
ADMIN_PHONE=263771234567 ADMIN_PASSWORD='Acadex#2026!Secure' PORT=3000 node whatsapp/bot-acadex-secure.js
# PWA: http://localhost:3000/zimsec-super-tutor.html
# USSD: POST http://localhost:3000/ussd
# Webhook: http://localhost:3000/webhook
```

## Structure
- `zimsec-super-tutor.html` — PWA frontend (16 languages, voice, library)
- `audio/` — 15 real fluent MP3s
- `whatsapp/bot-acadex-secure.js` — Unified server (WhatsApp + USSD + PWA + Admin)
- `manifest.json` + `sw.js` — Offline PWA

Built for HaroldManduna — Zimbabwe, 2026
