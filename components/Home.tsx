
import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  MessageSquare, 
  Video, 
  Image as ImageIcon, 
  Mic, 
  Globe, 
  Zap,
  Activity,
  CreditCard,
  Code2,
  Cloud,
  Cpu,
  Wifi,
  Battery,
  Calendar,
  Bell,
  HelpCircle,
  BatteryCharging,
  WifiOff,
  X,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

interface HomeProps {
  setView: (view: string) => void;
  onReplayTour?: () => void;
}

export const Home: React.FC<HomeProps> = ({ setView, onReplayTour }) => {
  const [time, setTime] = useState(new Date());
  
  // Real-time System State
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [isCharging, setIsCharging] = useState(false);
  const [cpuUsage, setCpuUsage] = useState(12);
  const [networkType, setNetworkType] = useState('WIFI');
  const [networkStatus, setNetworkStatus] = useState('Connected');
  const [isOnline, setIsOnline] = useState(true);

  // Notification State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifContainerRef = useRef<HTMLDivElement>(null);

  // Time Update
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // CPU Simulation (Browsers don't provide real CPU usage for security, so we simulate activity)
  useEffect(() => {
    const cpuInterval = setInterval(() => {
        // Fluctuate between 5% and 35% typically to mimic idle/light usage
        const targetUsage = Math.floor(Math.random() * 30) + 5;
        setCpuUsage(prev => {
            // Smooth interpolation
            const diff = targetUsage - prev;
            return Math.round(prev + diff * 0.2);
        });
    }, 1500);
    return () => clearInterval(cpuInterval);
  }, []);

  // Battery API
  useEffect(() => {
    let battery: any;
    
    const updateBattery = () => {
        if (battery) {
            setBatteryLevel(Math.floor(battery.level * 100));
            setIsCharging(battery.charging);
        }
    };

    const initBattery = async () => {
        // @ts-ignore - Navigator extended
        if (navigator.getBattery) {
            try {
                // @ts-ignore
                battery = await navigator.getBattery();
                updateBattery();
                battery.addEventListener('levelchange', updateBattery);
                battery.addEventListener('chargingchange', updateBattery);
            } catch (e) {
                console.log("Battery API not supported/blocked");
            }
        }
    };

    initBattery();

    return () => {
        if (battery) {
            battery.removeEventListener('levelchange', updateBattery);
            battery.removeEventListener('chargingchange', updateBattery);
        }
    };
  }, []);

  // Network Information API
  useEffect(() => {
      const handleOnline = () => { setIsOnline(true); setNetworkStatus('Connected'); };
      const handleOffline = () => { setIsOnline(false); setNetworkStatus('Offline'); };
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      setIsOnline(navigator.onLine);
      setNetworkStatus(navigator.onLine ? 'Connected' : 'Offline');

      // @ts-ignore - Network Information API
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      const updateConnection = () => {
          if (connection) {
              // Map effectiveType (4g, 3g, etc) to display string
              let type = connection.effectiveType ? connection.effectiveType.toUpperCase() : 'WIFI';
              if (type === '4G') type = '5G'; // Modernize for UI feel if fast
              setNetworkType(type);
              
              if (connection.downlink) {
                  // If we have speed info, maybe update status text
                  setNetworkStatus(connection.downlink > 10 ? 'High Speed' : 'Stable');
              }
          }
      };

      if (connection) {
          updateConnection();
          connection.addEventListener('change', updateConnection);
      }

      return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
          if (connection) {
              connection.removeEventListener('change', updateConnection);
          }
      };
  }, []);

  // Real-time Notifications Simulation
  useEffect(() => {
      // Initial sample notifications
      setNotifications([
          { id: 1, title: 'Welcome to Gemini Suite', type: 'info', time: 'Just now' },
          { id: 2, title: 'System Optimized', type: 'success', time: '2 mins ago' }
      ]);

      const notifTemplates = [
          { title: "Veo Rendering Complete", type: "success" },
          { title: "New Message from Gemini", type: "info" },
          { title: "High CPU Usage Detected", type: "warning" },
          { title: "Cloud Sync Finished", type: "success" },
          { title: "Network Switched to 5G", type: "info" },
          { title: "Security Scan Completed", type: "success" },
          { title: "New Feature Available", type: "info" }
      ];

      const interval = setInterval(() => {
          if (Math.random() > 0.7) { // 30% chance every 8s
              const template = notifTemplates[Math.floor(Math.random() * notifTemplates.length)];
              const newNotif = {
                  id: Date.now(),
                  title: template.title,
                  type: template.type,
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              };
              setNotifications(prev => [newNotif, ...prev].slice(0, 8)); // Keep last 8
          }
      }, 8000);

      // Close dropdown when clicking outside
      const handleClickOutside = (event: MouseEvent) => {
          if (notifContainerRef.current && !notifContainerRef.current.contains(event.target as Node)) {
              setShowNotifications(false);
          }
      };

      document.addEventListener('mousedown', handleClickOutside);

      return () => {
          clearInterval(interval);
          document.removeEventListener('mousedown', handleClickOutside);
      };
  }, []);

  const quickAccess = [
    { id: 'chat', title: 'Intelligence', icon: MessageSquare, desc: 'Gemini 3 Pro', gradient: 'from-blue-500/20 to-indigo-500/20', accent: 'text-blue-500 dark:text-blue-400' },
    { id: 'live', title: 'Secure Voice', icon: Mic, desc: 'Encrypted Link', gradient: 'from-emerald-500/20 to-teal-500/20', accent: 'text-emerald-500 dark:text-emerald-400' },
    { id: 'nexus', title: 'Nexus Web', icon: Globe, desc: 'Deep Browser', gradient: 'from-cyan-500/20 to-blue-500/20', accent: 'text-cyan-500 dark:text-cyan-400' },
    { id: 'video', title: 'Video Lab', icon: Video, desc: 'Veo Cinematic', gradient: 'from-purple-500/20 to-pink-500/20', accent: 'text-purple-500 dark:text-purple-400' },
    { id: 'image', title: 'Visual Lab', icon: ImageIcon, desc: 'Pro Generation', gradient: 'from-pink-500/20 to-rose-500/20', accent: 'text-pink-500 dark:text-pink-400' },
    { id: 'builder', title: 'App Studio', icon: Code2, desc: 'Code Generator', gradient: 'from-amber-500/20 to-orange-500/20', accent: 'text-amber-500 dark:text-amber-400' },
  ];

  return (
    <div className="h-full w-full overflow-y-auto p-6 lg:p-10 animate-fade-in custom-scrollbar relative z-10 selection:bg-blue-500/20">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-100/50 dark:from-blue-900/20 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Top Bar */}
        <div className="flex items-center justify-between pb-4">
            <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-400 dark:text-white/40 tracking-[0.2em] uppercase">System Dashboard</span>
                <span className="text-sm font-medium text-slate-700 dark:text-white/80">
                    {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
            </div>
            <div className="flex items-center gap-4">
                <button 
                  onClick={onReplayTour}
                  className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/10 backdrop-blur-md hover:bg-white/80 dark:hover:bg-white/10 transition-all text-xs font-bold text-slate-500 dark:text-white/60"
                >
                  <HelpCircle size={14} /> Quick Tour
                </button>
                <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/10 backdrop-blur-md">
                    <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'} animate-pulse`} />
                    <span className="text-xs font-bold text-slate-700 dark:text-white/80 tracking-wide">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                </div>
                
                {/* Notification Bell */}
                <div className="relative" ref={notifContainerRef}>
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={`p-3 rounded-full bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10 transition-all active:scale-95 relative ${showNotifications ? 'bg-white/80 dark:bg-white/20' : ''}`}
                    >
                        <Bell size={18} className="text-slate-700 dark:text-white/80" />
                        {notifications.length > 0 && (
                            <span className="absolute top-2.5 right-3 w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full border border-white dark:border-black animate-pulse" />
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 top-14 w-80 bg-white/80 dark:bg-[#151515]/90 backdrop-blur-2xl border border-black/5 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-slide-up origin-top-right">
                            <div className="p-4 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-white/5">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-white/60">Notifications</span>
                                <button 
                                    onClick={() => setNotifications([])} 
                                    className="text-[10px] font-bold text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-wide"
                                >
                                    Clear All
                                </button>
                            </div>
                            <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="p-10 text-center flex flex-col items-center gap-3 text-slate-400 dark:text-white/20">
                                        <Bell size={24} className="opacity-20" />
                                        <span className="text-xs font-medium">No new notifications</span>
                                    </div>
                                ) : (
                                    notifications.map(n => (
                                        <div key={n.id} className="p-4 border-b border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex gap-4 group">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                n.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 
                                                n.type === 'warning' ? 'bg-amber-500/10 text-amber-500' : 
                                                'bg-blue-500/10 text-blue-500'
                                            }`}>
                                                {n.type === 'success' ? <CheckCircle size={14} /> : 
                                                 n.type === 'warning' ? <AlertCircle size={14} /> : 
                                                 <Info size={14} />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-slate-800 dark:text-white/90 leading-tight mb-1">{n.title}</p>
                                                <p className="text-[10px] font-medium text-slate-400 dark:text-white/40">{n.time}</p>
                                            </div>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setNotifications(prev => prev.filter(item => item.id !== n.id));
                                                }}
                                                className="text-slate-400 dark:text-white/20 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Hero Section */}
        <div className="relative group rounded-[3rem] p-[1px] bg-gradient-to-br from-white/60 via-white/40 to-white/60 dark:from-white/20 dark:via-white/5 dark:to-white/10 shadow-xl dark:shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 rounded-[3rem] blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-1000" />
            
            <div className="relative h-full rounded-[3rem] bg-white/60 dark:bg-black/40 backdrop-blur-[60px] overflow-hidden p-8 lg:p-14">
                
                {/* Internal Gloss */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-50 dark:opacity-30 pointer-events-none" />
                
                <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-12">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 dark:border-blue-400/30 backdrop-blur-md">
                            <Sparkles size={12} className="text-blue-600 dark:text-blue-300" />
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-200 uppercase tracking-wider">Premium Access</span>
                        </div>
                        
                        <div className="space-y-1">
                            <h2 className="text-2xl text-slate-500 dark:text-white/60 font-light tracking-tight">Welcome back,</h2>
                            <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:via-white dark:to-white/60 drop-shadow-sm font-sans tracking-tight">
                                ꧁Rᴀʙʙʏ Eғᴛʏ꧂
                            </h1>
                        </div>

                        <div className="flex flex-wrap gap-4 pt-4">
                            <button 
                                onClick={() => setView('chat')}
                                className="px-8 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-black font-bold flex items-center gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 transition-all active:scale-95"
                            >
                                <MessageSquare size={18} /> Resume Chat
                            </button>
                            <button 
                                onClick={() => setView('nexus')}
                                className="px-8 py-4 rounded-2xl bg-white/60 dark:bg-white/5 text-slate-900 dark:text-white font-bold border border-black/5 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10 flex items-center gap-2 backdrop-blur-md transition-all active:scale-95 shadow-sm"
                            >
                                <Globe size={18} /> Launch Nexus
                            </button>
                        </div>
                    </div>

                    {/* Glass Widgets - REAL TIME DATA */}
                    <div className="flex gap-4 w-full lg:w-auto overflow-x-auto no-scrollbar pb-2 lg:pb-0">
                         {/* System Widget */}
                        <div className="min-w-[160px] p-5 rounded-3xl bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/10 backdrop-blur-xl flex flex-col justify-between h-40 relative group overflow-hidden shadow-sm">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 dark:from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex justify-between items-start relative z-10">
                                <Cpu size={20} className="text-emerald-500 dark:text-emerald-400" />
                                <span className="text-[10px] font-bold text-slate-400 dark:text-white/40">CPU</span>
                            </div>
                            <div className="relative z-10">
                                <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{cpuUsage}%</div>
                                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">{cpuUsage > 70 ? 'Heavy Load' : 'Optimal'}</div>
                            </div>
                            <div className="h-1 w-full bg-black/5 dark:bg-white/10 rounded-full mt-2 overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-700 ${cpuUsage > 70 ? 'bg-red-500' : 'bg-emerald-500 dark:bg-emerald-400'}`} 
                                    style={{ width: `${cpuUsage}%` }}
                                />
                            </div>
                        </div>

                        {/* Network Widget */}
                         <div className="min-w-[160px] p-5 rounded-3xl bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/10 backdrop-blur-xl flex flex-col justify-between h-40 relative group overflow-hidden shadow-sm">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 dark:from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex justify-between items-start relative z-10">
                                {isOnline ? <Wifi size={20} className="text-blue-500 dark:text-blue-400" /> : <WifiOff size={20} className="text-red-500" />}
                                <span className="text-[10px] font-bold text-slate-400 dark:text-white/40">NET</span>
                            </div>
                            <div className="relative z-10">
                                <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono truncate">{isOnline ? networkType : '--'}</div>
                                <div className={`text-xs font-medium mt-1 ${isOnline ? 'text-blue-600 dark:text-blue-400' : 'text-red-500'}`}>{isOnline ? networkStatus : 'No Signal'}</div>
                            </div>
                            <div className="flex gap-0.5 mt-2">
                                {[1,2,3,4,5].map(i => (
                                    <div key={i} className={`h-1 w-full rounded-full transition-colors duration-500 ${isOnline ? 'bg-blue-500 dark:bg-blue-400' : 'bg-black/5 dark:bg-white/10'}`} style={{ opacity: isOnline ? 1 : 0.2 }} />
                                ))}
                            </div>
                        </div>

                         {/* Battery Widget */}
                         <div className="min-w-[160px] p-5 rounded-3xl bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/10 backdrop-blur-xl flex flex-col justify-between h-40 relative group overflow-hidden shadow-sm">
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 dark:from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex justify-between items-start relative z-10">
                                {isCharging ? <BatteryCharging size={20} className="text-yellow-500 dark:text-yellow-400 animate-pulse" /> : <Battery size={20} className={batteryLevel < 20 ? "text-red-500" : "text-yellow-500 dark:text-yellow-400"} />}
                                <span className="text-[10px] font-bold text-slate-400 dark:text-white/40">PWR</span>
                            </div>
                            <div className="relative z-10">
                                <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{batteryLevel}%</div>
                                <div className="text-xs text-yellow-600 dark:text-yellow-400 font-medium mt-1">{isCharging ? 'Charging' : batteryLevel === 100 ? 'Charged' : 'Discharging'}</div>
                            </div>
                             <div className="h-1 w-full bg-black/5 dark:bg-white/10 rounded-full mt-2 overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 ${batteryLevel < 20 ? 'bg-red-500' : 'bg-yellow-500 dark:bg-yellow-400'}`} 
                                    style={{ width: `${batteryLevel}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Quick Access Grid */}
        <div>
            <div className="flex items-center gap-3 mb-6 px-2">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-white/60" />
                <h3 className="text-sm font-bold text-slate-500 dark:text-white/60 uppercase tracking-widest">Applications</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {quickAccess.map((item) => {
                    const Icon = item.icon;
                    return (
                        <button 
                            key={item.id}
                            onClick={() => setView(item.id)}
                            className="group relative h-40 rounded-[2.5rem] p-[1px] bg-gradient-to-br from-white/40 via-white/20 to-transparent dark:from-white/10 dark:via-white/5 dark:to-transparent hover:from-white/60 dark:hover:from-white/20 transition-all duration-500 active:scale-[0.98] shadow-md dark:shadow-none"
                        >
                            <div className="absolute inset-0 bg-white/60 dark:bg-black/40 backdrop-blur-xl rounded-[2.5rem]" />
                            <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2.5rem]`} />
                            
                            <div className="relative h-full p-6 flex items-start justify-between z-10">
                                <div className="flex flex-col justify-between h-full">
                                    <div className={`w-12 h-12 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-center backdrop-blur-md group-hover:scale-110 transition-transform duration-500 ${item.accent}`}>
                                        <Icon size={22} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{item.title}</h3>
                                        <p className="text-xs text-slate-500 dark:text-white/40 group-hover:text-slate-700 dark:group-hover:text-white/60 transition-colors">{item.desc}</p>
                                    </div>
                                </div>
                                
                                <div className="w-8 h-8 rounded-full border border-black/5 dark:border-white/5 flex items-center justify-center bg-white/50 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
                                    <Zap size={14} className="text-slate-900 dark:text-white" />
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
      </div>
    </div>
  );
};
