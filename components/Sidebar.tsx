
import React from 'react';
import { 
  AudioWaveform, 
  Video, 
  Image as ImageIcon, 
  Sparkles, 
  Menu,
  Phone,
  X,
  Code2,
  Users,
  CreditCard,
  Globe,
  LayoutGrid,
  Layers,
  Moon,
  Sun
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  isOpen: boolean;
  toggle: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isOpen, toggle, isDarkMode, toggleTheme }) => {
  const menuItems = [
    { id: 'home', label: 'Home', icon: LayoutGrid },
    { id: 'chat', label: 'Intelligence', icon: Sparkles },
    { id: 'live', label: 'Secure Voice', icon: Phone },
    { id: 'nexus', label: 'Nexus Browser', icon: Globe },
    { id: 'remix', label: 'Remix Lab', icon: Layers },
    { id: 'builder', label: 'App Studio', icon: Code2 },
    { id: 'video', label: 'Video Lab', icon: Video },
    { id: 'image', label: 'Visual Lab', icon: ImageIcon },
    { id: 'audio', label: 'Audio Engine', icon: AudioWaveform },
    { id: 'social', label: 'Social Grid', icon: Users },
    { id: 'card-gen', label: 'Card Architect', icon: CreditCard },
  ];

  return (
    <>
        <button 
            onClick={toggle}
            className="lg:hidden fixed top-6 left-6 z-[70] p-4 bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-2xl text-black dark:text-white shadow-2xl active:scale-95 transition-transform"
        >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className={`fixed inset-y-0 left-0 z-[60] w-80 transform transition-transform duration-700 cubic-bezier(0.2, 0.8, 0.2, 1) ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
            <div className="h-full w-full bg-white/60 dark:bg-black/30 backdrop-blur-[60px] border-r border-black/5 dark:border-white/5 flex flex-col transition-colors duration-500">
                <div className="p-10 pb-6 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-4 mb-3">
                             <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl ring-1 ring-white/20">
                                 <Sparkles className="text-white w-5 h-5" />
                             </div>
                             <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white/90">
                                Gemini Suite
                            </h1>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-white/30 font-bold tracking-[0.25em] uppercase pl-14">Ultra Pro Max</p>
                    </div>
                </div>

                <nav className="px-6 space-y-2 flex-1 overflow-y-auto py-6 no-scrollbar">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentView === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setView(item.id);
                                    if (window.innerWidth < 1024) toggle();
                                }}
                                className={`group w-full flex items-center gap-4 px-5 py-4 rounded-3xl transition-all duration-500 relative overflow-hidden ${
                                    isActive 
                                    ? 'text-slate-900 dark:text-white shadow-lg bg-white/40 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10' 
                                    : 'text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                                }`}
                            >
                                <div className={`relative z-10 p-2.5 rounded-xl transition-all duration-500 ${
                                    isActive ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl scale-110 text-white' : 'bg-black/5 dark:bg-white/5'
                                }`}>
                                    <Icon size={18} />
                                </div>
                                <span className="font-semibold tracking-wide text-sm relative z-10">{item.label}</span>
                                
                                {isActive && (
                                    <div className="absolute right-6 w-1 h-4 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-8 border-t border-black/5 dark:border-white/5 bg-black/5 dark:bg-black/20">
                    <div className="flex items-center justify-between gap-4">
                        <button
                            onClick={toggleTheme}
                            className="p-3 rounded-2xl bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/5 text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10 transition-all active:scale-95"
                            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        >
                            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        
                        <div className="flex-1 flex items-center justify-end gap-3 text-[10px] font-bold text-slate-400 dark:text-white/30 bg-white/40 dark:bg-white/5 rounded-2xl p-3 px-4 border border-black/5 dark:border-white/5">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                            <span className="opacity-60">v17.2</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </>
  );
};
