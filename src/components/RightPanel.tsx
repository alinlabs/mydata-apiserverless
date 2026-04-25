import React from 'react';
import { ResultData } from '../types';
import { Settings2, Scan, Copy, CheckCircle2, SlidersHorizontal, Scissors } from 'lucide-react';

interface RightPanelProps {
  resultData: ResultData | null;
  scale: number;
  setScale: (s: number) => void;
  invertColor: boolean;
  setInvertColor: (c: boolean) => void;
  startTime: string;
  setStartTime: (t: string) => void;
  endTime: string;
  setEndTime: (t: string) => void;
  getShareUrl: () => string;
  copyToClipboard: () => void;
  copied: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function RightPanel({
  resultData,
  scale,
  setScale,
  invertColor,
  setInvertColor,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  getShareUrl,
  copyToClipboard,
  copied,
  isOpen = false,
  onClose
}: RightPanelProps) {

  const shareUrlLocal = resultData ? getShareUrl() : '';
  const parsedUrl = resultData && shareUrlLocal ? new URL(shareUrlLocal, window.location.origin) : null;

  return (
    <aside className={`w-[280px] sm:w-80 bg-white border-l border-slate-200 flex flex-col h-full shadow-[-4px_0_24px_rgba(0,0,0,0.02)] shrink-0 absolute inset-y-0 right-0 z-20 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex-shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-slate-800" />
          <h2 className="text-sm font-bold tracking-wider uppercase text-slate-800">
            {resultData?.type === 'video' || resultData?.type === 'audio' ? 'Media Editor' : 'File Settings'}
          </h2>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        )}
      </div>

      {!resultData || !parsedUrl ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
          <SlidersHorizontal className="w-12 h-12 text-slate-200 mb-4" />
          <p className="text-sm font-medium">No file selected</p>
          <p className="text-xs mt-1">Select a file to adjust its properties.</p>
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* Image Settings */}
            {resultData.type === 'image' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-bold text-slate-700 tracking-wider">SCALE ({scale}%)</label>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="500" 
                    value={scale}
                    onChange={(e) => setScale(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 mt-2">
                    <span>1%</span>
                    <span>Orig</span>
                    <span>500%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Scan className="w-4 h-4 text-slate-500" />
                    <label className="text-xs font-bold text-slate-700">INVERT COLORS</label>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      value="" 
                      className="sr-only peer" 
                      checked={invertColor}
                      onChange={(e) => setInvertColor(e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            )}

            {/* Media Settings */}
            {(resultData.type === 'video' || resultData.type === 'audio') && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Scissors className="w-4 h-4 text-slate-500" />
                  <label className="text-xs font-bold text-slate-700 tracking-wider">TRIM MEDIA</label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Start (sec)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">End (sec)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="∞"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                  Settings only affect playback in compatible browsers using URL media fragments.
                </p>
              </div>
            )}
            
            {/* Meta Info */}
            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-4 break-all leading-tight">
                {resultData.filename}
              </h3>
              <dl className="space-y-3 text-xs">
                <div>
                  <dt className="text-slate-400 font-medium mb-0.5">Path</dt>
                  <dd className="text-slate-700 font-mono bg-slate-50 px-2 py-1 rounded border border-slate-100 break-all">{parsedUrl.pathname.substring(1)}</dd>
                </div>
                {parsedUrl.search && (
                  <div>
                    <dt className="text-slate-400 font-medium mb-0.5">Query Params</dt>
                    <dd className="text-slate-700 font-mono break-all">{parsedUrl.search}</dd>
                  </div>
                )}
                {parsedUrl.hash && (
                  <div>
                    <dt className="text-slate-400 font-medium mb-0.5">Fragment</dt>
                    <dd className="text-slate-700 font-mono break-all">{parsedUrl.hash}</dd>
                  </div>
                )}
                {resultData.type === 'image' && (
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-50">
                    <div>
                      <dt className="text-slate-400 font-medium mb-0.5">Original Size</dt>
                      <dd className="text-slate-700 font-mono">{resultData.width} × {resultData.height}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400 font-medium mb-0.5">Scaled Size</dt>
                      <dd className="text-slate-700 font-mono">{Math.max(1, Math.round((resultData.width * scale) / 100))} × {Math.max(1, Math.round((resultData.height * scale) / 100))}</dd>
                    </div>
                  </div>
                )}
              </dl>
            </div>
          </div>
          
          {/* Footer controls (Sticky) */}
          <div className="p-6 border-t border-slate-100 bg-slate-50/80 backdrop-blur-sm shrink-0">
            <label className="text-xs font-bold text-slate-700 tracking-wider mb-2 block">DIRECT ASSET URL</label>
            <div className="space-y-2">
              <input 
                type="text" 
                readOnly 
                value={shareUrlLocal}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm transition-all"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button 
                onClick={copyToClipboard}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold shadow-sm transition-all duration-200 ${
                  copied 
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                    : 'bg-gradient-to-r from-[#3b82f6] via-[#8b5cf6] to-[#ec4899] text-white hover:opacity-90'
                }`}
              >
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'COPIED!' : 'COPY URL'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
