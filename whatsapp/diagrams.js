/** Clear Maths diagrams as PNG — not ASCII. Only when the student asks to draw/sketch. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PImage from 'pureimage';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT = path.join(__dirname, 'fonts', 'DejaVuSans.ttf');
let fontReady = false;

async function font() {
  if (fontReady) return;
  const f = PImage.registerFont(FONT, 'DejaVu');
  if (typeof f.loadSync === 'function') f.loadSync();
  else await new Promise((res, rej) => f.load(e => (e ? rej(e) : res())));
  fontReady = true;
}

export function figureKind(text) {
  const t = normFig(text);
  if (/\bvenn\b/.test(t)) return 'venn';
  if (/\b(bar chart|histogram|bar graph)\b/.test(t)) return 'bar';
  if (/\b(number line)\b/.test(t)) return 'numberline';
  if (/\b(bearing|060°|060 degrees)\b/.test(t)) return 'bearing';
  if (/\b(vector)\b/.test(t)) return 'vector';
  if (/\b(cuboid|cube|net of)\b/.test(t)) return 'cuboid';
  if (/\b(parabola|x\^2|x²)\b/.test(t)) return 'parabola';
  if (/\b(circle|radius|chord|tangent|diameter)\b/.test(t)) return 'circle';
  if (/\b(graph|plot|axes|y\s*=)\b/.test(t)) return 'graph';
  if (/\b(angle|protractor)\b/.test(t) && !/\btriangle\b/.test(t)) return 'angle';
  if (/\b(pythagoras|a\s*\^?\s*2\s*\+|hypotenuse)\b/.test(t) && !/\bright/.test(t)) return 'pythagoras';
  if (/\b(pythagoras)\b/.test(t)) return 'pythagoras';
  if (/\b(right[- ]?angl|3.?4.?5|triangle)\b/.test(t)) return 'triangle';
  if (ASK_FIG.test(t)) return 'triangle';
  return null;
}

const ASK_FIG = /\b(draw|sketch|diagram|figure|illustrat|picture|graph it|plot it|show me|visual|label the|send .{0,28}(diagram|picture|sketch|figure|triangle|circle|graph))\b/i;

function normFig(s) {
  return String(s || '').toLowerCase()
    .replace(/triangl\w*/g, 'triangle')
    .replace(/diagra\w*/g, 'diagram')
    .replace(/hypotenus\w*/g, 'hypotenuse')
    .replace(/pythagor\w*/g, 'pythagoras')
    .replace(/right\s*angl\w*/g, 'right-angled');
}

export function wantsDiagram(text) {
  const t = normFig(text);
  if (ASK_FIG.test(t)) return true;
  if (/\b(right-angled|pythagoras|hypotenuse|bearing|vector|venn|cuboid|tangent|chord|number line|bar chart|histogram|parabola|y\s*=\s*-?\d)/.test(t)) return true;
  if (/\btriangle\b/.test(t) && /\b(right|draw|sketch|diagram|figure|send|picture|show)\b/.test(t)) return true;
  return false;
}

function nums(text) {
  return [...String(text || '').matchAll(/(\d+(?:\.\d+)?)/g)].map(m => +m[1]).filter(n => n > 0 && n < 10000);
}

function kind(text) {
  return figureKind(text) || 'triangle';
}

function parseLine(text) {
  const m = String(text || '').replace(/\s+/g, '').match(/y=([+-]?\d*\.?\d*)x([+-]\d+\.?\d*)?/);
  if (!m) return { m: 1, c: 0 };
  const slope = m[1] === '' || m[1] === '+' ? 1 : m[1] === '-' ? -1 : +m[1];
  const c = m[2] ? +m[2] : 0;
  return { m: slope, c };
}

function canvas(w = 900, h = 900) {
  const img = PImage.make(w, h);
  const ctx = img.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#111111';
  ctx.fillStyle = '#111111';
  ctx.lineWidth = 4;
  ctx.font = '28pt DejaVu';
  return { img, ctx, w, h };
}

