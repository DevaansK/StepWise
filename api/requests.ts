type JsonRecord = Record<string, unknown>;

const getSupabaseConfig = () => ({
  url: process.env.SUPABASE_URL?.replace(/\/$/, ''),
  anonKey: process.env.SUPABASE_ANON_KEY,
});

function sendError(res: any, status: number, message: string) {
  return res.status(status).json({ error: message });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return sendError(res, 405, 'Method not allowed');
  }

  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    return sendError(res, 503, 'Backend is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.');
  }

  const authorization = req.headers.authorization;
  if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) {
    return sendError(res, 401, 'A valid Supabase access token is required.');
  }

  // Validate the token with Supabase Auth; never trust user IDs supplied by the client.
  const userResponse = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: authorization },
  });

  if (!userResponse.ok) {
    return sendError(res, 401, 'The access token is invalid or expired.');
  }

  const user = await userResponse.json() as { id?: string };
  if (!user.id) return sendError(res, 401, 'Unable to identify the authenticated user.');

  if (req.method === 'GET') {
    const response = await fetch(
      `${url}/rest/v1/stepwise_requests?select=request_id,payload,created_at,updated_at&order=created_at.desc`,
      { headers: { apikey: anonKey, Authorization: authorization } },
    );
    const body = await response.text();
    return res.status(response.status).send(body);
  }

  const body = req.body as JsonRecord | undefined;
  const requestId = typeof body?.requestId === 'string' ? body.requestId.trim() : '';
  const payload = body?.payload;

  if (!requestId || !payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return sendError(res, 400, 'requestId and an object payload are required.');
  }
  if (requestId.length > 80) return sendError(res, 400, 'requestId is too long.');

  const response = await fetch(`${url}/rest/v1/stepwise_requests`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: authorization,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ owner_id: user.id, request_id: requestId, payload }),
  });

  const responseBody = await response.text();
  if (response.status === 409) return sendError(res, 409, 'A request with this ID already exists.');
  return res.status(response.status).send(responseBody);
}
