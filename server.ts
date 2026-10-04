import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, GenerateVideosOperation, Modality } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const getAi = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

function resolveModel(model?: string, defaultModel = 'gemini-3.8-flash'): string {
  if (!model) return defaultModel;
  if (model.includes('tts') || model.includes('audio-preview-tts')) return 'gemini-3.8-flash-lite-tts';
  if (model.includes('pro-image')) return 'gemini-3-pro-image';
  if (model.includes('flash-image') || model.includes('flash-lite-image') || model.includes('imagen')) return 'gemini-3.1-flash-image';
  if (model.includes('transcribe')) return 'gemini-3.5-transcribe';
  if (model.includes('native-audio') || model.includes('live')) return 'gemini-3.8-live';
  if (model.includes('veo-3.1-generate')) return 'veo-3.1-generate-preview';
  if (model.includes('veo')) return 'veo-3.1-lite-generate-preview';
  if (model.includes('pro')) return 'gemini-3.1-pro-preview';
  if (model.includes('flash')) return 'gemini-3.8-flash';
  return model;
}

// 1. Text & Multimodal Generate Content
app.post('/api/gemini/generate', async (req, res) => {
  try {
    const { model, contents, config } = req.body;
    const targetModel = resolveModel(model);
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: targetModel,
      contents,
      config,
    });
    return res.json({
      text: response.text,
      candidates: response.candidates,
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/generate:', error);
    return res.status(500).json({ error: error.message || 'Generation failed' });
  }
});

// 2. Generate Images (nano banana or Imagen)
app.post('/api/gemini/generate-images', async (req, res) => {
  try {
    const { model, prompt, config } = req.body;
    const targetModel = resolveModel(model, 'gemini-3.1-flash-image');
    const ai = getAi();

    const response = await ai.models.generateContent({
      model: targetModel,
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: config?.aspectRatio || '1:1',
          ...(config?.imageSize ? { imageSize: config.imageSize } : {})
        }
      }
    });

    const candidate = response.candidates?.[0];
    const imagePart = candidate?.content?.parts?.find((p: any) => p.inlineData);
    if (imagePart?.inlineData?.data) {
      return res.json({
        generatedImages: [{
          image: {
            imageBytes: imagePart.inlineData.data
          }
        }],
        candidates: response.candidates,
        text: response.text
      });
    }

    return res.json({
      generatedImages: [],
      candidates: response.candidates,
      text: response.text
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/generate-images:', error);
    return res.status(500).json({ error: error.message || 'Image generation failed' });
  }
});

// 3. Streaming Generate Content (SSE)
app.post('/api/gemini/stream', async (req, res) => {
  try {
    const { model, contents, config } = req.body;
    const targetModel = resolveModel(model);
    const ai = getAi();

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const responseStream = await ai.models.generateContentStream({
      model: targetModel,
      contents,
      config,
    });

    for await (const chunk of responseStream) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Error in /api/gemini/stream:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Streaming failed' });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
});

// 4. Video Generation (Veo)
app.post('/api/gemini/video/generate', async (req, res) => {
  try {
    const { model, prompt, image, lastFrame, config } = req.body;
    const targetModel = resolveModel(model, 'veo-3.1-lite-generate-preview');
    const ai = getAi();

    const payload: any = {
      model: targetModel,
      config: {
        numberOfVideos: 1,
        resolution: config?.resolution || '720p',
        aspectRatio: config?.aspectRatio || '16:9',
      }
    };
    if (prompt) payload.prompt = prompt;
    if (image) payload.image = image;
    if (lastFrame) payload.lastFrame = lastFrame;

    const operation = await ai.models.generateVideos(payload);
    return res.json({ operationName: operation.name });
  } catch (error: any) {
    console.error('Error in /api/gemini/video/generate:', error);
    return res.status(500).json({ error: error.message || 'Video generation failed' });
  }
});

// 5. Video Status Poll
app.post('/api/gemini/video/status', async (req, res) => {
  try {
    const { operationName } = req.body;
    if (!operationName) return res.status(400).json({ error: 'Missing operationName' });

    const ai = getAi();
    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });
    return res.json({
      done: updated.done,
      error: updated.error,
      response: updated.response,
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/video/status:', error);
    return res.status(500).json({ error: error.message || 'Video status check failed' });
  }
});

// 6. Video Download
app.get('/api/gemini/video/download', async (req, res) => {
  try {
    const operationName = req.query.operationName as string;
    if (!operationName) return res.status(400).json({ error: 'Missing operationName' });

    const ai = getAi();
    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });
    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
    if (!uri) return res.status(404).json({ error: 'Video URI not found or video not ready' });

    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
    const videoRes = await fetch(`${uri}&key=${apiKey}`, {
      headers: { 'x-goog-api-key': apiKey },
    });
    if (!videoRes.ok) throw new Error(`Video fetch failed: ${videoRes.statusText}`);

    res.setHeader('Content-Type', 'video/mp4');
    const buffer = Buffer.from(await videoRes.arrayBuffer());
    return res.send(buffer);
  } catch (error: any) {
    console.error('Error in /api/gemini/video/download:', error);
    return res.status(500).json({ error: error.message || 'Download failed' });
  }
});

// WebSocket Server for Gemini Live API
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url || '', `http://${request.headers.host}`);
  if (url.pathname === '/live') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', async (clientWs, request) => {
  const url = new URL(request.url || '', `http://${request.headers.host}`);
  const voiceName = url.searchParams.get('voice') || 'Zephyr';
  const ai = getAi();

  try {
    const session = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        outputAudioTranscription: {},
        inputAudioTranscription: {},
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
        systemInstruction: 'You are a natural, helpful AI in a real-time voice call.',
      },
      callbacks: {
        onopen: () => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'open' }));
          }
        },
        onmessage: (message) => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'message', data: message }));
          }
        },
        onclose: () => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'close' }));
            clientWs.close();
          }
        },
        onerror: (err) => {
          console.error('Gemini Live session error:', err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'error', error: String(err) }));
          }
        },
      },
    });

    clientWs.on('message', (raw) => {
      try {
        const payload = JSON.parse(raw.toString());
        const liveSession = session as any;
        if (payload.type === 'realtimeInput' && payload.media) {
          liveSession.sendRealtimeInput({ media: payload.media });
        } else if (payload.type === 'realtimeInput' && payload.audio) {
          liveSession.sendRealtimeInput({
            audio: { data: payload.audio, mimeType: payload.mimeType || 'audio/pcm;rate=16000' }
          });
        } else if (payload.type === 'realtimeInput' && payload.mediaChunks) {
          liveSession.sendRealtimeInput({ mediaChunks: payload.mediaChunks });
        } else if (payload.type === 'clientContent') {
          if (typeof liveSession.send === 'function') {
            liveSession.send({ clientContent: payload.payload });
          } else if (typeof liveSession.sendClientContent === 'function') {
            liveSession.sendClientContent(payload.payload);
          }
        }
      } catch (err) {
        console.error('Failed to process client live message', err);
      }
    });

    clientWs.on('close', () => {
      try {
        session.close();
      } catch (e) {}
    });
  } catch (err: any) {
    console.error('Failed to establish Gemini Live session:', err);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ type: 'error', error: err.message || 'Live session failed' }));
      clientWs.close();
    }
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
