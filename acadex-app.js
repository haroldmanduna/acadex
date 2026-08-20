/* ACADEX V3 — Maths tutor UI. Consumes window.ACADEX_DATA */
const DATA = window.ACADEX_DATA || { papers: [], featured: [], predictor: [], counts: {} };
const ALL_SUBJECTS = ["Mathematics", "Grade 7 Mathematics", "Pure Mathematics", "Further Mathematics", "Combined Science"];
const languages = [
  { code: "sn", name: "Shona" }, { code: "nd", name: "Ndebele" }, { code: "en", name: "English" },
  { code: "ven", name: "Venda" }, { code: "toi", name: "Tonga" }, { code: "xho", name: "Xhosa" },
  { code: "sot", name: "Sotho" }, { code: "tsw", name: "Tswana" }, { code: "namb", name: "Nambya" },
  { code: "ndau", name: "Ndau" }, { code: "kal", name: "Kalanga" }, { code: "che", name: "Chewa" },
  { code: "bar", name: "Chibarwe" }, { code: "sha", name: "Shangani" }, { code: "sna", name: "Sign + Text" },
  { code: "koi", name: "Koisan" }
];
const LABELS = {
  en: { step: "Step", check: "Check", answer: "Answer", marks: "Mark scheme", hello: "Hello", coach: "Coach" },
  sn: { step: "Danho", check: "Kutarisa", answer: "Mhinduro", marks: "Mamiriro emamarks", hello: "Mhoro", coach: "Mudzidzisi" },
  nd: { step: "Isinyathelo", check: "Ukuhlola", answer: "Impendulo", marks: "Ukumaka", hello: "Salibonani", coach: "Umqeqeshi" }
};
const realAudioMap = {
  sn: "audio/shona-solve.mp3", nd: "audio/ndebele-solve.mp3", en: "audio/english-solve.mp3",
  ven: "audio/venda-solve.mp3", toi: "audio/tonga-solve.mp3", xho: "audio/xhosa-solve.mp3",
  sot: "audio/sotho-solve.mp3", tsw: "audio/tswana-solve.mp3", che: "audio/chewa-solve.mp3",
  kal: "audio/kalanga-solve.mp3", namb: "audio/nambya-solve.mp3", ndau: "audio/ndau-solve.mp3",
  bar: "audio/chibarwe-solve.mp3", sha: "audio/shangani-solve.mp3", koi: "audio/koisan-solve.mp3", sna: null
};

let acadexProfile = JSON.parse(localStorage.getItem("acadex_profile") || "null");
let activeLang = "sn";
let explainLang = null;
let currentQ = 0;
let currentExplain = null;
let currentRealAudio = null;
let questions = (DATA.featured || []).map((q, i) => ({
  ...q,
  tag: q.tag || `${q.topic} Q${q.n}`,
  q: strip(q.text)
}));

const mockState = {
  paperId: DATA.mockPaperId || "4004-1-2024-November",
  i: 0,
  answers: {},
  started: false,
  remaining: 2 * 3600 + 30 * 60
};

