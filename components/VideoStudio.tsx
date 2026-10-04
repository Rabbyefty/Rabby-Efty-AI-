
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ensureApiKeySelected } from '../utils/key-selection';
import { Video, FileVideo, Upload, Loader2, Sparkles, Scissors, Wand2, Undo, Redo, Download, Film, Aperture, X, Sun, Contrast, Droplets, ChevronDown, Volume2, VolumeX, Zap, Crown, Maximize2, Palette, Gauge, Image as ImageIcon } from 'lucide-react';

type Mode = 'generate' | 'analyze' | 'edit' | 'enhance';

export const VideoStudio: React.FC = () => {
  const [mode, setMode] = useState<Mode>('generate');
  
  // Generation State
  const [prompt, setPrompt] = useState('A futuristic cityscape at sunset with flying vehicles');
  const [genLoading, setGenLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [startImage, setStartImage] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [veoResolution, setVeoResolution] = useState<'720p' | '1080p'>('1080p');
  const [veoModel, setVeoModel] = useState<'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview'>('veo-3.1-fast-generate-preview');
  const [genStatus, setGenStatus] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);

  // Analysis State
  const [analyzeFile, setAnalyzeFile] = useState<File | null>(null);
  const [analyzePreviewUrl, setAnalyzePreviewUrl] = useState<string | null>(null);
  const [analyzeResult, setAnalyzeResult] = useState('');
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzePrompt, setAnalyzePrompt] = useState('Analyze this video. Describe the key events, visual style, and any detected text or dialogue in detail.');

  // Editor State
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editSrc, setEditSrc] = useState<string | null>(null);
  const [filter, setFilter] = useState('none');
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [duration, setDuration] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  
  // Enhance State
  const [enhanceFile, setEnhanceFile] = useState<File | null>(null);
  const [enhanceSrc, setEnhanceSrc] = useState<string | null>(null);
  const [enhancePrompt, setEnhancePrompt] = useState('');
  const [isEnhanceProcessing, setIsEnhanceProcessing] = useState(false);
  const [enhanceStatus, setEnhanceStatus] = useState('');
  const [activeFilters, setActiveFilters] = useState<any>({});
  const enhanceVideoRef = useRef<HTMLVideoElement>(null);
  
  // Export State
  const [exportFormat, setExportFormat] = useState<'mp4' | 'webm'>('mp4');
  const [isExporting, setIsExporting] = useState(false);
  
  // Undo/Redo State
  const [history, setHistory] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);

  // --- Helpers ---
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const captureVideoFrame = (video: HTMLVideoElement): string | null => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${m}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  // --- Handlers ---

  const handleEnhancePrompt = async () => {
    if (!prompt) return;
    setIsEnhancing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ text: `Rewrite this video prompt to be more descriptive, cinematic, and detailed for an AI video generator (Veo). Keep it under 60 words. Prompt: "${prompt}"` }] }
      });
      if (response.text) setPrompt(response.text.trim());
    } catch (e) {
      console.error(e);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt && !startImage) return;
    
    const hasKey = await ensureApiKeySelected();
    if (!hasKey) return;

    setGenLoading(true);
    setGenStatus('Initializing Veo Model...');
    setGeneratedVideoUrl(null);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        let operation;
        
        if (startImage) {
             const mimeType = startImage.split(';')[0].split(':')[1] || 'image/png';
             operation = await ai.models.generateVideos({
                model: veoModel,
                prompt: prompt,
                image: {
                    imageBytes: startImage.split(',')[1],
                    mimeType: mimeType
                },
                config: {
                    numberOfVideos: 1,
                    resolution: veoResolution,
                    aspectRatio: aspectRatio
                }
            });
        } else {
            operation = await ai.models.generateVideos({
                model: veoModel,
                prompt: prompt,
                config: {
                    numberOfVideos: 1,
                    resolution: veoResolution,
                    aspectRatio: aspectRatio
                }
            });
        }

        setGenStatus('Dreaming (this takes ~1-2 mins)...');

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            try {
                operation = await ai.operations.getVideosOperation({ operation: operation });
                setGenStatus('Rendering frames...');
            } catch (pollError) {
                 console.warn("Polling error (retrying):", pollError);
            }
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (videoUri) {
            setGenStatus('Finalizing download...');
            const vidRes = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
            if (!vidRes.ok) throw new Error(`Failed to fetch video: ${vidRes.statusText}`);
            const blob = await vidRes.blob();
            const url = URL.createObjectURL(blob);
            setGeneratedVideoUrl(url);
        } else {
            throw new Error("Video generation completed but returned no result URI.");
        }

    } catch (e: any) {
        console.error("Video Gen Error", e);
        let msg = e.message || "Unknown error";
        if (JSON.stringify(e).includes('403') || msg.includes('403') || msg.includes('PERMISSION_DENIED')) {
             msg = "Permission Denied. Veo requires a paid API key from a billing-enabled Google Cloud Project.";
        }
        alert(`Generation Failed: ${msg}`);
    } finally {
        setGenLoading(false);
        setGenStatus('');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = () => setStartImage(reader.result as string);
          reader.readAsDataURL(file);
      }
  };

  const handleAnalyzeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 20 * 1024 * 1024) {
              alert("File too large. Please select a video under 20MB for analysis.");
              return;
          }
          setAnalyzeFile(file);
          const url = URL.createObjectURL(file);
          setAnalyzePreviewUrl(url);
          setAnalyzeResult('');
      }
  };

  useEffect(() => {
      return () => {
          if (analyzePreviewUrl) URL.revokeObjectURL(analyzePreviewUrl);
      };
  }, [analyzePreviewUrl]);

  const handleAnalyze = async () => {
      if (!analyzeFile) return;
      setAnalyzeLoading(true);
      setAnalyzeResult('');
      
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const base64 = await fileToBase64(analyzeFile);
          
          const response = await ai.models.generateContent({
              model: 'gemini-3-pro-preview',
              contents: {
                  parts: [
                      { inlineData: { mimeType: analyzeFile.type, data: base64 } },
                      { text: analyzePrompt }
                  ]
              }
          });
          
          setAnalyzeResult(response.text || "No analysis generated.");
      } catch (e) {
          console.error(e);
          setAnalyzeResult("Analysis failed. The video might be too large or the API key is invalid.");
      } finally {
          setAnalyzeLoading(false);
      }
  };

  const handleEnhanceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setEnhanceFile(file);
          setEnhanceSrc(URL.createObjectURL(file));
          setActiveFilters({});
      }
  };

  const applyAiFilter = async (type: 'auto' | 'prompt') => {
      if (!enhanceVideoRef.current || !enhanceSrc) return;
      
      setIsEnhanceProcessing(true);
      setEnhanceStatus('Analyzing frame composition...');
      
      try {
          const frameBase64 = captureVideoFrame(enhanceVideoRef.current);
          if (!frameBase64) throw new Error("Could not capture frame");

          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          
          let prompt = "";
          if (type === 'auto') {
              prompt = `Analyze this video frame. I want to color grade it to look professional, cinematic, and high-quality. Return a JSON object with specific CSS filter values. Example: {"brightness": 105, "contrast": 110, "saturate": 120, "sepia": 0, "hueRotate": 0, "blur": 0}`;
          } else {
              prompt = `Analyze this video frame. I want to apply a stylistic filter matching: "${enhancePrompt}". Return a JSON object with CSS filter values.`;
          }

          setEnhanceStatus('Gemini is crafting the look...');

          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash-image',
              contents: {
                  parts: [
                      { inlineData: { mimeType: 'image/jpeg', data: frameBase64 } },
                      { text: prompt }
                  ]
              }
          });

          const text = response.text?.replace(/```json/g, '').replace(/```/g, '').trim();
          if (text) {
              try {
                  const filters = JSON.parse(text);
                  setActiveFilters(filters);
                  setEnhanceStatus('Filters Applied.');
              } catch (e) {
                  console.error("JSON Parse Error", e);
                  setEnhanceStatus('Failed to parse AI response.');
              }
          }

      } catch (e) {
          console.error(e);
          setEnhanceStatus('Optimization failed.');
      } finally {
          setIsEnhanceProcessing(false);
          setTimeout(() => setEnhanceStatus(''), 2000);
      }
  };

  const handleSimulatedUpscale = async () => {
      setIsEnhanceProcessing(true);
      const steps = ["Super-resolution inference...", "Denoising frames...", "Sharpening details...", "Re-encoding stream at 4K..."];
      for (const step of steps) {
          setEnhanceStatus(step);
          await new Promise(r => setTimeout(r, 1200));
      }
      setEnhanceStatus('Upscale Complete (Simulated)');
      setIsEnhanceProcessing(false);
      setTimeout(() => setEnhanceStatus(''), 2000);
  };

  const handleEditFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setEditFile(file);
          setEditSrc(URL.createObjectURL(file));
          setDuration(0);
          setHistory([{ filter: 'none', trimStart: 0, trimEnd: 0, brightness: 100, contrast: 100, saturation: 100, volume: 1, isMuted: false }]);
          setCurrentStep(0);
          setFilter('none');
          setTrimStart(0);
          setTrimEnd(0);
          setBrightness(100);
          setContrast(100);
          setSaturation(100);
          setVolume(1);
          setIsMuted(false);
      }
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const dur = e.currentTarget.duration;
      setDuration(dur);
      setTrimEnd(dur);
  };

  const addToHistory = (newState: any) => {
      const newHistory = history.slice(0, currentStep + 1);
      newHistory.push(newState);
      setHistory(newHistory);
      setCurrentStep(newHistory.length - 1);
  };

  const applyFilter = (f: string) => {
      setFilter(f);
      addToHistory({ filter: f, trimStart, trimEnd, brightness, contrast, saturation, volume, isMuted });
  };
  
  const handleAdjustmentChange = (type: 'brightness' | 'contrast' | 'saturation', val: number) => {
      if (type === 'brightness') setBrightness(val);
      if (type === 'contrast') setContrast(val);
      if (type === 'saturation') setSaturation(val);
  };

  const handleAdjustmentCommit = () => {
      addToHistory({ filter, trimStart, trimEnd, brightness, contrast, saturation, volume, isMuted });
  };

  const handleVolumeChange = (val: number) => {
      setVolume(val);
      if (videoRef) videoRef.volume = val;
  };

  const handleVolumeCommit = () => {
      addToHistory({ filter, trimStart, trimEnd, brightness, contrast, saturation, volume, isMuted });
  };

  const toggleMute = () => {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      if (videoRef) videoRef.muted = newMuted;
      addToHistory({ filter, trimStart, trimEnd, brightness, contrast, saturation, volume, isMuted: newMuted });
  };

  const handleUndo = () => {
      if (currentStep > 0) {
          const prev = history[currentStep - 1];
          setFilter(prev.filter);
          setTrimStart(prev.trimStart);
          setTrimEnd(prev.trimEnd);
          setBrightness(prev.brightness);
          setContrast(prev.contrast);
          setSaturation(prev.saturation);
          setVolume(prev.volume);
          setIsMuted(prev.isMuted);
          if (videoRef) {
              videoRef.volume = prev.volume;
              videoRef.muted = prev.isMuted;
          }
          setCurrentStep(currentStep - 1);
      }
  };

  const handleRedo = () => {
      if (currentStep < history.length - 1) {
          const next = history[currentStep + 1];
          setFilter(next.filter);
          setTrimStart(next.trimStart);
          setTrimEnd(next.trimEnd);
          setBrightness(next.brightness);
          setContrast(next.contrast);
          setSaturation(next.saturation);
          setVolume(next.volume);
          setIsMuted(next.isMuted);
          if (videoRef) {
              videoRef.volume = next.volume;
              videoRef.muted = next.isMuted;
          }
          setCurrentStep(currentStep + 1);
      }
  };

  const handleExport = async () => {
    if (!editSrc) return;
    setIsExporting(true);
    await new Promise(r => setTimeout(r, 1500));
    const a = document.createElement('a');
    a.href = editSrc; 
    a.download = `gemini_edit_${Date.now()}.${exportFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setIsExporting(false);
  };

  const getEnhanceFilterString = () => {
      const { brightness, contrast, saturate, sepia, hueRotate, blur, grayscale, invert } = activeFilters;
      return [
          brightness && `brightness(${brightness}%)`,
          contrast && `contrast(${contrast}%)`,
          saturate && `saturate(${saturate}%)`,
          sepia && `sepia(${sepia})`,
          hueRotate && `hue-rotate(${hueRotate}deg)`,
          blur && `blur(${blur}px)`,
          grayscale && `grayscale(${grayscale}%)`,
          invert && `invert(${invert}%)`
      ].filter(Boolean).join(' ');
  };

  return (
    <div className="h-full w-full overflow-y-auto p-6 lg:p-10 pb-32">
      <div className="max-w-7xl mx-auto space-y-10 animate-fade-in">
        
        <header className="flex items-center gap-6 pb-6 border-b border-white/5">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-xl animate-scale-in">
                 <Video className="w-8 h-8 text-cyan-200" />
            </div>
            <div>
                <h1 className="text-4xl font-semibold text-white tracking-tight">Video Studio</h1>
                <p className="text-white/40 mt-1 font-medium">Veo Generation & Deep Analysis</p>
            </div>
        </header>

        <div className="flex gap-2 p-1.5 bg-black/30 backdrop-blur-xl border border-white/5 rounded-2xl w-fit sticky top-0 z-20 shadow-lg">
            <button onClick={() => setMode('generate')} className={`px-6 py-2.5 rounded-xl font-medium transition-all text-xs flex items-center gap-2 ${mode === 'generate' ? 'bg-white/10 text-white shadow-lg border border-white/10' : 'text-white/40 hover:text-white'}`}>
                <Sparkles size={14}/> Create
            </button>
            <button onClick={() => setMode('enhance')} className={`px-6 py-2.5 rounded-xl font-medium transition-all text-xs flex items-center gap-2 ${mode === 'enhance' ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-200 border border-purple-500/30' : 'text-white/40 hover:text-white'}`}>
                <Wand2 size={14}/> Upscale
            </button>
            <button onClick={() => setMode('analyze')} className={`px-6 py-2.5 rounded-xl font-medium transition-all text-xs flex items-center gap-2 ${mode === 'analyze' ? 'bg-white/10 text-white shadow-lg border border-white/10' : 'text-white/40 hover:text-white'}`}>
                <Aperture size={14}/> Analyze
            </button>
            <button onClick={() => setMode('edit')} className={`px-6 py-2.5 rounded-xl font-medium transition-all text-xs flex items-center gap-2 ${mode === 'edit' ? 'bg-white/10 text-white shadow-lg border border-white/10' : 'text-white/40 hover:text-white'}`}>
                <Scissors size={14}/> Editor
            </button>
        </div>

        {mode === 'generate' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slide-up">
                <div className="space-y-6 glass-panel p-8 rounded-[2rem]">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Video Prompt</label>
                            <button 
                                onClick={handleEnhancePrompt} 
                                disabled={!prompt || isEnhancing}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-wider hover:bg-cyan-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isEnhancing ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                                Enhance with AI
                            </button>
                        </div>
                        <div className="relative">
                            <textarea 
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="w-full h-36 glass-input rounded-2xl p-4 text-sm focus:ring-1 focus:ring-cyan-500/50 outline-none resize-none placeholder:text-white/20 leading-relaxed"
                                placeholder="A cinematic drone shot of a cyberpunk city..."
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                         <div className="flex justify-between items-center">
                             <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Source Image (Image-to-Video)</label>
                             {startImage && (
                                 <button onClick={() => setStartImage(null)} className="text-[10px] text-red-400 hover:text-red-300">Remove</button>
                             )}
                         </div>
                         
                         {!startImage ? (
                             <label 
                                 onDragEnter={() => setIsDragActive(true)}
                                 onDragLeave={() => setIsDragActive(false)}
                                 onDragOver={(e) => e.preventDefault()}
                                 onDrop={(e) => {
                                     e.preventDefault();
                                     setIsDragActive(false);
                                     if (e.dataTransfer.files[0]) {
                                         const reader = new FileReader();
                                         reader.onload = () => setStartImage(reader.result as string);
                                         reader.readAsDataURL(e.dataTransfer.files[0]);
                                     }
                                 }}
                                 className={`flex flex-col items-center justify-center h-40 border border-dashed rounded-2xl cursor-pointer transition-all ${
                                     isDragActive 
                                     ? 'border-cyan-500 bg-cyan-500/10 scale-[1.02]' 
                                     : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                                 }`}
                             >
                                 <div className="flex flex-col items-center gap-3 text-white/40 group-hover:text-white/60 transition-colors">
                                     <div className="p-3 bg-white/5 rounded-full">
                                         <ImageIcon size={24} />
                                     </div>
                                     <span className="text-xs font-medium">Drag & drop or click to upload</span>
                                 </div>
                                 <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                             </label>
                         ) : (
                             <div className="relative h-48 w-full rounded-2xl overflow-hidden border border-white/10 group animate-scale-in">
                                 <img src={startImage} className="w-full h-full object-cover" />
                                 <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                     <div className="text-center">
                                         <p className="text-xs font-bold text-white mb-2">Ready for Generation</p>
                                         <button onClick={() => setStartImage(null)} className="px-3 py-1.5 bg-red-500/20 text-red-300 rounded-lg text-[10px] border border-red-500/30 hover:bg-red-500/40 transition-colors">Change Image</button>
                                     </div>
                                 </div>
                             </div>
                         )}
                    </div>

                    <div className="space-y-4">
                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Model & Quality</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setVeoModel('veo-3.1-fast-generate-preview')}
                                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all text-left ${
                                    veoModel === 'veo-3.1-fast-generate-preview' 
                                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200' 
                                    : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Zap size={16} />
                                    <span className="text-sm font-bold">Veo Fast</span>
                                </div>
                                <span className="text-[10px] opacity-60">Low Latency</span>
                            </button>
                            
                            <button
                                onClick={() => setVeoModel('veo-3.1-generate-preview')}
                                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all text-left ${
                                    veoModel === 'veo-3.1-generate-preview' 
                                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-200' 
                                    : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Crown size={16} />
                                    <span className="text-sm font-bold">Veo Pro</span>
                                </div>
                                <span className="text-[10px] opacity-60">High Fidelity (1080p)</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                             <label className="text-[10px] font-bold text-white/40 uppercase">Aspect Ratio</label>
                             <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as any)} className="w-full glass-input rounded-xl p-2 text-sm outline-none">
                                 <option value="16:9">16:9 (Landscape)</option>
                                 <option value="9:16">9:16 (Portrait)</option>
                             </select>
                        </div>
                        <div className="space-y-2">
                             <label className="text-[10px] font-bold text-white/40 uppercase">Resolution</label>
                             <select 
                                value={veoResolution} 
                                onChange={(e) => setVeoResolution(e.target.value as '720p' | '1080p')} 
                                className={`w-full glass-input rounded-xl p-2 text-sm outline-none`}
                             >
                                 <option value="1080p">1080p HD</option>
                                 <option value="720p">720p</option>
                             </select>
                             {startImage && veoResolution === '1080p' && <p className="text-[9px] text-yellow-400/60 flex items-center gap-1"><Sparkles size={8}/> Upscaling enabled</p>}
                        </div>
                    </div>

                    <button 
                        onClick={handleGenerate}
                        disabled={genLoading || (!prompt && !startImage)}
                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${genLoading || (!prompt && !startImage) ? 'bg-white/5 cursor-wait' : 'bg-white text-black hover:bg-white/90'}`}
                    >
                        {genLoading ? <Loader2 className="animate-spin" /> : <Film size={18} />}
                        {genLoading ? genStatus : 'Generate Video'}
                    </button>
                    <p className="text-[10px] text-center text-white/30">Powered by Veo 3.1. Requires Billing-Enabled API Key.</p>
                </div>

                <div className="glass-panel rounded-[2rem] border border-white/10 bg-black/40 flex items-center justify-center min-h-[400px] relative overflow-hidden">
                    {generatedVideoUrl ? (
                        <div className="relative w-full h-full flex items-center justify-center bg-black">
                            <video src={generatedVideoUrl} controls autoPlay loop className="max-w-full max-h-full rounded-lg shadow-2xl" />
                            <a href={generatedVideoUrl} download="gemini-veo.mp4" className="absolute bottom-6 right-6 p-3 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-md transition-all">
                                <Download size={20} />
                            </a>
                        </div>
                    ) : (
                        <div className="text-center text-white/20">
                            {genLoading ? (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-cyan-400 animate-spin" />
                                    <p className="text-sm font-mono animate-pulse">{genStatus}</p>
                                </div>
                            ) : (
                                <>
                                    <Video className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                    <p className="text-sm font-medium">Veo Output Preview</p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        )}

        {mode === 'enhance' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slide-up">
                <div className="space-y-6 glass-panel p-8 rounded-[2rem]">
                    <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border border-white/10 mb-6">
                        <div className="flex items-center gap-3 overflow-hidden">
                             <div className="p-2 bg-white/10 rounded-lg">
                                 <Sparkles size={16} className="text-purple-400" />
                             </div>
                             <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-white truncate max-w-[200px]">
                                    {enhanceFile ? enhanceFile.name : 'Upload Source Video'}
                                </span>
                                <span className="text-[10px] text-white/40">
                                    {enhanceFile ? `${(enhanceFile.size / (1024*1024)).toFixed(1)}MB` : 'Select video to enhance'}
                                </span>
                             </div>
                        </div>
                        <label className="px-4 py-2 bg-white text-black text-xs font-bold rounded-xl hover:bg-white/90 cursor-pointer transition-all active:scale-95">
                            Choose File
                            <input 
                                type="file" 
                                accept="video/*" 
                                onChange={handleEnhanceFileChange}
                                className="hidden"
                            />
                        </label>
                    </div>

                    <div className="space-y-4">
                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Upscale Engine</label>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => applyAiFilter('auto')}
                                disabled={isEnhanceProcessing || !enhanceSrc}
                                className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border transition-all ${
                                    isEnhanceProcessing ? 'opacity-50 cursor-wait' : 'hover:scale-[1.02] active:scale-95'
                                } bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-white/10 hover:border-purple-500/30`}
                            >
                                <Wand2 size={24} className="text-purple-300" />
                                <div className="text-center">
                                    <div className="font-bold text-sm text-white">Auto Grade</div>
                                    <div className="text-[10px] text-white/40 mt-1">Cinematic Correction</div>
                                </div>
                            </button>

                            <button
                                onClick={handleSimulatedUpscale}
                                disabled={isEnhanceProcessing || !enhanceSrc}
                                className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border transition-all ${
                                    isEnhanceProcessing ? 'opacity-50 cursor-wait' : 'hover:scale-[1.02] active:scale-95'
                                } bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-white/10 hover:border-emerald-500/30`}
                            >
                                <Maximize2 size={24} className="text-emerald-300" />
                                <div className="text-center">
                                    <div className="font-bold text-sm text-white">4K Super Res</div>
                                    <div className="text-[10px] text-white/40 mt-1">Grok-Style Upscale</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Prompt-to-Filter</label>
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                value={enhancePrompt}
                                onChange={(e) => setEnhancePrompt(e.target.value)}
                                placeholder="e.g., 'The Matrix', '1950s Vintage', 'Cyberpunk'"
                                className="flex-1 glass-input rounded-xl p-3 text-sm text-white focus:ring-1 focus:ring-purple-500/50 outline-none"
                            />
                            <button 
                                onClick={() => applyAiFilter('prompt')}
                                disabled={isEnhanceProcessing || !enhanceSrc || !enhancePrompt}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50"
                            >
                                <Palette size={18} />
                            </button>
                        </div>
                        <p className="text-[10px] text-white/30">Gemini analyzes your prompt and generates complex CSS filter combinations.</p>
                    </div>
                </div>

                <div className="glass-panel rounded-[2rem] border border-white/10 bg-black/40 flex items-center justify-center min-h-[400px] relative overflow-hidden">
                    {enhanceSrc ? (
                        <div className="relative w-full h-full flex items-center justify-center bg-black group">
                            <video 
                                ref={enhanceVideoRef}
                                src={enhanceSrc} 
                                controls 
                                autoPlay 
                                loop 
                                className="max-w-full max-h-full rounded-lg shadow-2xl transition-all duration-700"
                                style={{ filter: getEnhanceFilterString() }}
                            />
                            
                            {Object.keys(activeFilters).length > 0 && (
                                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-mono text-emerald-400">
                                    AI FILTERS ACTIVE
                                </div>
                            )}

                            {isEnhanceProcessing && (
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 animate-fade-in">
                                    <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-purple-500 animate-spin mb-4" />
                                    <p className="text-sm font-bold text-white animate-pulse">{enhanceStatus}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-white/20">
                            <Wand2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p className="text-sm font-medium">Ready to Upscale</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {mode === 'analyze' && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slide-up">
                 <div className="space-y-6 glass-panel p-8 rounded-[2rem]">
                     <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border border-white/10 mb-6">
                        <div className="flex items-center gap-3 overflow-hidden">
                             <div className="p-2 bg-white/10 rounded-lg">
                                 <FileVideo size={16} />
                             </div>
                             <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-white truncate max-w-[200px]">
                                    {analyzeFile ? analyzeFile.name : 'No file selected'}
                                </span>
                                <span className="text-[10px] text-white/40">
                                    {analyzeFile ? `${(analyzeFile.size / (1024*1024)).toFixed(1)}MB` : 'Select a video'}
                                </span>
                             </div>
                        </div>
                        <label className="px-4 py-2 bg-white text-black text-xs font-bold rounded-xl hover:bg-white/90 cursor-pointer transition-all active:scale-95">
                            Choose File
                            <input 
                                type="file" 
                                accept="video/*" 
                                onChange={handleAnalyzeFileChange}
                                className="hidden"
                            />
                        </label>
                     </div>

                     <div className="space-y-4">
                         <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Question / Prompt</label>
                         <textarea 
                            value={analyzePrompt}
                            onChange={(e) => setAnalyzePrompt(e.target.value)}
                            className="w-full h-32 glass-input rounded-xl p-4 text-sm focus:ring-1 focus:ring-cyan-500/50 outline-none resize-none placeholder:text-white/20"
                         />
                     </div>
                     <button 
                        onClick={handleAnalyze}
                        disabled={analyzeLoading || !analyzeFile}
                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${analyzeLoading ? 'bg-white/5 cursor-wait' : 'bg-cyan-600 text-white hover:bg-cyan-500'}`}
                     >
                        {analyzeLoading ? <Loader2 className="animate-spin" /> : <Aperture size={18} />}
                        Analyze Content
                     </button>
                 </div>
                 <div className="glass-panel p-8 rounded-[2rem] bg-black/40 min-h-[400px] border border-white/10 overflow-y-auto relative">
                     {analyzePreviewUrl && !analyzeResult && (
                         <div className="absolute inset-0 bg-black/80 z-10 flex items-center justify-center">
                             <video src={analyzePreviewUrl} className="w-full h-full object-contain opacity-50" autoPlay loop muted />
                         </div>
                     )}
                     
                     {analyzeResult ? (
                         <div className="prose prose-invert prose-sm relative z-20">
                             <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                                 <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-400">
                                     <Sparkles size={18} />
                                 </div>
                                 <h3 className="text-lg font-bold text-white">Analysis Report</h3>
                             </div>
                             <p className="leading-relaxed text-white/80 whitespace-pre-wrap">{analyzeResult}</p>
                         </div>
                     ) : (
                         <div className="h-full flex flex-col items-center justify-center text-white/20 relative z-20">
                             {analyzeLoading ? (
                                 <div className="flex flex-col items-center gap-4">
                                     <Loader2 className="w-12 h-12 animate-spin text-cyan-500" />
                                     <p className="animate-pulse font-medium">Analyzing frames...</p>
                                 </div>
                             ) : (
                                 <>
                                     <FileVideo className="w-16 h-16 mb-4 opacity-20" />
                                     <p className="text-sm">Upload a video to begin analysis</p>
                                 </>
                             )}
                         </div>
                     )}
                 </div>
             </div>
        )}

        {mode === 'edit' && (
            <div className="space-y-8 animate-slide-up">
                <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border border-white/10">
                    <input type="file" accept="video/*" onChange={handleEditFileUpload} className="text-sm text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20" />
                    <div className="flex gap-2">
                        <button onClick={handleUndo} disabled={currentStep <= 0} className="p-2 bg-white/5 rounded-lg text-white/60 disabled:opacity-30 hover:text-white hover:bg-white/10 transition-all"><Undo size={18} /></button>
                        <button onClick={handleRedo} disabled={currentStep >= history.length - 1} className="p-2 bg-white/5 rounded-lg text-white/60 disabled:opacity-30 hover:text-white hover:bg-white/10 transition-all"><Redo size={18} /></button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                     <div className="lg:col-span-2 glass-panel rounded-[2rem] overflow-hidden bg-black relative border border-white/10 min-h-[400px]">
                         {editSrc ? (
                             <video 
                                src={editSrc} 
                                ref={(el) => setVideoRef(el)}
                                onLoadedMetadata={handleLoadedMetadata}
                                className="w-full h-full object-contain" 
                                controls 
                                volume={volume}
                                muted={isMuted}
                                style={{ filter: `${filter !== 'none' ? filter : ''} brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)` }}
                             />
                         ) : (
                             <div className="w-full h-full flex items-center justify-center text-white/20">
                                 <Film className="w-16 h-16 opacity-20" />
                             </div>
                         )}
                     </div>

                     <div className="space-y-6 glass-panel p-6 rounded-[2rem] h-fit">
                         <div>
                             <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 block">Filters</label>
                             <div className="grid grid-cols-3 gap-2">
                                 {['none', 'grayscale(1)', 'sepia(1)', 'invert(1)', 'blur(4px)', 'contrast(2)'].map(f => (
                                     <button 
                                        key={f}
                                        onClick={() => applyFilter(f)}
                                        className={`p-2 rounded-lg text-xs font-medium border transition-all ${filter === f ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' : 'bg-white/5 border-white/5 text-white/40 hover:text-white'}`}
                                     >
                                         {f === 'none' ? 'Normal' : f.split('(')[0]}
                                     </button>
                                 ))}
                             </div>
                         </div>

                         <div>
                             <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 block">Audio</label>
                             <div className="space-y-4">
                                <div className="space-y-2">
                                     <div className="flex justify-between text-[10px] text-white/60">
                                         <span className="flex items-center gap-1">
                                            {isMuted ? <VolumeX size={10} /> : <Volume2 size={10} />} 
                                            Volume
                                         </span>
                                         <span>{isMuted ? 'Muted' : `${Math.round(volume * 100)}%`}</span>
                                     </div>
                                     <div className="flex items-center gap-3">
                                         <button 
                                            onClick={toggleMute}
                                            className={`p-2 rounded-lg border transition-all ${isMuted ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'}`}
                                         >
                                             {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                                         </button>
                                         <input 
                                            type="range" min="0" max="1" step="0.01" value={volume} 
                                            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                                            onMouseUp={handleVolumeCommit}
                                            onTouchEnd={handleVolumeCommit}
                                            disabled={isMuted}
                                            className={`flex-1 accent-cyan-500 h-1 bg-white/10 rounded-full ${isMuted ? 'opacity-50 cursor-not-allowed' : ''}`}
                                         />
                                     </div>
                                 </div>
                             </div>
                         </div>

                         <div>
                             <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 block">Adjustments</label>
                             <div className="space-y-4">
                                 <div className="space-y-2">
                                     <div className="flex justify-between text-[10px] text-white/60">
                                         <span className="flex items-center gap-1"><Sun size={10} /> Brightness</span>
                                         <span>{brightness}%</span>
                                     </div>
                                     <input 
                                        type="range" min="0" max="200" value={brightness} 
                                        onChange={(e) => handleAdjustmentChange('brightness', parseInt(e.target.value))}
                                        onMouseUp={handleAdjustmentCommit}
                                        onTouchEnd={handleAdjustmentCommit}
                                        className="w-full accent-cyan-500 h-1 bg-white/10 rounded-full"
                                     />
                                 </div>
                                 <div className="space-y-2">
                                     <div className="flex justify-between text-[10px] text-white/60">
                                         <span className="flex items-center gap-1"><Contrast size={10} /> Contrast</span>
                                         <span>{contrast}%</span>
                                     </div>
                                     <input 
                                        type="range" min="0" max="200" value={contrast} 
                                        onChange={(e) => handleAdjustmentChange('contrast', parseInt(e.target.value))}
                                        onMouseUp={handleAdjustmentCommit}
                                        onTouchEnd={handleAdjustmentCommit}
                                        className="w-full accent-cyan-500 h-1 bg-white/10 rounded-full"
                                     />
                                 </div>
                                 <div className="space-y-2">
                                     <div className="flex justify-between text-[10px] text-white/60">
                                         <span className="flex items-center gap-1"><Droplets size={10} /> Saturation</span>
                                         <span>{saturation}%</span>
                                     </div>
                                     <input 
                                        type="range" min="0" max="200" value={saturation} 
                                        onChange={(e) => handleAdjustmentChange('saturation', parseInt(e.target.value))}
                                        onMouseUp={handleAdjustmentCommit}
                                        onTouchEnd={handleAdjustmentCommit}
                                        className="w-full accent-cyan-500 h-1 bg-white/10 rounded-full"
                                     />
                                 </div>
                             </div>
                         </div>
                         
                         <div>
                             <div className="flex justify-between items-center mb-3">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Precision Trim</label>
                                <span className="text-[10px] font-mono text-cyan-400">{formatTime(trimStart)} - {formatTime(trimEnd)}</span>
                             </div>

                             <div className="relative h-2 bg-white/10 rounded-full mb-6 mx-1">
                                <div 
                                    className="absolute h-full bg-cyan-500/30 rounded-full" 
                                    style={{ 
                                        left: `${(trimStart / (duration || 1)) * 100}%`, 
                                        right: `${100 - (trimEnd / (duration || 1)) * 100}%` 
                                    }}
                                />
                             </div>
                             
                             <div className="space-y-4">
                                 <div className="space-y-2">
                                     <div className="flex justify-between text-[10px] text-white/60">
                                         <span>Start</span>
                                         <span>{formatTime(trimStart)}</span>
                                     </div>
                                     <div className="flex gap-3">
                                         <input 
                                            type="range" 
                                            min="0" 
                                            max={duration} 
                                            step="0.01"
                                            value={trimStart} 
                                            onChange={(e) => {
                                                const v = parseFloat(e.target.value);
                                                if (v < trimEnd) setTrimStart(v);
                                            }} 
                                            className="flex-1 accent-cyan-500 h-1 bg-white/10 rounded-full" 
                                         />
                                         <input 
                                            type="number" 
                                            min="0"
                                            max={trimEnd}
                                            step="0.1"
                                            value={trimStart}
                                            onChange={(e) => {
                                                const v = parseFloat(e.target.value);
                                                if (v >= 0 && v < trimEnd) setTrimStart(v);
                                            }}
                                            className="w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-center outline-none focus:border-cyan-500/50"
                                         />
                                     </div>
                                 </div>

                                 <div className="space-y-2">
                                     <div className="flex justify-between text-[10px] text-white/60">
                                         <span>End</span>
                                         <span>{formatTime(trimEnd)}</span>
                                     </div>
                                     <div className="flex gap-3">
                                         <input 
                                            type="range" 
                                            min="0" 
                                            max={duration} 
                                            step="0.01"
                                            value={trimEnd} 
                                            onChange={(e) => {
                                                const v = parseFloat(e.target.value);
                                                if (v > trimStart) setTrimEnd(v);
                                            }} 
                                            className="flex-1 accent-cyan-500 h-1 bg-white/10 rounded-full" 
                                         />
                                         <input 
                                            type="number" 
                                            min={trimStart}
                                            max={duration}
                                            step="0.1"
                                            value={trimEnd}
                                            onChange={(e) => {
                                                const v = parseFloat(e.target.value);
                                                if (v > trimStart && v <= duration) setTrimEnd(v);
                                            }}
                                            className="w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-center outline-none focus:border-cyan-500/50"
                                         />
                                     </div>
                                 </div>
                             </div>
                         </div>

                         <div className="pt-4 border-t border-white/5 space-y-3">
                            <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Export Format</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <select 
                                        value={exportFormat}
                                        onChange={(e) => setExportFormat(e.target.value as any)}
                                        className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-cyan-500/50"
                                    >
                                        <option value="mp4">MP4 (H.264)</option>
                                        <option value="webm">WEBM (VP9)</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <ChevronDown size={12} className="text-white/40" />
                                    </div>
                                </div>
                                <button 
                                    onClick={handleExport}
                                    disabled={isExporting}
                                    className="flex-[2] py-3 bg-white text-black font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-white/90 disabled:opacity-50"
                                >
                                    {isExporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                                    {isExporting ? 'Exporting...' : 'Export'}
                                </button>
                            </div>
                        </div>
                     </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};
