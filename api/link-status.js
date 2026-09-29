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
    const sRes = await fetch(`${SUPABASE_URL}/rest/v1/settings?select=key,value`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });

    let status = 'waiting';
    let pairingCode = '9764-Z2RS';
    let qrDataUrl = null;

    if (sRes.ok) {
      const rows = await sRes.json();
      const map = {};
      for (const r of rows || []) map[r.key] = r.value;
      if (map.acadex_link_status) status = map.acadex_link_status;
      if (map.acadex_pairing_code) pairingCode = map.acadex_pairing_code;
      if (map.acadex_qr_data) qrDataUrl = map.acadex_qr_data;
    }

    return res.status(200).json({
      status,
      connected: status === 'connected',
      pairingCode: pairingCode || '9764-Z2RS',
      qrDataUrl: qrDataUrl,
      time: new Date().toISOString()
    });
  } catch (err) {
    return res.status(200).json({
      status: 'waiting',
      connected: false,
      pairingCode: '9764-Z2RS',
      error: err.message,
    });
  }
}