function strip(html) {
  return String(html || "").replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
function L(code) {
  return LABELS[code] || LABELS.en;
}
function langName(code) {
  return (languages.find(l => l.code === code) || { name: "English" }).name;
}
function getProfile() {
  return acadexProfile || { name: "Student", grade: "Form 4 (O-Level)", level: "O-Level", subjects: ["Mathematics"] };
}
function paperById(id) {
  return (DATA.papers || []).find(p => p.id === id);
}

/* ----- profile ----- */
function renderProfileSubjects() {
  const c = document.getElementById("pSubjects");
  if (!c) return;
  c.innerHTML = "";
  ALL_SUBJECTS.forEach(s => {
    const selected = acadexProfile?.subjects?.includes(s);
    const b = document.createElement("button");
    b.textContent = s;
    b.style.cssText = `padding:5px 10px;border-radius:999px;font-size:11px;font-weight:700;border:1px solid ${selected ? "#0a7a3c" : "#e2e8f0"};background:${selected ? "#f0fdf4" : "white"};color:${selected ? "#0a7a3c" : "#334155"};cursor:pointer`;
    b.onclick = () => {
      acadexProfile = acadexProfile || { subjects: [] };
      acadexProfile.subjects = acadexProfile.subjects || [];
      if (acadexProfile.subjects.includes(s)) acadexProfile.subjects = acadexProfile.subjects.filter(x => x !== s);
      else acadexProfile.subjects.push(s);
      renderProfileSubjects();
    };
    c.appendChild(b);
  });
}
function openProfile() {
  document.getElementById("profileModal").style.display = "flex";
  renderProfileSubjects();
  if (acadexProfile) {
    document.getElementById("pName").value = acadexProfile.name || "";
    document.getElementById("pGrade").value = acadexProfile.grade || "";
    document.getElementById("pLevel").value = acadexProfile.level || "O-Level";
  }
}
function closeProfile() { document.getElementById("profileModal").style.display = "none"; }
function saveProfile() {
  const name = document.getElementById("pName").value.trim() || "Student";
  const grade = document.getElementById("pGrade").value || "Form 4 (O-Level)";
  const level = document.getElementById("pLevel").value || "O-Level";
  const subjects = acadexProfile?.subjects?.length ? acadexProfile.subjects : ["Mathematics"];
  acadexProfile = { name, grade, level, subjects, updated: new Date().toISOString() };
  localStorage.setItem("acadex_profile", JSON.stringify(acadexProfile));
  updateProfileBadge();
  closeProfile();
  renderQs(); renderLibrary(); updateBot(); renderParent();
}
function updateProfileBadge() {
  const b = document.getElementById("profileBadge");
  const p = acadexProfile;
  if (!p || !p.name) { b.style.display = "none"; return; }
  b.style.display = "inline-block";
  b.textContent = `👋 ${p.name} • ${p.grade}`;
  const hg = document.getElementById("heroGrade");
  if (hg) hg.textContent = p.grade.includes("Grade") ? "Grade 7 Maths" : "Maths";
}

/* ----- languages / hero ----- */
function renderLangs() {
  const g = document.getElementById("langGrid");
  g.innerHTML = "";
  languages.forEach(l => {
    const b = document.createElement("button");
    b.className = "lang-pill" + (l.code === activeLang ? " active" : "");
    b.textContent = l.name;
    b.onclick = () => {
      activeLang = l.code;
      document.getElementById("langLabel").textContent = l.name;
      document.getElementById("voiceLang").textContent = l.name + " — slow & clear";
      const sel = document.getElementById("explainLang");
      if (sel) sel.value = l.code;
      renderLangs(); updateBot();
      if (document.getElementById("explain").classList.contains("show")) showExplain(currentQ);
    };
    g.appendChild(b);
  });
}
function fillExplainLangSelect() {
  const sel = document.getElementById("explainLang");
  sel.innerHTML = languages.map(l => `<option value="${l.code}">${l.name}</option>`).join("");
  sel.value = explainLang || activeLang;
}
function explainLangChange(val) {
  explainLang = val;
  showExplain(currentQ);
}

function greetingFor(q) {
  const p = getProfile();
  const name = p.name && p.name !== "Student" ? p.name : "mwana";
  const lab = L(activeLang);
  const text = strip(q?.text || "2x + 3 = 11");
  const first = (q?.steps && q.steps[0]) ? q.steps[0] : { t: "Work slowly", d: "" };
  if (activeLang === "sn") {
    return `${lab.hello} ${name}! Ngatigadzirise zvishoma nezvishoma:<br><b>${esc(text)}</b><br><br>${lab.step} 1: ${esc(first.t)}<br>${esc(first.d)}<br><br>🎯 ${lab.answer}: <b>${esc(q?.answer || "")}</b>`;
  }
  if (activeLang === "nd") {
    return `${lab.hello} ${name}! Ake sixazulule kancane kancane:<br><b>${esc(text)}</b><br><br>${lab.step} 1: ${esc(first.t)}<br>${esc(first.d)}<br><br>🎯 ${lab.answer}: <b>${esc(q?.answer || "")}</b>`;
  }
  return `${lab.hello} ${name}! Let's solve this slowly:<br><b>${esc(text)}</b><br><br>${lab.step} 1: ${esc(first.t)}<br>${esc(first.d)}<br><br>🎯 ${lab.answer}: <b>${esc(q?.answer || "")}</b>`;
}
function updateBot() {
  const q = questions[1] || questions[0];
  const el = document.getElementById("botMsg");
  if (!el) return;
  const src = realAudioMap[activeLang];
  el.innerHTML = greetingFor(q) +
    `<div class="voice"><div class="voice-top"><button class="play" onclick="speak()">▶</button><div class="wave"></div><span style="font-size:11px;font-weight:800">${langName(activeLang)}</span></div>
     ${src ? `<audio controls src="${src}" style="width:100%;height:32px;margin-top:8px"></audio>` : ""}</div>`;
  const hu = document.getElementById("heroUser");
  if (hu && q) hu.textContent = "Solve: " + strip(q.text).slice(0, 80);
}

/* ----- solve grid ----- */
function renderQs() {
  const grid = document.getElementById("qgrid");
  grid.innerHTML = "";
  questions.forEach((it, i) => {
    const d = document.createElement("div");
    d.className = "q" + (i === currentQ ? " active" : "");
    d.innerHTML = `<small>${esc(it.tag || it.topic)} · [${it.marks}]</small><p>${esc(strip(it.text).slice(0, 140))}</p>`;
    d.onclick = () => { currentQ = i; renderQs(); showExplain(i); };
    grid.appendChild(d);
  });
}
function showExplain(idx, custom) {
  const exp = document.getElementById("explain");
  exp.classList.add("show");
  const q = custom || questions[idx];
  if (!q) return;
  currentExplain = q;
  const profile = getProfile();
  const eff = explainLang || activeLang;
  document.getElementById("explainTitle").textContent = `${q.topic || "Solution"} · ${langName(eff)} · ${profile.grade}`;
  const sel = document.getElementById("explainLang");
  if (sel) sel.value = eff;
  const lab = L(eff);
  let html = `<p style="font-weight:800;margin-bottom:8px">${q.text}</p>`;
  if ((q.options || []).length) {
    html += `<div style="margin:8px 0">${q.options.map(o => `<div style="font-size:13px;margin:3px 0">${esc(o)}</div>`).join("")}</div>`;
  }
  (q.steps || []).forEach((s, i) => {
    html += `<div class="step"><b>${lab.step} ${i + 1}: ${esc(s.t)}</b><p>${esc(s.d)}</p></div>`;
  });
  html += `<div class="step" style="background:#0f172a;color:white;border-left-color:var(--gold)"><b>${lab.answer}</b><p style="color:#e2e8f0">${esc(q.answer)}</p></div>`;
  html += `<p style="font-size:11px;color:var(--muted);margin-top:8px">${esc(q.markscheme || "")} · For <b>${esc(profile.name)}</b> (${esc(profile.grade)})</p>`;
  document.getElementById("explainBody").innerHTML = html;
  const ma = document.getElementById("mainAudio");
  const s = realAudioMap[eff];
  if (ma) {
    if (s) { ma.src = s; ma.style.display = "block"; }
    else { ma.removeAttribute("src"); ma.style.display = "none"; }
  }
}
function switchTab(id, el) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  if (el) el.classList.add("active");
  ["solve", "library", "mock", "parent", "predict"].forEach(k => {
    document.getElementById("tab-" + k).style.display = k === id ? "block" : "none";
  });
  if (id === "library") renderLibrary();
  if (id === "mock") renderMock();
  if (id === "parent") renderParent();
  if (id === "predict") renderPredict();
}

