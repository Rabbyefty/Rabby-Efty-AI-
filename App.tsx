
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { SmartChat } from './components/SmartChat';
import { LiveVoice } from './components/LiveVoice';
import { VideoStudio } from './components/VideoStudio';
import { ImageStudio } from './components/ImageStudio';
import { AudioStudio } from './components/AudioStudio';
import { AppBuilder } from './components/AppBuilder';
import { SocialStudio } from './components/SocialStudio';
import { CreditCardGenerator } from './components/CreditCardGenerator';
import { NexusBrowser } from './components/NexusBrowser';
import { RemixStudio } from './components/RemixStudio';
import { OnboardingTour } from './components/OnboardingTour';
import { Home } from './components/Home';
import { ChevronLeft } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // Check local storage or system preference
    const storedTheme = localStorage.getItem('gemini_theme');
    if (storedTheme) {
      setIsDarkMode(storedTheme === 'dark');
    } else {
      // Default to dark
      setIsDarkMode(true);
    }

    const hasCompletedTour = localStorage.getItem('gemini_suite_onboarding_completed');
    if (!hasCompletedTour) {
      setShowOnboarding(true);
    }
  }, []);

  // Update HTML class when theme changes
  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add('dark');
      localStorage.setItem('gemini_theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('gemini_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  const completeOnboarding = () => {
    localStorage.setItem('gemini_suite_onboarding_completed', 'true');
    setShowOnboarding(false);
  };

  const goHome = () => setCurrentView('home');

  return (
    <div className="h-screen w-screen text-slate-900 dark:text-slate-100 flex overflow-hidden selection:bg-pink-500/30 transition-colors duration-500">
      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
        isOpen={sidebarOpen}
        toggle={() => setSidebarOpen(!sidebarOpen)}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />
      
      <main className="flex-1 lg:ml-80 h-full transition-all duration-300 relative flex flex-col min-w-0">
          <div className="flex-1 h-full overflow-hidden relative">
            {currentView === 'home' && <Home setView={setCurrentView} onReplayTour={() => setShowOnboarding(true)} />}
            {currentView === 'chat' && <SmartChat onViewChange={setCurrentView} />}
            {currentView === 'live' && <LiveVoice />}
            {currentView === 'builder' && <AppBuilder goHome={goHome} />}
            {currentView === 'video' && <VideoStudio />}
            {currentView === 'image' && <ImageStudio />}
            {currentView === 'audio' && <AudioStudio />}
            {currentView === 'social' && <SocialStudio goHome={goHome} />}
            {currentView === 'card-gen' && <CreditCardGenerator />}
            {currentView === 'nexus' && <NexusBrowser goHome={goHome} />}
            {currentView === 'remix' && <RemixStudio />}
          </div>

          {/* Glossy Glass Back Gesture Control */}
          {currentView !== 'home' && (
            <div className="absolute bottom-8 left-8 z-50 animate-slide-up">
                <button 
                    onClick={goHome}
                    className="group relative flex items-center gap-3 pl-2 pr-6 py-2 rounded-full bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-300 hover:bg-white/60 dark:hover:bg-white/10 active:scale-95 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-black/5 dark:from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-center group-hover:border-black/20 dark:group-hover:border-white/30 transition-colors relative z-10">
                        <ChevronLeft size={18} className="text-black dark:text-white group-hover:-translate-x-0.5 transition-transform" />
                    </div>
                    <div className="flex flex-col items-start relative z-10">
                        <span className="text-[9px] uppercase font-bold text-black/40 dark:text-white/40 tracking-[0.2em] group-hover:text-black/60 dark:group-hover:text-white/60 transition-colors">Navigate</span>
                        <span className="text-sm font-semibold text-black/90 dark:text-white/90 group-hover:text-black dark:group-hover:text-white">Return Home</span>
                    </div>
                </button>
            </div>
          )}

          {showOnboarding && (
            <OnboardingTour 
              onComplete={completeOnboarding} 
              onJumpTo={setCurrentView}
            />
          )}
      </main>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
      )}
    </div>
  );
};

export default App;
