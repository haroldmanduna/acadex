import QRCode from 'qrcode';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://eczotaismhalrbvpanck.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_Q3eEj-h6uR4yjdX0lE9LIg_KLi7DKgg';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let status = 'waiting';
    let pairingCode = '9764-Z2RS';
    let qrDataUrl = null;

    try {
      const sRes = await fetch(`${SUPABASE_URL}/rest/v1/settings?select=key,value`, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      });

      if (sRes.ok) {
        const rows = await sRes.json();
        const map = {};
        for (const r of rows || []) map[r.key] = r.value;
        if (map.acadex_link_status) status = map.acadex_link_status;
        if (map.acadex_pairing_code) pairingCode = map.acadex_pairing_code;
        if (map.acadex_qr_data && map.acadex_qr_data.startsWith('data:image')) {
          qrDataUrl = map.acadex_qr_data;
        }
      }
    } catch (e) {
      console.warn('Supabase fetch note:', e.message);
    }

    // Always guarantee a crisp QR Code Data URL
    if (!qrDataUrl) {
      const qrPayload = pairingCode ? `ACADEX:263716987183:${pairingCode.replace(/-/g, '')}` : 'ACADEX:263716987183';
      qrDataUrl = await QRCode.toDataURL(qrPayload, {
        margin: 2,
        width: 320,
        color: {
          dark: '#0a7a3c',
          light: '#ffffff',
        },
      });
    }

    return res.status(200).json({
      status,
      connected: status === 'connected',
      pairingCode: pairingCode || '9764-Z2RS',
      qrDataUrl: qrDataUrl,
      time: new Date().toISOString()
    });
  } catch (err) {
    let fallbackQr = null;
    try {
      fallbackQr = await QRCode.toDataURL('ACADEX:263716987183:9764Z2RS', { margin: 2, width: 320 });
    } catch (e) {}

    return res.status(200).json({
      status: 'waiting',
      connected: false,
      pairingCode: '9764-Z2RS',
      qrDataUrl: fallbackQr,
      error: err.message,
    });
  }
}
