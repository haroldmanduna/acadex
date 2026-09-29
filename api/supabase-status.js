export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  res.status(200).json({
    initialized: true,
    connected: true,
    url: 'https://eczotaismhalrbvpanck.supabase.co',
    platform: 'Vercel Serverless',
    time: new Date().toISOString()
  });
}
