import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { VISION, visionOn, readVisual, visionUserText } from './vision.js';
import { loadBank, handleTurn, resetFree } from './tutor.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const bank = loadBank(root);
const fail = [];
function expect(name, cond, detail) {
  if (!cond) fail.push(name + (detail ? ' :: ' + String(detail).slice(0, 220) : ''));
  else console.log('OK', name);
}

expect('cannot generate', VISION.makeImage === false && VISION.makeVideo === false && VISION.readImage && VISION.readVideo, '');
expect('user text caption', visionUserText({ question: 'Solve 2x+3=11' }, 'help me') === 'help me', '');
expect('user text from vision', /2x/.test(visionUserText({ question: 'Solve 2x+3=11' }, '[photo]')), '');

process.env.DISABLE_VISION = '1';
const off = await readVisual({ filePath: '/tmp/nope.png' });
expect('disabled', off === null, JSON.stringify(off));

delete process.env.DISABLE_VISION;
const prevKey = process.env.OPENROUTER_KEY;
delete process.env.OPENROUTER_KEY;
delete process.env.OPENROUTER_API_KEY;
expect('off without key', visionOn() === false, '');
const nokey = await readVisual({ filePath: '/tmp/nope.png' });
expect('no key null', nokey === null, JSON.stringify(nokey));
if (prevKey) process.env.OPENROUTER_KEY = prevKey;

const missing = await readVisual({ filePath: '/tmp/acadex-missing-vision.png' });
expect('missing file', !missing || missing.ok === false, JSON.stringify(missing));

resetFree('263771007701');
const cap = await handleTurn({
  from: '263771007701', text: '[photo]', bank, publicUrl: '',
  adminPhone: '263716987183', trigger: 'x', sessionMinutes: 30,
});
const capTxt = (cap.replies || []).map(x => x.text).join('\n');
expect('photo no media fallback', /caption|type it|clearer photo/i.test(capTxt), capTxt.slice(0, 160));

if (fail.length) {
  console.error('VISION FAIL', fail.length);
  fail.forEach(f => console.error(' -', f));
  process.exit(1);
}
console.log('VISION UNIT PASS');
