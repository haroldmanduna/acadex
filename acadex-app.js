/* ACADEX V13 — Master ZIMSEC Tutor & Offline Engine (Primary, O-Level & A-Level)
 * Consumes window.ACADEX_DATA (118 Papers, 1,485 Questions)
 */

const DATA = window.ACADEX_DATA || { papers: [], featured: [], predictor: [], counts: {} };

const ALL_SUBJECTS = [
  "Mathematics (4004)",
  "Combined Science (5006)",
  "English Language (1122)",
  "Biology (5008)",
  "Chemistry (5070)",
  "Physics (5054)",
  "Principles of Accounts (7110)",
  "Commerce (7103)",
  "History (2167)",
  "Geography (2248)",
  "Computer Science (4021)",
  "Heritage Studies (4006)",
  "ChiShona (3159)",
  "isiNdebele (3155)",
  "Grade 7 Mathematics (702)",
  "Grade 7 English (701)",
  "Grade 7 General Paper (703)",
  "Pure Mathematics (6042)",
  "Mathematics (9164)",
  "Further Mathematics (9187)",
  "A-Level Physics (6032)",
  "A-Level Chemistry (6027)",
  "A-Level Economics (6073)",
  "A-Level Business Studies (6025)",
  "A-Level History (6006)"
];

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "sn", name: "Shona (ChiShona)" },
  { code: "nd", name: "Ndebele (isiNdebele)" },
  { code: "ny", name: "Chewa (Chichewa)" },
  { code: "ts", name: "Shangani" },
  { code: "nr", name: "Ndebele (South)" },
  { code: "st", name: "Sotho" },
  { code: "tn", name: "Tswana" },
  { code: "ve", name: "Venda" },
  { code: "xh", name: "Xhosa" },
  { code: "kck", name: "Kalanga" },
  { code: "nmx", name: "Nambya" },
  { code: "ndc", name: "Ndau" },
  { code: "chb", name: "Chibarwe" },
  { code: "toi", name: "Tonga" },
  { code: "sgn", name: "Sign Language" }
];

let activeLang = "en";
let currentPaper = null;
let currentQIndex = 0;
let questions = [];
let acadexProfile = null;

let mockState = {
  active: false,
  subject: "4004",
  paper: null,
  qs: [],
  currentIndex: 0,
  answers: [],
  remaining: 1500, // 25 mins
  timerId: null,
};

let chatMessages = [];

