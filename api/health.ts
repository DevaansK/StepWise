export default function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ status: 'method_not_allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY);

  return res.status(200).json({
    status: 'ok',
    backend: 'StepWise API',
    databaseConfigured: Boolean(supabaseUrl && supabaseKey),
    aiConfigured: geminiConfigured,
    timestamp: new Date().toISOString(),
  });
}
