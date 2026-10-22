export default function handler(_req: any, res: any) {
  const configured = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
  res.status(configured ? 200 : 503).json({
    status: configured ? 'ok' : 'configuration_required',
    backend: 'StepWise API',
    databaseConfigured: configured,
    timestamp: new Date().toISOString(),
  });
}