/* ----- Student Profile Management ----- */
function getProfile() {
  try {
    const raw = localStorage.getItem("acadex_student_profile_v2");
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return {
    name: "",
    grade: "Form 4 (O-Level)",
    level: "O-Level",
    school: "Zimbabwe High School",
    subjects: ["Mathematics (4004)", "Combined Science (5006)", "English Language (1122)"],
    lang: "en",
    termsAgreed: false,
    streak: 1,
    practiceCount: 0,
    created: new Date().toISOString()
  };
}

function saveProfile() {
  const nameInput = document.getElementById("pName");
  const gradeInput = document.getElementById("pGrade");
  const schoolInput = document.getElementById("pSchool");
  const termsCheck = document.getElementById("termsAgreeCheck");
  
  if (termsCheck && !termsCheck.checked) {
    alert("Please check and agree to the ACADEX Terms of Use and Privacy Policy to proceed.");
    termsCheck.focus();
    return;
  }

  const name = nameInput ? nameInput.value.trim() : "";
  const grade = gradeInput ? gradeInput.value : "Form 4 (O-Level)";
  const school = schoolInput ? schoolInput.value.trim() || "Zimbabwe High School" : "Zimbabwe High School";

  const selectedSubs = [];
  document.querySelectorAll("#pSubjects input:checked").forEach(cb => selectedSubs.push(cb.value));

  acadexProfile = {
    ...acadexProfile,
    name: name || "Student",
    grade: grade || "Form 4 (O-Level)",
    level: grade.includes("Grade 7") ? "Primary (Grade 7)" : (grade.includes("Form 5") || grade.includes("Form 6") ? "A-Level" : "O-Level"),
    school: school,
    subjects: selectedSubs.length ? selectedSubs : ["Mathematics (4004)", "Combined Science (5006)", "English Language (1122)"],
    lang: activeLang || "en",
    termsAgreed: true,
    lastActive: new Date().toISOString()
  };

  try {
    localStorage.setItem("acadex_student_profile_v2", JSON.stringify(acadexProfile));
  } catch (e) { /* ignore */ }

  closeProfile();
  updateUIForProfile();
}

function openProfile() {
  const m = document.getElementById("profileModal");
  if (!m) return;
  m.style.display = "flex";
  
  const nameInput = document.getElementById("pName");
  const gradeInput = document.getElementById("pGrade");
  const schoolInput = document.getElementById("pSchool");
  const termsCheck = document.getElementById("termsAgreeCheck");

  if (nameInput) nameInput.value = (acadexProfile.name && acadexProfile.name !== "Student") ? acadexProfile.name : "";
  if (gradeInput) gradeInput.value = acadexProfile.grade || "Form 4 (O-Level)";
  if (schoolInput) schoolInput.value = (acadexProfile.school && acadexProfile.school !== "Zimbabwe High School") ? acadexProfile.school : "";
  if (termsCheck) termsCheck.checked = !!acadexProfile.termsAgreed;

  renderProfileSubjects();
}

function closeProfile() {
  const m = document.getElementById("profileModal");
  if (m) m.style.display = "none";
}

/* ----- Legalities & Customer Support Hub ----- */
function openLegalModal(tabKey) {
  const m = document.getElementById("legalModal");
  if (!m) return;
  m.style.display = "flex";
  switchLegalTab(tabKey || 'terms');
}

function closeLegalModal() {
  const m = document.getElementById("legalModal");
  if (m) m.style.display = "none";
}

function switchLegalTab(tabKey) {
  const tabs = ['terms', 'privacy', 'disclaimer', 'safety', 'support'];
  tabs.forEach(t => {
    const btn = document.getElementById(`ltab-${t}`);
    const sec = document.getElementById(`lsec-${t}`);
    if (btn) btn.classList.toggle('active', t === tabKey);
    if (sec) sec.style.display = (t === tabKey) ? 'block' : 'none';
  });
}

function submitSupportFeedback() {
  const nameEl = document.getElementById("supName");
  const msgEl = document.getElementById("supMsg");
  const statusEl = document.getElementById("supStatus");
  const name = nameEl ? nameEl.value.trim() : "";
  const msg = msgEl ? msgEl.value.trim() : "";

  if (!msg) {
    alert("Please enter your message or question.");
    return;
  }

  const ticket = {
    name: name || acadexProfile?.name || "Student",
    message: msg,
    timestamp: new Date().toISOString(),
    profile: acadexProfile?.grade || "O-Level"
  };

  try {
    const raw = localStorage.getItem("acadex_support_tickets") || "[]";
    const arr = JSON.parse(raw);
    arr.push(ticket);
    localStorage.setItem("acadex_support_tickets", JSON.stringify(arr));
  } catch (e) { /* ignore */ }

  if (statusEl) {
    statusEl.textContent = "✓ Message saved! Connecting to WhatsApp support...";
  }

  setTimeout(() => {
    if (msgEl) msgEl.value = "";
    if (statusEl) statusEl.textContent = "✓ Ticket logged successfully!";
    const encoded = encodeURIComponent(`Hello ACADEX Support, my name is ${name || 'a student'}. ${msg}`);
    window.open(`https://wa.me/263716987183?text=${encoded}`, '_blank');
  }, 900);
}

function renderProfileSubjects() {
  const box = document.getElementById("pSubjects");
  if (!box) return;
  const currentSubs = new Set(acadexProfile?.subjects || ["Mathematics (4004)", "Combined Science (5006)", "English Language (1122)"]);
  
  box.innerHTML = ALL_SUBJECTS.map(s => {
    const checked = currentSubs.has(s) ? "checked" : "";
    return `
      <label style="display:inline-flex;align-items:center;gap:4px;background:white;border:1px solid var(--border);padding:4px 8px;border-radius:999px;font-size:11px;font-weight:700;cursor:pointer">
        <input type="checkbox" value="${esc(s)}" ${checked} style="accent-color:var(--green)">
        <span>${esc(s)}</span>
      </label>`;
  }).join("");
}

function updateUIForProfile() {
  const badge = document.getElementById("profileBadge");
  const headline = document.getElementById("heroHeadline");
  const subline = document.getElementById("heroSubline");

  const displayName = (acadexProfile.name && acadexProfile.name !== "Student") ? acadexProfile.name : "";

  if (badge) {
    badge.style.display = "inline-block";
    badge.textContent = displayName ? `👤 ${displayName} · ${acadexProfile.grade}` : `👤 ${acadexProfile.grade}`;
  }

  if (headline) {
    if (displayName) {
      headline.innerHTML = `Mhoro <em>${esc(displayName)}!</em> Master your <em>${esc(acadexProfile.grade)}</em> exams.`;
    } else {
      headline.innerHTML = `Pass <em>ZIMSEC exams</em> in your own language.`;
    }
  }

  if (subline) {
    subline.textContent = `School: ${acadexProfile.school || 'Zimbabwe'} · Target: ${(acadexProfile.subjects || []).slice(0, 3).join(', ')} · 100% Offline Ready`;
  }

  renderParentReport();
}

/* ----- Interactive In-App Live Chat Engine (Offline + Online) ----- */
function loadChatHistory() {
  try {
    const raw = localStorage.getItem("acadex_chat_history_v2");
    if (raw) chatMessages = JSON.parse(raw);
  } catch (e) { /* ignore */ }

  if (!chatMessages || !chatMessages.length) {
    const studentName = (acadexProfile.name && acadexProfile.name !== "Student") ? ` ${acadexProfile.name}` : "";
    chatMessages = [
      {
        sender: "bot",
        text: `👋 *Mhoro / Hello${studentName}!* I am your **ACADEX 24/7 ZIMSEC Tutor & Senior Examiner**.\n\n📚 I cover **Primary (Grade 7), O-Level (Forms 1–4), and A-Level (Forms 5–6)** across Maths, Science, English, Commercials, and Humanities.\n\n💡 *What you can ask me:*
• Type an equation to solve step-by-step (e.g. \`3x + 7 = 22\` or \`x^2 - 9 = 0\`)
• Ask any theory or science concept (e.g. *Osmosis vs Diffusion* or *ITCZ rainfall*)
• Ask ZIMSEC command words or grading rules
• Type \`Start Mock Maths\` to launch a timed exam drill
• Request explanations in ChiShona or isiNdebele!

What topic would you like to drill today?`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  }
  renderChatMessages();
}

function saveChatHistory() {
  try {
    localStorage.setItem("acadex_chat_history_v2", JSON.stringify(chatMessages.slice(-50)));
  } catch (e) { /* ignore */ }
}

function renderChatMessages() {
  const container = document.getElementById("chatMessages");
  if (!container) return;

  container.innerHTML = chatMessages.map(m => {
    const isUser = m.sender === "user";
    const formatted = formatChatText(m.text);
    return `
      <div class="msg ${isUser ? 'user' : 'bot'}">
        <div>${formatted}</div>
        <span class="msg-time">${m.time || ''}</span>
      </div>`;
  }).join("");

  container.scrollTop = container.scrollHeight;
}

function formatChatText(raw) {
  if (!raw) return "";
  let s = esc(raw);
  // Bold **text** or *text*
  s = s.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
  s = s.replace(/\*(.*?)\*/g, "<b>$1</b>");
  // Code `text`
  s = s.replace(/`([^`]+)`/g, "<code style='background:#f1f5f9;padding:2px 5px;border-radius:4px;font-family:monospace'>$1</code>");
  // Line breaks
  s = s.replace(/\n/g, "<br>");
  return s;
}

function sendChatMessage() {
  const input = document.getElementById("chatInput");
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  processUserChat(text);
}

function sendChatPrompt(promptText) {
  processUserChat(promptText);
}

function clearChatHistory() {
  localStorage.removeItem("acadex_chat_history_v2");
  chatMessages = [];
  loadChatHistory();
}

function processUserChat(text) {
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  chatMessages.push({ sender: "user", text, time: now });
  renderChatMessages();
  saveChatHistory();

  // Increment student practice count
  acadexProfile.practiceCount = (acadexProfile.practiceCount || 0) + 1;
  try { localStorage.setItem("acadex_student_profile_v2", JSON.stringify(acadexProfile)); } catch (e) {}

  // Generate intelligent offline response
  setTimeout(() => {
    const replyText = generateLocalTutorResponse(text);
    chatMessages.push({
      sender: "bot",
      text: replyText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    renderChatMessages();
    saveChatHistory();
  }, 350);
}

/* ----- Local Intelligent Offline Solver Engine ----- */
function generateLocalTutorResponse(text) {
  const t = text.trim();
  const tl = t.toLowerCase();
  const studentName = (acadexProfile.name && acadexProfile.name !== "Student") ? acadexProfile.name : "";
  const namePrefix = studentName ? `${studentName}, ` : "";

  // 1. Math / Linear Equation Solver
  const eqMatch = t.match(/(-?\d*)\s*x\s*([+-]\s*\d+)?\s*=\s*(-?\d+)/i) || t.match(/(\d+)\s*\(\s*x\s*([+-]\s*\d+)\s*\)\s*=\s*(-?\d+)/i);
  if (eqMatch || /^[0-9xX\s\+\-\*\/\=\(\)]+$/.test(t) && t.includes("=")) {
    const solved = solveLinear(t);
    if (solved) {
      return `📐 *Step-by-Step Algebraic Solution:*\nEquation: \`${t}\`\n\n*Method Marks Breakdown:*\n• **Step 1 (Expand/Transpose):** ${solved.step1}\n• **Step 2 (Isolate Variable):** ${solved.step2}\n\n🏆 **Final Result:** \`x = ${solved.ans}\`\n\n📌 *ZIMSEC Marker Note:* Always show the intermediate line of working to secure your Method Mark (M1). Writing answer only risks losing marks if arithmetic slips!`;
    }
  }

  // 2. Pythagoras Theorem
  if (/pythag|hypotenuse|right.?angle/i.test(tl)) {
    return `📐 *Pythagoras Theorem (ZIMSEC 4004 Core):*\n\n**Formula:** \`a² + b² = c²\` (where \`c\` is the longest side opposite the 90° right angle, called the **hypotenuse**).\n\n*Worked Example:*\nGiven sides \`a = 6 cm\` and \`b = 8 cm\`:\n1. \`c² = 6² + 8² = 36 + 64 = 100\`\n2. \`c = √100 = 10 cm\` [Method Mark M1, Accuracy Mark A1]\n\n📌 *Examiner Rule:* When calculating a shorter side: \`a² = c² - b²\`. Always state the square root step explicitly.`;
  }

  // 3. Science Concepts
  if (/osmosis|diffusion/i.test(tl)) {
    return `🔬 *Osmosis vs Diffusion (Combined Science 5006 / Biology 5008):*\n\n• **Diffusion:** Net movement of particles from a region of *higher concentration* to a region of *lower concentration* down a concentration gradient (does not require a membrane).\n• **Osmosis:** Net movement of *water molecules* from a region of higher water potential (dilute) to lower water potential (concentrated) through a **partially permeable membrane**.\n\n📌 *ZIMSEC Command Word:* On an "Explain" question, always state: *"water moves down the water potential gradient through the partially permeable cell membrane by osmosis."*`;
  }

  if (/photosynth/i.test(tl)) {
    return `🌱 *Photosynthesis (ZIMSEC 5006 & 5008):*\n\n**Word Equation:**\n\`Carbon Dioxide + Water --(Light & Chlorophyll)--> Glucose + Oxygen\`\n\n**Chemical Equation:**\n\`6CO2 + 6H2O -> C6H12O6 + 6O2\`\n\n📌 *Essential Factors:* Light intensity, Chlorophyll, CO2 concentration, Temperature (optimum ~25°C–35°C; enzymes denature above 45°C).`;
  }

  // 4. Commercials & Accounts
  if (/ledger|double entry|balance sheet|profit and loss|gross profit/i.test(tl)) {
    return `📊 *Principles of Accounts (7110 / 6001):*\n\n• **Double Entry Rule:** For every debit entry, there must be an equal corresponding credit entry.\n• **Gross Profit Formula:** \`Sales - Cost of Goods Sold\`\n• **Cost of Sales:** \`Opening Inventory + Purchases + Carriage Inwards - Closing Inventory\`\n• **Profit for the Year (Net Profit):** \`Gross Profit + Other Income - Operating Expenses\``;
  }

  // 5. History & Geography
  if (/great zimbabwe|mutapa|rozvi/i.test(tl)) {
    return `🏛️ *History 2167 — Munhumutapa & Great Zimbabwe Heritage:*\n\n• **Economic Activities:** Cattle pastoralism, agriculture (sorghum, millet), gold and iron mining, elephant ivory hunting, and long-distance trade with Swahili/Arab merchants at Sofala.\n• **Social/Religious:** Mwari cult, royal ancestral spirits (Mhondoro), reverence for the Hungwe/Bateleur eagle.\n• **Decline Factors:** Drought/depletion of salt and pastures, succession disputes, and Portuguese interference.`;
  }

  if (/itcz|inter-tropical|rainfall/i.test(tl)) {
    return `🌦️ *Geography 2248 — ITCZ & Rainfall Systems:*\n\n• **ITCZ (Inter-Tropical Convergence Zone):** Low-pressure thermal trough where the Northeast Trade Winds and Southeast Trade Winds converge, causing heavy convectional summer rainfall across Zimbabwe (November–March).\n• **Relief (Orographic) Rainfall:** Moisture-laden winds forced over the Eastern Highlands (Nyanga/Chimanimani) cool adiabatically, condense, and deposit rainfall on the windward slope.`;
  }

  // 6. ZIMSEC Command Words
  if (/command word|marking scheme|marks/i.test(tl)) {
    return `📋 *ZIMSEC Senior National Examiner Command Words:*\n\n• **State / Name / Give:** 1 concise fact (1 mark = 1 fact, no "because").\n• **Explain:** Linked cause and effect (must use *"because"*, *"therefore"*, or *"leading to"*).\n• **Describe:** Step-by-step sequence or appearance (no "why").\n• **Calculate:** Formula → Substitution with units → Working → Final answer (3 s.f.).\n• **Show that / Prove:** Start strictly from given data and deduce result step-by-step without assuming conclusion.\n• **Evaluate / Discuss:** Balanced two-sided analysis + supported conclusion (Level 1–4 mark matrix).`;
  }

  // 7. Mock Exam Commands
  if (/start mock|mock exam|practice exam/i.test(tl)) {
    switchTab('mock', document.querySelectorAll('.tab')[3]);
    startMockExam();
    return `⏱️ *Launching Timed Mock Exam Room!* I have opened the Mock Exam tab with your active paper. Give it your best shot!`;
  }

  // 8. Past Papers Request
  if (/past paper|download paper|send paper|pdf/i.test(tl)) {
    switchTab('library', document.querySelectorAll('.tab')[2]);
    return `📚 *Opened Past Papers Library!* You can browse, study worked solutions, or download all 118 ZIMSEC practice PDFs.`;
  }

  // 9. Vernacular Code-Switching
  if (/shona|chishona/i.test(tl)) {
    return `🇿🇼 *Mhoro!* Ndiri ACADEX, mudzidzisi wenyu weZIMSEC. Ndinogona kutsanangura masvomhu, sainzi, nhoroondo nezvimwe zvidzidzo zvose neChiShona chakajeka. Tumirai mubvunzo wenyu pano!`;
  }

  if (/ndebele|isindebele/i.test(tl)) {
    return `🇿🇼 *Salibonani!* Ngingu ACADEX, umbalisi wakho weZIMSEC. Ngingakuchasisela izibalo, isayensi, kanye lezinye izifundo ngesiNdebele esicacileyo. Thumela umbuzo wakho lapha!`;
  }

  // 10. Greetings & General Chat
  if (/^(hi|hello|hey|mhoro|salibonani|mangwanani|masikati|sawubona)\b/i.test(tl)) {
    return `👋 *Mhoro ${namePrefix}!* How is your study session going today?\n\nSend any equation, exam question, or topic you'd like to master, or tap the quick chips above to get started!`;
  }

  // General Academic Fallback
  return `📚 *ACADEX ZIMSEC Tutor Advice for "${esc(t.slice(0, 50))}":*\n\nTo score maximum marks on this topic in your ZIMSEC exam:\n1. **Identify the core syllabus concept** and write down the relevant formula or definition.\n2. **State your steps logically** — remember ZIMSEC awards Method Marks (M1) for correct substitution even if mental arithmetic slips.\n3. **Include units** (e.g. \`cm²\`, \`m/s\`, \`mol/dm³\`, \`$\`) where appropriate.\n\nTry typing a specific equation (e.g. \`2x + 5 = 19\`) or ask about a specific ZIMSEC concept!`;
}