function line(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function oval(ctx, x, y, r, n = 96) {
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const px = x + r * Math.cos(a);
    const py = y + r * Math.sin(a);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
}

function label(ctx, text, x, y, color = '#0a7a3c') {
  ctx.fillStyle = color;
  ctx.font = '26pt DejaVu';
  ctx.fillText(String(text), x, y);
  ctx.fillStyle = '#111111';
}

function drawParabola(ctx) {
  const ox = 450, oy = 780, s = 40;
  ctx.lineWidth = 3;
  line(ctx, 80, oy, 820, oy);
  line(ctx, ox, 80, ox, 840);
  ctx.fillText('x', 800, oy + 32);
  ctx.fillText('y', ox - 28, 70);
  ctx.strokeStyle = '#0a7a3c';
  ctx.lineWidth = 5;
  ctx.beginPath();
  for (let i = -8; i <= 8; i += 0.2) {
    const x = ox + i * s;
    const y = oy - (i * i) * 8;
    if (i === -8) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.strokeStyle = '#111';
  label(ctx, 'y = x²', 560, 160);
}

function drawPythagoras(ctx) {
  const s = 70;
  const Bx = 280, By = 620;
  const Ax = Bx, Ay = By - 3 * s;
  const Cx = Bx + 4 * s, Cy = By;
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#111111';
  ctx.beginPath();
  ctx.moveTo(Ax, Ay);
  ctx.lineTo(Bx, By);
  ctx.lineTo(Cx, Cy);
  ctx.closePath();
  ctx.stroke();
  ctx.lineWidth = 3;
  line(ctx, Bx + 28, By, Bx + 28, By - 28);
  line(ctx, Bx + 28, By - 28, Bx, By - 28);
  // square on AB (up-left)
  ctx.strokeStyle = '#0a7a3c';
  ctx.strokeRect(Ax - 3 * s, Ay, 3 * s, 3 * s);
  // square on BC (down)
  ctx.strokeRect(Bx, By, 4 * s, 4 * s);
  // square on AC — outward along the hypotenuse is fiddly; draw a tilted quad
  const dx = Cx - Ax, dy = Cy - Ay;
  const len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len;
  const px = -uy, py = ux;
  const P1x = Ax, P1y = Ay;
  const P2x = Cx, P2y = Cy;
  const P3x = Cx + px * len, P3y = Cy + py * len;
  const P4x = Ax + px * len, P4y = Ay + py * len;
  ctx.beginPath();
  ctx.moveTo(P1x, P1y);
  ctx.lineTo(P2x, P2y);
  ctx.lineTo(P3x, P3y);
  ctx.lineTo(P4x, P4y);
  ctx.closePath();
  ctx.stroke();
  ctx.strokeStyle = '#111';
  label(ctx, 'a', (Ax + Bx) / 2 - 36, (Ay + By) / 2);
  label(ctx, 'b', (Bx + Cx) / 2, By + 36);
  label(ctx, 'c', (Ax + Cx) / 2 + 10, (Ay + Cy) / 2 - 10);
  label(ctx, 'a²', Ax - 2 * s, Ay + 1.6 * s);
  label(ctx, 'b²', Bx + 1.6 * s, By + 2.2 * s);
  label(ctx, 'c²', (P3x + P4x) / 2 - 20, (P3y + P4y) / 2);
  label(ctx, 'a² + b² = c²', 40, 50);
}

function drawTriangle(ctx) {
  // True right angle at B: AB vertical, BC horizontal (3-4-5).
  const scale = 110;
  const B = [220, 700];
  const A = [220, 700 - 3 * scale];
  const C = [220 + 4 * scale, 700];
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(A[0], A[1]);
  ctx.lineTo(B[0], B[1]);
  ctx.lineTo(C[0], C[1]);
  ctx.closePath();
  ctx.stroke();
  const s = 44;
  ctx.lineWidth = 4;
  line(ctx, B[0], B[1] - s, B[0] + s, B[1] - s);
  line(ctx, B[0] + s, B[1] - s, B[0] + s, B[1]);
  label(ctx, 'A', A[0] - 28, A[1] - 12);
  label(ctx, 'B', B[0] - 44, B[1] + 42);
  label(ctx, 'C', C[0] + 12, C[1] + 42);
  label(ctx, 'leg', (A[0] + B[0]) / 2 - 52, (A[1] + B[1]) / 2);
  label(ctx, 'leg', (B[0] + C[0]) / 2 - 10, B[1] + 48, '#111');
  label(ctx, 'hypotenuse', (A[0] + C[0]) / 2 + 8, (A[1] + C[1]) / 2 - 8);
  label(ctx, 'Right angle at B', 40, 48);
}

function drawCircle(ctx, withTangent) {
  const x = 450, y = 430, r = 260;
  ctx.lineWidth = 5;
  oval(ctx, x, y, r);
  line(ctx, x, y, x + r, y);
  ctx.beginPath();
  oval(ctx, x, y, 6, 24);
  ctx.fill();
  label(ctx, 'O', x - 28, y - 16);
  label(ctx, 'r', x + r / 2 - 10, y - 16);
  label(ctx, 'A', x + r + 12, y + 10);
  if (withTangent) {
    ctx.strokeStyle = '#0a7a3c';
    ctx.lineWidth = 5;
    line(ctx, x + r, y - 280, x + r, y + 280);
    ctx.strokeStyle = '#111';
    label(ctx, 'tangent', x + r + 16, y - 200);
  }
}

function drawGraph(ctx, slope, c) {
  const ox = 120, oy = 760, s = 55;
  ctx.lineWidth = 3;
  line(ctx, 80, oy, 860, oy);
  line(ctx, ox, 80, ox, 820);
  ctx.font = '20pt DejaVu';
  for (let i = 1; i <= 12; i++) {
    line(ctx, ox + i * s, oy - 8, ox + i * s, oy + 8);
    line(ctx, ox - 8, oy - i * s, ox + 8, oy - i * s);
    if (i % 2 === 0) {
      ctx.fillText(String(i), ox + i * s - 8, oy + 32);
      ctx.fillText(String(i), ox - 36, oy - i * s + 8);
    }
  }
  ctx.fillText('x', 840, oy + 36);
  ctx.fillText('y', ox - 28, 70);
  ctx.strokeStyle = '#0a7a3c';
  ctx.lineWidth = 5;
  const yAt = (x) => oy - (slope * x + c) * s;
  line(ctx, ox + (-1) * s, yAt(-1), ox + 10 * s, yAt(10));
  ctx.strokeStyle = '#111111';
  label(ctx, `y = ${slope}x${c >= 0 ? '+' : ''}${c}`, 500, 120);
}

function drawVector(ctx) {
  const ox = 160, oy = 720, s = 70;
  ctx.lineWidth = 3;
  line(ctx, 80, oy, 860, oy);
  line(ctx, ox, 80, ox, 820);
  ctx.strokeStyle = '#0a7a3c';
  ctx.lineWidth = 6;
  const x2 = ox + 5 * s, y2 = oy - 3 * s;
  line(ctx, ox, oy, x2, y2);
  // arrow
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 24, y2 + 28);
  ctx.lineTo(x2 - 32, y2 + 8);
  ctx.closePath();
  ctx.fillStyle = '#0a7a3c';
  ctx.fill();
  ctx.strokeStyle = '#111';
  label(ctx, 'O', ox - 36, oy + 36);
  label(ctx, 'a = (5 ; 3)', 480, 200);
}

function drawBearing(ctx) {
  const x = 450, y = 450;
  ctx.lineWidth = 4;
  line(ctx, x, 80, x, 820);
  label(ctx, 'N', x - 12, 70);
  ctx.beginPath();
  ctx.arc(x, y, 220, -Math.PI / 2, -Math.PI / 2 + (60 * Math.PI) / 180, false);
  ctx.stroke();
  ctx.strokeStyle = '#0a7a3c';
  ctx.lineWidth = 5;
  const ang = (60 - 90) * Math.PI / 180;
  line(ctx, x, y, x + 280 * Math.cos(ang), y + 280 * Math.sin(ang));
  ctx.strokeStyle = '#111';
  label(ctx, '060°', x + 40, y - 80);
  label(ctx, 'A', x - 16, y + 36);
  label(ctx, 'B', x + 200, y - 40);
}

function drawCuboid(ctx) {
  const x = 180, y = 280, w = 420, h = 260, d = 140;
  ctx.lineWidth = 5;
  ctx.strokeRect(x, y, w, h);
  line(ctx, x, y, x + d, y - d);
  line(ctx, x + w, y, x + w + d, y - d);
  line(ctx, x + w, y + h, x + w + d, y + h - d);
  line(ctx, x + d, y - d, x + w + d, y - d);
  line(ctx, x + w + d, y - d, x + w + d, y + h - d);
  ctx.setLineDash?.();
  label(ctx, 'l', x + w / 2 - 10, y + h + 40);
  label(ctx, 'h', x - 36, y + h / 2);
  label(ctx, 'w', x + w + d / 2, y - d / 2);
}

function drawVenn(ctx) {
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(340, 430, 220, 0, Math.PI * 2, false);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(560, 430, 220, 0, Math.PI * 2, false);
  ctx.stroke();
  label(ctx, 'A', 240, 240);
  label(ctx, 'B', 640, 240);
  label(ctx, 'ξ', 80, 80);
}

function drawNumberLine(ctx) {
  ctx.lineWidth = 5;
  line(ctx, 60, 450, 840, 450);
  for (let i = -4; i <= 4; i++) {
    const x = 450 + i * 90;
    line(ctx, x, 430, x, 470);
    ctx.fillText(String(i), x - 10, 520);
  }
  ctx.fillStyle = '#0a7a3c';
  ctx.beginPath();
  ctx.arc(450 + 2 * 90, 450, 12, 0, Math.PI * 2, false);
  ctx.fill();
}

function drawBar(ctx) {
  const vals = [4, 7, 3, 8, 5];
  const labels = ['A', 'B', 'C', 'D', 'E'];
  ctx.lineWidth = 4;
  line(ctx, 120, 780, 120, 80);
  line(ctx, 120, 780, 860, 780);
  vals.forEach((v, i) => {
    const x = 180 + i * 130;
    const h = v * 70;
    ctx.fillStyle = '#0a7a3c';
    ctx.fillRect(x, 780 - h, 80, h);
    ctx.fillStyle = '#111';
    ctx.fillText(labels[i], x + 24, 820);
  });
}

function drawAngle(ctx) {
  const x = 200, y = 700;
  ctx.lineWidth = 5;
  line(ctx, x, y, 820, y);
  const a = -40 * Math.PI / 180;
  line(ctx, x, y, x + 500 * Math.cos(a), y + 500 * Math.sin(a));
  ctx.beginPath();
  ctx.arc(x, y, 90, a, 0, false);
  ctx.stroke();
  label(ctx, 'θ', x + 110, y - 40);
}

async function save(img, dir) {
  fs.mkdirSync(dir, { recursive: true });
  const fp = path.join(dir, `d-${Date.now()}-${Math.random().toString(16).slice(2, 8)}.png`);
  await PImage.encodePNGToStream(img, fs.createWriteStream(fp));
  return fp;
}

export async function renderDiagram(workspaceRoot, text) {
  await font();
  const { img, ctx } = canvas();
  const k = figureKind(text) || 'triangle';
  if (k === 'circle') drawCircle(ctx, /\btangent\b/i.test(text));
  else if (k === 'pythagoras') drawPythagoras(ctx);
  else if (k === 'parabola') drawParabola(ctx);
  else if (k === 'graph') {
    const { m, c } = parseLine(text);
    drawGraph(ctx, m, c);
  } else if (k === 'vector') drawVector(ctx);
  else if (k === 'bearing') drawBearing(ctx);
  else if (k === 'cuboid') drawCuboid(ctx);
  else if (k === 'venn') drawVenn(ctx);
  else if (k === 'numberline') drawNumberLine(ctx);
  else if (k === 'bar') drawBar(ctx);
  else if (k === 'angle') drawAngle(ctx);
  else drawTriangle(ctx);
  const n = nums(text);
  if ((k === 'triangle' || k === 'pythagoras') && n.length >= 2) {
    ctx.font = '24pt DejaVu';
    ctx.fillStyle = '#0a7a3c';
    ctx.fillText('sides: ' + n.slice(0, 3).join(', '), 40, 50);
  }
  const dir = path.join(workspaceRoot || path.join(__dirname, '..'), 'data', 'diagrams');
  return save(img, dir);
}