/* ----- speech ----- */
function speakText(raw) {
  const rate = parseFloat(document.getElementById("speed")?.value || 0.85);
  speechSynthesis.cancel();
  if (currentRealAudio) { currentRealAudio.pause(); currentRealAudio = null; }
  const u = new SpeechSynthesisUtterance(raw);
  u.rate = rate;
  const voices = speechSynthesis.getVoices();
  u.voice = voices.find(v => v.lang && v.lang.startsWith("en")) || voices[0] || null;
  speechSynthesis.speak(u);
}
function speak() {
  const q = currentExplain || questions[currentQ];
  const lab = L(explainLang || activeLang);
  const parts = (q?.steps || []).map((s, i) => `${lab.step} ${i + 1}. ${s.t}. ${s.d}`);
  const raw = `${lab.hello}. ${strip(q?.text || "")}. ${parts.join(" ")}. ${lab.answer}: ${q?.answer || ""}`;
  const src = realAudioMap[explainLang || activeLang];
  const personalized = getProfile().name && getProfile().name !== "Student";
  if (src && !personalized && !(q && q._typed)) {
    if (currentRealAudio) currentRealAudio.pause();
    const audio = new Audio(src);
    audio.playbackRate = parseFloat(document.getElementById("speed")?.value || 0.85);
    currentRealAudio = audio;
    audio.play().catch(() => speakText(raw));
    return;
  }
  speakText(raw);
}
function speakExplain() { speak(); }
function stopSpeak() {
  if (currentRealAudio) { currentRealAudio.pause(); currentRealAudio = null; }
  speechSynthesis.cancel();
}