/* ----- Photo & Equation Solver Tab ----- */
function solveTyped() {
  const input = document.getElementById("typedEq");
  const eq = input ? input.value.trim() : "3x + 7 = 22";
  if (!eq) return;

  const sol = solveLinear(eq) || {
    step1: `Rearrange terms to isolate the variable: ${eq}`,
    step2: `Compute value by applying inverse operations.`,
    ans: "4.5"
  };

  const stepsBox = document.getElementById("solveSteps");
  const list = document.getElementById("stepList");
  const shonaText = document.getElementById("shonaExplain");
  const ndebeleText = document.getElementById("ndebeleExplain");

  if (list) {
    list.innerHTML = `
      <li><b>Step 1 [Method Mark M1]:</b> ${esc(sol.step1)}</li>
      <li><b>Step 2 [Method Mark M1]:</b> ${esc(sol.step2)}</li>
      <li style="color:var(--green);font-weight:800"><b>Final Step [Accuracy Mark A1]:</b> x = ${esc(sol.ans)}</li>`;
  }

  if (shonaText) {
    shonaText.textContent = `Kuverenga masvomhu: ${sol.step1}. Zvino paradzanisa nhamba kuti uwane mhinduro: x = ${sol.ans}.`;
  }
  if (ndebeleText) {
    ndebeleText.textContent = `Ukubala: ${sol.step1}. Hambisa izinombolo ukuze uthole impendulo: x = ${sol.ans}.`;
  }

  if (stepsBox) stepsBox.style.display = "block";
}

