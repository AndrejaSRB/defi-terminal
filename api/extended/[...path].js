const EXT_API = 'https://api.starknet.extended.exchange';
const EXT_UA = 'Mozilla/5.0 Tegra/1.0';
const EXT_ORIGIN = 'https://app.extended.exchange';

const FORWARD_HEADERS = [
  'x-api-key', 'l1_signature', 'l1_message_time',
  'l1-signature', 'l1-message-time', 'x-x10-active-account',
];

/** @param {import('@vercel/node').VercelRequest} req @param {import('@vercel/node').VercelResponse} res */
module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', [...FORWARD_HEADERS, 'Content-Type'].join(', '));

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const path = Array.isArray(req.query.path) ? req.query.path.join('/') : (req.query.path || '');

  // Rebuild query string without the 'path' param
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (key !== 'path') {
      if (Array.isArray(value)) value.forEach(v => params.append(key, v));
      else params.append(key, value);
    }
  }
  const search = params.toString() ? `?${params.toString()}` : '';
  const target = `${EXT_API}/${path}${search}`;

  const headers = {
    'Content-Type': 'application/json',
    'Origin': EXT_ORIGIN,
    'User-Agent': EXT_UA,
  };

  for (const key of FORWARD_HEADERS) {
    const value = req.headers[key];
    if (value) headers[key] = value;
  }

  try {
    const response = await fetch(target, {
      method: req.method,
      headers,
      ...(req.body ? { body: JSON.stringify(req.body) } : {}),
    });

    const contentType = response.headers.get('content-type') || 'application/json';
    res.setHeader('Content-Type', contentType);

    const data = await response.arrayBuffer();
    res.status(response.status).send(Buffer.from(data));
  } catch (err) {
    res.status(502).json({ error: 'Proxy fetch failed', details: String(err) });
  }
};