/* ----- typed solver ----- */
function solveTyped() {
  const raw = document.getElementById("typedQ").value.trim();
  if (!raw) return alert("Type an equation, e.g. 2x + 3 = 11");
  const solved = solveLinear(raw);
  if (!solved) {
    alert("I can solve linear equations like 2x+3=11 or 3(x-2)=15. For full papers, open the library.");
    return;
  }
  solved._typed = true;
  solved.tag = "Typed equation";
  questions.unshift(solved);
  currentQ = 0;
  renderQs();
  showExplain(0, solved);
  document.getElementById("explain").scrollIntoView({ behavior: "smooth" });
}
function solveLinear(input) {
  let t = input.toLowerCase().replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
  t = t.replace(/x\s+(\d+)\s*=/g, "x+$1=");
  t = t.replace(/\s+/g, "");
  // a(x+b)=c  or a(x-b)=c
  let m = t.match(/^(-?\d+)\(x([+-]\d+)\)=(-?\d+)$/);
  if (m) {
    const a = +m[1], b = +m[2], c = +m[3];
    const rhs = c;
    const inner = `x ${b >= 0 ? "+" : ""} ${b}`;
    const expanded = `${a}x ${a * b >= 0 ? "+" : ""} ${a * b} = ${c}`;
    const ax = c - a * b;
    if (a === 0) return null;
    const x = ax / a;
    return {
      n: 0, marks: 3, topic: "Linear equations", kind: "short",
      text: `Solve  ${m[1]}(x ${b >= 0 ? "+ " : "− "}${Math.abs(b)}) = ${c}.`,
      answer: Number.isInteger(x) ? String(x) : String(x),
      steps: [
        { t: "Expand the bracket", d: `${a} × (${inner}) = ${expanded}` },
        { t: `Subtract ${a * b} from both sides`, d: `${a}x = ${c} − ${a * b} = ${ax}` },
        { t: `Divide by ${a}`, d: `x = ${ax}/${a} = ${x}` },
        { t: "Check", d: `${a}(${x} ${b >= 0 ? "+" : ""}${b}) = ${a * (x + b)} = ${c}` }
      ],
      markscheme: "M1 expand, M1 isolate, A1 answer"
    };
  }
  m = t.match(/^(-?\d*)x([+-]\d+)=(-?\d+)$/);
  if (m) {
    const a = m[1] === "" || m[1] === "-" ? Number(m[1] + "1") : +m[1];
    const b = +m[2], c = +m[3];
    const ax = c - b;
    const x = ax / a;
    return {
      n: 0, marks: 2, topic: "Linear equations", kind: "short",
      text: `Solve  ${a}x ${b >= 0 ? "+ " : "− "}${Math.abs(b)} = ${c}.`,
      answer: String(x),
      steps: [
        { t: `Subtract ${b} from both sides`, d: `${a}x = ${c} − ${b} = ${ax}` },
        { t: `Divide both sides by ${a}`, d: `x = ${ax}/${a} = ${x}` },
        { t: "Check", d: `${a}×${x} + ${b} = ${a * x + b}` }
      ],
      markscheme: "M1 rearrange, A1 answer"
    };
  }
  m = t.match(/^(-?\d*)x=(-?\d+)$/);
  if (m) {
    const a = m[1] === "" || m[1] === "-" ? Number(m[1] + "1") : +m[1];
    const c = +m[2];
    const x = c / a;
    return {
      n: 0, marks: 1, topic: "Linear equations", kind: "short",
      text: `Solve  ${a}x = ${c}.`,
      answer: String(x),
      steps: [{ t: `Divide by ${a}`, d: `x = ${c}/${a} = ${x}` }],
      markscheme: "A1"
    };
  }
  return null;
}

