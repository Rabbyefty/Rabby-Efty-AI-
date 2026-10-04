// Server-side proxy client for Gemini API

export enum Modality {
  AUDIO = 'AUDIO',
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO'
}

export interface LiveServerMessage {
  serverContent?: {
    modelTurn?: {
      parts?: Array<{
        text?: string;
        inlineData?: {
          mimeType: string;
          data: string;
        };
      }>;
    };
    turnComplete?: boolean;
    interrupted?: boolean;
    inputTranscription?: {
      text: string;
    };
    outputTranscription?: {
      text: string;
    };
  };
}

export interface LiveSession {
  sendRealtimeInput: (input: { media?: any; audio?: string; mimeType?: string; mediaChunks?: any[] }) => void;
  send: (payload: any) => void;
  close: () => void;
}

export interface LiveConnectParams {
  model?: string;
  callbacks?: {
    onopen?: () => void;
    onmessage?: (message: LiveServerMessage) => void;
    onclose?: () => void;
    onerror?: (error: any) => void;
  };
  config?: {
    responseModalities?: Modality[];
    speechConfig?: {
      voiceConfig?: {
        prebuiltVoiceConfig?: {
          voiceName: string;
        };
      };
    };
    systemInstruction?: string;
    inputAudioTranscription?: any;
    outputAudioTranscription?: any;
  };
}

export class GoogleGenAI {
  constructor(_options?: any) {
    // API Key is handled securely on the server side
  }

  chats = {
    create: (params: { model?: string; config?: any }) => {
      return {
        sendMessageStream: async function* ({ message }: { message: any }) {
          const contents = typeof message === 'string'
            ? [{ role: 'user', parts: [{ text: message }] }]
            : (message.parts ? [{ role: 'user', parts: message.parts }] : message);

          const res = await fetch('/api/gemini/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: params.model,
              contents,
              config: params.config,
            }),
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: res.statusText }));
            throw new Error(errorData.error || `Chat request failed: ${res.statusText}`);
          }

          const data = await res.json();
          yield {
            text: data.text,
            candidates: data.candidates,
          };
        },
      };
    },
  };

  models = {
    generateContent: async (params: {
      model?: string;
      contents: any;
      config?: any;
    }) => {
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(errorData.error || `Request failed with status ${res.status}`);
      }

      return await res.json();
    },

    generateImages: async (params: {
      model?: string;
      prompt: string;
      config?: any;
    }) => {
      const res = await fetch('/api/gemini/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(errorData.error || `Request failed with status ${res.status}`);
      }

      return await res.json();
    },

    generateVideos: async (params: {
      model?: string;
      prompt?: string;
      image?: any;
      lastFrame?: any;
      config?: any;
    }) => {
      const res = await fetch('/api/gemini/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(errorData.error || `Request failed with status ${res.status}`);
      }

      const data = await res.json();
      return {
        name: data.operationName,
        done: false,
      };
    },
  };

  operations = {
    getVideosOperation: async ({ operation }: { operation: { name: string } }) => {
      const res = await fetch('/api/gemini/video/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operationName: operation.name }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(errorData.error || `Operation polling failed: ${res.statusText}`);
      }

      const data = await res.json();
      return {
        name: operation.name,
        done: data.done,
        error: data.error,
        response: data.response,
      };
    },
  };

  live = {
    connect: async (params: LiveConnectParams): Promise<LiveSession> => {
      const voiceName = params.config?.speechConfig?.voiceConfig?.prebuiltVoiceConfig?.voiceName || 'Zephyr';
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live?voice=${encodeURIComponent(voiceName)}`;

      const ws = new WebSocket(wsUrl);

      const session: LiveSession = {
        sendRealtimeInput: (input) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'realtimeInput', ...input }));
          }
        },
        send: (payload) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'clientContent', payload }));
          }
        },
        close: () => {
          if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
            ws.close();
          }
        },
      };

      ws.onopen = () => {
        params.callbacks?.onopen?.();
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'message' && parsed.data) {
            params.callbacks?.onmessage?.(parsed.data);
          } else if (parsed.type === 'open') {
            // connection established
          } else if (parsed.type === 'close') {
            params.callbacks?.onclose?.();
          } else if (parsed.type === 'error') {
            params.callbacks?.onerror?.(parsed.error);
          }
        } catch (e) {
          console.error('Error handling live message:', e);
        }
      };

      ws.onerror = (e) => {
        params.callbacks?.onerror?.(e);
      };

      ws.onclose = () => {
        params.callbacks?.onclose?.();
      };

      return session;
    },
  };
}

export async function fetchVideoBlob(operationName: string): Promise<Blob> {
  const res = await fetch(`/api/gemini/video/download?operationName=${encodeURIComponent(operationName)}`);
  if (!res.ok) {
    throw new Error(`Failed to download video: ${res.statusText}`);
  }
  return await res.blob();
}
