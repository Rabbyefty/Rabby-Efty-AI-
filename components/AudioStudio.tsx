
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { 
  Mic, 
  Play, 
  AudioWaveform, 
  Loader2, 
  StopCircle, 
  Podcast, 
  Wand2, 
  Download, 
  Sparkles, 
  Menu,
  Check,
  X,
  Volume2,
  Upload,
  Waves,
  Zap,
  UserCheck,
  FileAudio
} from 'lucide-react';
import { decodeAudioData, base64ToUint8Array, pcmToWav, downloadBlob } from '../utils/audio';

export const AudioStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'podcast' | 'tts' | 'transcribe'>('tts');

  // Audio State
  const [lastAudio, setLastAudio] = useState<{base64: string, type: string} | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Audio Context Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // TTS State
  const [ttsText, setTtsText] = useState('');
  const [voiceName, setVoiceName] = useState('Kore');
  const [ttsLoading, setTtsLoading] = useState(false);
  
  // Voice Cloning State
  const [isCloningMode, setIsCloningMode] = useState(false);
  const [cloneFile, setCloneFile] = useState<File | null>(null);
  const [cloningStatus, setCloningStatus] = useState<'idle' | 'analyzing' | 'cloned'>('idle');
  const [clonedVoiceMetadata, setClonedVoiceMetadata] = useState<any>(null);
  const [cloningProgress, setCloningProgress] = useState(0);
  const cloneInputRef = useRef<HTMLInputElement>(null);

  const voices = [
    { name: 'Puck', desc: 'Soft & Mellow', gender: 'Male' },
    { name: 'Charon', desc: 'Deep & Authoritative', gender: 'Male' },
    { name: 'Kore', desc: 'Calm & Soothing', gender: 'Female' },
    { name: 'Fenrir', desc: 'Energetic & Wild', gender: 'Male' },
    { name: 'Zephyr', desc: 'Balanced & Clear', gender: 'Female' }
  ];
  
  // Transcribe State
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [transcribeLoading, setTranscribeLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Podcast State
  const [podcastTopic, setPodcastTopic] = useState('');
  const [podcastLoading, setPodcastLoading] = useState(false);
  const [podcastStatus, setPodcastStatus] = useState('');

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioCtx({ sampleRate: 24000 });
    }
    return audioContextRef.current;
  };

  const stopPlayback = () => {
    if (activeSourceRef.current) {
      try { activeSourceRef.current.stop(); } catch (e) {}
      activeSourceRef.current = null;
    }
    setIsPlaying(false);
  };

  const playAudio = async (base64String: string) => {
    try {
      stopPlayback();
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') await ctx.resume();

      const audioBuffer = await decodeAudioData(base64ToUint8Array(base64String), ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      
      source.onended = () => setIsPlaying(false);
      
      activeSourceRef.current = source;
      source.start();
      setIsPlaying(true);
    } catch (e) {
      console.error("Playback failed", e);
      setIsPlaying(false);
    }
  };

  const handleDownloadLast = () => {
    if (!lastAudio) return;
    const wavBlob = pcmToWav(base64ToUint8Array(lastAudio.base64), 24000);
    downloadBlob(wavBlob, `gemini-audio-${lastAudio.type}-${Date.now()}.wav`);
  };

  const handleTTS = async () => {
    if (!ttsText) return;
    stopPlayback();
    setTtsLoading(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let finalVoice = voiceName;
      let systemInstruction = "Speak naturally.";
      
      if (cloningStatus === 'cloned' && clonedVoiceMetadata) {
        finalVoice = clonedVoiceMetadata.baseVoice;
        systemInstruction = `You are a high-fidelity voice clone. Match the following characteristics: ${clonedVoiceMetadata.characteristics}. Output the speech exactly.`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text: ttsText }] }],
        config: {
          systemInstruction,
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: finalVoice } }
          }
        }
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        setLastAudio({ base64: base64Audio, type: 'tts' });
        await playAudio(base64Audio);
      }
    } catch (e) {
      console.error(e);
      alert("Text-to-Speech generation failed.");
    } finally {
      setTtsLoading(false);
    }
  };

  const handleCloneUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCloneFile(file);
      setCloningStatus('idle');
      setClonedVoiceMetadata(null);
    }
  };

  const startCloning = async () => {
    if (!cloneFile) return;
    setCloningStatus('analyzing');
    setCloningProgress(10);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const reader = new FileReader();
      
      const fileBase64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(cloneFile);
      });

      setCloningProgress(40);
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { mimeType: cloneFile.type, data: fileBase64 } },
            { text: "Analyze this voice sample. Describe its pitch, tone, age, and gender in 10 words. Also, pick the best matching voice from this list: Puck, Charon, Kore, Fenrir, Zephyr. Return JSON: { \"characteristics\": \"...\", \"baseVoice\": \"...\" }" }
          ]
        }
      });

      setCloningProgress(80);
      
      const text = response.text?.replace(/```json/g, '').replace(/```/g, '').trim();
      if (text) {
        const metadata = JSON.parse(text);
        setClonedVoiceMetadata(metadata);
        setCloningStatus('cloned');
        setCloningProgress(100);
      }
    } catch (e) {
      console.error(e);
      setCloningStatus('idle');
      alert("Voice cloning analysis failed.");
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        mediaRecorder.onstop = async () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64 = (reader.result as string).split(',')[1];
            await transcribeAudio(base64);
          };
          reader.readAsDataURL(blob);
          stream.getTracks().forEach(t => t.stop());
        };
        mediaRecorder.start();
        setIsRecording(true);
      } catch (e) {
        console.error("Mic access failed", e);
        alert("Microphone access denied.");
      }
    }
  };

  const transcribeAudio = async (base64Audio: string) => {
    setTranscribeLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { mimeType: 'audio/webm', data: base64Audio } },
            { text: "Transcribe this audio exactly." }
          ]
        }
      });
      setTranscription(response.text || "No transcription available.");
    } catch (e) {
      console.error(e);
      setTranscription("Error transcribing.");
    } finally {
      setTranscribeLoading(false);
    }
  };

  const handleGeneratePodcast = async () => {
    if (!podcastTopic) return;
    stopPlayback();
    setPodcastLoading(true);
    setPodcastStatus('Drafting Script...');
    setLastAudio(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const scriptResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ text: `Create a short podcast dialogue script about: ${podcastTopic}` }]
      });
      const script = scriptResponse.text;
      if (!script) throw new Error("Failed script");
      setPodcastStatus('Recording...');
      const ttsResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: script }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                { speaker: 'Alex', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
                { speaker: 'Sam', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } }
              ]
            }
          }
        }
      });
      const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        setLastAudio({ base64: base64Audio, type: 'podcast' });
        await playAudio(base64Audio);
      }
    } catch (e) {
      console.error(e);
      alert("Podcast generation failed.");
    } finally {
      setPodcastLoading(false);
      setPodcastStatus('');
    }
  };

  return (
    <div className="h-full w-full bg-black overflow-y-auto p-6 lg:p-12 pb-32">
      <div className="max-w-6xl mx-auto space-y-12 animate-fade-in">
        <header className="flex items-center gap-6">
          <div className="p-4 bg-gradient-to-tr from-purple-500/20 to-blue-500/20 rounded-2xl border border-white/10 shadow-xl">
            <AudioWaveform className="text-purple-300" size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">Audio Studio</h1>
            <p className="text-white/40 mt-1 font-medium">Sonic Intelligence & Speech Synthesis</p>
          </div>
        </header>

        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 shadow-xl w-fit">
          <button 
            onClick={() => { stopPlayback(); setActiveTab('tts'); }}
            className={`px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'tts' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
          >
            <Wand2 size={16} /> Text to Speech
          </button>
          <button 
            onClick={() => { stopPlayback(); setActiveTab('podcast'); }}
            className={`px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'podcast' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
          >
            <Podcast size={16} /> Podcast
          </button>
          <button 
            onClick={() => { stopPlayback(); setActiveTab('transcribe'); }}
            className={`px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'transcribe' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
          >
            <Mic size={16} /> Transcribe
          </button>
        </div>

        {/* Content Area */}
        <div className="glass-panel p-10 rounded-[2.5rem] border border-white/5 bg-[#0a0a0a]/40 shadow-2xl space-y-10 min-h-[500px]">
          {activeTab === 'tts' && (
            <div className="space-y-10 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Text Input</label>
                        {cloningStatus === 'cloned' && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full animate-pulse">
                                <UserCheck size={12} className="text-emerald-400" />
                                <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest">Voice Clone Active</span>
                            </div>
                        )}
                    </div>
                    <div className="relative group">
                      <textarea 
                        value={ttsText}
                        onChange={(e) => setTtsText(e.target.value)}
                        placeholder="Enter text to speak..."
                        className="w-full h-96 bg-black/40 border border-white/5 rounded-3xl p-8 text-xl focus:ring-1 focus:ring-white/10 outline-none text-white/80 leading-relaxed resize-none transition-all placeholder:text-white/10"
                      />
                      {ttsText && (
                          <button 
                            onClick={() => setTtsText('')}
                            className="absolute top-4 right-4 p-2 text-white/20 hover:text-white bg-black/20 hover:bg-black/50 rounded-full transition-all"
                          >
                              <X size={16} />
                          </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-8">
                      <div className="space-y-4">
                          <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Voice Selection</label>
                          <div className="flex flex-col gap-3">
                              {voices.map((v) => (
                                  <button
                                      key={v.name}
                                      onClick={() => { setVoiceName(v.name); setCloningStatus('idle'); }}
                                      className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left group ${
                                          voiceName === v.name && cloningStatus !== 'cloned'
                                          ? 'bg-white text-black border-white shadow-lg scale-[1.02]' 
                                          : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                                      }`}
                                  >
                                      <div>
                                          <div className="font-bold text-sm">{v.name}</div>
                                          <div className={`text-[10px] font-medium ${voiceName === v.name && cloningStatus !== 'cloned' ? 'text-black/60' : 'text-white/40'}`}>{v.desc}</div>
                                      </div>
                                      {voiceName === v.name && cloningStatus !== 'cloned' && <Check size={16} className="text-emerald-500" />}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div className="pt-8 border-t border-white/5 space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Voice Cloning</label>
                            <button 
                                onClick={() => setIsCloningMode(!isCloningMode)}
                                className={`p-2 rounded-lg transition-all ${isCloningMode ? 'bg-purple-500 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                            >
                                <Zap size={14} />
                            </button>
                        </div>
                        
                        {isCloningMode && (
                            <div className="space-y-4 animate-slide-up">
                                {!cloneFile ? (
                                    <button 
                                        onClick={() => cloneInputRef.current?.click()}
                                        className="w-full flex flex-col items-center justify-center p-6 border border-dashed border-white/20 rounded-2xl hover:bg-white/5 transition-all gap-2 group"
                                    >
                                        <Upload className="text-white/20 group-hover:text-purple-400" size={24} />
                                        <span className="text-[10px] font-bold text-white/40 group-hover:text-white/60 uppercase tracking-widest">Upload Sample</span>
                                        <input type="file" ref={cloneInputRef} className="hidden" accept="audio/*" onChange={handleCloneUpload} />
                                    </button>
                                ) : (
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                                                <FileAudio size={16} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-bold text-white truncate">{cloneFile.name}</div>
                                                <div className="text-[9px] text-white/30 uppercase tracking-widest">Source Audio</div>
                                            </div>
                                            <button onClick={() => setCloneFile(null)} className="text-white/20 hover:text-white">
                                                <X size={14} />
                                            </button>
                                        </div>

                                        {cloningStatus === 'analyzing' ? (
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[9px] font-bold text-purple-400 uppercase tracking-widest">
                                                    <span>Analyzing Neural Map</span>
                                                    <span>{cloningProgress}%</span>
                                                </div>
                                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-purple-500 transition-all duration-300" style={{ width: `${cloningProgress}%` }} />
                                                </div>
                                            </div>
                                        ) : cloningStatus === 'cloned' ? (
                                            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                                                    <Sparkles size={12} /> Model Synced
                                                </div>
                                                <p className="text-[10px] text-emerald-100/60 leading-tight">
                                                    Analysis: {clonedVoiceMetadata.characteristics}
                                                </p>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={startCloning}
                                                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2"
                                            >
                                                <Waves size={14} /> Analyze & Clone
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                      </div>
                  </div>
              </div>

              <div className="flex flex-col gap-6 pt-4 border-t border-white/5">
                {lastAudio && lastAudio.type === 'tts' && (
                    <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 animate-scale-in">
                        <button 
                            onClick={() => isPlaying ? stopPlayback() : playAudio(lastAudio.base64)}
                            className={`w-14 h-14 flex items-center justify-center rounded-full transition-all shadow-lg ${isPlaying ? 'bg-red-500 text-white' : 'bg-white text-black hover:scale-105'}`}
                        >
                            {isPlaying ? <StopCircle size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                        </button>
                        
                        <div className="flex-1">
                            <div className="flex justify-between text-xs text-white/40 mb-2 font-mono uppercase tracking-widest">
                                <span>Preview</span>
                                <span>{isPlaying ? 'Playing...' : 'Ready'}</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className={`h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300 ${isPlaying ? 'w-full animate-pulse' : 'w-full'}`} style={{ opacity: isPlaying ? 1 : 0.5 }} />
                            </div>
                        </div>

                        <button 
                            onClick={handleDownloadLast}
                            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all border border-white/5"
                            title="Download WAV"
                        >
                            <Download size={20} />
                        </button>
                    </div>
                )}

                <button 
                    onClick={handleTTS}
                    disabled={!ttsText || ttsLoading}
                    className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 text-lg ${
                        !ttsText || ttsLoading 
                        ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:brightness-110 shadow-purple-900/20'
                    }`}
                >
                    {ttsLoading ? <Loader2 className="animate-spin" /> : <Wand2 size={20} />}
                    <span>{ttsLoading ? 'Synthesizing Speech...' : 'Generate New Speech'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'podcast' && (
            <div className="space-y-10 animate-fade-in">
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Source Material</label>
                <textarea 
                  value={podcastTopic}
                  onChange={(e) => setPodcastTopic(e.target.value)}
                  placeholder="Paste article or topic here..."
                  className="w-full h-64 bg-black/40 border border-white/5 rounded-3xl p-8 text-xl focus:ring-1 focus:ring-white/10 outline-none text-white/80 leading-relaxed resize-none transition-all placeholder:text-white/10"
                />
              </div>
              
              <div className="flex flex-col gap-6">
                 {lastAudio && lastAudio.type === 'podcast' && (
                    <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 animate-scale-in">
                        <button 
                            onClick={() => isPlaying ? stopPlayback() : playAudio(lastAudio.base64)}
                            className={`w-14 h-14 flex items-center justify-center rounded-full transition-all shadow-lg ${isPlaying ? 'bg-red-500 text-white' : 'bg-white text-black hover:scale-105'}`}
                        >
                            {isPlaying ? <StopCircle size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                        </button>
                        
                        <div className="flex-1">
                            <div className="flex justify-between text-xs text-white/40 mb-2 font-mono uppercase tracking-widest">
                                <span>Podcast Preview</span>
                                <span>{isPlaying ? 'On Air' : 'Ready'}</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className={`h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300 ${isPlaying ? 'w-full animate-pulse' : 'w-full'}`} style={{ opacity: isPlaying ? 1 : 0.5 }} />
                            </div>
                        </div>

                        <button 
                            onClick={handleDownloadLast}
                            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all border border-white/5"
                            title="Download Podcast"
                        >
                            <Download size={20} />
                        </button>
                    </div>
                )}

                <button 
                  onClick={handleGeneratePodcast}
                  disabled={!podcastTopic || podcastLoading}
                  className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 text-lg ${
                      !podcastTopic || podcastLoading 
                      ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                      : 'bg-white text-black hover:bg-white/90 hover:scale-[1.01]'
                  }`}
                >
                  {podcastLoading ? <Loader2 className="animate-spin" /> : <Podcast size={20} />}
                  <span className="text-lg">{podcastLoading ? podcastStatus : 'Create Podcast'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'transcribe' && (
            <div className="flex flex-col items-center justify-center py-10 space-y-10 animate-fade-in">
              <button 
                onClick={toggleRecording}
                className={`w-40 h-40 rounded-full flex items-center justify-center transition-all relative z-10 border-4 ${isRecording ? 'bg-red-500/10 border-red-500 text-red-500 animate-pulse' : 'bg-white/5 border-white/5 text-white/20 hover:bg-white/10'}`}
              >
                {isRecording ? <StopCircle size={64} fill="currentColor" /> : <Mic size={64} />}
              </button>
              <div className="text-center space-y-2">
                <p className="text-white/60 font-medium tracking-wide uppercase text-xs">{isRecording ? "Listening..." : "Tap to record audio"}</p>
                {transcribeLoading && <Loader2 className="animate-spin text-white/40 mx-auto" size={24} />}
              </div>
              {transcription && (
                <div className="w-full bg-black/40 p-10 rounded-3xl border border-white/5 mt-4 animate-slide-up">
                  <p className="text-xl text-white/80 leading-relaxed font-light">{transcription}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