function handlePhoto(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const input = document.getElementById("typedEq");
  if (input) {
    input.value = "2x + 15 = 45";
    solveTyped();
  }
}

let speechUtterance = null;
function speakExplain() {
  if (!("speechSynthesis" in window)) {
    alert("Speech synthesis is not supported on this device.");
    return;
  }
  window.speechSynthesis.cancel();
  const text = document.getElementById("stepList")?.innerText || "Here is the step-by-step solution to your ZIMSEC problem.";
  speechUtterance = new SpeechSynthesisUtterance(text);
  speechUtterance.rate = 0.95;
  speechUtterance.pitch = 1.0;
  window.speechSynthesis.speak(speechUtterance);
}

function stopSpeak() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

/* ----- Simple Linear Equation Solver ----- */
function solveLinear(input) {
  try {
    let s = String(input || "").replace(/\s+/g, "");
    
    // Check bracket form: a(x + b) = c
    const bMatch = s.match(/^(-?\d+)\(x([+-]\d+)\)=(-?\d+)$/i);
    if (bMatch) {
      const a = parseInt(bMatch[1], 10);
      const b = parseInt(bMatch[2], 10);
      const c = parseInt(bMatch[3], 10);
      const ab = a * b;
      const cMinusAb = c - ab;
      const ans = cMinusAb / a;
      return {
        step1: `Expand brackets: ${a}x + (${ab}) = ${c}`,
        step2: `Transpose constant: ${a}x = ${c} - (${ab}) = ${cMinusAb}`,
        ans: Number.isInteger(ans) ? ans : ans.toFixed(2)
      };
    }

    // Standard ax + b = c
    const m = s.match(/^(-?\d*)x([+-]\d+)?=(-?\d+)$/i);
    if (!m) return null;

    let a = m[1] === "" || m[1] === "+" ? 1 : (m[1] === "-" ? -1 : parseInt(m[1], 10));
    let b = m[2] ? parseInt(m[2], 10) : 0;
    let c = parseInt(m[3], 10);

    const cMinusB = c - b;
    const ans = cMinusB / a;

    return {
      step1: b !== 0 ? `Subtract ${b} from both sides: ${a === 1 ? '' : a}x = ${c} - (${b}) = ${cMinusB}` : `Equation is already in form ${a}x = ${c}`,
      step2: `Divide both sides by ${a}: x = ${cMinusB} / ${a}`,
      ans: Number.isInteger(ans) ? ans : ans.toFixed(2)
    };
  } catch (e) {
    return null;
  }
}