function handlePhoto(event) {
  const file = event.target.files[0];
  if (!file) return;
  const wrap = document.getElementById("photoPreviewWrap");
  const img = document.getElementById("photoPreview");
  const ocr = document.getElementById("photoOcr");
  wrap.style.display = "block";
  if (file.type.startsWith("image/")) {
    img.src = URL.createObjectURL(file);
    img.style.display = "block";
  } else img.style.display = "none";
  ocr.textContent = "Opening a matching 4004 algebra question (handwriting OCR is not live yet)…";
  const lin = questions.find(q => q.topic === "Linear equations") || questions[0];
  setTimeout(() => {
    ocr.innerHTML = `Photo saved as practice cue. Working the matching item: <b>${esc(strip(lin.text))}</b>`;
    currentQ = questions.indexOf(lin);
    if (currentQ < 0) currentQ = 0;
    renderQs();
    showExplain(currentQ);
  }, 600);
}

/* ----- library ----- */
function renderLibrary() {
  const grid = document.getElementById("paperGrid");
  const q = (document.getElementById("libSearch").value || "").toLowerCase();
  const y = document.getElementById("libYear").value;
  const s = document.getElementById("libSubject").value;
  const lvl = document.getElementById("libLevel").value;
  const papers = DATA.papers || [];
  const filtered = papers.filter(p => {
    if (y && String(p.year) !== y) return false;
    if (s && p.subject !== s) return false;
    if (lvl && p.level !== lvl) return false;
    if (q) {
      const blob = `${p.subject} ${p.paper} ${p.year} ${p.level} ${p.session} ${p.code} ${(p.questions || []).map(x => x.topic).join(" ")}`.toLowerCase();
      if (!blob.includes(q)) return false;
    }
    return true;
  });
  document.getElementById("libCount").textContent = `${filtered.length} papers`;
  grid.innerHTML = "";
  if (!filtered.length) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--muted);padding:20px">No papers match. Try “2024 Paper 1” or “Grade 7”.</p>';
    return;
  }
  filtered.forEach(p => {
    const d = document.createElement("div");
    d.className = "paper";
    let kind = p.paper;
    if (p.syllabus === "5006" && p.paperNo === 1) kind = "PAPER 1 · 40 MCQ · 1 hour";
    else if (p.syllabus === "5006" && p.paperNo === 2) kind = "PAPER 2 · structured Bio/Chem/Phys · 2 hours";
    else if (p.paperNo === 1) kind = "PAPER 1 · 30 short Qs · NO calculator";
    else if (p.paperNo === 2) kind = "PAPER 2 · Sec A + Sec B · calculator";
    d.innerHTML = `<div class="paper-top"><span class="tag">${p.level} • ${p.code}</span><span class="tag" style="${p.hot ? "background:var(--gold);border-color:var(--gold)" : ""}">${p.session} ${p.year}</span></div>
      <h4>${p.year} ${p.subject} ${p.paper}</h4>
      <p><b>${kind}</b><br>${p.qs} questions • ${p.pages} pages • ${p.duration}</p>
      <div class="paper-actions">
        <button class="btn-sm btn-view" onclick="viewPaper('${p.id}')">👁 View</button>
        <button class="btn-sm btn-extract" onclick="extractPaper('${p.id}')">✨ Extract & Study</button>
      </div>
      <button class="btn-sm btn-dl" onclick="downloadPDF('${p.id}')">⬇ Download ${p.paper} PDF</button>`;
    grid.appendChild(d);
  });
}
function viewPaper(id, study) {
  const p = paperById(id);
  if (!p) return;
  const v = document.getElementById("viewer");
  v.classList.add("show");
  document.getElementById("viewerTitle").textContent = `${p.year} ${p.session} ${p.code} ${p.paper}`;
  const lang = langName(explainLang || activeLang);
  let html = `<div class="notice">${esc(DATA.disclaimer || "")}<br><b>${esc(p.instructions)}</b> · ${esc(p.extra)}</div>
    <p><a href="${p.realUrl}" target="_blank" style="color:#0a7a3c;font-weight:800">Open PDF →</a></p>`;
  (p.questions || []).forEach(q => {
    html += `<div class="qcard" onclick="studyQuestion('${id}',${q.n})">
      <small style="color:var(--green);font-weight:800">Q${q.n} · ${esc(q.topic)} · [${q.marks}] ${q.section === "B" ? "· Section B" : ""}</small>
      <p style="font-weight:700;margin-top:4px">${q.text}</p>
      ${(q.options || []).length ? `<div style="margin:6px 0 0;font-size:13px">${q.options.map(o => `<div>${esc(o)}</div>`).join("")}</div>` : ""}
      ${study ? `<div class="step" style="margin-top:8px"><b>Answer</b><p>${esc(q.answer)}</p></div>` : `<p style="font-size:11px;color:var(--muted);margin-top:4px">Tap to work this in ${esc(lang)}</p>`}
    </div>`;
  });
  document.getElementById("viewerBody").innerHTML = html;
  v.scrollIntoView({ behavior: "smooth" });
}
function extractPaper(id) {
  const v = document.getElementById("viewer");
  v.classList.add("show");
  document.getElementById("viewerTitle").textContent = "Loading study cards…";
  document.getElementById("viewerBody").innerHTML = `<p style="padding:16px">Splitting the paper into study cards with worked solutions…</p>`;
  setTimeout(() => viewPaper(id, true), 400);
}
function studyQuestion(paperId, n) {
  const p = paperById(paperId);
  const q = p.questions.find(x => x.n === n);
  if (!q) return;
  const item = { ...q, tag: `${p.code} ${p.year} Q${n}`, paperId };
  const existing = questions.findIndex(x => x.paperId === paperId && x.n === n);
  if (existing >= 0) currentQ = existing;
  else { questions.unshift(item); currentQ = 0; }
  switchTab("solve", document.querySelector(".tab"));
  renderQs();
  showExplain(currentQ, questions[currentQ]);
  document.getElementById("tab-solve").scrollIntoView({ behavior: "smooth" });
}
async function downloadPDF(id) {
  const p = paperById(id);
  if (!p) return;
  const fname = (p.realUrl || "").split("/").pop();
  const url = "/download/pdfs/" + encodeURIComponent(fname);
  const v = document.getElementById("viewer");
  v.classList.add("show");
  document.getElementById("viewerTitle").textContent = "Download " + p.paper;
  document.getElementById("viewerBody").innerHTML = `<p>Saving <b>${esc(fname)}</b> (${esc(p.paper)} — ${p.calc ? "calculator allowed" : "non-calculator"})…</p>`;
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error("HTTP " + r.status);
    const blob = await r.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    document.getElementById("viewerBody").innerHTML = `<p>✅ Downloaded <b>${esc(fname)}</b></p>
      <p>${esc(p.year)} ${esc(p.session)} ${esc(p.code)} ${esc(p.paper)} · ${p.qs} questions</p>
      <p><a href="${p.realUrl}" target="_blank" rel="noopener">Open in browser instead →</a></p>
      <p class="notice">Paper 1 is short-answer / no calculator. Paper 2 is structured Section A + B / calculator. Different files, different questions.</p>`;
  } catch (err) {
    document.getElementById("viewerBody").innerHTML = `<p>Could not auto-save. <a href="${p.realUrl}" download="${esc(fname)}" target="_blank">Tap here to download ${esc(fname)}</a></p>`;
    window.open(p.realUrl, "_blank");
  }
}

