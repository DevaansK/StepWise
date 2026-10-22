import { GoogleGenAI } from '@google/genai';
import { COLLEGE_KNOWLEDGE_SYSTEM_PROMPT, getKnowledgeBaseAnswer } from '../src/server/advisorKnowledgeBase';

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

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, history } = req.body ?? {};
  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // If Gemini API is configured, attempt live model completion
  if (ai) {
    try {
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

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API call timed out')), 5000)
      );

      const generatePromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction: COLLEGE_KNOWLEDGE_SYSTEM_PROMPT,
          temperature: 0.3,
        },
      });

      const response = await Promise.race([generatePromise, timeoutPromise]);
      const reply = response.text?.trim();

      if (reply) {
        const lower = (message + ' ' + reply).toLowerCase();
        let relatedServiceId: string | null = null;
        if (lower.includes('bonafide')) relatedServiceId = 'srv-bonafide';
        else if (lower.includes('transcript')) relatedServiceId = 'srv-transcript';
        else if (lower.includes('fee receipt') || lower.includes('fee statement')) relatedServiceId = 'srv-fee';
        else if (lower.includes('id card') || lower.includes('identity card')) relatedServiceId = 'srv-id-card';
        else if (lower.includes('hostel') || lower.includes('outpass')) relatedServiceId = 'srv-hostel';
        else if (lower.includes('leave')) relatedServiceId = 'srv-leave';
        else if (lower.includes('no-dues') || lower.includes('no dues')) relatedServiceId = 'srv-nodues';
        else if (lower.includes('address') || lower.includes('contact')) relatedServiceId = 'srv-address';

        return res.status(200).json({
          reply,
          relatedServiceId,
          source: 'gemini-3.8-flash',
          isDemoMode: false,
        });
      }
    } catch (error) {
      console.warn('Live Gemini advisor failed or was unavailable, using grounded knowledge base:', error);
      // Fall through to deterministic knowledge base
    }
  }

  // High-fidelity grounded knowledge base fallback
  const fallback = getKnowledgeBaseAnswer(message);
  return res.status(200).json(fallback);
}
