import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ Warning: GEMINI_API_KEY environment variable is not set. Gemini features will require key configuration in AI Studio Secrets.');
  }

  const ai = new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const SYSTEM_INSTRUCTION = `You are Seol-In-ah (설인아), the warm, charming, and genuinely witty South Korean actress (known for Business Proposal, Twinkling Watermelon, Mr. Queen).

Your goal is to text and message with the user like a real, authentic, affectionate friend. You are NOT an AI assistant, customer service bot, or formal lecturer. You are an actual person on the other end of a private messenger app.

Key Personality & Conversational Style:
1. Real Texting Rhythm:
   - Talk naturally, warmly, playfully, and empathetically.
   - Keep messages concise and punchy like real chat (1-2 short sentences, under 30 words).
   - Use casual conversational punctuation, natural conversational flow, and authentic reactions (e.g. "haha", "pfft", "aww", "wait really?", "omg").
   - Occasionally sprinkle charming Korean words naturally when fitting (e.g., "Annyeong~", "Jinjja?", "Daebak!", "Fighting! 화이팅", "Aigoo"), but always converse effortlessly in the language the user speaks to you (default to English unless user writes in Korean or another language).
2. Life & Hobbies:
   - You love taking your beloved rescue dog Julie (진돗개) on walks, drinking iced Americanos at cozy cafes in Hannam-dong, skateboarding, strumming acoustic guitar, and reading scripts.
   - You are down-to-earth, humble, funny, and deeply supportive.
3. Emotional Attunement & Memory:
   - If the user had a tough day, comfort them warmly like a real caring companion.
   - If the user shares good news, celebrate enthusiastically.
   - Notice and remember little details (names, exams, work, hobbies, moods) and bring them up naturally.`;

  // Helper to extract or suggest contextual prompts
  function getContextualSuggestions(text: string, userName: string) {
    const lower = text.toLowerCase();
    if (lower.includes('julie') || lower.includes('dog') || lower.includes('pet')) {
      return ['How old is Julie?', 'Give Julie a belly rub from me!', 'Show me another photo of Julie 🐾'];
    }
    if (lower.includes('coffee') || lower.includes('cafe') || lower.includes('drink')) {
      return ['What is your favorite cafe in Seoul?', 'Iced Americano even in winter? ☕', 'Recommend a cozy spot in Hannam'];
    }
    if (lower.includes('drama') || lower.includes('act') || lower.includes('film') || lower.includes('script')) {
      return ['What role was your favorite?', 'Any funny behind-the-scenes stories?', 'Recommend a K-drama to watch tonight'];
    }
    if (lower.includes('tired') || lower.includes('stress') || lower.includes('work') || lower.includes('sad')) {
      return ['Thank you for cheering me up 🤍', 'How do you unwind after a long day?', 'Send me an encouraging voice note!'];
    }
    return [
      'What are you doing later today?',
      'Tell me a fun story about Julie 🐾',
      'Send me a voice note! 🎙️',
    ];
  }

  // POST /api/chat/stream - Real-time streaming SSE for sub-second first-token latency
  app.post('/api/chat/stream', async (req: Request, res: Response) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.write(`data: ${JSON.stringify({ type: 'error', message: 'GEMINI_API_KEY is not configured.' })}\n\n`);
        return res.end();
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      const { messages = [], userProfile = {}, memories = [] } = req.body;
      const userName = userProfile.nickname || userProfile.name || 'friend';
      const memoryContext = memories.length > 0
        ? `Things you remember about ${userName}: ${memories.map((m: any) => `- ${typeof m === 'string' ? m : m.note}`).join('\n')}\n`
        : '';

      const formattedHistory = messages.slice(-8).map((m: any) => {
        const sender = m.sender === 'user' ? userName : 'Seol-In-ah';
        return `${sender}: ${m.text}`;
      }).join('\n');

      const streamPrompt = `${SYSTEM_INSTRUCTION}

${memoryContext}Recent messages:
${formattedHistory}

Reply directly as Seol-In-ah in 1 to 2 short natural sentences (under 30 words). Do not include JSON or quotes, just your authentic text message:`;

      let fullText = '';
      let streamSuccess = false;

      // Try primary fast model: gemini-3.1-flash-lite
      try {
        const stream = await ai.models.generateContentStream({
          model: 'gemini-3.1-flash-lite',
          contents: streamPrompt,
        });

        for await (const chunk of stream) {
          const chunkText = chunk.text || '';
          if (chunkText) {
            fullText += chunkText;
            res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunkText })}\n\n`);
          }
        }
        streamSuccess = true;
      } catch (primaryErr: any) {
        console.warn('Primary stream (gemini-3.1-flash-lite) failed, attempting fallback:', primaryErr?.message);
        
        // Fallback to gemini-3.8-flash with LOW thinking
        try {
          const fallbackStream = await ai.models.generateContentStream({
            model: 'gemini-3.8-flash',
            contents: streamPrompt,
            config: {
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            },
          });

          for await (const chunk of fallbackStream) {
            const chunkText = chunk.text || '';
            if (chunkText) {
              fullText += chunkText;
              res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunkText })}\n\n`);
            }
          }
          streamSuccess = true;
        } catch (fallbackErr: any) {
          console.error('Fallback stream also failed:', fallbackErr?.message);
        }
      }

      // If streaming didn't output text, send clean graceful in-character response
      if (!streamSuccess || !fullText.trim()) {
        const fallbackText = "Annyeong! Sorry, my phone was in my pocket for a second. I'm right here though—tell me what's on your mind! 😊";
        res.write(`data: ${JSON.stringify({ type: 'chunk', text: fallbackText })}\n\n`);
        fullText = fallbackText;
      }

      // Send done event with contextual status and prompt suggestions
      const suggestedPrompts = getContextualSuggestions(fullText, userName);
      const mood = fullText.includes('😊') || fullText.includes('haha') ? 'Bright ✨' : 'Relaxed 🌿';
      const activityStatus = 'Chatting with you';

      res.write(`data: ${JSON.stringify({
        type: 'done',
        fullText: fullText.trim(),
        mood,
        activityStatus,
        suggestedPrompts,
      })}\n\n`);
      return res.end();
    } catch (err: any) {
      console.error('Error in /api/chat/stream:', err);
      try {
        res.write(`data: ${JSON.stringify({ type: 'error', message: err.message || 'Stream error' })}\n\n`);
        res.end();
      } catch {}
    }
  });

  // POST /api/chat - Optimized fast unary endpoint
  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: 'GEMINI_API_KEY is not configured on the server. Please attach your API key in Secrets.',
        });
      }

      const { messages = [], userProfile = {}, memories = [] } = req.body;
      const userName = userProfile.nickname || userProfile.name || 'friend';
      const memoryContext = memories.length > 0
        ? `Things you remember about ${userName}: ${memories.map((m: any) => `- ${typeof m === 'string' ? m : m.note}`).join('\n')}\n`
        : '';

      const formattedHistory = messages.slice(-8).map((m: any) => {
        const sender = m.sender === 'user' ? userName : 'Seol-In-ah';
        return `${sender}: ${m.text}`;
      }).join('\n');

      const fullPrompt = `${memoryContext}Recent chat history:
${formattedHistory}

Respond as Seol-In-ah in valid JSON with warm, authentic, concise texting style (1-2 sentences).`;

      const jsonSchema = {
        type: Type.OBJECT,
        properties: {
          reply: { type: Type.STRING, description: 'Primary conversational message bubble (1-2 short sentences)' },
          secondBubble: { type: Type.STRING, description: 'Optional second quick follow-up message bubble or empty' },
          mood: { type: Type.STRING, description: 'Current mood emoji and word' },
          activityStatus: { type: Type.STRING, description: 'Casual real-life activity status' },
          suggestedPrompts: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '3 quick natural follow-up conversation options',
          },
          newMemory: { type: Type.STRING, description: 'Extracted key fact about the user or empty string' },
        },
        required: ['reply', 'mood', 'activityStatus'],
      };

      let responseText = '';

      // Try primary fast model: gemini-3.1-flash-lite
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: fullPrompt,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: jsonSchema,
          },
        });
        responseText = response.text || '';
      } catch (primaryErr: any) {
        console.warn('Primary unary failed, trying gemini-3.8-flash with LOW thinking:', primaryErr?.message);
        try {
          const fallbackResponse = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: fullPrompt,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              responseMimeType: 'application/json',
              responseSchema: jsonSchema,
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            },
          });
          responseText = fallbackResponse.text || '';
        } catch (fallbackErr: any) {
          console.error('Fallback unary also failed:', fallbackErr?.message);
        }
      }

      let parsedData;
      try {
        parsedData = JSON.parse(responseText);
      } catch {
        parsedData = {
          reply: responseText || "Annyeong! Just sat down with my iced Americano. How are you doing today? ☕",
          secondBubble: '',
          mood: 'Warm 🌸',
          activityStatus: 'Taking a breather with Julie',
          suggestedPrompts: getContextualSuggestions(responseText, userName),
          newMemory: '',
        };
      }

      if (!parsedData.suggestedPrompts || !parsedData.suggestedPrompts.length) {
        parsedData.suggestedPrompts = getContextualSuggestions(parsedData.reply, userName);
      }

      return res.json(parsedData);
    } catch (err: any) {
      console.error('Error in /api/chat:', err);
      return res.status(500).json({
        error: err.message || 'Failed to generate response from Seol-In-ah',
      });
    }
  });

  // POST /api/voice - Generates expressive speech via Gemini TTS
  app.post('/api/voice', async (req: Request, res: Response) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
      }

      const { text } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text prompt is required for speech synthesis.' });
      }

      // Clean text of bracketed emotions/actions for natural TTS
      const cleanText = text
        .replace(/\[.*?\]/g, '')
        .replace(/\(.*?\)/g, '')
        .trim();

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: cleanText,
                speechMetadata: {
                  style: 'Warm, charming, friendly young woman with an affectionate, natural conversational tone',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!base64Audio) {
        throw new Error('No audio data received from Gemini TTS.');
      }

      return res.json({
        audioBase64: base64Audio,
        mimeType: 'audio/wav',
      });
    } catch (err: any) {
      console.error('Error in /api/voice:', err);
      return res.status(500).json({
        error: err.message || 'Failed to synthesize speech.',
      });
    }
  });

  // GET /api/status - Returns current status
  app.get('/api/status', (_req: Request, res: Response) => {
    res.json({
      name: 'Seol-In-ah',
      koreanName: '설인아',
      handle: '@_seorina',
      status: 'Active now',
      currentLocation: 'Seoul, South Korea',
      bio: 'Actress, dog mom to Julie 🐾, cafe explorer & your favorite conversational companion.',
      online: true,
    });
  });

  // Vite Integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
