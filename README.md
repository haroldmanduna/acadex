# ACADEX — Pass ZIMSEC Maths in your language 🇿🇼

**Maths only (for now):** Grade 7 (702), O-Level (4004), A-Level Pure / Maths / Further.

52 original **ZIMSEC-style practice papers** (not official copyrighted scripts) with matching worked solutions.

- Paper 1 (4004/1): 30 short questions, **100 marks**, 2h30, **non-calculator**
- Paper 2 (4004/2): Section A 52 (all) + Section B 7×12 choose 4
- App, PDFs, mock exam, and WhatsApp all use the same question bank

## Deploy (Render)

1. Push this repo
2. Render → New → Blueprint (`render.yaml`) **or** Web Service, start command:

```bash
node whatsapp/bot-acadex-secure.js
```

3. Set env vars in the dashboard (do **not** put secrets in git):

- `ADMIN_PHONE` — your number, digits only e.g. `26377…`
- `ADMIN_PASSWORD` — strong unique password
- `WHATSAPP_TOKEN`, `PHONE_NUMBER_ID`, `VERIFY_TOKEN`, `PUBLIC_URL`

## Local

```bash
npm install --prefix whatsapp
ADMIN_PHONE=26377xxxxxxx ADMIN_PASSWORD='choose-a-strong-password' PORT=3000 node whatsapp/bot-acadex-secure.js
```

- App: http://localhost:3000/
- Health: http://localhost:3000/health
- USSD test: http://localhost:3000/ussd/test

## Rebuild papers

```bash
python3 scripts/build_maths.py
```

Writes `pdfs/*.pdf`, `acadex-data.js`, `acadex-question-bank.json`.

## Structure

- `zimsec-super-tutor.html` + `acadex-app.js` — PWA
- `acadex-data.js` — 52 papers + solutions
- `scripts/build_maths.py` — generator
- `whatsapp/bot-acadex-secure.js` — Express (static + WhatsApp + USSD + admin)

WhatsApp trigger: `mhoro acadex`
