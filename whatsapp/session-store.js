/** Save Baileys session + learner names off Render's ephemeral disk.
 *  Uses a PRIVATE GitHub repo (GH_TOKEN + SESSION_REPO) — never commit those.
 *  Disk is still the live copy while the process is up.
 */
import fs from 'fs';
import path from 'path';
import { gzipSync, gunzipSync } from 'zlib';

const SKIP = new Set(['qr.png', 'pairing.txt']);
const PACK_FILE = 'acadex-pack.txt';
let persistTimer = null;
let lastPersist = 0;
let lastSha = '';

function token() {
  return process.env.SESSION_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';
}
function repoSpec() {
  return process.env.SESSION_REPO || 'haroldmanduna/acadex-session';
}
function ghHeaders() {
  return {
    Authorization: `Bearer ${token()}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'ACADEX',
  };
}

function packDir(dir) {
  const files = {};
  if (!dir || !fs.existsSync(dir)) return files;
  for (const name of fs.readdirSync(dir)) {
    if (SKIP.has(name) || name.startsWith('.')) continue;
    const fp = path.join(dir, name);
    try {
      if (!fs.statSync(fp).isFile()) continue;
      if (fs.statSync(fp).size > 400000) continue;
      files[name] = fs.readFileSync(fp, 'utf8');
    } catch { /* skip */ }
  }
  return files;
}

function unpackDir(dir, files) {
  if (!dir || !files) return 0;
  fs.mkdirSync(dir, { recursive: true });
  let n = 0;
  for (const [name, body] of Object.entries(files)) {
    if (!name || SKIP.has(name) || name.includes('..') || name.includes('/')) continue;
    fs.writeFileSync(path.join(dir, name), String(body ?? ''));
    n += 1;
  }
  return n;
}

function encodePack(obj) {
  return gzipSync(Buffer.from(JSON.stringify(obj), 'utf8')).toString('base64');
}
function decodePack(b64) {
  const raw = gunzipSync(Buffer.from(String(b64 || ''), 'base64')).toString('utf8');
  return JSON.parse(raw);
}

async function repoRead() {
  const t = token();
  if (!t) return null;
  const res = await fetch(`https://api.github.com/repos/${repoSpec()}/contents/${PACK_FILE}`, {
    headers: ghHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('session read ' + res.status);
  const data = await res.json();
  lastSha = data.sha || '';
  const text = Buffer.from(String(data.content || '').replace(/\n/g, ''), 'base64').toString('utf8');
  if (!text) return null;
  try { return decodePack(text); } catch { return JSON.parse(text); }
}

async function repoWrite(pack) {
  const t = token();
  if (!t) return false;
  const body = encodePack(pack);
  if (!lastSha) {
    try {
      const cur = await fetch(`https://api.github.com/repos/${repoSpec()}/contents/${PACK_FILE}`, { headers: ghHeaders() });
      if (cur.ok) lastSha = (await cur.json()).sha || '';
    } catch { /* first write */ }
  }
  const payload = {
    message: 'acadex session',
    content: Buffer.from(body, 'utf8').toString('base64'),
  };
  if (lastSha) payload.sha = lastSha;
  const res = await fetch(`https://api.github.com/repos/${repoSpec()}/contents/${PACK_FILE}`, {
    method: 'PUT',
    headers: { ...ghHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error('session write ' + res.status + ' ' + err.slice(0, 180));
  }
  const data = await res.json();
  lastSha = data.content?.sha || lastSha;
  return true;
}

export function sessionStoreMode() {
  if (token()) return 'github+disk';
  return 'disk';
}

export async function restoreSession(authDir) {
  try {
    const creds = path.join(authDir, 'creds.json');
    if (fs.existsSync(creds) && fs.statSync(creds).size > 200) return { restored: false, reason: 'local' };
    const pack = await repoRead();
    const files = pack?.session || pack?.files;
    if (!files || !files['creds.json']) return { restored: false, reason: 'empty' };
    let parsed;
    try { parsed = JSON.parse(files['creds.json']); } catch { parsed = null; }
    if (!parsed || !(parsed.noiseKey || parsed.me || parsed.signedIdentityKey)) {
      return { restored: false, reason: 'bad-creds' };
    }
    const n = unpackDir(authDir, files);
    console.log('SESSION STORE restored', n, 'files');
    return { restored: true, files: n };
  } catch (e) {
    console.warn('SESSION STORE restore', e.message);
    return { restored: false, reason: e.message };
  }
}

export async function restoreLearners(learnersFile) {
  try {
    if (learnersFile && fs.existsSync(learnersFile) && fs.statSync(learnersFile).size > 4) {
      return { restored: false, reason: 'local' };
    }
    const pack = await repoRead();
    const learners = pack?.learners;
    if (!learners || typeof learners !== 'object') return { restored: false, reason: 'empty' };
    fs.mkdirSync(path.dirname(learnersFile), { recursive: true });
    fs.writeFileSync(learnersFile, JSON.stringify(learners));
    console.log('SESSION STORE learners restored', Object.keys(learners).length);
    return { restored: true, n: Object.keys(learners).length };
  } catch (e) {
    console.warn('SESSION STORE learners', e.message);
    return { restored: false, reason: e.message };
  }
}

export async function persistNow(authDir, learnersFile) {
  const session = packDir(authDir);
  let learners = {};
  try {
    if (learnersFile && fs.existsSync(learnersFile)) {
      learners = JSON.parse(fs.readFileSync(learnersFile, 'utf8') || '{}');
    }
  } catch { learners = {}; }
  if (!Object.keys(session).length && !Object.keys(learners).length) return false;
  const ok = await repoWrite({
    savedAt: new Date().toISOString(),
    session,
    learners,
  });
  if (ok) lastPersist = Date.now();
  return ok;
}

export function schedulePersist(authDir, learnersFile) {
  if (!token()) return;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    persistNow(authDir, learnersFile).catch((e) => console.warn('SESSION STORE persist', e.message));
  }, 8000);
}

export function lastPersistAt() {
  return lastPersist || null;
}

export async function clearRemoteSession(authDir) {
  try {
    let learners = {};
    try {
      const pack = await repoRead();
      learners = pack?.learners || {};
    } catch { /* keep empty */ }
    await repoWrite({ savedAt: new Date().toISOString(), session: {}, learners });
  } catch (e) {
    console.warn('SESSION STORE clear', e.message);
  }
}
