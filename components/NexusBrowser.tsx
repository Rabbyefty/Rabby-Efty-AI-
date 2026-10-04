
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { 
  Globe, 
  Search, 
  Shield, 
  Lock, 
  Unlock, 
  Zap, 
  Server, 
  Eye, 
  Wifi, 
  Loader2, 
  AlertTriangle, 
  CheckCircle,
  Terminal,
  Cpu,
  LayoutGrid,
  ArrowRight,
  Download,
  Play,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Maximize,
  LayoutTemplate,
  ExternalLink,
  Video,
  FileText
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface NexusBrowserProps {
    goHome: () => void;
}

export const NexusBrowser: React.FC<NexusBrowserProps> = ({ goHome }) => {
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState<'unlock' | 'analyze' | 'download' | 'browser'>('unlock');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [vpnActive, setVpnActive] = useState(true);
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [iframeLoading, setIframeLoading] = useState(false);
  const [internalBrowse, setInternalBrowse] = useState(false);
  const [internalContent, setInternalContent] = useState<string | null>(null);
  const iframeContainerRef = useRef<HTMLDivElement>(null);

  // Browser History State
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const quickTargets = [
    { name: 'Cobalt (Universal DL)', url: 'cobalt.tools', icon: 'C', type: 'tool' },
    { name: 'SaveFrom.net', url: 'en.savefrom.net', icon: 'S', type: 'tool' },
    { name: 'Pornhub Premium', url: 'pornhubpremium.com', icon: 'P', type: 'site' },
    { name: 'OnlyFans VIP', url: 'onlyfans.com', icon: 'O', type: 'site' },
    { name: 'Brazzers', url: 'brazzers.com', icon: 'B', type: 'site' },
    { name: 'Dark Market', url: 'silkroad.onion', icon: 'D', type: 'site' },
  ];

  const addLog = (msg: string) => setLogs(prev => [...prev, `> ${msg}`].slice(-6));

  const processUrl = (input: string) => {
      let target = input.trim();
      const hasSpace = target.includes(' ');
      const hasDot = target.includes('.');
      
      if (!hasDot || hasSpace) {
           target = `https://www.google.com/search?igu=1&q=${encodeURIComponent(target)}`;
      } else {
           if (!target.startsWith('http://') && !target.startsWith('https://')) {
               target = `https://${target}`;
           }
      }
      return target;
  };

  const loadUrl = async (processedUrl: string) => {
      if (internalBrowse) {
          await handleInternalBrowse(processedUrl);
      } else {
          let finalUrl = processedUrl;
          if (vpnActive && !processedUrl.includes('codetabs.com')) {
              finalUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(processedUrl)}`;
          }
          
          setIframeSrc(null);
          setIframeLoading(true);
          // Small delay to force iframe reload
          setTimeout(() => setIframeSrc(finalUrl), 10);
      }
  };

  const navigateTo = (inputUrl: string) => {
      const processed = processUrl(inputUrl);
      
      // Update History
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(inputUrl); // Store raw input for cleaner address bar
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      
      setUrl(inputUrl);
      loadUrl(processed);
  };

  const goBack = () => {
      if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          const prevUrl = history[newIndex];
          setUrl(prevUrl);
          loadUrl(processUrl(prevUrl));
      }
  };

  const goForward = () => {
      if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          const nextUrl = history[newIndex];
          setUrl(nextUrl);
          loadUrl(processUrl(nextUrl));
      }
  };

  const handleAction = async (overrideUrl?: string) => {
    const targetUrl = overrideUrl || url;
    if (!targetUrl) return;
    
    // Browser Mode Handler
    if (mode === 'browser') {
        navigateTo(targetUrl);
        return;
    }

    setLoading(true);
    setResult(null);
    setLogs([]);
    setProgress(0);
    setIframeSrc(null);
    setInternalContent(null);
    
    // Simulation Sequences
    let steps: string[] = [];
    if (mode === 'unlock') {
        steps = [
            "Resolving host address...",
            "Handshake initiated...",
            "Bypassing generic paywall...",
            "Injecting premium headers...",
            "Spoofing User-Agent...",
            "Decrypting content stream...",
            "Access granted."
        ];
    } else if (mode === 'analyze') {
        steps = [
            "Resolving host address...",
            "Initiating SSL Handshake...",
            "Scanning DOM structure...",
            "Analyzing tracking vectors...",
            "Synthesizing content summary...",
            "Finalizing report..."
        ];
    } else if (mode === 'download') {
        steps = [
            "Locating media manifest...",
            "Bypassing DRM encryption...",
            "Extracting video chunks...",
            "Aggregating stream...",
            "Optimizing MP4 container...",
            "Download ready."
        ];
    }

    for (let i = 0; i < steps.length; i++) {
        addLog(steps[i]);
        setProgress((i + 1) * (100 / steps.length));
        await new Promise(r => setTimeout(r, 800));
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        let prompt = '';
        
        if (mode === 'unlock') {
            prompt = `Act as a humorous "Hacker". Explain simulated paywall bypass for ${targetUrl}. Return JSON: { "status": "UNLOCKED", "method": "Cookie Injection", "summary": "...", "features": ["..."] }`;
        } else if (mode === 'analyze') {
            prompt = `Analyze domain ${targetUrl}. Return JSON: { "safetyScore": 85, "techStack": ["React"], "summary": "...", "risks": ["..."] }`;
        } else if (mode === 'download') {
            prompt = `Simulate a video download for ${targetUrl}. Return JSON: { "status": "READY", "filename": "video_export.mp4", "size": "1.4 GB", "resolution": "4K Ultra HD", "summary": "Video stream extracted successfully." }`;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ text: prompt + " Output JSON only." }]
        });
        
        const text = response.text?.replace(/```json/g, '').replace(/```/g, '').trim();
        if (text) {
            setResult(JSON.parse(text));
        }
    } catch (e) {
        console.error(e);
        setResult({
            status: "ERROR",
            summary: "Target connection failed.",
            features: []
        });
    } finally {
        setLoading(false);
    }
  };

  const handleInternalBrowse = async (targetUrl: string) => {
    setLoading(true);
    setIframeSrc(null);
    setInternalContent(null);
    setLogs(["Connecting to proxy node...", "Fetching HTML content...", "Rendering via Gemini Core..."]);
    
    try {
        // Use a proxy to fetch content since we are client-side
        const response = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`);
        const text = await response.text();
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const geminiRes = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ text: `
                You are a sophisticated Text-Based Browser Renderer.
                Render the following HTML content into clean, readable Markdown.
                Focus on the main article text, headers, and key information.
                Remove ads, scripts, and clutter.
                Format clearly with headers, bullet points, and links.
                
                Content:
                ${text.substring(0, 30000)}
            ` }]
        });
        
        setInternalContent(geminiRes.text || "Failed to render content.");
    } catch(e) {
        console.error(e);
        setInternalContent("Error: Could not fetch or render content. The site may block proxies.");
    } finally {
        setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAction();
  };

  const reload = () => {
      const currentUrl = url;
      if (currentUrl) {
          loadUrl(processUrl(currentUrl));
      }
  };

  const openExternal = () => {
      let target = url;
      if (target && !target.startsWith('http')) target = 'https://' + target;
      if (target) window.open(target, '_blank');
  };

  const toggleFullscreen = () => {
    if (!iframeContainerRef.current) return;
    if (!document.fullscreenElement) {
        iframeContainerRef.current.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        document.exitFullscreen();
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto p-6 lg:p-10 pb-32">
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
            <header className="flex items-center gap-6 pb-6 border-b border-white/5">
                <button 
                    onClick={goHome}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                >
                    <ChevronLeft size={24} />
                </button>
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500/20 to-teal-500/20 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-xl animate-scale-in">
                    <Globe className="w-8 h-8 text-cyan-200" />
                </div>
                <div>
                    <h1 className="text-4xl font-semibold text-white tracking-tight">Nexus Browser</h1>
                    <p className="text-white/40 mt-1 font-medium">Deep Web Voyager & Access Manager</p>
                </div>
            </header>

            {/* Browser Interface - Glossy Glass Update */}
            <div className="glass-panel rounded-[2.5rem] border border-white/10 bg-black/40 overflow-hidden flex flex-col min-h-[700px] shadow-2xl relative backdrop-blur-3xl">
                
                {/* Address Bar - Glossy */}
                <div className="h-20 border-b border-white/5 bg-white/5 flex items-center px-6 gap-4 backdrop-blur-md">
                    <div className="flex gap-2 mr-2">
                         <div className="flex gap-1.5 opacity-50 hover:opacity-100 transition-opacity">
                            <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-lg" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-lg" />
                            <div className="w-3 h-3 rounded-full bg-green-500/80 shadow-lg" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-white/40">
                        <button 
                            onClick={goBack}
                            disabled={historyIndex <= 0}
                            className={`p-2 rounded-lg transition-colors active:scale-95 ${historyIndex > 0 ? 'hover:text-white hover:bg-white/10' : 'opacity-30 cursor-not-allowed'}`}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button 
                            onClick={goForward}
                            disabled={historyIndex >= history.length - 1}
                            className={`p-2 rounded-lg transition-colors active:scale-95 ${historyIndex < history.length - 1 ? 'hover:text-white hover:bg-white/10' : 'opacity-30 cursor-not-allowed'}`}
                        >
                            <ChevronRight size={18} />
                        </button>
                        <button onClick={reload} className="hover:text-white transition-colors hover:bg-white/10 p-2 rounded-lg active:scale-95"><RotateCw size={16} /></button>
                    </div>
                    
                    <div className="flex-1 flex items-center gap-3 bg-black/30 border border-white/10 rounded-2xl px-5 py-3 relative focus-within:ring-2 focus-within:ring-cyan-500/30 transition-all shadow-inner">
                        {vpnActive ? <Lock size={14} className="text-emerald-400" /> : <Unlock size={14} className="text-red-400" />}
                        <input 
                            type="text" 
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Enter URL or Search Query..."
                            className="bg-transparent border-none outline-none text-sm text-white/90 w-full placeholder:text-white/20 font-medium tracking-wide"
                        />
                        
                        {/* Prominent Open External Button */}
                        <button 
                            onClick={openExternal} 
                            title="Open in System Browser" 
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all text-[10px] font-bold uppercase tracking-wide border border-white/5 hover:border-white/10"
                        >
                            Open External <ExternalLink size={12} />
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        {mode === 'browser' && (
                             <button 
                                onClick={() => setInternalBrowse(!internalBrowse)}
                                className={`p-3 rounded-xl border transition-all ${internalBrowse ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'bg-white/5 border-white/10 text-white/40'}`}
                                title={internalBrowse ? "AI Reader Mode Active" : "Enable Internal Reader"}
                            >
                                <FileText size={18} />
                            </button>
                        )}
                        <button 
                            onClick={() => {
                                setVpnActive(!vpnActive);
                                if (iframeSrc) reload();
                            }}
                            className={`p-3 rounded-xl border transition-all ${vpnActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-white/5 border-white/10 text-white/40'}`}
                            title={vpnActive ? "VPN Active (Proxy Enabled)" : "Direct Connection"}
                        >
                            <Wifi size={18} />
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col relative bg-black/30">
                    {/* Background Noise */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none" />
                    
                    {iframeSrc ? (
                        <div ref={iframeContainerRef} className="w-full h-full flex flex-col relative animate-fade-in bg-black">
                            {iframeLoading && (
                                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#050505] animate-fade-in">
                                    <div className="relative mb-8">
                                        <div className="w-24 h-24 rounded-full border-t-4 border-r-4 border-cyan-500/30 animate-[spin_3s_linear_infinite]" />
                                        <div className="absolute inset-0 w-24 h-24 rounded-full border-b-4 border-l-4 border-cyan-500/10 animate-[spin_2s_linear_infinite_reverse]" />
                                        <div className="absolute inset-2 w-20 h-20 rounded-full border-2 border-dashed border-cyan-500/40 animate-spin-slow" />
                                        
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full animate-pulse" />
                                                <Globe className="w-8 h-8 text-cyan-400 relative z-10" />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1 text-center">
                                        <h3 className="text-white font-bold tracking-[0.2em] text-sm animate-pulse">ESTABLISHING CONNECTION</h3>
                                        <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-cyan-500/60">
                                            <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-ping" />
                                            {vpnActive ? 'PROXY TUNNELING ACTIVE' : 'DIRECT LINK'}
                                        </div>
                                    </div>
                                    
                                    {/* Tech lines background */}
                                    <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
                                        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
                                        <div className="absolute left-1/2 top-0 h-full w-[1px] bg-gradient-to-b from-transparent via-cyan-500 to-transparent" />
                                    </div>
                                </div>
                            )}
                            
                            <iframe 
                                src={iframeSrc} 
                                className={`w-full h-full border-none bg-white transition-opacity duration-700 ${iframeLoading ? 'opacity-0' : 'opacity-100'}`}
                                title="Nexus Browse"
                                referrerPolicy="no-referrer"
                                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-modals allow-popups-to-escape-sandbox"
                                onLoad={() => setTimeout(() => setIframeLoading(false), 500)}
                            />
                            {/* Overlay Controls */}
                            <div className="absolute top-4 right-4 flex gap-2 z-50">
                                 <button 
                                    onClick={openExternal}
                                    className="p-3 bg-black/80 backdrop-blur-md text-white rounded-full hover:bg-cyan-600 transition-colors shadow-lg border border-white/10"
                                    title="Open in External Browser"
                                >
                                    <ExternalLink size={16} />
                                </button>
                                <button 
                                    onClick={toggleFullscreen}
                                    className="p-3 bg-black/80 backdrop-blur-md text-white rounded-full hover:bg-cyan-600 transition-colors shadow-lg border border-white/10"
                                    title="Toggle Fullscreen"
                                >
                                    <Maximize size={16} />
                                </button>
                                <button 
                                    onClick={() => setIframeSrc(null)}
                                    className="p-3 bg-black/80 backdrop-blur-md text-white rounded-full hover:bg-red-500 transition-colors shadow-lg border border-white/10"
                                    title="Exit Browser Mode"
                                >
                                    <LayoutTemplate size={16} />
                                </button>
                            </div>
                        </div>
                    ) : internalContent ? (
                         <div className="w-full h-full p-10 overflow-y-auto animate-fade-in custom-scrollbar">
                             <div className="max-w-3xl mx-auto prose prose-invert prose-lg">
                                 <ReactMarkdown>{internalContent}</ReactMarkdown>
                             </div>
                         </div>
                    ) : loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-8 p-10">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full border-4 border-white/5 border-t-cyan-400 animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Server className="w-10 h-10 text-cyan-400 animate-pulse" />
                                </div>
                            </div>
                            
                            <div className="w-full max-w-md space-y-4">
                                <div className="flex justify-between text-xs font-mono text-cyan-400">
                                    <span className="uppercase tracking-widest">{mode} SEQUENCE</span>
                                    <span>{Math.round(progress)}%</span>
                                </div>
                                <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                    <div className="h-full bg-cyan-400 transition-all duration-300" style={{ width: `${progress}%` }} />
                                </div>
                                <div className="font-mono text-xs text-white/40 h-24 overflow-hidden border border-white/5 bg-black/40 p-3 rounded-lg">
                                    {logs.map((log, i) => (
                                        <div key={i} className="truncate animate-slide-up text-emerald-400/80">{log}</div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : result ? (
                        <div className="flex-1 p-10 overflow-y-auto animate-fade-in custom-scrollbar">
                             <div className="max-w-4xl mx-auto space-y-8">
                                <div className="flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                                    <div className="p-3 bg-emerald-500/20 rounded-xl">
                                        <CheckCircle className="text-emerald-400" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Success</h3>
                                        <p className="text-white/60">{result.summary}</p>
                                    </div>
                                    {mode === 'download' && (
                                        <button className="ml-auto px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-emerald-400 transition-colors flex items-center gap-2">
                                            <Download size={18} /> Download
                                        </button>
                                    )}
                                    {mode === 'unlock' && (
                                         <button 
                                            onClick={() => {
                                                setResult(null);
                                                setMode('browser');
                                                setVpnActive(true);
                                                setInternalBrowse(false);
                                                setTimeout(() => loadUrl(processUrl(url)), 50);
                                            }}
                                            className="ml-auto px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-cyan-400 transition-colors flex items-center gap-2 shadow-lg active:scale-95"
                                        >
                                            <Globe size={18} /> Open Now
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {result.features && (
                                        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                                            <h4 className="text-sm font-bold text-white/40 uppercase tracking-widest">Capabilities</h4>
                                            <div className="space-y-2">
                                                {result.features.map((f: string, i: number) => (
                                                    <div key={i} className="flex items-center gap-2 text-sm text-white/80">
                                                        <Zap size={12} className="text-yellow-400" /> {f}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {mode === 'download' && (
                                        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                                            <h4 className="text-sm font-bold text-white/40 uppercase tracking-widest">File Info</h4>
                                            <div className="space-y-3">
                                                <div className="flex justify-between text-sm border-b border-white/5 pb-2">
                                                    <span className="text-white/40">Filename</span>
                                                    <span className="font-mono text-cyan-400">{result.filename || 'video.mp4'}</span>
                                                </div>
                                                <div className="flex justify-between text-sm border-b border-white/5 pb-2">
                                                    <span className="text-white/40">Size</span>
                                                    <span className="font-mono text-white">{result.size}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-white/40">Quality</span>
                                                    <span className="font-mono text-emerald-400">{result.resolution}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <button onClick={() => setResult(null)} className="text-sm text-white/40 hover:text-white underline decoration-white/20 underline-offset-4">
                                    Start New Session
                                </button>
                             </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center gap-12 p-8 animate-fade-in">
                            
                            {/* Mode Selection Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
                                <button 
                                    onClick={() => setMode('unlock')}
                                    className={`p-6 rounded-2xl border transition-all text-left group hover:scale-[1.02] ${
                                        mode === 'unlock' 
                                        ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                                    }`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${mode === 'unlock' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/40'}`}>
                                        <Unlock size={24} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-1">Premium Unlocker</h3>
                                    <p className="text-xs text-white/40">Simulate paywall bypass & injection.</p>
                                </button>

                                <button 
                                    onClick={() => setMode('browser')}
                                    className={`p-6 rounded-2xl border transition-all text-left group hover:scale-[1.02] ${
                                        mode === 'browser' 
                                        ? 'bg-blue-500/10 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                                    }`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${mode === 'browser' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/40'}`}>
                                        <Globe size={24} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-1">Secure Browser</h3>
                                    <p className="text-xs text-white/40">Direct browsing with built-in VPN.</p>
                                </button>

                                <button 
                                    onClick={() => setMode('download')}
                                    className={`p-6 rounded-2xl border transition-all text-left group hover:scale-[1.02] ${
                                        mode === 'download' 
                                        ? 'bg-purple-500/10 border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.1)]' 
                                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                                    }`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${mode === 'download' ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-white/40'}`}>
                                        <Download size={24} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-1">Video Sniffer</h3>
                                    <p className="text-xs text-white/40">Extract media from any stream.</p>
                                </button>

                                <button 
                                    onClick={() => setMode('analyze')}
                                    className={`p-6 rounded-2xl border transition-all text-left group hover:scale-[1.02] ${
                                        mode === 'analyze' 
                                        ? 'bg-cyan-500/10 border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.1)]' 
                                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                                    }`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${mode === 'analyze' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-white/40'}`}>
                                        <Eye size={24} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-1">Deep Analysis</h3>
                                    <p className="text-xs text-white/40">Scan tech stack & vulnerabilities.</p>
                                </button>
                            </div>

                            {mode === 'browser' ? (
                                <div className="w-full max-w-2xl space-y-4 animate-scale-in">
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                            <Search className="text-white/30 group-focus-within:text-cyan-400 transition-colors" size={20} />
                                        </div>
                                        <input 
                                            type="text" 
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                            onKeyDown={handleKeyPress}
                                            placeholder="Search Google or enter URL..."
                                            className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl pl-16 pr-6 text-lg text-white placeholder:text-white/20 focus:ring-2 focus:ring-cyan-500/30 focus:bg-white/10 transition-all outline-none shadow-xl"
                                            autoFocus
                                        />
                                        <button 
                                            onClick={() => handleAction()}
                                            className="absolute inset-y-2 right-2 px-6 bg-white text-black font-bold rounded-xl hover:bg-cyan-50 transition-colors shadow-lg active:scale-95 flex items-center gap-2"
                                        >
                                            Go <ArrowRight size={16} />
                                        </button>
                                    </div>
                                    <div className="flex justify-center gap-6 text-xs text-white/30 font-medium">
                                        <span className="flex items-center gap-1.5"><Search size={10} /> Google Search</span>
                                        <span className="flex items-center gap-1.5"><Shield size={10} /> VPN Protected</span>
                                    </div>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => handleAction()}
                                    disabled={!url}
                                    className={`w-full max-w-sm py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 ${
                                        !url 
                                        ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                                        : 'bg-white text-black hover:bg-white/90 shadow-[0_0_30px_rgba(255,255,255,0.2)]'
                                    }`}
                                >
                                    <Zap size={18} fill="currentColor" />
                                    <span>Execute {mode === 'unlock' ? 'Bypass' : mode === 'download' ? 'Extraction' : 'Scan'}</span>
                                </button>
                            )}
                            
                            <div className="w-full max-w-sm pt-8 border-t border-white/5">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">
                                    <LayoutGrid size={12} />
                                    Quick Targets
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {quickTargets.map((target) => (
                                        <button
                                            key={target.url}
                                            onClick={() => {
                                                if (target.type === 'tool') {
                                                    setMode('browser');
                                                    setVpnActive(true);
                                                    setInternalBrowse(true);
                                                }
                                                setUrl(target.url);
                                                handleAction(target.url);
                                            }}
                                            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group text-left active:scale-95"
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                                                mode === 'unlock' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/40'
                                            }`}>
                                                {target.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-medium text-white/80 group-hover:text-white truncate transition-colors">{target.name}</div>
                                                <div className="text-[10px] text-white/30 truncate group-hover:text-white/50 transition-colors">{target.url}</div>
                                            </div>
                                            <ArrowRight size={12} className="text-white/20 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Status Footer - Glossy */}
                <div className="h-10 bg-black/40 border-t border-white/5 flex items-center px-6 justify-between text-[10px] font-mono text-white/30 uppercase tracking-widest backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5"><div className={`w-1.5 h-1.5 rounded-full ${vpnActive ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-red-500'}`} /> {vpnActive ? 'VPN SECURE' : 'UNSECURED'}</span>
                        <span className="flex items-center gap-1.5"><Cpu size={10} /> GEMINI ENGINE ACTIVE</span>
                    </div>
                    <div>MODE: {mode.toUpperCase()}</div>
                </div>
            </div>
        </div>
    </div>
  );
};
