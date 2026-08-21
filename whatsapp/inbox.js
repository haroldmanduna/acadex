/** Per-student serial queue + global cap so a flood of WhatsApp chats still gets replies. */
const MAX_PARALLEL = Number(process.env.INBOX_PARALLEL || 4);
const MAX_QUEUE = Number(process.env.INBOX_MAX || 200);
const MAX_PER_USER = Number(process.env.INBOX_PER_USER || 12);
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = Number(process.env.INBOX_RATE || 40);
const BUSY_HINT_AFTER = 5;
const BUSY_HINT_COOLDOWN = 90_000;

const stats = {
  received: 0,
  done: 0,
  dropped: 0,
  errors: 0,
  busyHints: 0,
  waiting: 0,
  peakWaiting: 0,
  lastMs: 0,
};

let inflight = 0;
const slotWaiters = [];
const userChain = new Map();
const userPending = new Map();
const userHits = new Map();
const lastHint = new Map();

function acquire() {
  if (inflight < MAX_PARALLEL) {
    inflight += 1;
    return Promise.resolve();
  }
  return new Promise((resolve) => slotWaiters.push(resolve));
}

function release() {
  const next = slotWaiters.shift();
  if (next) next();
  else inflight = Math.max(0, inflight - 1);
}

export function isBusy() {
  return inflight >= Math.max(1, MAX_PARALLEL - 1) || stats.waiting >= 4;
}

export function inboxStats() {
  return {
    received: stats.received,
    done: stats.done,
    dropped: stats.dropped,
    errors: stats.errors,
    inflight,
    waiting: stats.waiting,
    peakWaiting: stats.peakWaiting,
    busyHints: stats.busyHints,
    lastMs: stats.lastMs,
    users: userPending.size,
    parallel: MAX_PARALLEL,
  };
}

export function resetInbox() {
  stats.received = stats.done = stats.dropped = stats.errors = stats.busyHints = 0;
  stats.waiting = stats.peakWaiting = stats.lastMs = 0;
  inflight = 0;
  slotWaiters.length = 0;
  userChain.clear();
  userPending.clear();
  userHits.clear();
  lastHint.clear();
}

export function splitWhatsApp(text, max = 3500) {
  const s = String(text || '').trim();
  if (!s) return [''];
  if (s.length <= max) return [s];
  const parts = [];
  let rest = s;
  while (rest.length > max && parts.length < 7) {
    let cut = rest.lastIndexOf('\n', max);
    if (cut < max * 0.45) {
      const dot = rest.lastIndexOf('. ', max);
      cut = dot > max * 0.45 ? dot + 1 : max;
    }
    parts.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest && parts.length < 8) parts.push(rest.slice(0, max));
  return parts.filter(Boolean);
}

export function enqueue({ from, run, onBusy, jid }) {
  const phone = String(from || '').replace(/\D/g, '') || 'unknown';
  stats.received += 1;
  const now = Date.now();

  const hits = (userHits.get(phone) || []).filter((t) => now - t < RATE_WINDOW_MS);
  hits.push(now);
  userHits.set(phone, hits);
  if (hits.length > RATE_MAX) {
    stats.dropped += 1;
    return { accepted: false, reason: 'rate' };
  }

  const pending = userPending.get(phone) || 0;
  if (pending >= MAX_PER_USER) {
    stats.dropped += 1;
    return { accepted: false, reason: 'user-full' };
  }
  if (stats.waiting + inflight >= MAX_QUEUE) {
    stats.dropped += 1;
    return { accepted: false, reason: 'full' };
  }

  userPending.set(phone, pending + 1);
  stats.waiting += 1;
  if (stats.waiting > stats.peakWaiting) stats.peakWaiting = stats.waiting;

  if (stats.waiting >= BUSY_HINT_AFTER && typeof onBusy === 'function') {
    const last = lastHint.get(phone) || 0;
    if (now - last > BUSY_HINT_COOLDOWN) {
      lastHint.set(phone, now);
      stats.busyHints += 1;
      Promise.resolve()
        .then(() => onBusy({ phone, jid, waiting: stats.waiting }))
        .catch(() => {});
    }
  }

  const prev = userChain.get(phone) || Promise.resolve();
  const next = prev
    .then(() => runJob(run))
    .catch((e) => {
      stats.errors += 1;
      console.error('inbox job', e?.message || e);
    })
    .finally(() => {
      const n = (userPending.get(phone) || 1) - 1;
      if (n <= 0) {
        userPending.delete(phone);
        userChain.delete(phone);
      } else userPending.set(phone, n);
    });
  userChain.set(phone, next);
  return { accepted: true, waiting: stats.waiting };
}

async function runJob(run) {
  stats.waiting = Math.max(0, stats.waiting - 1);
  await acquire();
  const t0 = Date.now();
  try {
    await run();
    stats.done += 1;
  } finally {
    stats.lastMs = Date.now() - t0;
    release();
  }
}
