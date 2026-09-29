export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { image, base64Image, caption = '' } = req.body || {};
    const imgData = base64Image || image;
    if (!imgData) {
      return res.status(400).json({ ok: false, error: 'No image provided' });
    }

    const form = new URLSearchParams();
    form.append('base64Image', imgData.startsWith('data:') ? imgData : `data:image/jpeg;base64,${imgData}`);
    form.append('language', 'eng');
    form.append('isOverlayRequired', 'false');
    form.append('detectOrientation', 'true');
    form.append('scale', 'true');
    form.append('OCREngine', '2');

    const keys = ['helloworld', 'K87899142388957'];
    for (const k of keys) {
      try {
        const ocrRes = await fetch('https://api.ocr.space/parse/image', {
          method: 'POST',
          headers: {
            apikey: k,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: form.toString()
        });
        if (ocrRes.ok) {
          const data = await ocrRes.json();
          const text = data?.ParsedResults?.[0]?.ParsedText?.trim();
          if (text) {
            return res.status(200).json({
              ok: true,
              text,
              caption
            });
          }
        }
      } catch (e) {
        console.warn('OCR Space err:', e.message);
      }
    }

    return res.status(200).json({
      ok: false,
      error: 'Could not extract text clearly from image.'
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
