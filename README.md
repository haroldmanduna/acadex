# ACADEX — Pass ZIMSEC in your language 🇿🇼

Original **ZIMSEC-style practice papers** (not official copyrighted scripts) for:

- **Maths 4004** — P1: 30 short, 100 marks, 2h30, no calculator. P2: Sec A 52 all + Sec B 7×12 choose 4
- **Combined Science 5006** — P1: 40 MCQ, 1 hour. P2: 8 structured Bio/Chem/Phys, 2 hours, 80 marks, all compulsory
- **English Language 1122** — P1 composition + guided writing. P2 comprehension, summary, register

PWA, PDFs, and WhatsApp share the same question bank (88 papers).

## Use it

- Website: https://haroldmanduna.github.io/acadex/
- WhatsApp: **+263 71 698 7183** — send `mhoro acadex`
- Link the phone (auto-replies, no Facebook): https://acadex-r6z0.onrender.com/link

## Deploy (Render)

Start command:

```bash
node whatsapp/bot-acadex-secure.js
```

Env (dashboard only — never commit secrets):

- `ADMIN_PHONE` — `263716987183`
- `ADMIN_PASSWORD` — strong unique password
- `PUBLIC_URL` — `https://acadex-r6z0.onrender.com`
- `TRIGGER_PHRASE` — `mhoro acadex`
- Optional Cloud API: `WHATSAPP_TOKEN`, `PHONE_NUMBER_ID`, `VERIFY_TOKEN`

## Local

```bash
npm install --prefix whatsapp
ADMIN_PHONE=263716987183 PORT=3000 node whatsapp/bot-acadex-secure.js
```

Open http://localhost:3000/link and enter the pairing code on the phone.

## Rebuild papers

```bash
python3 scripts/build_maths.py
```
