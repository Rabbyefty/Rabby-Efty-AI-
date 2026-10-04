
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { 
  Send, 
  User, 
  Bot, 
  Loader2, 
  Mic, 
  Square, 
  Volume2, 
  StopCircle, 
  X, 
  VolumeX, 
  Paperclip, 
  FileText, 
  Image as ImageIcon, 
  Phone, 
  Download,
  Globe,
  ExternalLink,
  Search
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { decodeAudioData, base64ToUint8Array, pcmToWav, downloadBlob, createPcmBlob } from '../utils/audio';

type Attachment = {
  type: 'image' | 'file';
  mimeType: string;
  data: string;
  previewUrl: string;
  name?: string;
};

type GroundingSource = {
  title: string;
  uri: string;
};

type Message = {
  role: 'user' | 'model';
  text: string;
  attachment?: Attachment;
  sources?: GroundingSource[];
};

type ModelMode = 'fast' | 'pro' | 'thinking';

interface SmartChatProps {
  onViewChange?: (view: string) => void;
}

export const SmartChat: React.FC<SmartChatProps> = ({ onViewChange }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<ModelMode>('pro');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Voice State
  const [isRecording, setIsRecording] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const isVoiceInputRef = useRef(false);
  
  // Audio Playback Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Real-time Recording Refs
  const recordingContextRef = useRef<AudioContext | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const liveSessionPromiseRef = useRef<Promise<any> | null>(null);
  
  // Attachment State
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, attachment, loading]);

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAttachment({
        type: file.type.startsWith('image/') ? 'image' : 'file',
        mimeType: file.type,
        data: result.split(',')[1],
        previewUrl: result,
        name: file.name
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const stopAudioPlayback = () => {
    if (activeSourceRef.current) {
      activeSourceRef.current.stop();
      activeSourceRef.current = null;
    }
    setPlayingMessageId(null);
  };

  const startRecording = async () => {
    try {
      stopAudioPlayback();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;
      
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx({ sampleRate: 16000 });
      recordingContextRef.current = ctx;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsRecording(true);
            isVoiceInputRef.current = true;
            
            const source = ctx.createMediaStreamSource(stream);
            const processor = ctx.createScriptProcessor(4096, 1, 1);
            recordingProcessorRef.current = processor;
            
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData, ctx.sampleRate);
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            
            source.connect(processor);
            processor.connect(ctx.destination);
          },
          onmessage: (msg: LiveServerMessage) => {
            if (msg.serverContent?.inputTranscription) {
              const text = msg.serverContent.inputTranscription.text;
              setInput(prev => prev + text);
            }
          },
          onclose: () => {
            setIsRecording(false);
          },
          onerror: (e) => {
            console.error(e);
            setIsRecording(false);
          }
        }
      });
      liveSessionPromiseRef.current = sessionPromise;
      
    } catch (e) {
      alert("Microphone access denied.");
      console.error(e);
    }
  };

  const stopRecording = () => {
    if (liveSessionPromiseRef.current) {
        liveSessionPromiseRef.current.then(session => session.close());
        liveSessionPromiseRef.current = null;
    }
    if (recordingProcessorRef.current) {
        recordingProcessorRef.current.disconnect();
        recordingProcessorRef.current = null;
    }
    if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach(t => t.stop());
        recordingStreamRef.current = null;
    }
    if (recordingContextRef.current) {
        recordingContextRef.current.close();
        recordingContextRef.current = null;
    }
    setIsRecording(false);
  };

  const playTTS = async (text: string, id: number) => {
    if (isMuted || !text) return;
    if (playingMessageId === id) { stopAudioPlayback(); return; }
    stopAudioPlayback();
    try {
      setPlayingMessageId(id);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: { parts: [{ text }] },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
        }
      });
      const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64) {
        if (!audioContextRef.current) audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        const ctx = audioContextRef.current;
        const buffer = await decodeAudioData(base64ToUint8Array(base64), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.onended = () => setPlayingMessageId(null);
        source.start();
        activeSourceRef.current = source;
      } else { setPlayingMessageId(null); }
    } catch (e) { setPlayingMessageId(null); }
  };

  const downloadMessageAudio = async (text: string, id: number) => {
    if (!text) return;
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: { parts: [{ text }] },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
        }
      });
      const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64) {
        const wavBlob = pcmToWav(base64ToUint8Array(base64), 24000);
        downloadBlob(wavBlob, `gemini-msg-${id}.wav`);
      }
    } catch (e) { alert("Failed to download audio."); }
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachment) || loading) return;
    stopAudioPlayback();
    if (isRecording) stopRecording();

    const userMsg = input;
    const currentAttachment = attachment;
    const shouldAutoPlay = isVoiceInputRef.current && !isMuted;
    
    isVoiceInputRef.current = false; 
    setInput(''); 
    setAttachment(null); 
    setLoading(true);
    
    setMessages(prev => [...prev, { role: 'user', text: userMsg, attachment: currentAttachment || undefined }]);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const model = mode === 'fast' ? 'gemini-3-flash-preview' : 'gemini-3-pro-preview';
      
      // Configure tools: Pro and Thinking mode get Search Grounding
      const tools: any[] = (mode === 'pro' || mode === 'thinking') ? [{ googleSearch: {} }] : [];
      
      const config: any = {
        tools,
        systemInstruction: "You are a helpful, advanced AI assistant. Provide concise, accurate information. If search is used, cite your findings."
      };

      if (mode === 'thinking') {
        config.thinkingConfig = { thinkingBudget: 32768 };
      }

      const activeChat = ai.chats.create({ model, config });
      
      let messageContent: any = userMsg;
      if (currentAttachment) {
        messageContent = {
          parts: [
            { inlineData: { mimeType: currentAttachment.mimeType, data: currentAttachment.data } }, 
            { text: userMsg || "Describe this content." }
          ]
        };
      } else {
        messageContent = { parts: [{ text: userMsg }] };
      }
      
      const resultStream = await activeChat.sendMessageStream({ message: userMsg || " " });
      let fullText = '';
      let groundingSources: GroundingSource[] = [];
      
      setMessages(prev => [...prev, { role: 'model', text: '' }]);
      
      for await (const chunk of resultStream) {
        if (chunk.text) {
          fullText += chunk.text;
          
          // Extract Grounding Chunks if available
          const chunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
          if (chunks) {
            chunks.forEach((c: any) => {
              if (c.web) {
                const source = { title: c.web.title, uri: c.web.uri };
                if (!groundingSources.some(s => s.uri === source.uri)) {
                  groundingSources.push(source);
                }
              }
            });
          }

          setMessages(prev => {
            const newMsgs = [...prev];
            const last = newMsgs[newMsgs.length - 1];
            last.text = fullText;
            last.sources = groundingSources.length > 0 ? groundingSources : undefined;
            return newMsgs;
          });
        }
      }
      
      if (shouldAutoPlay && fullText) await playTTS(fullText, messages.length);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'model', text: "Encountered an error. Please verify connectivity or project billing." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-screen relative overflow-hidden bg-black/20">
      <div className="px-6 py-4 flex items-center justify-between sticky top-0 z-20 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg border border-white/10"><Bot size={22} className="text-white" /></div>
          <div><h2 className="font-semibold text-sm text-white tracking-tight">Gemini Intelligence</h2><p className="text-[10px] text-emerald-400 font-bold tracking-wider flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> ENGINE ONLINE</p></div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => onViewChange?.('live')} className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition-all"><Phone size={18} /></button>
          <button onClick={() => { if (!isMuted) stopAudioPlayback(); setIsMuted(!isMuted); }} className={`p-2.5 rounded-xl transition-all border active:scale-95 ${isMuted ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-white/5 border-white/5 text-white/40 hover:text-white'}`}>{isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
            {['fast', 'pro', 'thinking'].map(m => (
              <button key={m} onClick={() => setMode(m as any)} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${mode === m ? 'bg-white text-black shadow-lg' : 'text-white/20 hover:text-white'}`}>{m}</button>
            ))}
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-10 no-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-6 animate-slide-up ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl ${m.role === 'user' ? 'bg-indigo-600/20 border border-indigo-500/30' : 'bg-white/5 border border-white/5'}`}>{m.role === 'user' ? <User size={20} className="text-white/80" /> : <Bot size={20} className="text-blue-400/80" />}</div>
            <div className="flex flex-col gap-3 max-w-[80%] lg:max-w-[70%] group">
              <div className={`rounded-3xl p-6 backdrop-blur-3xl border shadow-2xl ${m.role === 'user' ? 'bg-indigo-600/10 border-indigo-500/20 text-white/90 rounded-tr-sm' : 'bg-[#121212]/80 border-white/5 text-white/80 rounded-tl-sm'}`}>
                {m.attachment && (
                  <div className="mb-4">
                    {m.attachment.type === 'image' ? <img src={m.attachment.previewUrl} className="rounded-2xl border border-white/10 shadow-lg max-h-80 object-cover" /> : <div className="flex items-center gap-3 p-4 bg-black/50 rounded-2xl border border-white/5"><FileText size={24} className="text-blue-400" /><p className="text-sm font-semibold truncate text-white/80">{m.attachment.name}</p></div>}
                  </div>
                )}
                <ReactMarkdown className="prose prose-invert prose-sm max-w-none leading-relaxed font-light">{m.text}</ReactMarkdown>
                
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
                      <Search size={10} /> Grounded Sources
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {m.sources.map((s, idx) => (
                        <a 
                          key={idx} 
                          href={s.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/5 hover:bg-white/10 rounded-lg text-[11px] text-white/60 hover:text-white transition-all group"
                        >
                          <span className="truncate max-w-[150px]">{s.title || 'Source'}</span>
                          <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {m.text && m.role === 'model' && (
                <div className="flex items-center gap-2 px-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <button onClick={() => playTTS(m.text, i)} disabled={isMuted} className={`p-2.5 rounded-xl transition-all active:scale-90 ${playingMessageId === i ? 'text-blue-400 bg-blue-500/10 border border-blue-500/20' : 'text-white/20 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5'}`}>{playingMessageId === i ? <StopCircle size={16} className="animate-pulse" /> : <Volume2 size={16} />}</button>
                  <button onClick={() => downloadMessageAudio(m.text, i)} className="p-2.5 rounded-xl text-white/20 hover:bg-white/5 hover:text-white transition-all active:scale-90 border border-transparent hover:border-white/5" title="Download Voice"><Download size={16} /></button>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && <div className="flex gap-6 animate-slide-up"><div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0"><Bot size={20} className="text-blue-400/80" /></div><div className="bg-[#121212]/80 border border-white/5 rounded-3xl rounded-tl-sm p-6 flex items-center gap-4 shadow-2xl"><Loader2 className="animate-spin text-blue-400" size={18} /><span className="text-sm text-white/40 font-bold uppercase tracking-widest">{mode === 'thinking' ? 'Deep Reasoning...' : 'Architecting response...'}</span></div></div>}
      </div>

      <div className="p-8 bg-[#0a0a0a]/90 backdrop-blur-3xl border-t border-white/5 relative z-20">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          {attachment && (
            <div className="relative w-fit bg-white/5 rounded-2xl p-3 pr-14 border border-white/5 animate-scale-in">
              {attachment.type === 'image' ? <div className="h-20 w-20 rounded-xl overflow-hidden ring-1 ring-white/10"><img src={attachment.previewUrl} className="w-full h-full object-cover" /></div> : <div className="flex items-center gap-4 p-3"><FileText size={28} className="text-blue-400" /><p className="text-sm font-semibold truncate text-white/80">{attachment.name}</p></div>}
              <button onClick={() => setAttachment(null)} className="absolute top-2 right-2 p-2 bg-red-500/20 text-red-500 rounded-xl hover:bg-red-500 transition-colors active:scale-90"><X size={14} /></button>
            </div>
          )}
          <div className="relative flex items-center gap-4">
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,.txt,.csv,.md" />
            <input type="file" ref={imageInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
            <div className="flex gap-2">
              <button onClick={() => fileInputRef.current?.click()} className="p-4 rounded-2xl bg-white/5 text-white/40 hover:text-white border border-white/5 active:scale-95 transition-all"><Paperclip size={20} /></button>
              <button onClick={() => imageInputRef.current?.click()} className="p-4 rounded-2xl bg-white/5 text-white/40 hover:text-white border border-white/5 active:scale-95 transition-all"><ImageIcon size={20} /></button>
            </div>
            <div className="relative flex-1">
              <input 
                type="text" 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
                placeholder={isRecording ? "Listening to your voice..." : mode === 'pro' ? "Search the web with Gemini 3 Pro..." : "Collaborate with Gemini..."} 
                className={`w-full bg-black/40 border border-white/5 rounded-[2rem] py-5 pl-8 pr-16 focus:outline-none focus:ring-1 focus:ring-white/10 text-white/90 text-[15px] placeholder:text-white/10 transition-all ${isRecording ? 'animate-pulse ring-1 ring-red-500/50 bg-red-500/5' : ''}`} 
                disabled={loading} 
              />
              <button onClick={handleSend} disabled={(!input.trim() && !attachment) || loading} className="absolute right-3 top-1/2 -translate-y-1/2 p-3.5 bg-white text-black rounded-full active:scale-90 shadow-xl disabled:opacity-20 transition-all"><Send size={18} fill="currentColor" /></button>
            </div>
            <button onClick={isRecording ? stopRecording : startRecording} className={`p-5 rounded-full transition-all border shadow-2xl ${isRecording ? 'bg-red-500 border-red-400 text-white animate-pulse' : 'bg-white/5 border-white/5 text-white/40 hover:text-white'}`} disabled={loading}>{isRecording ? <Square size={24} fill="currentColor" /> : <Mic size={24} />}</button>
          </div>
        </div>
      </div>
    </div>
  );
};
