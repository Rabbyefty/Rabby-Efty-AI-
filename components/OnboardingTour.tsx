
import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  MessageSquare, 
  Mic, 
  Video, 
  Globe, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Zap, 
  CheckCircle2,
  Cpu,
  ShieldCheck,
  Star
} from 'lucide-react';

interface OnboardingTourProps {
  onComplete: () => void;
  onJumpTo: (view: string) => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete, onJumpTo }) => {
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const steps = [
    {
      title: "The Future of AI",
      subtitle: "Welcome to Creative Suite 2026",
      desc: "Experience a unified intelligence environment powered by Gemini 3 and Veo. Your personal studio for creation, reasoning, and real-time interaction.",
      icon: Sparkles,
      color: "blue",
      accent: "from-blue-500 to-indigo-600",
      feature: "All-in-one Hub"
    },
    {
      title: "Deep Intelligence",
      subtitle: "Conversational Reasoning",
      desc: "Engage with Smart Chat using Gemini 3 Pro. Featuring deep reasoning modes and Google Search grounding for real-time accurate data.",
      icon: MessageSquare,
      color: "indigo",
      accent: "from-indigo-500 to-purple-600",
      targetView: "chat",
      feature: "Smart Chat"
    },
    {
      title: "Secure Voice Link",
      subtitle: "Real-time Interaction",
      desc: "Connect instantly with Gemini Live. Ultra-low latency voice conversations with native audio processing for a truly human feel.",
      icon: Mic,
      color: "emerald",
      accent: "from-emerald-500 to-teal-600",
      targetView: "live",
      feature: "Live Voice"
    },
    {
      title: "Cinematic Creation",
      subtitle: "Veo Video Lab",
      desc: "Transform your ideas into stunning 1080p cinematic videos. Powered by Veo 3.1 for high-fidelity generative motion.",
      icon: Video,
      color: "purple",
      accent: "from-purple-500 to-pink-600",
      targetView: "video",
      feature: "Video Studio"
    },
    {
      title: "Nexus & Beyond",
      subtitle: "Web & Code Mastery",
      desc: "Browse the deep web securely with Nexus Browser or architect full-stack applications in seconds with the App Studio.",
      icon: Globe,
      color: "cyan",
      accent: "from-cyan-500 to-blue-600",
      targetView: "nexus",
      feature: "Nexus Browser"
    }
  ];

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else onComplete();
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  const current = steps[step];
  const Icon = current.icon;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-2xl animate-fade-in">
      {/* Ambient Glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-${current.color}-500/10 blur-[120px] rounded-full transition-all duration-1000`} />

      <div className="relative w-full max-w-2xl glass-panel p-1 border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden animate-scale-in">
        <div className="bg-[#0a0a0b]/80 backdrop-blur-[80px] rounded-[2.4rem] p-10 lg:p-14 relative overflow-hidden">
          
          {/* Header Controls */}
          <div className="absolute top-8 right-8 flex items-center gap-4">
             <button 
                onClick={onComplete} 
                className="flex items-center gap-2 group px-4 py-2 rounded-full hover:bg-white/5 transition-all"
             >
                <span className="text-[10px] font-bold text-white/40 group-hover:text-white uppercase tracking-widest transition-colors">Skip Tour</span>
                <X size={14} className="text-white/40 group-hover:text-white transition-colors" />
             </button>
          </div>

          <div className="flex flex-col items-center text-center space-y-8">
            {/* Animated Icon */}
            <div className={`relative group`}>
                <div className={`absolute inset-0 bg-gradient-to-tr ${current.accent} blur-2xl opacity-20 group-hover:opacity-40 transition-opacity`} />
                <div className={`w-24 h-24 rounded-3xl bg-gradient-to-tr ${current.accent} p-[1px] shadow-2xl animate-bounce-slow`}>
                    <div className="w-full h-full bg-[#0a0a0b] rounded-[1.4rem] flex items-center justify-center">
                        <Icon size={40} className="text-white" />
                    </div>
                </div>
            </div>

            <div className="space-y-4 max-w-md">
                <div className="space-y-1">
                    <p className={`text-[10px] font-bold uppercase tracking-[0.3em] bg-clip-text text-transparent bg-gradient-to-r ${current.accent}`}>
                        Step {step + 1} of {steps.length} • {current.feature}
                    </p>
                    <h2 className="text-4xl font-bold text-white tracking-tight leading-tight">{current.title}</h2>
                    <h3 className="text-lg font-medium text-white/60">{current.subtitle}</h3>
                </div>
                <p className="text-white/40 leading-relaxed font-medium">
                    {current.desc}
                </p>
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-col items-center gap-6 w-full max-w-sm pt-8">
                <div className="flex gap-4 w-full">
                    {step > 0 && (
                        <button 
                            onClick={prev}
                            className="p-5 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all active:scale-95"
                        >
                            <ChevronLeft size={24} />
                        </button>
                    )}
                    <button 
                        onClick={next}
                        className={`flex-1 py-5 rounded-2xl bg-white text-black font-bold text-lg flex items-center justify-center gap-2 hover:bg-white/90 shadow-2xl transition-all active:scale-95`}
                    >
                        {step === steps.length - 1 ? "Get Started" : "Continue"}
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Quick Jump (for steps after intro) */}
                {current.targetView && (
                    <button 
                        onClick={() => { onJumpTo(current.targetView!); onComplete(); }}
                        className="flex items-center gap-2 text-[10px] font-bold text-white/30 hover:text-white/60 uppercase tracking-widest transition-all"
                    >
                        Jump directly to {current.feature} <Star size={10} className="fill-current" />
                    </button>
                )}

                {/* Progress Indicators */}
                <div className="flex gap-2">
                    {steps.map((_, i) => (
                        <div 
                            key={i} 
                            className={`h-1 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-white' : 'w-2 bg-white/10'}`} 
                        />
                    ))}
                </div>
            </div>
          </div>

          {/* Decorative Corner Elements */}
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 blur-3xl rounded-full" />
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 blur-3xl rounded-full" />
        </div>
      </div>
    </div>
  );
};
