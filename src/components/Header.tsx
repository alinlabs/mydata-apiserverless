import React, { useState, useEffect } from 'react';
import { LayoutDashboard, BookOpen, Settings, Download, Menu, PanelRight } from 'lucide-react';
import logoImage from '../images/logo.png';

interface HeaderProps {
  onToggleLeft?: () => void;
  onToggleRight?: () => void;
}

export default function Header({ onToggleLeft, onToggleRight }: HeaderProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 z-30 shrink-0 relative">
      <div className="flex items-center gap-2 sm:gap-3">
        {onToggleLeft && (
          <button onClick={onToggleLeft} className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden">
            <Menu className="w-5 h-5" />
          </button>
        )}
        <img src={logoImage} alt="Logo" className="h-8 sm:h-10 w-auto object-contain" />
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-slate-800 tracking-tight">MyData</h1>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#59C3E8] text-white">Serverless</span>
        </div>
      </div>
      
      <nav className="flex items-center gap-1">
        {isInstallable && (
          <button 
            onClick={handleInstallClick}
            className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] hover:opacity-90 transition-opacity shadow-sm mr-1 sm:mr-2"
          >
            <Download className="w-4 h-4 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Install App</span>
          </button>
        )}
        <div className="hidden md:flex items-center gap-1">
          <button className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
            <LayoutDashboard className="w-4 h-4 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <button className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
            <BookOpen className="w-4 h-4 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Docs</span>
          </button>
          <button className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
            <Settings className="w-4 h-4 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
        {onToggleRight && (
          <button onClick={onToggleRight} className="p-2 -mr-2 rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden ml-1">
            <PanelRight className="w-5 h-5" />
          </button>
        )}
      </nav>
    </header>
  );
}