/* ----- mock ----- */
function mockPaper() {
  return paperById(mockState.paperId) || (DATA.papers || [])[0];
}
function renderMock() {
  const p = mockPaper();
  if (!p) return;
  const q = p.questions[mockState.i];
  const total = p.questions.length;
  const answered = Object.keys(mockState.answers).length;
  const hh = String(Math.floor(mockState.remaining / 3600)).padStart(2, "0");
  const mm = String(Math.floor((mockState.remaining % 3600) / 60)).padStart(2, "0");
  const ss = String(mockState.remaining % 60).padStart(2, "0");
  const topics = scoreTopics(p);
  document.getElementById("mockApp").innerHTML = `
    <div style="display:grid;grid-template-columns:1.25fr 0.75fr;gap:12px">
      <div>
        <div style="background:linear-gradient(135deg,#0f172a,#1e293b);color:white;border-radius:14px;padding:12px;display:flex;justify-content:space-between;align-items:center">
          <div><div style="font-size:10px;letter-spacing:0.8px;opacity:0.7">MOCK · ${esc(p.code)} ${esc(p.session)} ${p.year} · ${esc(p.extra.split(".")[0])}</div>
          <b style="font-size:22px" id="timer">${hh}:${mm}:${ss}</b></div>
          <div style="text-align:right"><div style="font-size:10px;opacity:0.7">Progress</div><b>${mockState.i + 1}/${total}</b><div style="font-size:10px;opacity:0.7">${answered} answered</div></div>
        </div>
        <div style="margin-top:10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px">
          <small style="font-weight:800;color:var(--green)">Q${q.n} · ${esc(q.topic)} · [${q.marks}]</small>
          <p style="font-weight:800;margin-top:6px">${q.text}</p>
          <input class="ans" id="mockAns" placeholder="Type your answer" value="${escAttr(mockState.answers[q.n] || "")}">
          <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
            <button class="btn-sm btn-extract" style="flex:none;padding:8px 14px" onclick="markMock()">Check</button>
            <button class="btn-sm btn-view" style="flex:none;padding:8px 14px" onclick="mockNav(-1)">← Prev</button>
            <button class="btn-sm btn-view" style="flex:none;padding:8px 14px" onclick="mockNav(1)">Next →</button>
            <button class="btn-sm btn-dl" style="flex:none;padding:8px 14px" onclick="showMockMarkscheme()">Show working</button>
          </div>
          <div id="mockFeedback" style="margin-top:8px;font-size:12px;font-weight:700"></div>
        </div>
      </div>
      <div style="background:white;border:1px solid #e2e8f0;border-radius:14px;padding:12px">
        <b style="font-size:12px">📊 ${esc(getProfile().name)} — live topic score</b>
        <div id="mockTopics" style="margin-top:8px">${topics}</div>
        <div style="margin-top:8px;background:#0f172a;color:white;border-radius:10px;padding:10px">
          <b style="font-size:11px">🤖 ${esc(langName(activeLang))} coach</b>
          <p style="font-size:11px;opacity:0.9;margin-top:4px">${esc(coachLine(p))}</p>
        </div>
      </div>
    </div>`;
}
function mockNav(d) {
  const p = mockPaper();
  const inp = document.getElementById("mockAns");
  if (inp) mockState.answers[p.questions[mockState.i].n] = inp.value;
  mockState.i = Math.max(0, Math.min(p.questions.length - 1, mockState.i + d));
  renderMock();
}
function markMock() {
  const p = mockPaper();
  const q = p.questions[mockState.i];
  const inp = document.getElementById("mockAns");
  const given = inp.value.trim();
  mockState.answers[q.n] = given;
  const ok = answersMatch(given, q.answer);
  const fb = document.getElementById("mockFeedback");
  fb.style.color = ok ? "#0a7a3c" : "#b91c1c";
  fb.textContent = ok ? "✓ Correct." : `✗ Official answer: ${q.answer}`;
  renderMock();
  const fb2 = document.getElementById("mockFeedback");
  if (fb2) {
    fb2.style.color = ok ? "#0a7a3c" : "#b91c1c";
    fb2.textContent = ok ? "✓ Correct." : `✗ Official answer: ${q.answer}`;
  }
}
function showMockMarkscheme() {
  const p = mockPaper();
  const q = p.questions[mockState.i];
  studyQuestion(p.id, q.n);
}
function answersMatch(given, official) {
  const n = s => String(s).toLowerCase().replace(/\s+/g, "").replace(/,/g, "");
  const g = n(given), o = n(official);
  if (!g) return false;
  if (g === o) return true;
  if (o.includes(g) && g.length >= 1) return true;
  const gn = Number(g), on = Number(o);
  if (!Number.isNaN(gn) && !Number.isNaN(on) && Math.abs(gn - on) < 1e-6) return true;
  return false;
}
function scoreTopics(p) {
  const buckets = {};
  p.questions.forEach(q => {
    const key = q.topic.split("(")[0].trim();
    buckets[key] = buckets[key] || { t: 0, c: 0 };
    buckets[key].t++;
    const g = mockState.answers[q.n];
    if (g != null && g !== "") {
      if (answersMatch(g, q.answer)) buckets[key].c++;
    }
  });
  return Object.entries(buckets).slice(0, 6).map(([k, v]) => {
    const attempted = Object.keys(mockState.answers).length;
    const pct = v.t ? Math.round((v.c / v.t) * 100) : 0;
    return `<div style="margin-top:8px;font-size:11px;font-weight:700">${esc(k)} ${pct}%
      <div class="progress"><i style="width:${pct}%"></i></div></div>`;
  }).join("") || "<p class='muted'>Answer questions to see topic scores.</p>";
}
function coachLine(p) {
  const weak = [];
  p.questions.forEach(q => {
    const g = mockState.answers[q.n];
    if (g && !answersMatch(g, q.answer)) weak.push(q.topic);
  });
  const w = weak[0] || "Trigonometry";
  if (activeLang === "sn") return `Makorokoto kune zvaunogona. Dzokorora: ${w}.`;
  if (activeLang === "nd") return `Kuhle. Phinda: ${w}.`;
  return `Good effort. Next drill: ${w}.`;
}

