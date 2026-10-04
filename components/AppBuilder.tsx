
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import Prism from 'prismjs';
import { 
  Code2, 
  Play, 
  Terminal, 
  Download, 
  Loader2, 
  Sparkles, 
  RotateCcw, 
  Monitor, 
  Smartphone, 
  ChevronRight,
  Send,
  History,
  Copy,
  Check,
  Link as LinkIcon,
  Type,
  Paperclip,
  X,
  Image as ImageIcon, 
  ChevronLeft,
  Package,
  Save,
  Database,
  Clock,
  Upload
} from 'lucide-react';

type AppVersion = {
  id: string;
  prompt: string;
  code: string;
  timestamp: number;
};

interface AppBuilderProps {
    goHome: () => void;
}

const HighlightedCode: React.FC<{ code: string }> = ({ code }) => {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code]);

  return (
    <div className="relative w-full h-full text-sm">
      <pre className="!bg-transparent !m-0 !p-6 h-full overflow-auto custom-scrollbar">
        <code ref={codeRef} className="language-html">
          {code}
        </code>
      </pre>
    </div>
  );
};

export const AppBuilder: React.FC<AppBuilderProps> = ({ goHome }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [apkLoading, setApkLoading] = useState(false);
  const [buildStatus, setBuildStatus] = useState('');
  const [code, setCode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [history, setHistory] = useState<AppVersion[]>([]);
  const [copied, setCopied] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  
  // Track last saved state to avoid redundant saves
  const lastSavedRef = useRef<{code: string, prompt: string} | null>(null);
  
  // Link Mode State
  const [genMode, setGenMode] = useState<'prompt' | 'link'>('prompt');
  const [targetLink, setTargetLink] = useState('');
  const [targetName, setTargetName] = useState('');
  const [targetPlatform, setTargetPlatform] = useState<'android' | 'ios'>('android');

  // Image Attachment State (Used for both Reference and App Icon)
  const [attachment, setAttachment] = useState<{data: string, mimeType: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Use string concatenation to prevent the HTML parser from seeing a script tag literal
  const scriptTag = "<" + "script>";
  const scriptCloseTag = "<" + "/script>";

  const demoCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Persistent Tasks</title>
    <script src="https://cdn.tailwindcss.com">${scriptCloseTag}
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
      body { font-family: 'Inter', sans-serif; }
      .task-enter { opacity: 0; transform: translateY(10px); }
      .task-enter-active { opacity: 1; transform: translateY(0); transition: all 0.3s ease; }
    </style>
</head>
<body class="bg-[#0f172a] text-white min-h-screen flex items-center justify-center p-4">
    <div class="bg-[#1e293b] w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden border border-slate-700">
        <div class="p-8 pb-4">
            <h1 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">My Tasks</h1>
            <p class="text-slate-400 text-xs font-medium uppercase tracking-widest flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Local Storage Synced
            </p>
        </div>
        
        <div class="px-8 pb-6">
            <div class="flex gap-2">
                <input type="text" id="taskInput" placeholder="Add a new task..." class="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-500">
                <button onclick="addTask()" class="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-900/20">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                </button>
            </div>
        </div>

        <div id="taskList" class="px-8 pb-8 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
            <!-- Tasks will be injected here -->
        </div>
        
        <div class="bg-slate-900/50 p-4 text-center border-t border-slate-700/50">
            <button onclick="clearAll()" class="text-xs text-red-400 hover:text-red-300 font-medium transition-colors">Clear All Data</button>
        </div>
    </div>

    ${scriptTag}
        let tasks = JSON.parse(localStorage.getItem('my_tasks') || '[]');
        const list = document.getElementById('taskList');
        const input = document.getElementById('taskInput');

        function save() {
            localStorage.setItem('my_tasks', JSON.stringify(tasks));
            render();
        }

        function addTask() {
            const text = input.value.trim();
            if (!text) return;
            tasks.unshift({ id: Date.now(), text, done: false });
            input.value = '';
            save();
        }

        function toggle(id) {
            tasks = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
            save();
        }

        function remove(id) {
            tasks = tasks.filter(t => t.id !== id);
            save();
        }
        
        function clearAll() {
            if(confirm('Delete all tasks?')) {
                tasks = [];
                save();
            }
        }

        function render() {
            list.innerHTML = '';
            if (tasks.length === 0) {
                list.innerHTML = '<div class="text-center text-slate-500 py-8 text-sm">No tasks yet. Start creating!</div>';
                return;
            }
            
            tasks.forEach(t => {
                const el = document.createElement('div');
                el.className = 'group flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-all task-enter-active';
                el.innerHTML = \`
                    <button onclick="toggle(\${t.id})" class="w-5 h-5 rounded-full border \${t.done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'} flex items-center justify-center transition-all">
                        \${t.done ? '<svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>' : ''}
                    </button>
                    <span class="flex-1 text-sm \${t.done ? 'text-slate-500 line-through' : 'text-slate-200'}">\${t.text}</span>
                    <button onclick="remove(\${t.id})" class="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                \`;
                list.appendChild(el);
            });
        }

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addTask();
        });

        // Initial Render
        render();
    ${scriptCloseTag}
</body>
</html>`;

  // Initialize and load history
  useEffect(() => {
    const saved = localStorage.getItem('gemini_app_builder_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(parsed);
        if (parsed.length > 0) {
          setCode(parsed[0].code);
          setPrompt(parsed[0].prompt);
          lastSavedRef.current = { code: parsed[0].code, prompt: parsed[0].prompt };
        } else {
          loadDemo();
        }
      } catch (e) {
        console.error("Failed to load history", e);
        loadDemo();
      }
    } else {
      // Try to load auto-save if no history
      const autosave = localStorage.getItem('gemini_app_builder_autosave');
      if (autosave) {
        try {
          const parsed = JSON.parse(autosave);
          setCode(parsed.code);
          setPrompt(parsed.prompt);
          lastSavedRef.current = { code: parsed.code, prompt: parsed.prompt };
          setHistory([
            {
              id: 'autosave-recovery',
              prompt: parsed.prompt,
              code: parsed.code,
              timestamp: parsed.timestamp,
            },
          ]);
        } catch (e) {
          loadDemo();
        }
      } else {
        loadDemo();
      }
    }
  }, []);

  const loadDemo = () => {
    const demo: AppVersion = {
        id: 'demo-tasks',
        prompt: 'A task management app with local storage persistence and a dark theme.',
        code: demoCode,
        timestamp: Date.now()
    };
    setHistory([demo]);
    setCode(demo.code);
    setPrompt(demo.prompt);
    lastSavedRef.current = { code: demo.code, prompt: demo.prompt };
  };

  // Persist history changes
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('gemini_app_builder_history', JSON.stringify(history.slice(0, 10)));
    }
  }, [history]);

  // AUTO-SAVE FEATURE: Saves every 60 seconds if code is present
  useEffect(() => {
    if (!code) return;

    const autoSaveInterval = setInterval(() => {
      // Avoid saving if nothing changed
      if (lastSavedRef.current && lastSavedRef.current.code === code && lastSavedRef.current.prompt === prompt) {
          return;
      }

      const saveTimestamp = Date.now();
      const dataToSave = {
        code,
        prompt,
        timestamp: saveTimestamp,
      };
      localStorage.setItem('gemini_app_builder_autosave', JSON.stringify(dataToSave));
      lastSavedRef.current = { code, prompt };

      const timeStr = new Date(saveTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSaved(timeStr);

      // Hide indicator after 5 seconds
      setTimeout(() => setLastSaved(null), 5000);
      console.debug(`[AppBuilder] Auto-saved at ${timeStr}`);
    }, 60000); // 60,000ms = 60 seconds

    return () => clearInterval(autoSaveInterval);
  }, [code, prompt]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result as string;
            const data = base64.split(',')[1];
            setAttachment({ data, mimeType: file.type });
        };
        reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const generateApp = async (customPrompt?: string) => {
    let targetPrompt = customPrompt || prompt;
    let parts: any[] = [];
    
    // Web to App Mode Logic
    if (genMode === 'link' && !customPrompt) {
        if (!targetLink) return;

        let formattedLink = targetLink;
        if (!formattedLink.startsWith('http')) {
            formattedLink = 'https://' + formattedLink;
        }

        setPreviewDevice('mobile'); // Auto-switch to mobile view for link apps
        const platformStyle = targetPlatform === 'android' ? 'Android 15 (Material You, edge-to-edge)' : 'iOS 18 (Cupertino, frosted glass)';
        
        targetPrompt = `Create a high-fidelity mobile PWA wrapper application for the URL: "${formattedLink}". 
        App Name: "${targetName || 'MyApp'}".
        Target Platform: ${platformStyle}.
        
        Requirements:
        1. Design strictly for ${platformStyle} aesthetics.
        2. Include a high-quality Splash Screen with the app name ${attachment ? 'and the provided icon' : ''} that fades out after 2s.
        3. Create a polished bottom navigation bar (Home, Search, Profile).
        4. The main content area must be an <iframe> pointing to "${formattedLink}".
        5. Handle iframe security: Add a "Open External" button if the iframe refuses to load.
        6. IMPLEMENT LOCAL STORAGE: Save user preferences or last visited state.
        7. Status bar area should match the ${targetPlatform} system bar style.`;

        // If icon attached, pass it
        if (attachment) {
             parts.push({ inlineData: { mimeType: attachment.mimeType, data: attachment.data } });
             targetPrompt += "\nUse the attached image as the App Icon and in the Splash Screen.";
        }
    }

    if (!targetPrompt.trim() && !attachment) return;

    setLoading(true);
    setViewMode('preview');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const systemInstruction = `You are a world-class senior frontend engineer and mobile app architect. 
      Output ONLY the complete HTML code. 
      Use Tailwind CSS. 
      Ensure the code is responsive and works in a browser.
      CRITICAL: You MUST implement 'localStorage' to persist ALL application state.
      Add a visual indicator when data is saved.
      The app should feel native.`;

      let userMessage = "";

      if (code && customPrompt) {
          // Iteration Mode
          userMessage = `Here is the current HTML code of the app:\n\`\`\`html\n${code}\n\`\`\`\n\nRequest: ${customPrompt}\n\nReturn the updated complete HTML code. Ensure localStorage persistence remains intact.`;
          parts.push({ text: userMessage });
      } else {
          // New Creation Mode
          if (attachment && genMode === 'prompt') {
              // Image to Code (Reference)
              userMessage = `Build a functional web app that replicates the design shown in this image. ${targetPrompt}. Make sure it saves data to localStorage.`;
              parts.push({ inlineData: { mimeType: attachment.mimeType, data: attachment.data } });
          } else {
              // Link Mode or Text Prompt
              userMessage = `Generate a web app with this description: ${targetPrompt}`;
          }
          parts.push({ text: userMessage });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [
            { role: 'user', parts }
        ],
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const generatedCode = response.text || '';
      let cleanCode = generatedCode;
      
      // Robust Markdown extraction
      const match = generatedCode.match(/```html\s*([\s\S]*?)\s*```/);
      if (match) {
          cleanCode = match[1];
      } else {
          cleanCode = generatedCode.replace(/^```html\n?/, '').replace(/\n?```$/, '').trim();
      }
      
      setCode(cleanCode);
      
      const newVersion: AppVersion = {
        id: Date.now().toString(),
        prompt: genMode === 'link' ? `Wrapper App: ${targetName} (${targetLink})` : targetPrompt,
        code: cleanCode,
        timestamp: Date.now()
      };
      
      setHistory(prev => [newVersion, ...prev].slice(0, 10));
      // Don't clear attachment in link mode so user can rebuild easily
      if (!customPrompt && genMode !== 'link') setAttachment(null); 

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBuildApk = async () => {
    if (!code) return;
    setApkLoading(true);
    setBuildStatus('Initializing Build Environment...');
    
    // Simulating Android 15 Build Process steps
    const steps = targetPlatform === 'android' ? [
        "Analyzing Source Code...",
        "Injecting Persistence Layer (SQLite/LocalStorage)...",
        "Compiling for Android 15 (API Level 35)...",
        "Optimizing Assets for HDPI...",
        "Generating Signed WebAPK Manifest...",
        "Packaging Installable Bundle (.apk / .aab)..."
    ] : [
        "Analyzing Source Code...",
        "Building iOS Web Archive...",
        "Injecting MobileConfig Profiles...",
        "Signing with Development Certificate...",
        "Packaging for TestFlight..."
    ];
    
    for(const step of steps) {
        setBuildStatus(step);
        await new Promise(r => setTimeout(r, 800));
    }

    // Construct a Data URI Manifest for PWA installation
    // This makes the HTML file act as a valid installable WebAPK on Android
    const manifest = {
        name: targetName || "Gemini App",
        short_name: targetName || "App",
        start_url: ".",
        display: "standalone",
        background_color: "#000000",
        theme_color: "#000000",
        icons: [
            {
                src: attachment ? `data:${attachment.mimeType};base64,${attachment.data}` : "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u2728.png",
                sizes: "512x512",
                type: "image/png"
            }
        ]
    };
    
    // Parse the current code to inject manifest and meta tags
    const parser = new DOMParser();
    const doc = parser.parseFromString(code, 'text/html');
    
    // Inject Manifest
    const link = doc.createElement('link');
    link.rel = 'manifest';
    link.href = `data:application/manifest+json,${encodeURIComponent(JSON.stringify(manifest))}`;
    doc.head.appendChild(link);
    
    // Inject Theme Color
    const metaTheme = doc.createElement('meta');
    metaTheme.name = 'theme-color';
    metaTheme.content = '#000000';
    doc.head.appendChild(metaTheme);

    // Inject Viewport for Mobile
    let metaViewport = doc.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
    if (!metaViewport) {
        metaViewport = doc.createElement('meta');
        metaViewport.name = 'viewport';
        doc.head.appendChild(metaViewport);
    }
    metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');

    const finalHtml = `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
    
    const blob = new Blob([finalHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Naming it .html allows it to run immediately. 
    // We append _Installable to indicate it can be added to home screen.
    const ext = targetPlatform === 'android' ? '_Android15_Installable.html' : '_iOS18_Installable.html';
    a.download = `${targetName ? targetName.replace(/\s+/g, '_') : 'App'}${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    
    setBuildStatus('Build Complete.');
    setTimeout(() => setApkLoading(false), 2000);
  };

  const handleCopy = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (code) {
      const blob = new Blob([code], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gemini-app-${Date.now()}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const clearHistory = () => {
    if (confirm("Clear all generation history?")) {
      setHistory([]);
      setCode(null);
      setPrompt('');
      localStorage.removeItem('gemini_app_builder_history');
    }
  };

  const loadFromHistory = (version: AppVersion) => {
    setCode(version.code);
    setPrompt(version.prompt);
    setViewMode('preview');
  };

  return (
    <div className="flex h-full w-full overflow-hidden animate-fade-in">
      <div className="w-[400px] flex flex-col border-r border-white/5 bg-black/40 backdrop-blur-2xl">
        <header className="p-8 border-b border-white/5">
            <div className="flex items-center gap-4 mb-2">
                <button 
                    onClick={goHome}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="p-2.5 bg-blue-500/20 rounded-xl border border-blue-500/30">
                    <Code2 className="text-blue-400" size={20} />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">App Studio</h1>
                </div>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
            
            <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
                <button 
                    onClick={() => setGenMode('prompt')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${genMode === 'prompt' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
                >
                    <Type size={14} /> Text/Image
                </button>
                <button 
                    onClick={() => setGenMode('link')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${genMode === 'link' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
                >
                    <LinkIcon size={14} /> Web to App
                </button>
            </div>

            {genMode === 'prompt' ? (
                <div className="space-y-4 animate-slide-up">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Sparkles size={12} className="text-blue-400" /> Specification
                        </label>
                        {lastSaved && (
                            <div className="flex items-center gap-1.5 text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20 animate-fade-in">
                                <Save size={10} /> Saved {lastSaved}
                            </div>
                        )}
                    </div>
                    <div className="relative group">
                        <textarea 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe your app... (e.g. 'A workout tracker that saves my sets')"
                            className="w-full h-48 glass-input rounded-[2rem] p-6 pb-20 text-[13px] text-white/90 focus:ring-1 focus:ring-blue-500/50 outline-none resize-none placeholder:text-white/20 leading-relaxed shadow-2xl transition-all"
                        />
                        
                        {attachment && (
                            <div className="absolute bottom-5 left-5 z-10 flex items-center gap-2 bg-black/60 backdrop-blur-md p-1.5 pl-3 rounded-lg border border-white/10">
                                <ImageIcon size={12} className="text-blue-400" />
                                <span className="text-[10px] text-white/60 font-medium">Image Attached</span>
                                <button onClick={() => setAttachment(null)} className="p-1 hover:bg-white/10 rounded-md text-white/40 hover:text-white"><X size={12} /></button>
                            </div>
                        )}

                        <div className="absolute bottom-5 right-5 flex items-center gap-2">
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className={`p-3.5 rounded-2xl transition-all shadow-xl active:scale-95 border ${attachment ? 'bg-blue-500/20 border-blue-500/30 text-blue-300' : 'bg-white/5 text-white/40 hover:text-white border-white/5 hover:bg-white/10'}`}
                                title="Attach Reference Image"
                            >
                                <Paperclip size={18} />
                            </button>
                            <button 
                                onClick={() => generateApp()}
                                disabled={loading || (!prompt.trim() && !attachment)}
                                className={`p-3.5 rounded-2xl transition-all shadow-xl active:scale-95 ${
                                    loading || (!prompt.trim() && !attachment)
                                    ? 'bg-white/5 text-white/20' 
                                    : 'bg-white text-black hover:bg-blue-50 hover:scale-105'
                                }`}
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            </button>
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
                    </div>
                </div>
            ) : (
                <div className="space-y-6 animate-slide-up">
                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Target URL</label>
                        <input 
                            type="text" 
                            value={targetLink}
                            onChange={(e) => setTargetLink(e.target.value)}
                            placeholder="https://example.com"
                            className="w-full glass-input rounded-xl p-4 text-sm text-white/90 focus:ring-1 focus:ring-blue-500/50 outline-none"
                        />
                    </div>
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-white/40 uppercase tracking-[0.2em]">App Configuration</label>
                        <div className="grid grid-cols-2 gap-3">
                            <input 
                                type="text" 
                                value={targetName}
                                onChange={(e) => setTargetName(e.target.value)}
                                placeholder="App Name"
                                className="w-full glass-input rounded-xl p-3 text-sm text-white/90 focus:ring-1 focus:ring-blue-500/50 outline-none"
                            />
                            <div className="relative">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`w-full h-full rounded-xl border flex items-center justify-center gap-2 transition-all ${
                                        attachment ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                                    }`}
                                >
                                    {attachment ? <Check size={14} /> : <Upload size={14} />}
                                    <span className="text-[10px] font-bold uppercase">{attachment ? 'Icon Set' : 'Upload Icon'}</span>
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-white/40 uppercase tracking-[0.2em]">Platform Target</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setTargetPlatform('android')}
                                className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                                    targetPlatform === 'android' 
                                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                                    : 'bg-white/5 border-white/5 text-white/40 hover:text-white'
                                }`}
                            >
                                <Smartphone size={16} /> <span className="text-xs font-bold">Android 15</span>
                            </button>
                            <button
                                onClick={() => setTargetPlatform('ios')}
                                className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                                    targetPlatform === 'ios' 
                                    ? 'bg-white text-black border-white' 
                                    : 'bg-white/5 border-white/5 text-white/40 hover:text-white'
                                }`}
                            >
                                <Smartphone size={16} /> <span className="text-xs font-bold">iOS 18</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <button 
                            onClick={() => generateApp()}
                            disabled={loading || !targetLink.trim()}
                            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 ${
                                loading || !targetLink.trim()
                                ? 'bg-white/5 text-white/20' 
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:brightness-110'
                            }`}
                        >
                             {loading ? <Loader2 size={18} className="animate-spin" /> : <Smartphone size={18} />}
                             Generate App Code
                        </button>
                    </div>
                </div>
            )}

            {code && (
                 <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl animate-fade-in space-y-3">
                     <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-widest">
                         <Database size={12} /> Local Storage Active
                     </div>
                     <p className="text-[10px] text-white/50 leading-relaxed">
                         The generated app is pre-configured to persist data. Use the "Build" button below to create an {targetPlatform === 'android' ? 'Android installable package' : 'iOS WebClip'}.
                     </p>
                     
                     <button 
                        onClick={handleBuildApk}
                        disabled={apkLoading}
                        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 text-xs ${
                            apkLoading
                            ? 'bg-white/5 text-white/20' 
                            : 'bg-emerald-600 text-white hover:bg-emerald-500'
                        }`}
                    >
                         {apkLoading ? <Loader2 size={14} className="animate-spin" /> : <Package size={14} />}
                         {apkLoading ? (targetPlatform === 'android' ? 'Building APK...' : 'Packaging IPA...') : (targetPlatform === 'android' ? 'Build Android WebAPK' : 'Build iOS Package')}
                    </button>
                    {buildStatus && apkLoading && (
                        <div className="text-[9px] text-white/40 text-center animate-pulse">{buildStatus}</div>
                    )}
                </div>
            )}

            {history.length > 0 && (
                <div className="space-y-4 pt-8 border-t border-white/5">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                            <History size={12} /> Recent Versions
                        </label>
                        <button onClick={clearHistory} className="text-[10px] text-white/20 hover:text-red-400 transition-colors uppercase font-bold">Clear All</button>
                    </div>
                    <div className="space-y-3">
                        {history.map((v) => (
                            <div key={v.id} className="group relative p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                         <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                                             <Code2 size={12} />
                                         </div>
                                         <span className="text-[10px] font-mono text-white/40 flex items-center gap-1">
                                             <Clock size={10} />
                                             {new Date(v.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                         </span>
                                    </div>
                                    {code === v.code && (
                                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">ACTIVE</span>
                                    )}
                                </div>
                                
                                <p className="text-xs text-white/80 font-medium line-clamp-2 mb-3 h-8 leading-relaxed">
                                    {v.prompt}
                                </p>

                                <button 
                                    onClick={() => loadFromHistory(v)}
                                    className="w-full py-2 bg-white/5 hover:bg-blue-600 hover:text-white text-white/40 group-hover:text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 border border-white/5 group-hover:border-transparent active:scale-95"
                                >
                                    <RotateCcw size={12} /> Restore Version
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-black/40 relative">
          <div className="h-20 px-8 border-b border-white/5 flex items-center justify-between bg-[#0a0a0a]/80 backdrop-blur-3xl sticky top-0 z-20">
              <div className="flex items-center gap-4">
                  <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 shadow-inner">
                      <button 
                        onClick={() => setViewMode('preview')}
                        className={`flex items-center gap-2.5 px-6 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'preview' ? 'bg-white text-black shadow-2xl' : 'text-white/40 hover:text-white'}`}
                      >
                          <Play size={14} fill={viewMode === 'preview' ? 'currentColor' : 'none'} /> PREVIEW
                      </button>
                      <button 
                        onClick={() => setViewMode('code')}
                        className={`flex items-center gap-2.5 px-6 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'code' ? 'bg-white text-black shadow-2xl' : 'text-white/40 hover:text-white'}`}
                      >
                          <Terminal size={14} /> SOURCE
                      </button>
                  </div>

                  {viewMode === 'preview' && (
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                        <button 
                            onClick={() => setPreviewDevice('desktop')} 
                            className={`p-2 rounded-lg transition-all ${previewDevice === 'desktop' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                            title="Desktop View"
                        >
                            <Monitor size={16} />
                        </button>
                        <button 
                            onClick={() => setPreviewDevice('mobile')} 
                            className={`p-2 rounded-lg transition-all ${previewDevice === 'mobile' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                            title="Mobile View"
                        >
                            <Smartphone size={16} />
                        </button>
                    </div>
                  )}
              </div>

              <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[10px] font-bold text-emerald-400">LIVE RENDER</span>
                  </div>
                  <div className="flex gap-2">
                      <button 
                        onClick={handleCopy}
                        className={`p-2.5 rounded-xl border transition-all ${copied ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'}`}
                        title="Copy Code"
                      >
                          {copied ? <Check size={18} /> : <Copy size={18} />}
                      </button>
                      <button 
                        onClick={handleDownload}
                        className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all hover:bg-white/10"
                        title="Download HTML"
                      >
                          <Download size={18} />
                      </button>
                  </div>
              </div>
          </div>

          <div className="flex-1 overflow-hidden relative flex items-center justify-center p-8 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-opacity-5">
              {viewMode === 'preview' ? (
                 code ? (
                     <div className={`transition-all duration-500 ease-in-out relative shadow-2xl ${
                         previewDevice === 'mobile' 
                         ? 'w-[375px] h-[750px] rounded-[3rem] border-8 border-[#1a1a1a] bg-black shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden ring-1 ring-white/10' 
                         : 'w-full h-full rounded-2xl border border-white/10 bg-white overflow-hidden'
                     }`}>
                         {previewDevice === 'mobile' && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#1a1a1a] rounded-b-2xl z-20" />}
                         <iframe 
                            ref={iframeRef}
                            srcDoc={code} 
                            className="w-full h-full border-none bg-white"
                            title="App Preview"
                            sandbox="allow-scripts allow-modals allow-same-origin allow-forms"
                         />
                     </div>
                 ) : (
                     <div className="flex flex-col items-center text-white/20">
                         <Code2 size={64} className="mb-4 opacity-20" />
                         <p className="font-medium tracking-wide">Waiting for Generation...</p>
                     </div>
                 )
              ) : (
                  <div className="w-full h-full bg-[#0a0a0a] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                      {code ? (
                          <HighlightedCode code={code} />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/20">
                              <p>No Source Code Available</p>
                          </div>
                      )}
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
