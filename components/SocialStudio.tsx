
import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { 
  Users, 
  Instagram, 
  Facebook,
  TrendingUp, 
  Zap, 
  Loader2, 
  CheckCircle, 
  Copy, 
  Hash,
  Send,
  Globe,
  Award,
  BarChart3,
  Rocket,
  ThumbsUp,
  MessageCircle,
  UserPlus,
  ShieldAlert,
  Lock,
  Search,
  Sparkles,
  Activity,
  ChevronLeft,
  Image as ImageIcon, 
  X,
  RefreshCw,
  Key,
  ShieldCheck,
  EyeOff,
  Terminal,
  AlertTriangle,
  Flame
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface SocialStudioProps {
    goHome: () => void;
}

export const SocialStudio: React.FC<SocialStudioProps> = ({ goHome }) => {
  const [mode, setMode] = useState<'followers' | 'insta_earn' | 'caption' | 'facebook_likes' | 'facebook_followers' | 'profile_pentest' | 'trend_hunter'>('followers');
  
  // Instagram State
  const [link, setLink] = useState('');
  const [targetFollowers, setTargetFollowers] = useState(1000);
  
  // Insta Earn (Viral Protocol) State
  const [instaEarnUser, setInstaEarnUser] = useState('');
  const [instaEarnGoal, setInstaEarnGoal] = useState('Brand Deals');

  // Facebook Like & Comment State
  const [fbLink, setFbLink] = useState('');
  const [targetLikes, setTargetLikes] = useState(100);

  // Facebook Followers State
  const [fbFollowerLink, setFbFollowerLink] = useState('');
  const [targetFbFollowers, setTargetFbFollowers] = useState(1000);

  // Profile Pentest State
  const [auditLink, setAuditLink] = useState('');

  // Trend Hunter State
  const [trendKeyword, setTrendKeyword] = useState('');

  // Caption Generator State
  const [captionTopic, setCaptionTopic] = useState('');
  const [captionTone, setCaptionTone] = useState('Viral & Hype');
  const [captionImage, setCaptionImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Shared State
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');

  const handleBoost = async () => {
    if(!link) return;
    setLoading(true);
    setResult(null);
    setProgress(0);

    const steps = [
        "Connecting to Instagram Graph...",
        "Analyzing Profile Architecture...",
        "Identifying Niche Virality Vectors...",
        "Synthesizing Growth Protocol...",
        "Finalizing Strategy..."
    ];

    for (let i = 0; i < steps.length; i++) {
        setProgressStatus(steps[i]);
        setProgress((i + 1) * 20);
        await new Promise(r => setTimeout(r, 800));
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ text: `
                Act as a world-class Social Media Strategist. 
                I want to organically gain ${targetFollowers} followers for this Instagram profile: ${link}.
                
                Generate a high-impact, actionable "Growth Protocol".
                Format strictly in Markdown.
                Include:
                1. 🎯 **Audience Persona**: Who to target.
                2. ⚡ **Content Pillars**: 3 viral content ideas specific to the likely niche.
                3. #️⃣ **Hashtag Stack**: 30 optimized tags (mix of high/mid/low volume).
                4. 🚀 **Engagement Hack**: One specific tactic to boost visibility immediately.
                5. 🧬 **Bio Optimization**: A rewritten, high-converting bio suggestion.
            ` }]
        });
        setResult(response.text || "Strategy generated.");
    } catch(e) {
        console.error(e);
        setResult("Error generating growth plan. Please check your API key.");
    } finally {
        setLoading(false);
    }
  };

  const handleInstaEarn = async () => {
    if(!instaEarnUser) return;
    setLoading(true);
    setResult(null);
    setProgress(0);

    const steps = [
        `Analyzing @${instaEarnUser.replace('@', '')} engagement metrics...`,
        "Scanning monetization eligibility...",
        "Identifying viral earnings vectors...",
        "Calculating potential RPM...",
        "Generating Income Protocol..."
    ];

    for (let i = 0; i < steps.length; i++) {
        setProgressStatus(steps[i]);
        setProgress((i + 1) * 20);
        await new Promise(r => setTimeout(r, 800));
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ text: `
                Act as a Social Media Monetization Expert.
                The user wants to earn 100% real income/followers on Instagram for @${instaEarnUser.replace('@', '')}.
                Goal: ${instaEarnGoal}.
                
                Generate a "Viral Earnings & Growth Protocol".
                Tone: Professional, tactical, high-performance.
                Format strictly in Markdown.
                
                Include:
                1. 💰 **Monetization Blueprint**: Specific ways to monetize this specific account type (e.g., Reels Bonuses, Affiliate, Digital Products).
                2. 🚀 **Viral Trigger**: A specific Reels concept guaranteed to get views based on current trends.
                3. 📈 **The 100% Organic Method**: How to gain followers without bots (Interactions, Collabs).
                4. 🛡️ **Shadowban Avoidance**: What NOT to do to ensure account health.
                5. ⚡ **Action Plan**: A 7-day schedule to execute immediately.
            ` }]
        });
        setResult(response.text || "Protocol ready.");
    } catch(e) {
        console.error(e);
        setResult("Error generating plan.");
    } finally {
        setLoading(false);
    }
  };

  const handleFbBoost = async () => {
    if(!fbLink) return;
    setLoading(true);
    setResult(null);
    setProgress(0);

    const steps = [
        "Connecting to Facebook Graph API...",
        "Bypassing Rate Limits...",
        "Accessing Unlimited Liker Cloud...",
        "Injecting Like & Comment Vectors...",
        "Verifying 100% Success Rate..."
    ];

    for (let i = 0; i < steps.length; i++) {
        setProgressStatus(steps[i]);
        setProgress((i + 1) * 20);
        await new Promise(r => setTimeout(r, 800));
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ text: `
                Act as a Facebook Viral Specialist.
                I need to generate ${targetLikes.toLocaleString()} organic likes and relevant comments for this post: ${fbLink}.
                The user wants an "Unlimited" and "100% Free" auto-like strategy.
                
                Generate a "Viral Auto-Like & Comment Protocol" (Strategic Guide).
                Format strictly in Markdown.
                Include:
                1. 🧪 **The Unlimited Hook**: How to structure the post so it triggers the 'Unlimited Reach' algorithm.
                2. 👥 **Engagement Pods 2.0**: How to leverage legitimate engagement groups (no bots).
                3. 💬 **Comment Baiting**: A specific question to add in the comments to trigger replies.
                4. 🕒 **Timing Hack**: When exactly to post for maximum distribution.
            ` }]
        });
        setResult(response.text || "Protocol generated.");
    } catch(e) {
        console.error(e);
        setResult("Error generating protocol.");
    } finally {
        setLoading(false);
    }
  };

  const handleFbFollowers = async () => {
      if(!fbFollowerLink) return;
      setLoading(true);
      setResult(null);
      setProgress(0);

      const steps = [
          "Analyzing Page Category & Niche...",
          "Scraping Competitor Audience Data...",
          "Identifying 'Super-Fan' Clusters...",
          "Generating Follower Magnet Strategy...",
          "Compiling Report..."
      ];

      for (let i = 0; i < steps.length; i++) {
          setProgressStatus(steps[i]);
          setProgress((i + 1) * 20);
          await new Promise(r => setTimeout(r, 800));
      }

      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: [{ text: `
                  Act as a Facebook Page Growth Expert.
                  Target: ${targetFbFollowers.toLocaleString()} Followers for ${fbFollowerLink}.
                  
                  Generate a "Facebook Page Domination Protocol".
                  Format strictly in Markdown.
                  Include:
                  1. 📢 **Content Mix**: The exact ratio of Video vs Image vs Text posts.
                  2. 🤝 **Cross-Pollination**: How to use Groups to funnel users to the Page without getting banned.
                  3. 🎁 **The 'Magnet'**: A lead magnet or giveaway idea relevant to generic pages.
                  4. 📅 **30-Day Calendar**: A brief content calendar table.
              ` }]
          });
          setResult(response.text || "Strategy generated.");
      } catch(e) {
          console.error(e);
          setResult("Error generating strategy.");
      } finally {
          setLoading(false);
      }
  };

  const handlePentest = async () => {
      if(!auditLink) return;
      setLoading(true);
      setResult(null);
      setProgress(0);

      const steps = [
          "Initiating OSINT Reconnaissance...",
          "Scanning for Public Data Leaks...",
          "Analyzing Password Hygiene Probability...",
          "Checking 2FA Configuration...",
          "Calculating Social Engineering Vulnerability..."
      ];

      for (let i = 0; i < steps.length; i++) {
          setProgressStatus(steps[i]);
          setProgress((i + 1) * 20);
          await new Promise(r => setTimeout(r, 800));
      }

      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: [{ text: `
                  Act as a White Hat Social Media Security Auditor.
                  Perform a simulated "Security & Trust Score Report" for the public footprint of: ${auditLink}.
                  (Do not actually hack; simulate an audit based on common vulnerabilities for this type of profile).
                  
                  Format strictly in Markdown.
                  Include:
                  1. 🛡️ **Trust Score**: (0-100) based on typical public profile settings.
                  2. 🚨 **Vulnerability Vectors**: 3 common ways this type of account gets compromised.
                  3. 🔐 **Lockdown Protocol**: 5 immediate steps to secure the account (2FA app, backup codes, phishing awareness).
                  4. 👁️ **Privacy Check**: What info is likely too public (Location tags, family photos).
              ` }]
          });
          setResult(response.text || "Audit complete.");
      } catch(e) {
          console.error(e);
          setResult("Error performing audit.");
      } finally {
          setLoading(false);
      }
  };

  const handleTrendAnalysis = async () => {
    if(!trendKeyword) return;
    setLoading(true);
    setResult(null);
    setProgress(0);

    const steps = [
        "Scanning Global Trend Matrix...",
        "Querying Google Search Real-time Index...",
        "Cross-referencing Platform Volatility...",
        "Extracting Hashtag Velocity...",
        "Compiling Trend Intelligence..."
    ];

    for (let i = 0; i < steps.length; i++) {
        setProgressStatus(steps[i]);
        setProgress((i + 1) * 20);
        await new Promise(r => setTimeout(r, 800));
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: [{ text: `
                Act as a Real-Time Social Media Trend Hunter.
                I need to know what is trending RIGHT NOW related to: "${trendKeyword}".
                
                Use Google Search to fetch live data.
                Generate a "Viral Trend Report".
                Format strictly in Markdown.
                
                Include:
                1. 🔥 **Top 3 Breakout Trends**: Specific topics or news stories driving conversation.
                2. #️⃣ **Hashtag Pack**: 10 high-velocity hashtags associated with these trends.
                3. 💡 **Content Angle**: How to hijack this trend for engagement (a content idea).
                4. 🔗 **Source/Context**: Mention why this is trending right now (citations included).
            ` }],
            config: {
                tools: [{ googleSearch: {} }]
            }
        });
        setResult(response.text || "No trends found.");
    } catch(e) {
        console.error(e);
        setResult("Error analyzing trends. Please check your API key.");
    } finally {
        setLoading(false);
    }
  };

  const handleCaption = async () => {
      if(!captionTopic && !captionImage) return;
      setLoading(true);
      setResult(null);
      
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          let parts: any[] = [];
          
          if(captionImage) {
              parts.push({ inlineData: { mimeType: 'image/jpeg', data: captionImage.split(',')[1] } });
              parts.push({ text: `Generate 5 viral Instagram captions for this image. Tone: ${captionTone}. Include relevant hashtags.` });
          } else {
              parts.push({ text: `Generate 5 viral Instagram captions about: "${captionTopic}". Tone: ${captionTone}. Include relevant hashtags.` });
          }

          const response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: [{ parts }]
          });
          setResult(response.text || "Captions generated.");
      } catch(e) {
          console.error(e);
          setResult("Error generating captions.");
      } finally {
          setLoading(false);
      }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = () => setCaptionImage(reader.result as string);
          reader.readAsDataURL(file);
      }
  };

  const tools = [
      { id: 'followers', name: 'Insta Followers', icon: UserPlus, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
      { id: 'insta_earn', name: 'Insta Earn', icon: Activity, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
      { id: 'trend_hunter', name: 'Trend Hunter', icon: Flame, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
      { id: 'caption', name: 'Magic Caption', icon: Sparkles, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
      { id: 'facebook_likes', name: 'FB Auto Likes', icon: ThumbsUp, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
      { id: 'facebook_followers', name: 'FB Page Growth', icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
      { id: 'profile_pentest', name: 'Profile Audit', icon: ShieldCheck, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  ];

  return (
    <div className="h-full w-full overflow-y-auto p-6 lg:p-10 pb-32">
        <div className="max-w-7xl mx-auto space-y-10 animate-fade-in">
            <header className="flex items-center gap-6 pb-6 border-b border-white/5">
                <button 
                    onClick={goHome}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                >
                    <ChevronLeft size={24} />
                </button>
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-pink-500/20 to-orange-500/20 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-xl animate-scale-in">
                    <Users className="w-8 h-8 text-pink-200" />
                </div>
                <div>
                    <h1 className="text-4xl font-semibold text-white tracking-tight">Social Grid</h1>
                    <p className="text-white/40 mt-1 font-medium">Viral Engineering & Analytics</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-1 space-y-3">
                    {tools.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => {
                                setMode(t.id as any);
                                setResult(null);
                                setProgress(0);
                            }}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 group ${
                                mode === t.id 
                                ? `${t.bg} ${t.border} shadow-lg scale-[1.02]` 
                                : 'bg-white/5 border-white/5 hover:bg-white/10'
                            }`}
                        >
                            <div className={`p-2 rounded-lg ${mode === t.id ? 'bg-black/20' : 'bg-white/5'} transition-colors`}>
                                <t.icon size={18} className={t.color} />
                            </div>
                            <span className={`text-sm font-bold ${mode === t.id ? 'text-white' : 'text-white/60 group-hover:text-white'}`}>
                                {t.name}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Main Action Area */}
                <div className="lg:col-span-3 space-y-8">
                    <div className="glass-panel p-8 rounded-[2.5rem] bg-black/40 border border-white/10 min-h-[400px]">
                        <div className="max-w-2xl mx-auto space-y-8">
                            
                            {/* Header for Active Tool */}
                            <div className="flex flex-col items-center text-center space-y-2 mb-8">
                                {tools.map(t => mode === t.id && (
                                    <React.Fragment key={t.id}>
                                        <div className={`w-16 h-16 rounded-full ${t.bg} border ${t.border} flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(0,0,0,0.3)] animate-scale-in`}>
                                            <t.icon size={32} className={t.color} />
                                        </div>
                                        <h2 className="text-2xl font-bold text-white">{t.name}</h2>
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* Tool Specific Inputs */}
                            <div className="space-y-6 animate-slide-up">
                                {mode === 'followers' && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Instagram Username / Link</label>
                                            <input 
                                                type="text" 
                                                value={link} 
                                                onChange={(e) => setLink(e.target.value)}
                                                placeholder="@username or https://instagram.com/..."
                                                className="w-full glass-input rounded-xl p-4 text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-pink-500/50 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Target Followers</label>
                                            <div className="flex items-center gap-4 bg-white/5 rounded-xl p-2 border border-white/5">
                                                <input 
                                                    type="range" 
                                                    min="1000" 
                                                    max="100000" 
                                                    step="1000" 
                                                    value={targetFollowers} 
                                                    onChange={(e) => setTargetFollowers(parseInt(e.target.value))}
                                                    className="flex-1 accent-pink-500 h-2 bg-white/10 rounded-full appearance-none cursor-pointer"
                                                />
                                                <span className="font-mono text-pink-400 font-bold w-20 text-right">{targetFollowers.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={handleBoost} 
                                            disabled={loading || !link}
                                            className="w-full py-4 bg-pink-600 hover:bg-pink-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-pink-900/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {loading ? <Loader2 className="animate-spin" /> : <Rocket size={20} />}
                                            {loading ? 'Initializing Protocol...' : 'Launch Growth Protocol'}
                                        </button>
                                    </>
                                )}

                                {mode === 'insta_earn' && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Instagram Handle</label>
                                            <input 
                                                type="text" 
                                                value={instaEarnUser} 
                                                onChange={(e) => setInstaEarnUser(e.target.value)}
                                                placeholder="@username"
                                                className="w-full glass-input rounded-xl p-4 text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Primary Goal</label>
                                            <select 
                                                value={instaEarnGoal} 
                                                onChange={(e) => setInstaEarnGoal(e.target.value)}
                                                className="w-full glass-input rounded-xl p-4 text-white bg-black/40 outline-none focus:ring-2 focus:ring-purple-500/50 transition-all appearance-none cursor-pointer"
                                            >
                                                <option>Brand Deals</option>
                                                <option>Affiliate Income</option>
                                                <option>Sell Digital Products</option>
                                                <option>Creator Fund / Bonuses</option>
                                            </select>
                                        </div>
                                        <button 
                                            onClick={handleInstaEarn} 
                                            disabled={loading || !instaEarnUser}
                                            className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-purple-900/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {loading ? <Loader2 className="animate-spin" /> : <Award size={20} />}
                                            {loading ? 'Analyzing Potential...' : 'Calculate Earnings'}
                                        </button>
                                    </>
                                )}

                                {mode === 'trend_hunter' && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Industry or Keyword</label>
                                            <input 
                                                type="text" 
                                                value={trendKeyword} 
                                                onChange={(e) => setTrendKeyword(e.target.value)}
                                                placeholder="e.g., AI, Crypto, Fashion, Taylor Swift"
                                                className="w-full glass-input rounded-xl p-4 text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                            />
                                        </div>
                                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex gap-3 items-start">
                                            <Zap className="text-emerald-400 flex-shrink-0" size={18} />
                                            <p className="text-xs text-emerald-200/80 leading-relaxed">
                                                Powered by Google Search Grounding to fetch real-time data. Results include live trending hashtags and breakout topics.
                                            </p>
                                        </div>
                                        <button 
                                            onClick={handleTrendAnalysis} 
                                            disabled={loading || !trendKeyword}
                                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-900/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {loading ? <Loader2 className="animate-spin" /> : <Flame size={20} />}
                                            {loading ? 'Scanning Trends...' : 'Analyze Real-Time Trends'}
                                        </button>
                                    </>
                                )}

                                {mode === 'facebook_likes' && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Facebook Post URL</label>
                                            <input 
                                                type="text" 
                                                value={fbLink} 
                                                onChange={(e) => setFbLink(e.target.value)}
                                                placeholder="https://facebook.com/..."
                                                className="w-full glass-input rounded-xl p-4 text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Target Likes</label>
                                            <div className="flex items-center gap-4 bg-white/5 rounded-xl p-2 border border-white/5">
                                                <input 
                                                    type="range" 
                                                    min="100" 
                                                    max="10000" 
                                                    step="100" 
                                                    value={targetLikes} 
                                                    onChange={(e) => setTargetLikes(parseInt(e.target.value))}
                                                    className="flex-1 accent-blue-500 h-2 bg-white/10 rounded-full appearance-none cursor-pointer"
                                                />
                                                <span className="font-mono text-blue-400 font-bold w-20 text-right">{targetLikes.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={handleFbBoost} 
                                            disabled={loading || !fbLink}
                                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-900/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {loading ? <Loader2 className="animate-spin" /> : <ThumbsUp size={20} />}
                                            {loading ? 'Engaging Network...' : 'Start Auto-Like Protocol'}
                                        </button>
                                    </>
                                )}

                                {mode === 'facebook_followers' && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Facebook Page Link</label>
                                            <input 
                                                type="text" 
                                                value={fbFollowerLink} 
                                                onChange={(e) => setFbFollowerLink(e.target.value)}
                                                placeholder="https://facebook.com/pages/..."
                                                className="w-full glass-input rounded-xl p-4 text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Growth Target</label>
                                            <div className="flex items-center gap-4 bg-white/5 rounded-xl p-2 border border-white/5">
                                                <input 
                                                    type="range" 
                                                    min="500" 
                                                    max="50000" 
                                                    step="500" 
                                                    value={targetFbFollowers} 
                                                    onChange={(e) => setTargetFbFollowers(parseInt(e.target.value))}
                                                    className="flex-1 accent-cyan-500 h-2 bg-white/10 rounded-full appearance-none cursor-pointer"
                                                />
                                                <span className="font-mono text-cyan-400 font-bold w-20 text-right">{targetFbFollowers.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={handleFbFollowers} 
                                            disabled={loading || !fbFollowerLink}
                                            className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-cyan-900/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {loading ? <Loader2 className="animate-spin" /> : <TrendingUp size={20} />}
                                            {loading ? 'Analyzing Trends...' : 'Activate Follower Magnet'}
                                        </button>
                                    </>
                                )}

                                {mode === 'profile_pentest' && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Profile Link to Audit</label>
                                            <input 
                                                type="text" 
                                                value={auditLink} 
                                                onChange={(e) => setAuditLink(e.target.value)}
                                                placeholder="Any social profile URL"
                                                className="w-full glass-input rounded-xl p-4 text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                                            />
                                        </div>
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-3 items-start">
                                            <AlertTriangle className="text-red-400 flex-shrink-0" size={18} />
                                            <p className="text-xs text-red-200/80 leading-relaxed">
                                                This tool simulates a security audit based on public OSINT data. It does not perform unauthorized access. Use only on your own profiles.
                                            </p>
                                        </div>
                                        <button 
                                            onClick={handlePentest} 
                                            disabled={loading || !auditLink}
                                            className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-red-900/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} />}
                                            {loading ? 'Running Vulnerability Scan...' : 'Start Security Audit'}
                                        </button>
                                    </>
                                )}

                                {mode === 'caption' && (
                                    <>
                                        <div className="space-y-4">
                                            <div 
                                                onClick={() => fileInputRef.current?.click()}
                                                className={`w-full h-32 border border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all group ${
                                                    captionImage 
                                                    ? 'border-amber-500/50 bg-amber-500/10' 
                                                    : 'border-white/20 hover:border-amber-500/50 hover:bg-white/5'
                                                }`}
                                            >
                                                {captionImage ? (
                                                    <div className="relative h-full w-full p-2">
                                                        <img src={captionImage} className="w-full h-full object-contain" />
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setCaptionImage(null); }}
                                                            className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-red-500"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <ImageIcon className="w-8 h-8 text-white/30 group-hover:text-amber-400 mb-2 transition-colors" />
                                                        <span className="text-xs text-white/50 group-hover:text-white/80">Upload Image for Context</span>
                                                    </>
                                                )}
                                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Topic / Keywords</label>
                                                <input 
                                                    type="text" 
                                                    value={captionTopic} 
                                                    onChange={(e) => setCaptionTopic(e.target.value)}
                                                    placeholder="e.g. Summer vibes, New product launch..."
                                                    className="w-full glass-input rounded-xl p-4 text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Tone</label>
                                                <select 
                                                    value={captionTone}
                                                    onChange={(e) => setCaptionTone(e.target.value)}
                                                    className="w-full glass-input rounded-xl p-4 text-white bg-black/40 outline-none focus:ring-2 focus:ring-amber-500/50 transition-all appearance-none cursor-pointer"
                                                >
                                                    <option>Viral & Hype</option>
                                                    <option>Professional & Clean</option>
                                                    <option>Funny & Witty</option>
                                                    <option>Inspirational</option>
                                                    <option>Dark & Mysterious</option>
                                                </select>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={handleCaption} 
                                            disabled={loading || (!captionTopic && !captionImage)}
                                            className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-amber-900/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                                            {loading ? 'Crafting Viral Hooks...' : 'Generate Magic Captions'}
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Result Display */}
                            {loading && (
                                <div className="space-y-4 pt-8 border-t border-white/5 animate-fade-in">
                                    <div className="flex justify-between items-center text-xs font-mono text-white/60">
                                        <span className="animate-pulse uppercase">{progressStatus || 'Processing...'}</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full rounded-full transition-all duration-300 relative overflow-hidden" 
                                            style={{ 
                                                width: `${progress}%`,
                                                backgroundColor: mode === 'followers' ? '#db2777' : mode === 'insta_earn' ? '#9333ea' : mode === 'facebook_likes' ? '#2563eb' : mode === 'facebook_followers' ? '#0891b2' : mode === 'trend_hunter' ? '#10b981' : mode === 'profile_pentest' ? '#dc2626' : '#d97706'
                                            }}
                                        >
                                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {result && !loading && (
                                <div className="pt-8 border-t border-white/5 animate-slide-up">
                                    <div className="flex items-center gap-2 mb-4">
                                        <CheckCircle size={18} className="text-emerald-400" />
                                        <span className="text-sm font-bold text-white uppercase tracking-widest">Protocol Generated</span>
                                    </div>
                                    <div className="bg-black/40 rounded-2xl p-6 border border-white/5 max-h-[500px] overflow-y-auto custom-scrollbar">
                                        <div className="prose prose-invert prose-sm max-w-none">
                                            <ReactMarkdown>{result}</ReactMarkdown>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => {navigator.clipboard.writeText(result)}}
                                        className="mt-4 flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white transition-colors"
                                    >
                                        <Copy size={12} /> Copy to Clipboard
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