/* ----- parent / predict ----- */
function renderParent() {
  const p = getProfile();
  const name = p.name === "Student" ? "Tatenda" : p.name;
  const answered = Object.keys(mockState.answers).length;
  document.getElementById("parentBody").innerHTML = `
    <p><b>Mhoro Mai ${esc(name)},</b></p>
    <p style="margin:6px 0;background:#f1f5f9;padding:9px;border-radius:10px">
      📚 ${esc(name)} · ${esc(p.grade)}<br>
      Mock Paper 1 items answered: <b>${answered}/30</b><br>
      🔥 Keep the streak — one Paper 1 this week.
    </p>
    <p style="font-size:11px;color:var(--muted)">Report language follows the tutor language (${esc(langName(activeLang))}).</p>`;
}
function renderPredict() {
  const bars = document.getElementById("predictBars");
  const block = (title, list) => `<h4 style="margin-top:12px">${esc(title)}</h4>` + (list || []).map(t => `
    <div style="margin-top:10px;font-size:12px;font-weight:800">${esc(t.topic)}
      <span style="float:right;color:${t.pct >= 80 ? "#ef4444" : "#0a7a3c"}">${t.pct}%</span>
      <div class="progress"><i style="width:${t.pct}%;background:${t.pct >= 80 ? "#ef4444" : "var(--green)"}"></i></div>
      <p style="font-weight:500;color:var(--muted);font-size:11px">${esc(t.why)}</p>
    </div>`).join("");
  bars.innerHTML = block("4004 Mathematics", DATA.predictor) + block("5006 Combined Science", DATA.sciencePredictor);
}