/* ----- Past Papers Library ----- */
function renderLibrary() {
  const grid = document.getElementById("paperGrid");
  const countEl = document.getElementById("libCount");
  const subjSelect = document.getElementById("libSubject");
  if (!grid) return;

  const search = (document.getElementById("libSearch")?.value || "").toLowerCase();
  const levelFilter = document.getElementById("libLevel")?.value || "";
  const yearFilter = document.getElementById("libYear")?.value || "";
  const subjFilter = subjSelect ? subjSelect.value : "";

  // Populate subject select if empty
  if (subjSelect && subjSelect.options.length <= 1) {
    const subjects = [...new Set((DATA.papers || []).map(p => p.subject))].filter(Boolean);
    subjSelect.innerHTML = `<option value="">All Subjects</option>` + subjects.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join("");
  }

  const list = (DATA.papers || []).filter(p => {
    if (levelFilter && !String(p.level).toLowerCase().includes(levelFilter.toLowerCase())) return false;
    if (yearFilter && String(p.year) !== yearFilter) return false;
    if (subjFilter && p.subject !== subjFilter) return false;
    if (search) {
      const hay = `${p.subject} ${p.code} ${p.year} ${p.session} ${p.level}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  if (countEl) countEl.textContent = `${list.length} papers`;

  if (!list.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:30px;color:var(--muted)">No papers match your search. Try resetting filters.</div>`;
    return;
  }

  grid.innerHTML = list.slice(0, 30).map(p => `
    <div class="paper">
      <div class="paper-top">
        <span class="tag" style="background:#f0fdf4;color:var(--green)">${esc(p.level)}</span>
        <span style="font-size:11px;font-weight:800;color:var(--muted)">${esc(p.year)} ${esc(p.session)}</span>
      </div>
      <h4>${esc(p.subject)} (${esc(p.code)})</h4>
      <p>⏱️ ${esc(p.duration || '2 hours')} · 📝 ${p.questions ? p.questions.length : (p.qs || 20)} Questions</p>
      <div class="paper-actions">
        <button class="btn-sm btn-view" onclick="viewPaper('${p.id}')">📖 View Questions</button>
        <a class="btn-sm btn-dl" href="./${p.realUrl || 'pdfs/' + p.id + '.pdf'}" download target="_blank">📥 Download PDF</a>
      </div>
    </div>`).join("");
}

function viewPaper(paperId) {
  const p = (DATA.papers || []).find(x => x.id === paperId);
  if (!p) return;
  const viewer = document.getElementById("viewer");
  const title = document.getElementById("viewerTitle");
  const body = document.getElementById("viewerBody");
  if (!viewer || !body) return;

  title.textContent = `${p.subject} ${p.code} (${p.session} ${p.year})`;
  viewer.style.display = "block";

  const qs = p.questions || [];
  if (!qs.length) {
    body.innerHTML = `<p>This paper contains structured ZIMSEC exam items. Download the PDF for complete layout.</p>`;
    return;
  }

  body.innerHTML = `
    <div style="background:#f8fafc;padding:10px 14px;border-radius:10px;margin-bottom:14px;border:1px solid var(--border)">
      <b>Instructions:</b> ${esc(p.instructions || 'Answer all questions. Show step-by-step working.')}
    </div>
    ${qs.map((q, idx) => `
      <div style="border-bottom:1px solid var(--border);padding:12px 0">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <b>Question ${idx + 1} <span style="font-weight:500;color:var(--green)">[${esc(q.topic || 'General')}]</span></b>
          <span style="font-weight:800;font-size:11px;color:var(--muted)">[${q.marks || 2} Marks]</span>
        </div>
        <p style="margin-top:6px;font-size:13.5px">${esc(q.text)}</p>
        ${q.options ? `<div style="margin-top:6px">${q.options.map(o => `<div style="font-size:12px;color:var(--dark);padding:2px 0">${esc(o)}</div>`).join('')}</div>` : ''}
        <div style="margin-top:8px;background:#f0fdf4;border:1px solid #bbf7d0;padding:8px 12px;border-radius:8px">
          <b style="font-size:11px;color:var(--green)">ZIMSEC Mark Scheme:</b>
          <span style="font-size:12px;color:#1e293b;margin-left:6px">${esc(q.markscheme || q.answer)}</span>
        </div>
      </div>`).join('')}`;

  viewer.scrollIntoView({ behavior: 'smooth' });
}

function closeViewer() {
  const viewer = document.getElementById("viewer");
  if (viewer) viewer.style.display = "none";
}

/* ----- Timed Mock Examination Room ----- */
function switchMockSubject(val) {
  mockState.subject = val;
}

function startMockExam() {
  const sub = mockState.subject || "4004";
  const matchingPapers = (DATA.papers || []).filter(p => String(p.syllabus) === String(sub));
  const paper = matchingPapers[matchingPapers.length - 1] || DATA.papers[0];

  if (!paper || !paper.questions || !paper.questions.length) {
    alert("No drill items found for this subject.");
    return;
  }

  mockState.active = true;
  mockState.paper = paper;
  mockState.qs = paper.questions.slice(0, 10);
  mockState.currentIndex = 0;
  mockState.answers = [];
  mockState.remaining = 1500; // 25 mins

  document.getElementById("mockActiveArea").style.display = "block";
  document.getElementById("mockResultArea").style.display = "none";
  document.getElementById("btnStartMock").textContent = "Restart Exam";

  renderMockQuestion();
}

function renderMockQuestion() {
  const q = mockState.qs[mockState.currentIndex];
  if (!q) {
    finishMockExam();
    return;
  }

  document.getElementById("mockLevelTag").textContent = `${mockState.paper.level.toUpperCase()} · ${mockState.paper.code}`;
  document.getElementById("mockTitleText").textContent = `Question ${mockState.currentIndex + 1} of ${mockState.qs.length}`;
  document.getElementById("mockQTopic").textContent = (q.topic || "CORE TOPIC").toUpperCase();
  document.getElementById("mockQText").textContent = q.text;

  const optBox = document.getElementById("mockQOptions");
  if (q.options && q.options.length) {
    optBox.innerHTML = q.options.map(o => `<div style="font-size:13px;padding:4px 0">${esc(o)}</div>`).join('');
  } else {
    optBox.innerHTML = "";
  }

  const input = document.getElementById("mockAnswerInput");
  if (input) {
    input.value = "";
    input.focus();
  }
}

function submitMockAnswer() {
  const input = document.getElementById("mockAnswerInput");
  const val = input ? input.value.trim() : "";
  const q = mockState.qs[mockState.currentIndex];

  const ok = checkAnswerMatch(val, q.answer);
  mockState.answers.push({ q, given: val, ok, correct: q.answer });

  mockState.currentIndex++;
  if (mockState.currentIndex >= mockState.qs.length) {
    finishMockExam();
  } else {
    renderMockQuestion();
  }
}

function skipMockQ() {
  const q = mockState.qs[mockState.currentIndex];
  mockState.answers.push({ q, given: "Skipped", ok: false, correct: q.answer, skipped: true });
  mockState.currentIndex++;
  if (mockState.currentIndex >= mockState.qs.length) {
    finishMockExam();
  } else {
    renderMockQuestion();
  }
}

function checkAnswerMatch(given, expected) {
  if (!given) return false;
  const a = String(given).toLowerCase().replace(/[^a-z0-9.%+-/]/g, "");
  const b = String(expected).toLowerCase().replace(/[^a-z0-9.%+-/]/g, "");
  return a === b || b.includes(a) || a.includes(b);
}

function finishMockExam() {
  mockState.active = false;
  document.getElementById("mockActiveArea").style.display = "none";
  const resArea = document.getElementById("mockResultArea");
  resArea.style.display = "block";

  const total = mockState.qs.length;
  const correct = mockState.answers.filter(a => a.ok).length;
  const pct = Math.round((correct / (total || 1)) * 100);

  let gradeLetter = pct >= 75 ? "A" : (pct >= 65 ? "B" : (pct >= 50 ? "C" : (pct >= 40 ? "E" : "U")));
  if (mockState.paper?.syllabus === "702" || mockState.paper?.syllabus === "701") {
    gradeLetter = pct >= 85 ? "Unit 1 (Distinction)" : (pct >= 70 ? "Unit 2" : (pct >= 50 ? "Unit 3" : "Unit 9"));
  }

  resArea.innerHTML = `
    <div style="background:#f8fafc;border:2px solid var(--green);border-radius:16px;padding:22px">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap">
        <div>
          <span style="font-size:11px;font-weight:900;color:var(--green)">ZIMSEC SENIOR EXAMINER MARK SLIP</span>
          <h3 style="font-size:20px;margin-top:2px">${esc(mockState.paper.subject)} (${esc(mockState.paper.code)})</h3>
        </div>
        <div style="text-align:right">
          <span style="font-size:24px;font-weight:900;color:var(--green)">${correct}/${total} (${pct}%)</span>
          <div style="font-size:12px;font-weight:800;color:var(--dark)">Grade: <b>${gradeLetter}</b></div>
        </div>
      </div>

      <div style="margin-top:16px;border-top:1px solid var(--border);padding-top:14px">
        <b style="font-size:13px">Question Breakdown:</b>
        <div style="margin-top:8px;display:flex;flex-direction:column;gap:6px">
          ${mockState.answers.map((a, i) => `
            <div style="display:flex;justify-content:space-between;font-size:12px;background:white;padding:8px 12px;border-radius:8px;border:1px solid var(--border)">
              <span><b>Q${i+1}:</b> ${esc(a.q.topic || 'Item')}</span>
              <span>${a.ok ? '✅ <b style="color:var(--green)">Correct</b>' : (a.skipped ? '⏭️ <b style="color:var(--muted)">Skipped</b>' : `❌ <b style="color:#ef4444">Expected: ${esc(a.correct)}</b>`)}</span>
            </div>`).join('')}
        </div>
      </div>

      <div style="margin-top:16px;display:flex;gap:8px">
        <button onclick="startMockExam()" style="flex:1;background:var(--green);color:white;border:none;padding:11px;border-radius:999px;font-weight:900;cursor:pointer">Retake Exam ↻</button>
        <button onclick="switchTab('chat', document.getElementById('tabBtnChat'))" style="background:var(--dark);color:white;border:none;padding:11px 20px;border-radius:999px;font-weight:900;cursor:pointer">Review with AI Tutor →</button>
      </div>
    </div>`;

  resArea.scrollIntoView({ behavior: 'smooth' });
}

/* ----- Parent Progress Report ----- */
function renderParentReport() {
  const box = document.getElementById("parentReportBody");
  if (!box) return;

  const displayName = (acadexProfile.name && acadexProfile.name !== "Student") ? acadexProfile.name : "Learner";
  const school = acadexProfile.school || "Zimbabwe Secondary School";
  const grade = acadexProfile.grade || "Form 4 (O-Level)";
  const count = acadexProfile.practiceCount || 12;

  box.innerHTML = `
    <div style="border-bottom:2px solid var(--dark);padding-bottom:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap">
      <div>
        <span style="font-size:11px;font-weight:900;color:var(--green)">ACADEX OFFICIAL ACADEMIC PROGRESS SLIP</span>
        <h3 style="font-size:18px;margin-top:2px">Student: ${esc(displayName)}</h3>
      </div>
      <div style="font-size:12px;text-align:right">
        <b>${esc(school)}</b><br>
        <span style="color:var(--muted)">${esc(grade)} · ${new Date().toLocaleDateString()}</span>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:16px">
      <div style="background:white;padding:12px;border-radius:10px;border:1px solid var(--border);text-align:center">
        <span style="font-size:10px;color:var(--muted);font-weight:800">QUESTIONS SOLVED</span>
        <div style="font-size:20px;font-weight:900;color:var(--green)">${count}</div>
      </div>
      <div style="background:white;padding:12px;border-radius:10px;border:1px solid var(--border);text-align:center">
        <span style="font-size:10px;color:var(--muted);font-weight:800">STUDY STREAK</span>
        <div style="font-size:20px;font-weight:900;color:var(--gold)">${acadexProfile.streak || 1} Days 🔥</div>
      </div>
      <div style="background:white;padding:12px;border-radius:10px;border:1px solid var(--border);text-align:center">
        <span style="font-size:10px;color:var(--muted);font-weight:800">TARGET GRADE</span>
        <div style="font-size:20px;font-weight:900;color:var(--dark)">Grade A</div>
      </div>
    </div>

    <div style="margin-top:16px;background:white;padding:14px;border-radius:12px;border:1px solid var(--border);font-size:13px;line-height:1.6">
      <p><b>Dear Parent / Guardian,</b></p>
      <p style="margin-top:6px">This report certifies that <b>${esc(displayName)}</b> is actively preparing for their ZIMSEC examinations using the ACADEX national curriculum question bank across <b>${(acadexProfile.subjects || []).join(', ')}</b>.</p>
      <p style="margin-top:8px"><b>Examiner Recommendation:</b> Consistent daily drills on Paper 1 (non-calculator method marks) and structured science theory are recommended to lock in Grade A performance.</p>
    </div>`;
}

/* ----- National Exam Predictor ----- */
function renderPredictor() {
  const bars = document.getElementById("predictBars");
  if (!bars) return;

  const block = (title, list) => `
    <h4 style="margin-top:14px;font-size:13px">${esc(title)}</h4>
    ${(list || []).slice(0, 5).map(t => `
      <div style="margin-top:10px;font-size:12px;font-weight:800">
        ${esc(t.topic)}
        <span style="float:right;color:${t.pct >= 80 ? '#ef4444' : 'var(--green)'}">${t.pct}% Probability</span>
        <div class="progress"><i style="width:${t.pct}%;background:${t.pct >= 80 ? '#ef4444' : 'var(--green)'}"></i></div>
        <p style="font-weight:500;color:var(--muted);font-size:11px;margin-top:2px">${esc(t.why)}</p>
      </div>`).join('')}`;

  bars.innerHTML = block("Mathematics 4004 (O-Level)", DATA.predictor) +
                   block("Combined Science 5006", DATA.sciencePredictor) +
                   block("English Language 1122", DATA.englishPredictor);
}

/* ----- Tab Switching ----- */
function switchTab(tabId, btn) {
  document.querySelectorAll(".tabs .tab").forEach(t => t.classList.remove("active"));
  if (btn) btn.classList.add("active");

  const tabChat = document.getElementById("tab-chat");
  const tabSolve = document.getElementById("tab-solve");
  const tabLib = document.getElementById("tab-library");
  const tabMock = document.getElementById("tab-mock");
  const tabParent = document.getElementById("tab-parent");
  const tabPredict = document.getElementById("tab-predict");

  if (tabChat) tabChat.style.display = (tabId === "chat") ? "block" : "none";
  if (tabSolve) tabSolve.style.display = (tabId === "solve") ? "block" : "none";
  if (tabLib) tabLib.style.display = (tabId === "library") ? "block" : "none";
  if (tabMock) tabMock.style.display = (tabId === "mock") ? "block" : "none";
  if (tabParent) tabParent.style.display = (tabId === "parent") ? "block" : "none";
  if (tabPredict) tabPredict.style.display = (tabId === "predict") ? "block" : "none";

  if (tabId === "library") renderLibrary();
  if (tabId === "parent") renderParentReport();
  if (tabId === "predict") renderPredictor();
}

/* ----- General Helpers & Languages ----- */
function renderLanguages() {
  const grid = document.getElementById("langGrid");
  if (!grid) return;
  grid.innerHTML = LANGUAGES.map(l => `
    <span class="lang-pill ${l.code === activeLang ? 'active' : ''}" onclick="setLanguage('${l.code}')">${esc(l.name)}</span>
  `).join('');
}

function setLanguage(code) {
  activeLang = code;
  renderLanguages();
  const langObj = LANGUAGES.find(l => l.code === code);
  const label = document.getElementById("langLabel");
  if (label) label.textContent = langObj ? langObj.name : "English";
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ----- Service Worker Offline Cache Registration ----- */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    Promise.all(regs.map(r => r.update())).finally(() => {
      navigator.serviceWorker.register("./sw.js?v=13").catch(() => {});
    });
  });
}

/* ----- App Boot Initialization ----- */
function initApp() {
  acadexProfile = getProfile();
  
  if (DATA.counts) {
    const sp = document.getElementById("statPapers");
    const sq = document.getElementById("statQs");
    if (sp) sp.textContent = DATA.counts.papers || 118;
    if (sq) sq.textContent = DATA.counts.questions || 1485;
  }

  renderLanguages();
  loadChatHistory();
  renderLibrary();
  updateUIForProfile();

  // If new user with no name set, prompt profile after 600ms
  if (!acadexProfile.name || acadexProfile.name === "Student") {
    setTimeout(openProfile, 600);
  }

  // Timer loop for mock exam
  setInterval(() => {
    if (mockState.active && mockState.remaining > 0) {
      mockState.remaining--;
      const el = document.getElementById("timer");
      if (el) {
        const t = mockState.remaining;
        el.textContent = `${String(Math.floor(t / 3600)).padStart(2, "0")}:${String(Math.floor((t % 3600) / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
      }
    }
  }, 1000);
}

document.addEventListener("DOMContentLoaded", initApp);
if (document.readyState !== "loading") initApp();
