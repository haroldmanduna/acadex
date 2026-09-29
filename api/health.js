import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let papersCount = 118;
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'data', 'acadex-maths.json'), 'utf8');
    const data = JSON.parse(raw);
    papersCount = data.papers?.length || 118;
  } catch (e) {
    // default 118
  }

  res.status(200).json({
    status: 'ACADEX live on Vercel',
    platform: 'Vercel Serverless',
    alwaysOn: true,
    papers: papersCount,
    vision: 'dual-layer-ocr',
    time: new Date().toISOString()
  });
}