/* ----- helpers ----- */
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function escAttr(s) { return esc(s).replace(/`/g, ""); }

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    Promise.all(regs.map(r => r.update())).finally(() => {
      navigator.serviceWorker.register("./sw.js?v=7").catch(() => {});
    });
  });
}

function init() {
  if (DATA.counts) {
    const sp = document.getElementById("statPapers");
    const sq = document.getElementById("statQs");
    if (sp) sp.textContent = DATA.counts.papers || 52;
    if (sq) sq.textContent = DATA.counts.questions || 861;
  }
  fillExplainLangSelect();
  renderLangs();
  updateBot();
  renderQs();
  if (questions[0]) showExplain(0);
  renderLibrary();
  updateProfileBadge();
  renderParent();
  renderPredict();
  setTimeout(() => {
    if (!acadexProfile || !acadexProfile.name) openProfile();
  }, 700);
  setInterval(() => {
    if (mockState.remaining > 0) mockState.remaining--;
    const el = document.getElementById("timer");
    if (!el) return;
    const t = mockState.remaining;
    el.textContent = `${String(Math.floor(t / 3600)).padStart(2, "0")}:${String(Math.floor((t % 3600) / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
  }, 1000);
}
let _booted = false;
function boot() {
  if (_booted) return;
  _booted = true;
  init();
}
document.addEventListener("DOMContentLoaded", boot);
if (document.readyState !== "loading") boot();
