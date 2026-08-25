# ACADEX — Pass ZIMSEC in Your Language 🇿🇼

Comprehensive **ZIMSEC Heritage-Based Education 5.0** AI tutor and examination platform covering:

- **Primary (Grade 1–7):** Mathematics (702/1 & 702/2), English Language, General Paper (Agriculture, Science & Tech, Social Sciences), Shona, Ndebele. (Results reported in Units 1–9).
- **O-Level (Forms 1–4):** Mathematics (4004/1 & 4004/2), Combined Science (5006/1 & 5006/2), English Language (1122/1 & 1122/2), Biology (5008), Chemistry (5070), Physics (5054), Principles of Accounts (7110), Commerce (7103), History (2167), Geography (2248), Shona (3159), Ndebele (3155).
- **A-Level (Forms 5–6):** Pure Mathematics (6042/1 & 6042/2), Mathematics (9164), Further Mathematics (9187), Sciences (Physics 6032, Chemistry 6027, Biology 6030), Commercials (Accounting 6001, Economics 6073, Business Studies 6025), Humanities (Geography 6002, History 6006, Literature in English 6039, Family & Religious Studies 6019). (Results reported in Grades A–U and 15 Points system).

PWA, 88 Practice PDFs, WhatsApp Bot, and Supabase Cloud Sync share the same unified standard.

## 🚀 Key Features

1. **📄 Live PDF Past Paper Dispatch on WhatsApp:**
   - Type `Past Papers` to view the 88 available examination papers.
   - Type `Send [Year] [Subject] P[1/2]` (e.g. `Send 2024 Maths P1`, `Send 2024 Science P2`, `Send 2024 Grade 7 P1`, `Send 2024 Pure Maths P1`) to receive the full PDF examination paper directly in WhatsApp.

2. **⏱️ Interactive Live Mock Exam Room:**
   - Type `Start Mock Maths` (4004/1 non-calculator drill)
   - Type `Start Mock Science` (5006/1 MCQ drill)
   - Type `Start Mock Grade 7` (702/1 primary drill)
   - Type `Start Mock Pure Maths` (6042/1 A-Level drill)
   - Questions are delivered one-by-one with an active countdown timer.
   - Submit written answers or snap photos of handwritten working (OCR extracted with Ox Alpha).
   - Generates an official ACADEX Senior Examiner Mark Slip with percentage, letter grade, and syllabus leak topics.

3. **🗄️ Supabase Cloud Database Sync:**
   - Synchronizes student profiles, streaks, and house points to the `students` table.
   - Stores mock exam marks and grades in the `grades` table.
   - Synchronizes platform metrics to the `settings` table.

4. **🇿🇼 Multi-Lingual Vernacular Code-Switching:**
   - Explains difficult technical concepts in ChiShona (`ChiShona`), isiNdebele (`isiNdebele`), or Chichewa (`Chichewa`), with final examination phrasing in standard technical English.
   - Text-to-speech voice notes (`VOICE`).

## 📲 Use It

- **Website / PWA:** https://haroldmanduna.github.io/acadex/
- **WhatsApp Companion Bot:** **+263 71 698 7183** — Send `mhoro acadex` or any question
- **Link Portal:** https://acadex-r6z0.onrender.com/link
- **Live Health Status:** https://acadex-r6z0.onrender.com/health

## 🛠️ Deploy (Render)

Start command:
```bash
node whatsapp/bot-acadex-secure.js
```

Environment Variables:
- `ADMIN_PHONE` — `263716987183`
- `ADMIN_PASSWORD` — Admin dashboard password
- `PUBLIC_URL` — `https://acadex-r6z0.onrender.com`
- `TRIGGER_PHRASE` — `mhoro acadex`
- `SUPABASE_URL` — `https://eczotaismhalrbvpanck.supabase.co`
- `SUPABASE_KEY` — `sb_publishable_Q3eEj-h6uR4yjdX0lE9LIg_KLi7DKgg`
- `OPENROUTER_KEY` — OpenRouter API key for vision OCR and LLM reasoning

## 💻 Local Development

```bash
npm install --prefix whatsapp
ADMIN_PHONE=263716987183 PORT=3000 node whatsapp/bot-acadex-secure.js
```
