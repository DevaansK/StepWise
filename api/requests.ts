type JsonRecord = Record<string, unknown>;

const config = () => ({
  url: process.env.SUPABASE_URL?.replace(/\\/$/, ''),
  anonKey: process.env.SUPABASE_ANON_KEY,
});

function sendError(res: any, status: number, message: string) {
  return res.status(status).json({ error: message });
}

async function authenticatedUser(url: string, anonKey: string, authorization: string) {
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: authorization },
  });
  if (!response.ok) return null;
  return await response.json() as { id?: string };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return sendError(res, 405, 'Method not allowed');
  }

  const { url, anonKey } = config();
  if (!url || !anonKey) return sendError(res, 503, 'Backend is not configured.');
  const authorization = req.headers.authorization;
  if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) {
    return sendError(res, 401, 'A valid Supabase access token is required.');
  }

  const user = await authenticatedUser(url, anonKey, authorization);
  if (!user?.id) return sendError(res, 401, 'The access token is invalid or expired.');

  if (req.method === 'GET') {
    const response = await fetch(
      `${url}/rest/v1/service_requests?select=*&student_id=eq.${encodeURIComponent(user.id)}&order=submitted_at.desc`,
      { headers: { apikey: anonKey, Authorization: authorization } },
    );
    return res.status(response.status).send(await response.text());
  }

  const body = req.body as JsonRecord | undefined;
  const payload = body?.payload as JsonRecord | undefined;
  const serviceName = typeof payload?.serviceName === 'string' ? payload.serviceName : '';
  if (!payload || !serviceName || typeof payload.formData !== 'object' || !payload.formData) {
    return sendError(res, 400, 'payload.serviceName and payload.formData are required.');
  }

  const serviceResponse = await fetch(
    `${url}/rest/v1/services?select=id,name,department&name=eq.${encodeURIComponent(serviceName)}&is_active=eq.true&limit=1`,
    { headers: { apikey: anonKey, Authorization: authorization } },
  );
  if (!serviceResponse.ok) return res.status(serviceResponse.status).send(await serviceResponse.text());
  const services = await serviceResponse.json() as Array<{ id: string; name: string; department: string }>;
  if (!services[0]) return sendError(res, 400, 'This service is not available.');

  const safeDocuments = Array.isArray(payload.uploadedDocuments)
    ? payload.uploadedDocuments.map((doc: any) => {
        if (!doc || typeof doc !== 'object') return {};
        const { dataUrl: _dataUrl, ...metadata } = doc;
        return metadata;
      })
    : [];

  const record = {
    student_id: user.id,
    service_id: services[0].id,
    description: Object.entries(payload.formData as Record<string, unknown>)
      .map(([key, value]) => `${key}: ${String(value)}`).join('\\n'),
    status: 'submitted',
    service_name: services[0].name,
    service_code: typeof payload.serviceCode === 'string' ? payload.serviceCode : null,
    student_name: typeof payload.studentName === 'string' ? payload.studentName : null,
    student_email: typeof payload.studentEmail === 'string' ? payload.studentEmail : null,
    student_roll: typeof payload.studentRoll === 'string' ? payload.studentRoll : null,
    student_department: typeof payload.studentDepartment === 'string' ? payload.studentDepartment : null,
    form_data: payload.formData,
    uploaded_documents: safeDocuments,
    assigned_department_id: services[0].department,
  };

  const response = await fetch(`${url}/rest/v1/service_requests`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: authorization,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(record),
  });
  return res.status(response.status).send(await response.text());
}
