
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { ensureApiKeySelected } from '../utils/key-selection';
import { createPcmBlob, decodeAudioData, base64ToUint8Array, pcmToWav, downloadBlob } from '../utils/audio';
import { 
  PhoneOff, 
  Loader2, 
  Sparkles, 
  Image as ImageIcon, 
  Check, 
  Mic, 
  AlertCircle, 
  Settings2, 
  X, 
  Sliders, 
  Volume2, 
  Gauge, 
  Download, 
  ChevronDown, 
  Radio,
  MessageSquareText,
  Pause,
  Play,
  Square
} from 'lucide-react';

export const LiveVoice: React.FC = () => {
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Audio Levels for UI scaling
  const [userLevel, setUserLevel] = useState(0);
  const [aiLevel, setAiLevel] = useState(0);

  const [duration, setDuration] = useState(0);
  const [imageUploaded, setImageUploaded] = useState(false);
  const [lastSharedImage, setLastSharedImage] = useState<string | null>(null);
  
  // Settings State
  const [voiceName, setVoiceName] = useState('Zephyr');
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [pitch, setPitch] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [downloadingVoice, setDownloadingVoice] = useState<string | null>(null);

  // Transcription state
  const [isTranscriptionEnabled, setIsTranscriptionEnabled] = useState(true);
  const [userTranscript, setUserTranscript] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');
  const userTranscriptRef = useRef('');
  const aiTranscriptRef = useRef('');
  const clearTranscriptTimeoutRef = useRef<any>(null);

  // Recording State
  const [isRecordingCall, setIsRecordingCall] = useState(false);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const aiRecordingGainNodeRef = useRef<GainNode | null>(null);
  const callRecorderRef = useRef<MediaRecorder | null>(null);
  const callChunksRef = useRef<Blob[]>([]);

  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Analysers for visualization
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const voices = [
    { name: 'Puck', desc: 'Soft & Mellow', gender: 'Male' },
    { name: 'Charon', desc: 'Deep & Authoritative', gender: 'Male' },
    { name: 'Kore', desc: 'Calm & Soothing', gender: 'Female' },
    { name: 'Fenrir', desc: 'Energetic & Wild', gender: 'Male' },
    { name: 'Zephyr', desc: 'Balanced & Clear', gender: 'Female' }
  ];

  useEffect(() => {
    let interval: any;
    if (active && status === 'connected') {
        interval = setInterval(() => setDuration(prev => prev + 1), 1000);
    } else {
        setDuration(0);
    }
    return () => clearInterval(interval);
  }, [active, status]);

  useEffect(() => {
    sourcesRef.current.forEach(source => {
        try {
            if (source.playbackRate) source.playbackRate.value = playbackRate;
            if (source.detune) source.detune.value = pitch;
        } catch(e) {}
    });
  }, [playbackRate, pitch]);

  // Canvas Visualizer Loop
  useEffect(() => {
      if (!active || status !== 'connected' || !canvasRef.current) {
          if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
          return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const AI_BARS = 64;
      const USER_BARS = 64;
      const CENTER_X = rect.width / 2;
      const CENTER_Y = rect.height / 2;
      const RADIUS_AI = 80;
      const RADIUS_USER = 140;

      const aiData = new Uint8Array(AI_BARS);
      const userData = new Uint8Array(USER_BARS);
      
      let rotation = 0;
      const particles: {x: number, y: number, vx: number, vy: number, life: number, color: string}[] = [];

      const draw = () => {
          if (!active) return;

          // Clear
          ctx.clearRect(0, 0, rect.width, rect.height);
          
          rotation += 0.002;

          let aiAvg = 0;
          let userAvg = 0;

          if (outputAnalyserRef.current) {
              const bufferLength = outputAnalyserRef.current.frequencyBinCount;
              const rawData = new Uint8Array(bufferLength);
              outputAnalyserRef.current.getByteFrequencyData(rawData);
              
              const step = Math.floor(bufferLength * 0.6 / AI_BARS);
              for (let i = 0; i < AI_BARS; i++) {
                  let sum = 0;
                  for (let j = 0; j < step; j++) sum += rawData[i * step + j];
                  aiData[i] = sum / step;
                  aiAvg += aiData[i];
              }
              aiAvg /= AI_BARS;
          }

          if (inputAnalyserRef.current) {
              const bufferLength = inputAnalyserRef.current.frequencyBinCount;
              const rawData = new Uint8Array(bufferLength);
              inputAnalyserRef.current.getByteFrequencyData(rawData);
              
              const step = Math.floor(bufferLength * 0.6 / USER_BARS);
              for (let i = 0; i < USER_BARS; i++) {
                  let sum = 0;
                  for (let j = 0; j < step; j++) sum += rawData[i * step + j];
                  userData[i] = sum / step;
                  userAvg += userData[i];
              }
              userAvg /= USER_BARS;
          }

          if (Math.random() > 0.9) {
             setAiLevel(aiAvg / 255);
             setUserLevel(userAvg / 255);
          }

          if (aiAvg > 30) {
              for(let k=0; k<2; k++) {
                  const angle = Math.random() * Math.PI * 2;
                  const speed = (Math.random() * 2) + 1;
                  particles.push({
                      x: 0, y: 0,
                      vx: Math.cos(angle) * speed,
                      vy: Math.sin(angle) * speed,
                      life: 1.0,
                      color: `hsla(${200 + Math.random() * 40}, 100%, 70%, 0.8)`
                  });
              }
          }

          ctx.save();
          ctx.translate(CENTER_X, CENTER_Y);
          
          for (let i = particles.length - 1; i >= 0; i--) {
              const p = particles[i];
              p.x += p.vx;
              p.y += p.vy;
              p.life -= 0.02;
              
              if (p.life <= 0) {
                  particles.splice(i, 1);
              } else {
                  ctx.beginPath();
                  ctx.arc(p.x, p.y, 2 * p.life, 0, Math.PI * 2);
                  ctx.fillStyle = p.color;
                  ctx.fill();
              }
          }

          // Inner Bars
          ctx.save();
          ctx.rotate(rotation); 
          for (let i = 0; i < AI_BARS; i++) {
              const val = aiData[i] / 255.0;
              const barHeight = 20 + val * 100;
              const angle = (i / AI_BARS) * Math.PI * 2;
              
              ctx.save();
              ctx.rotate(angle);
              
              if (val > 0.1) {
                  ctx.shadowBlur = 15;
                  ctx.shadowColor = `hsla(210, 100%, 60%, ${val})`;
              }

              const grad = ctx.createLinearGradient(0, -RADIUS_AI, 0, -RADIUS_AI - barHeight);
              grad.addColorStop(0, `hsla(220, 90%, 60%, ${0.5 + val})`);
              grad.addColorStop(1, `hsla(260, 90%, 70%, 0)`);

              ctx.fillStyle = grad;
              ctx.beginPath();
              if (ctx.roundRect) {
                  ctx.roundRect(-2, -RADIUS_AI - barHeight, 4, barHeight, 2);
              } else {
                  ctx.rect(-2, -RADIUS_AI - barHeight, 4, barHeight);
              }
              ctx.fill();
              ctx.restore();
          }
          ctx.restore();

          // Outer Bars
          ctx.save();
          ctx.rotate(-rotation * 0.5); 
          for (let i = 0; i < USER_BARS; i++) {
              const val = userData[i] / 255.0;
              const barHeight = 10 + val * 60;
              const angle = (i / USER_BARS) * Math.PI * 2;
              
              ctx.save();
              ctx.rotate(angle);
              
              if (val > 0.1) {
                  ctx.shadowBlur = 10;
                  ctx.shadowColor = `hsla(150, 100%, 60%, ${val})`;
              }

              const grad = ctx.createLinearGradient(0, -RADIUS_USER, 0, -RADIUS_USER - barHeight);
              grad.addColorStop(0, `hsla(160, 90%, 50%, ${0.3 + val})`);
              grad.addColorStop(1, `hsla(180, 90%, 60%, 0)`);

              ctx.fillStyle = grad;
              ctx.beginPath();
              if (ctx.roundRect) {
                  ctx.roundRect(-1.5, -RADIUS_USER - barHeight, 3, barHeight, 2);
              } else {
                  ctx.rect(-1.5, -RADIUS_USER - barHeight, 3, barHeight);
              }
              ctx.fill();
              ctx.restore();
          }
          ctx.restore();
          ctx.restore();

          animationFrameRef.current = requestAnimationFrame(draw);
      };

      draw();

      return () => {
          if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };
  }, [active, status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const stopCallRecording = () => {
      if (callRecorderRef.current && callRecorderRef.current.state !== 'inactive') {
          callRecorderRef.current.stop();
      }
      setIsRecordingCall(false);
      setIsRecordingPaused(false);
  };

  const stopSession = () => {
    if (isRecordingCall) stopCallRecording();
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => { try { session.close(); } catch (e) {} }).catch(() => {});
      sessionPromiseRef.current = null;
    }
    if (processorRef.current) { processorRef.current.disconnect(); processorRef.current = null; }
    if (sourceRef.current) { sourceRef.current.disconnect(); sourceRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
    if (inputContextRef.current) { inputContextRef.current.close().catch(() => {}); inputContextRef.current = null; }
    if (outputContextRef.current) { outputContextRef.current.close().catch(() => {}); outputContextRef.current = null; }
    
    aiRecordingGainNodeRef.current = null;
    sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    inputAnalyserRef.current = null;
    outputAnalyserRef.current = null;
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (clearTranscriptTimeoutRef.current) clearTimeout(clearTranscriptTimeoutRef.current);

    setUserTranscript(''); setAiTranscript('');
    if (status !== 'error') setStatus('disconnected');
    setActive(false); setUserLevel(0); setAiLevel(0); 
    setImageUploaded(false); setLastSharedImage(null);
  };

  const startSession = async () => {
    try {
      const hasKey = await ensureApiKeySelected();
      if (!hasKey) return;
      setStatus('connecting'); setErrorMessage('');
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioCtx({ sampleRate: 16000 });
      const outputCtx = new AudioCtx({ sampleRate: 24000 });
      
      await inputCtx.resume(); await outputCtx.resume();
      inputContextRef.current = inputCtx; outputContextRef.current = outputCtx;
      
      const inAnalyser = inputCtx.createAnalyser(); inAnalyser.fftSize = 512; inputAnalyserRef.current = inAnalyser;
      const outAnalyser = outputCtx.createAnalyser(); outAnalyser.fftSize = 512; outputAnalyserRef.current = outAnalyser;

      const outputNode = outputCtx.createGain();
      outputNode.connect(outputCtx.destination);
      outputNode.connect(outAnalyser); 
      
      const aiRecordingGain = outputCtx.createGain();
      aiRecordingGainNodeRef.current = aiRecordingGain;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setStatus('connected'); setActive(true);
            if (!inputContextRef.current || !streamRef.current) return;
            const source = inputContextRef.current.createMediaStreamSource(streamRef.current);
            sourceRef.current = source;
            if (inputAnalyserRef.current) source.connect(inputAnalyserRef.current);
            const actualSampleRate = inputContextRef.current.sampleRate;
            const processor = inputContextRef.current.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData, actualSampleRate);
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob })).catch(() => {});
            };
            source.connect(processor);
            processor.connect(inputContextRef.current.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
             if (msg.serverContent?.inputTranscription) {
               if (clearTranscriptTimeoutRef.current) clearTimeout(clearTranscriptTimeoutRef.current);
               userTranscriptRef.current += msg.serverContent.inputTranscription.text;
               setUserTranscript(userTranscriptRef.current);
             }
             if (msg.serverContent?.outputTranscription) {
               if (clearTranscriptTimeoutRef.current) clearTimeout(clearTranscriptTimeoutRef.current);
               aiTranscriptRef.current += msg.serverContent.outputTranscription.text;
               setAiTranscript(aiTranscriptRef.current);
             }
             if (msg.serverContent?.turnComplete) {
               userTranscriptRef.current = ''; aiTranscriptRef.current = '';
               clearTranscriptTimeoutRef.current = setTimeout(() => { setUserTranscript(''); setAiTranscript(''); }, 3000);
             }
             const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (base64Audio && outputContextRef.current) {
                const ctx = outputContextRef.current;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                const audioBuffer = await decodeAudioData(base64ToUint8Array(base64Audio), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.playbackRate.value = playbackRate;
                source.detune.value = pitch;
                source.connect(outputNode);
                if (aiRecordingGainNodeRef.current) source.connect(aiRecordingGainNodeRef.current);
                source.addEventListener('ended', () => sourcesRef.current.delete(source));
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration / (playbackRate * Math.pow(2, pitch / 1200));
                sourcesRef.current.add(source);
             }
             if (msg.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
                sourcesRef.current.clear(); nextStartTimeRef.current = 0; setAiTranscript(''); aiTranscriptRef.current = '';
             }
          },
          onclose: () => stopSession(),
          onerror: (e) => { console.error("Live Error", e); setErrorMessage("Connection failed."); setStatus('error'); stopSession(); }
        },
        config: {
          responseModalities: [Modality.AUDIO], outputAudioTranscription: {}, inputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } } },
          systemInstruction: "You are a natural, helpful AI in a real-time voice call."
        }
      });
      sessionPromiseRef.current = sessionPromise;
    } catch (e: any) { setErrorMessage("Could not start session."); setStatus('error'); stopSession(); }
  };

  const handleVoiceChange = (newName: string) => { setVoiceName(newName); if (active) { stopSession(); setTimeout(() => startSession(), 500); } };
  const handleDownloadVoiceSample = async (vName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (downloadingVoice) return;
    setDownloadingVoice(vName);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: { parts: [{ text: `Hello, I am ${vName}.` }] },
            config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: vName } } } }
        });
        const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64) downloadBlob(pcmToWav(base64ToUint8Array(base64), 24000), `voice-${vName}.wav`);
    } catch (e) { console.error(e); } finally { setDownloadingVoice(null); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sessionPromiseRef.current) return;
    const reader = new FileReader();
    reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setLastSharedImage(reader.result as string);
        sessionPromiseRef.current?.then(session => session.sendRealtimeInput({ media: { mimeType: file.type, data: base64 } }));
        setImageUploaded(true); setTimeout(() => setImageUploaded(false), 3000);
    };
    reader.readAsDataURL(file); e.target.value = '';
  };

  const togglePauseRecording = () => {
      if (callRecorderRef.current) {
          if (isRecordingPaused) { callRecorderRef.current.resume(); setIsRecordingPaused(false); } 
          else { callRecorderRef.current.pause(); setIsRecordingPaused(true); }
      }
  };

  const handleToggleCallRecording = () => {
      if (isRecordingCall) { stopCallRecording(); } 
      else {
          if (!outputContextRef.current || !streamRef.current || !aiRecordingGainNodeRef.current) return;
          const ctx = outputContextRef.current;
          const dest = ctx.createMediaStreamDestination();
          aiRecordingGainNodeRef.current.connect(dest);
          const micSource = ctx.createMediaStreamSource(streamRef.current);
          micSource.connect(dest);
          const recorder = new MediaRecorder(dest.stream);
          callRecorderRef.current = recorder;
          callChunksRef.current = [];
          recorder.ondataavailable = (e) => { if (e.data.size > 0) callChunksRef.current.push(e.data); };
          recorder.onstop = () => {
              downloadBlob(new Blob(callChunksRef.current, { type: 'audio/webm' }), `gemini-call-${Date.now()}.webm`);
              micSource.disconnect(); aiRecordingGainNodeRef.current?.disconnect(dest);
          };
          recorder.start(); setIsRecordingCall(true); setIsRecordingPaused(false);
      }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 animate-fade-in relative bg-white/60 dark:bg-black selection:bg-blue-500/20 transition-colors duration-500">
        <div className="absolute top-6 right-6 z-20">
            <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`p-3 rounded-full transition-all border ${showSettings ? 'bg-slate-900 dark:bg-white text-white dark:text-black' : 'bg-white/40 dark:bg-white/5 text-slate-600 dark:text-white/40 border-black/5 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/10'}`}
            >
                {showSettings ? <X size={20} /> : <Settings2 size={20} />}
            </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
            <div className="absolute top-20 right-6 z-30 w-80 glass-panel p-6 animate-scale-in border border-black/5 dark:border-white/10 bg-white/80 dark:bg-[#0f0f0f]/90">
                <div className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest flex items-center gap-2">
                            <Mic size={12} /> Voice Personality
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                            {voices.map(v => (
                                <div 
                                    key={v.name}
                                    className={`flex items-center gap-2 p-1 pr-2 rounded-xl border transition-all ${
                                        voiceName === v.name 
                                        ? 'bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/30 dark:border-blue-500/50' 
                                        : 'bg-transparent border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/10'
                                    }`}
                                >
                                    <button onClick={() => handleVoiceChange(v.name)} className="flex-1 flex items-center justify-between p-2 text-left">
                                        <div>
                                            <div className={`font-semibold text-sm ${voiceName === v.name ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-white/70'}`}>{v.name}</div>
                                            <div className="text-[10px] opacity-60 text-slate-500 dark:text-white/50">{v.desc}</div>
                                        </div>
                                        {voiceName === v.name && <Check size={14} className="text-blue-500 dark:text-blue-400" />}
                                    </button>
                                    <button
                                        onClick={(e) => handleDownloadVoiceSample(v.name, e)}
                                        disabled={!!downloadingVoice}
                                        className="p-2 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/20 text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95"
                                    >
                                        {downloadingVoice === v.name ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-4 pt-4 border-t border-black/5 dark:border-white/5">
                         <div className="space-y-2">
                            <div className="flex justify-between text-xs text-slate-500 dark:text-white/60 font-medium">
                                <span className="flex items-center gap-2"><Gauge size={12}/> Speed</span>
                                <span>{playbackRate.toFixed(1)}x</span>
                            </div>
                            <input type="range" min="0.5" max="2.0" step="0.1" value={playbackRate} onChange={(e) => setPlaybackRate(parseFloat(e.target.value))} className="w-full accent-blue-500 h-1.5 bg-black/10 dark:bg-white/10 rounded-full" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-slate-500 dark:text-white/60 font-medium">
                                <span className="flex items-center gap-2"><Sliders size={12}/> Pitch</span>
                                <span>{pitch > 0 ? '+' : ''}{pitch} cents</span>
                            </div>
                            <input type="range" min="-1200" max="1200" step="100" value={pitch} onChange={(e) => setPitch(parseInt(e.target.value))} className="w-full accent-pink-500 h-1.5 bg-black/10 dark:bg-white/10 rounded-full" />
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div className="relative z-10 w-full max-w-lg glass-panel p-10 lg:p-14 shadow-3xl flex flex-col items-center justify-between min-h-[620px] border border-black/5 dark:border-white/5 bg-white/40 dark:bg-[#050505]/40 overflow-hidden">
            
            <div className="text-center space-y-3 w-full animate-slide-up flex flex-col items-center">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Gemini Live</h2>
                <div className="flex items-center justify-center gap-2">
                    {active && status === 'connected' ? (
                        <div className="flex items-center gap-2 px-3 py-1 bg-white/60 dark:bg-white/5 rounded-full border border-black/5 dark:border-white/10 backdrop-blur-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-slate-600 dark:text-white/60 font-mono text-sm tracking-wider">{formatTime(duration)}</span>
                        </div>
                    ) : (
                        <div className="text-slate-400 dark:text-white/20 uppercase text-[10px] font-bold tracking-[0.2em]">Disconnected</div>
                    )}
                </div>

                <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/10 transition-all active:scale-95 group"
                >
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-white/40 group-hover:text-slate-600 dark:group-hover:text-white/60 tracking-wider">Voice</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-white/80 group-hover:text-slate-900 dark:group-hover:text-white">{voiceName}</span>
                    <ChevronDown size={12} className={`text-slate-400 dark:text-white/40 transition-transform ${showSettings ? 'rotate-180' : ''}`} />
                </button>
            </div>

            <div className="relative flex flex-col items-center justify-center flex-1 w-full my-8">
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
                <div 
                  className={`relative z-10 w-52 h-52 lg:w-60 lg:h-60 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
                      active 
                      ? 'bg-blue-600 shadow-[0_0_50px_rgba(37,99,235,0.4)] ring-4 ring-blue-500/20' 
                      : 'bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/5'
                  }`}
                  style={{ transform: active ? `scale(${1 + aiLevel * 0.1})` : 'scale(1)' }}
                >
                    {status === 'connecting' ? (
                        <Loader2 className="w-16 h-16 animate-spin text-slate-400 dark:text-white/30" />
                    ) : status === 'error' ? (
                        <AlertCircle className="w-16 h-16 text-red-400 animate-pulse" />
                    ) : active ? (
                        <div className="relative animate-scale-in">
                            <Sparkles className="w-24 h-24 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                            {userLevel > 0.1 && (
                                <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
                            )}
                        </div>
                    ) : (
                        <Mic className="w-20 h-20 text-slate-300 dark:text-white/5" />
                    )}
                </div>

                {isTranscriptionEnabled && (
                    <div className="absolute bottom-0 w-full px-6 flex flex-col gap-3 z-20 transition-all pointer-events-none">
                        {aiTranscript && (
                            <div className="animate-slide-up text-center">
                                <p className="text-sm text-blue-700 dark:text-blue-200/90 leading-relaxed font-medium bg-white/80 dark:bg-black/60 backdrop-blur-xl px-6 py-3 rounded-2xl border border-blue-200 dark:border-blue-500/20 shadow-lg inline-block mx-auto max-w-full">
                                    {aiTranscript}
                                </p>
                            </div>
                        )}
                        {userTranscript && (
                            <div className="animate-slide-up text-center flex justify-center">
                                <div className="flex items-center gap-3 bg-emerald-100/80 dark:bg-emerald-900/40 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 shadow-xl max-w-[90%]">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse shadow-[0_0_5px_#34d399]" />
                                    <p className="text-sm text-emerald-800 dark:text-emerald-100 font-medium italic">
                                        "{userTranscript}"
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="w-full flex flex-col items-center gap-8 mt-4">
                {status === 'error' && errorMessage && (
                    <div className="text-red-600 dark:text-red-300 text-[11px] font-bold bg-red-100 dark:bg-red-900/20 px-5 py-2 rounded-full border border-red-200 dark:border-red-500/20 backdrop-blur-md text-center">
                        {errorMessage}
                    </div>
                )}
                
                {imageUploaded && (
                    <div className="px-5 py-2 bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-full flex items-center gap-2 animate-bounce">
                         <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                         <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-200 uppercase tracking-widest">Image Shared</span>
                         {lastSharedImage && (
                             <img src={lastSharedImage} alt="Shared" className="w-4 h-4 rounded object-cover border border-white/20 ml-2" />
                         )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={!active}
                        className={`p-4 rounded-3xl transition-all border shadow-lg ${
                            active 
                            ? 'bg-white/80 dark:bg-[#151515] border-black/5 dark:border-white/10 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/5 active:scale-95'
                            : 'bg-white/40 dark:bg-white/5 text-slate-300 dark:text-white/5 border-transparent cursor-not-allowed'
                        }`}
                        title="Share Image"
                    >
                         <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                         <ImageIcon size={20} />
                    </button>

                    <button
                        onClick={() => setIsTranscriptionEnabled(!isTranscriptionEnabled)}
                        className={`p-4 rounded-3xl transition-all border shadow-lg ${
                            isTranscriptionEnabled 
                            ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20' 
                            : 'bg-white/80 dark:bg-[#151515] border-black/5 dark:border-white/10 text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60 hover:bg-white dark:hover:bg-white/5 active:scale-95'
                        }`}
                        title={isTranscriptionEnabled ? "Hide Transcription" : "Show Transcription"}
                    >
                        <MessageSquareText size={20} />
                    </button>

                    <button
                        onClick={active ? stopSession : startSession}
                        disabled={status === 'connecting'}
                        className={`w-20 h-20 rounded-[2.5rem] flex items-center justify-center transition-all shadow-3xl border-2 active:scale-90 ${
                            active 
                            ? 'bg-red-500 text-white border-red-400 shadow-red-500/30 dark:shadow-red-900/30' 
                            : 'bg-white text-black border-white shadow-lg hover:bg-blue-50'
                        } ${status === 'connecting' ? 'opacity-50' : ''}`}
                    >
                        {active ? <div className="flex flex-col items-center"><PhoneOff size={32} /></div> : <Mic size={32} />}
                    </button>

                    <button
                        onClick={handleToggleCallRecording}
                        disabled={!active}
                        className={`p-4 rounded-3xl transition-all border shadow-lg ${
                            active 
                            ? isRecordingCall
                                ? 'bg-red-50 dark:bg-red-500/20 border-red-200 dark:border-red-500/50 text-red-500 dark:text-red-400'
                                : 'bg-white/80 dark:bg-[#151515] border-black/5 dark:border-white/10 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/5 active:scale-95'
                            : 'bg-white/40 dark:bg-white/5 text-slate-300 dark:text-white/5 border-transparent cursor-not-allowed'
                        } ${isRecordingCall && !isRecordingPaused ? 'animate-pulse' : ''}`}
                        title={isRecordingCall ? "Stop Recording" : "Record Call"}
                    >
                         {isRecordingCall ? <Square size={20} fill="currentColor" /> : <Radio size={20} />} 
                    </button>

                    {isRecordingCall && (
                        <button
                            onClick={togglePauseRecording}
                            className={`p-4 rounded-3xl transition-all border shadow-lg ${
                                isRecordingPaused 
                                ? 'bg-yellow-50 dark:bg-yellow-500/20 border-yellow-200 dark:border-yellow-500/50 text-yellow-500 dark:text-yellow-400' 
                                : 'bg-white/80 dark:bg-[#151515] border-black/5 dark:border-white/10 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/5 active:scale-95'
                            }`}
                            title={isRecordingPaused ? "Resume Recording" : "Pause Recording"}
                        >
                            {isRecordingPaused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}
                        </button>
                    )}
                </div>
                
                <p className="text-[10px] text-slate-400 dark:text-white/20 font-bold tracking-[0.3em] uppercase">
                    {active ? 'Live Connection Secured' : 'Initiate Secure Voice Link'}
                </p>
            </div>
        </div>
        
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 dark:bg-blue-600/5 blur-[150px] rounded-full pointer-events-none transition-opacity duration-1000 ${active ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  );
};
