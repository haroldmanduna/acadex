import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'data', 'acadex-maths.json'), 'utf8');
    const data = JSON.parse(raw);
    return res.status(200).json({
      ok: true,
      count: data.papers?.length || 0,
      papers: (data.papers || []).map(p => ({
        id: p.id,
        year: p.year,
        session: p.session,
        subject: p.subject,
        code: p.code,
        paper: p.paper,
        level: p.level,
        pdfUrl: `/pdfs/${p.realUrl ? path.basename(p.realUrl) : ''}`,
      }))
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
