import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import neonApi from './src/server/neonApi.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use('/api', neonApi);

// Initialize GoogleGenAI if key is present
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

import { COLLEGE_KNOWLEDGE_SYSTEM_PROMPT, getKnowledgeBaseAnswer } from './src/server/advisorKnowledgeBase.ts';

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    backend: 'StepWise API',
    hasGeminiKey: Boolean(apiKey),
    timestamp: new Date().toISOString(),
  });
});

// AI Assistant chat endpoint
app.post('/api/assistant', async (req, res) => {
  const { message, history } = req.body || {};

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  // If Gemini API key is available, use Gemini 3.8 Flash
  if (ai) {
    try {
      const conversationContents: any[] = [];

      if (Array.isArray(history)) {
        for (const item of history.slice(-6)) {
          if (item?.sender === 'user' && typeof item?.text === 'string') {
            conversationContents.push({ role: 'user', parts: [{ text: item.text.slice(0, 4000) }] });
          } else if (item?.sender === 'assistant' && typeof item?.text === 'string') {
            conversationContents.push({ role: 'model', parts: [{ text: item.text.slice(0, 4000) }] });
          }
        }
      }

      conversationContents.push({
        role: 'user',
        parts: [{ text: message.trim().slice(0, 8000) }],
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API call timed out')), 5000)
      );

      const generatePromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: conversationContents,
        config: {
          systemInstruction: COLLEGE_KNOWLEDGE_SYSTEM_PROMPT,
          temperature: 0.3,
        },
      });

      const response = await Promise.race([generatePromise, timeoutPromise]);
      const replyText = response.text?.trim();

      if (replyText) {
        let relatedServiceId: string | null = null;
        const lower = (message + ' ' + replyText).toLowerCase();
        if (lower.includes('bonafide')) relatedServiceId = 'srv-bonafide';
        else if (lower.includes('transcript')) relatedServiceId = 'srv-transcript';
        else if (lower.includes('fee receipt') || lower.includes('fee statement')) relatedServiceId = 'srv-fee';
        else if (lower.includes('id card') || lower.includes('identity card')) relatedServiceId = 'srv-id-card';
        else if (lower.includes('hostel') || lower.includes('outpass')) relatedServiceId = 'srv-hostel';
        else if (lower.includes('leave')) relatedServiceId = 'srv-leave';
        else if (lower.includes('no-dues') || lower.includes('no dues')) relatedServiceId = 'srv-nodues';
        else if (lower.includes('address') || lower.includes('contact')) relatedServiceId = 'srv-address';

        return res.json({
          reply: replyText,
          relatedServiceId,
          source: 'gemini-3.8-flash',
          isDemoMode: false,
        });
      }
    } catch (err: any) {
      console.warn('Gemini advisor call failed or unavailable, using grounded knowledge base:', err?.message || err);
    }
  }

  // Deterministic Grounded College Advisor fallback
  const fallback = getKnowledgeBaseAnswer(message);
  return res.json(fallback);
});

// Serve frontend in production or mount Vite middleware in development
async function start() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StepWise server running on port ${PORT} (dev: ${!isProd})`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
