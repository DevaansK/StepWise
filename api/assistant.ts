import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const SYSTEM_INSTRUCTION = `
You are the AI Administrative Advisor for StepWise, a college administrative service and workflow automation platform.
Help students understand service procedures, required documents, responsible offices, processing times, and request tracking.
Be concise, structured, and practical. Use bullet points for steps and document checklists.
Always mention the responsible department, required documents, and estimated processing days when the information is known.
Do not invent official college policies, legal or financial guarantees, or service details. State when information is illustrative and advise contacting the relevant department for confirmation.
Suggest that users open Browse Services > Start Request when they are ready to apply.
`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, history } = req.body ?? {};
  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (!ai) {
    return res.status(503).json({ error: 'AI assistant is not configured. Set GEMINI_API_KEY in Vercel environment variables.' });
  }

  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
  if (Array.isArray(history)) {
    for (const item of history.slice(-6)) {
      if ((item?.sender === 'user' || item?.sender === 'assistant') && typeof item.text === 'string') {
        contents.push({
          role: item.sender === 'user' ? 'user' : 'model',
          parts: [{ text: item.text.slice(0, 4000) }],
        });
      }
    }
  }
  contents.push({ role: 'user', parts: [{ text: message.trim().slice(0, 8000) }] });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: { systemInstruction: SYSTEM_INSTRUCTION, temperature: 0.3 },
    });
    const reply = response.text?.trim();
    if (!reply) return res.status(502).json({ error: 'The AI assistant returned an empty response.' });
    return res.status(200).json({ reply, relatedServiceId: null, source: 'gemini-2.5-flash', isDemoMode: false });
  } catch (error) {
    console.error('StepWise assistant request failed:', error);
    return res.status(502).json({ error: 'The AI assistant is temporarily unavailable. Please try again.' });
  }
}
