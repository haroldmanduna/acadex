import { enqueue, inboxStats, resetInbox, splitWhatsApp, isBusy } from './inbox.js';

const fail = [];
function expect(name, cond, detail) {
  if (!cond) fail.push(name + (detail ? ' :: ' + String(detail).slice(0, 180) : ''));
  else console.log('OK', name);
}

resetInbox();
expect('split short', splitWhatsApp('hello').length === 1, '');
const long = ('Line about algebra.\n').repeat(400);
const parts = splitWhatsApp(long, 3500);
expect('split many', parts.length >= 2 && parts.every(p => p.length <= 3500), parts.map(p => p.length).join(','));

const order = [];
const started = [];
let parallel = 0;
let peak = 0;

function job(id, ms) {
  return async () => {
    parallel += 1;
    if (parallel > peak) peak = parallel;
    started.push(id);
    await new Promise(r => setTimeout(r, ms));
    order.push(id);
    parallel -= 1;
  };
}

resetInbox();
enqueue({ from: '263771000001', run: job('a1', 40) });
enqueue({ from: '263771000001', run: job('a2', 20) });
enqueue({ from: '263771000002', run: job('b1', 30) });
enqueue({ from: '263771000003', run: job('c1', 30) });
enqueue({ from: '263771000004', run: job('d1', 30) });
enqueue({ from: '263771000005', run: job('e1', 20) });

await new Promise(r => setTimeout(r, 400));
const st = inboxStats();
expect('all done', st.done === 6, JSON.stringify(st));
expect('same user order', order.indexOf('a1') < order.indexOf('a2'), order.join(','));
expect('parallel cap', peak <= 4 && peak >= 2, 'peak=' + peak);
expect('stats waiting drained', st.waiting === 0 && st.inflight === 0, JSON.stringify(st));

resetInbox();
let busyFired = 0;
for (let i = 0; i < 8; i++) {
  enqueue({
    from: '263771000009',
    run: job('x' + i, 5),
    onBusy: () => { busyFired += 1; },
  });
}
await new Promise(r => setTimeout(r, 250));
expect('busy hint once', busyFired === 1, 'hints=' + busyFired);

resetInbox();
let dropped = 0;
for (let i = 0; i < 50; i++) {
  const r = enqueue({ from: '263771000010', run: async () => {} });
  if (!r.accepted) dropped += 1;
}
expect('rate or user cap drops', dropped >= 1, 'dropped=' + dropped);

resetInbox();
expect('not busy idle', isBusy() === false, '');

if (fail.length) {
  console.error('FAIL', fail.length);
  fail.forEach(f => console.error(' -', f));
  process.exit(1);
}
console.log('ALL PASS');
