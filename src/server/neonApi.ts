import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

const router = Router();
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })
  : null;

type AuthUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

async function getAuthenticatedUser(req: Request, res: Response): Promise<AuthUser | null> {
  const authorization = req.header('authorization');
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!authorization?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Sign in to continue.' });
    return null;
  }
  if (!supabaseUrl || !anonKey) {
    res.status(503).json({ error: 'Authentication is not configured on the server.' });
    return null;
  }
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: anonKey, Authorization: authorization },
    });
    if (!response.ok) {
      res.status(401).json({ error: 'Your session is invalid or expired. Sign in again.' });
      return null;
    }
    return await response.json() as AuthUser;
  } catch {
    res.status(502).json({ error: 'Could not validate the login session.' });
    return null;
  }
}

async function ensureProfile(user: AuthUser) {
  if (!pool) throw new Error('Neon database is not configured.');
  const metadata = user.user_metadata || {};
  const fullName = String(metadata.full_name || metadata.name || user.email?.split('@')[0] || 'Student');
  const institutionalId = metadata.institutional_id ? String(metadata.institutional_id) : null;
  const department = metadata.department ? String(metadata.department) : 'dept-acad';
  const phone = metadata.phone ? String(metadata.phone) : null;
  // New profiles are students by default. Existing staff/admin roles are preserved server-side.
  await pool.query(
    `INSERT INTO profiles (id, full_name, email, institutional_id, department, phone, role)
     VALUES ($1, $2, $3, $4, $5, $6, 'student')
     ON CONFLICT (id) DO UPDATE SET
       full_name = COALESCE(NULLIF(profiles.full_name, ''), EXCLUDED.full_name),
       email = COALESCE(profiles.email, EXCLUDED.email),
       institutional_id = COALESCE(profiles.institutional_id, EXCLUDED.institutional_id),
       department = COALESCE(profiles.department, EXCLUDED.department),
       phone = COALESCE(profiles.phone, EXCLUDED.phone)`,
    [user.id, fullName, user.email || null, institutionalId, department, phone],
  );
}

router.get('/health', async (_req, res) => {
  let database = 'not_configured';
  if (pool) {
    try {
      await pool.query('SELECT 1');
      database = 'connected';
    } catch (error) {
      console.error('Neon health check failed:', error);
      database = 'error';
    }
  }
  res.status(database === 'error' ? 503 : 200).json({
    status: database === 'error' ? 'degraded' : 'ok',
    backend: 'StepWise API',
    database,
    authenticationConfigured: Boolean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
    aiConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

router.get('/requests', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'Neon database is not configured.' });
  const user = await getAuthenticatedUser(req, res);
  if (!user) return;
  try {
    await ensureProfile(user);
    const { rows } = await pool.query(
      'SELECT * FROM service_requests WHERE student_id = $1 ORDER BY submitted_at DESC',
      [user.id],
    );
    return res.json(rows);
  } catch (error) {
    console.error('Request list failed:', error);
    return res.status(500).json({ error: 'Could not load your requests.' });
  }
});

router.post('/requests', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'Neon database is not configured.' });
  const user = await getAuthenticatedUser(req, res);
  if (!user) return;
  const body = req.body || {};
  const payload = body.payload && typeof body.payload === 'object' ? body.payload : body;
  const serviceName = typeof payload.serviceName === 'string' ? payload.serviceName.trim() : '';
  const formData = payload.formData && typeof payload.formData === 'object' && !Array.isArray(payload.formData)
    ? payload.formData as Record<string, unknown>
    : null;
  if (!serviceName || !formData) {
    return res.status(400).json({ error: 'serviceName and formData are required.' });
  }
  try {
    await ensureProfile(user);
    const serviceResult = await pool.query(
      'SELECT id, name, department FROM services WHERE name = $1 AND is_active = true LIMIT 1',
      [serviceName],
    );
    const service = serviceResult.rows[0];
    if (!service) return res.status(400).json({ error: 'This service is not available.' });

    const documents = Array.isArray(payload.uploadedDocuments)
      ? payload.uploadedDocuments.map((doc: Record<string, unknown>) => {
          const { dataUrl: _dataUrl, ...metadata } = doc || {};
          return metadata;
        })
      : [];
    const description = Object.entries(formData).map(([key, value]) => `${key}: ${String(value)}`).join('\n');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const profileResult = await client.query('SELECT full_name, email, institutional_id, department FROM profiles WHERE id = $1', [user.id]);
      const profile = profileResult.rows[0];
      const inserted = await client.query(
        `INSERT INTO service_requests
          (student_id, service_id, description, status, service_name, service_code,
           student_name, student_email, student_roll, student_department, form_data,
           uploaded_documents, assigned_department_id)
         VALUES ($1,$2,$3,'submitted',$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,$12)
         RETURNING *`,
        [
          user.id, service.id, description, service.name, payload.serviceCode || null,
          profile?.full_name || user.email || 'Student', profile?.email || user.email || null,
          profile?.institutional_id || null, profile?.department || service.department,
          JSON.stringify(formData), JSON.stringify(documents), service.department,
        ],
      );
      const row = inserted.rows[0];
      await client.query(
        `INSERT INTO request_history (request_id, changed_by, old_status, new_status, comment)
         VALUES ($1, $2, 'draft', 'submitted', $3)`,
        [row.id, user.id, `Request submitted for ${service.name}.`],
      );
      await client.query(
        `INSERT INTO notifications (user_id, request_id, title, message)
         VALUES ($1, $2, 'Request Submitted Successfully', $3)`,
        [user.id, row.id, `Your request SW-${new Date(row.submitted_at).getFullYear()}-${String(row.tracking_number).padStart(4, '0')} for "${service.name}" has been received.`],
      );
      await client.query('COMMIT');
      return res.status(201).json(row);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Request submission failed:', error);
    return res.status(500).json({ error: 'The request could not be saved. Please try again.' });
  }
});

export default router;
