/** Ping our public URL so Render Free does not spin down after 15 min idle.
 *  Self-ping alone is not enough if the process is already dead — pair with
 *  GitHub Actions (.github/workflows/keep-acadex-awake.yml) and the PWA ping.
 */
const state = {
  lastAt: null,
  lastOk: null,
  lastStatus: null,
  ok: 0,
  fail: 0,
  everyMs: 0,
};

export function keepaliveState() {
  return { ...state };
}

export function startKeepAlive(urls, everyMs = 4 * 60 * 1000) {
  const list = [...new Set((urls || []).map((u) => String(u || '').replace(/\/$/, '')).filter((u) => /^https?:\/\//i.test(u)))];
  state.everyMs = everyMs;
  if (!list.length) return state;

  const ping = async () => {
    state.lastAt = new Date().toISOString();
    for (const u of list) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 20000);
        const res = await fetch(u, {
          method: 'GET',
          cache: 'no-store',
          redirect: 'follow',
          signal: ctrl.signal,
          headers: { 'user-agent': 'ACADEX-keepalive', accept: 'text/plain' },
        });
        clearTimeout(t);
        state.lastStatus = res.status;
        if (res.ok) {
          state.ok += 1;
          state.lastOk = state.lastAt;
        } else state.fail += 1;
      } catch {
        state.fail += 1;
      }
    }
  };

  setTimeout(() => { ping().catch(() => {}); }, 5000);
  setInterval(() => { ping().catch(() => {}); }, everyMs);
  return state;
}
