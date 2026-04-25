import React from 'react';
import { ResultData } from '../types';
import { Layers, ExternalLink } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

interface PreviewProps {
  resultData: ResultData | null;
  getShareUrl: () => string;
}

export default function Preview({ resultData, getShareUrl }: PreviewProps) {
  return (
    <main className="flex-1 w-full bg-slate-50 relative flex items-center justify-center p-4 sm:p-8 overflow-hidden z-0 min-h-0">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
      
      {!resultData ? (
        <div className="relative z-10 text-center flex flex-col items-center justify-center max-w-sm">
          <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center mb-6">
            <Layers className="w-10 h-10 text-slate-300" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Select a file</h2>
          <p className="text-sm text-slate-500 text-balance leading-relaxed">Choose an item from the repository sidebar to view its details and generate sharing links.</p>
        </div>
      ) : (
        <div className="relative z-10 w-full h-full max-w-4xl flex items-center justify-center">
          <div className={`${resultData.type === 'image' ? 'p-4 sm:p-6' : 'bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 p-6 sm:p-10'} w-full max-h-full flex flex-col items-center justify-center overflow-hidden group`}>
            
            <div className={`relative w-full flex items-center justify-center flex-1 overflow-hidden min-h-[300px] ${resultData.type === 'image' ? 'cursor-grab active:cursor-grabbing' : ''}`}>
              {resultData.type === 'image' && (
                <TransformWrapper 
                  initialScale={1} 
                  minScale={0.5} 
                  maxScale={10} 
                  centerOnInit={true}
                  wheel={{ step: 0.1 }}
                >
                  <TransformComponent wrapperStyle={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={getShareUrl()} alt="Selected File" className="max-w-full max-h-full object-contain rounded-lg drop-shadow-md mix-blend-multiply" />
                  </TransformComponent>
                </TransformWrapper>
              )}
              {resultData.type === 'video' && (
                <div className="w-full max-w-3xl rounded-xl overflow-hidden shadow-lg border border-slate-100 bg-black">
                  <video key={getShareUrl()} src={getShareUrl()} controls className="w-full h-auto max-h-[60vh] outline-none" />
                </div>
              )}
              {resultData.type === 'audio' && (
                <div className="w-full max-w-md bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center">
                  <div className="w-24 h-24 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                  </div>
                  <audio key={getShareUrl()} src={getShareUrl()} controls className="w-full outline-none" />
                </div>
              )}
              {(resultData.type === 'document' || resultData.type === 'other') && (
                <div className="text-center flex flex-col items-center max-w-md">
                  <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-6 border border-emerald-100 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Preview not available</h3>
                  <p className="text-slate-500 text-sm mb-8">This file type cannot be previewed directly in the browser.</p>
                  <a 
                    href={getShareUrl()} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors shadow-sm hover:shadow"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open File Explicitly
                  </a>
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}
    </main>
  );
}
