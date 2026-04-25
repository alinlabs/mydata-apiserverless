import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Preview from './components/Preview';
import RightPanel from './components/RightPanel';
import { GalleryItem, ResultData } from './types';

export default function App() {
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [copied, setCopied] = useState(false);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [totalSize, setTotalSize] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [scale, setScale] = useState<number>(100);
  const [invertColor, setInvertColor] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');

  // Mobile sidebar states
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLeftSidebarOpen(false);
        setIsRightSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const fetchGallery = async () => {
    try {
      const res = await fetch('/api/gallery');
      if (res.ok) {
        const data = await res.json();
        if (data.error) {
          alert('Backend Error: ' + data.error);
        }
        setGallery(data.files || []);
        setTotalSize(data.totalSizeBytes || 0);
      }
    } catch (e) {
      console.error('Failed to fetch gallery', e);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const getShareUrl = (url: string = resultData?.url || '', currentScale: number = scale, currentInvert: boolean = invertColor, start: string = startTime, end: string = endTime, isLocal = false) => {
    if (!url) return '';
    try {
      const isRelative = url.startsWith('/');
      const urlObj = isRelative ? new URL(url, window.location.origin) : new URL(url);
      
      if (currentScale !== 100) {
        urlObj.searchParams.set('scale', currentScale.toString());
      } else {
        urlObj.searchParams.delete('scale');
      }

      if (currentInvert) {
        urlObj.searchParams.set('invert', 'true');
      } else {
        urlObj.searchParams.delete('invert');
      }

      if ((resultData?.type === 'video' || resultData?.type === 'audio') && (start || end)) {
        urlObj.hash = `#t=${start || ''}${end ? ',' + end : ''}`;
      } else {
        urlObj.hash = '';
      }

      if (isLocal) {
        return urlObj.pathname + urlObj.search + urlObj.hash;
      }
      return `https://mydata-apiserverless.vercel.app${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
    } catch {
      const base = isLocal ? url.split('#')[0] : `https://mydata-apiserverless.vercel.app/${url.split('#')[0]}`;
      const params = new URLSearchParams();
      if (currentScale !== 100) params.set('scale', currentScale.toString());
      if (currentInvert) params.set('invert', 'true');
      const q = params.toString();
      
      let finalUrl = q ? `${base}?${q}` : base;
      if ((resultData?.type === 'video' || resultData?.type === 'audio') && (start || end)) {
        finalUrl += `#t=${start || ''}${end ? ',' + end : ''}`;
      }
      return finalUrl;
    }
  };

  const copyToClipboard = () => {
    if (!resultData) return;
    navigator.clipboard.writeText(getShareUrl(resultData.url, scale, invertColor, startTime, endTime));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectGalleryItem = (item: GalleryItem) => {
    setResultData({
      id: item.id,
      url: item.url,
      filename: item.filename,
      category: item.category,
      width: item.width,
      height: item.height,
      type: item.type
    });
    setScale(100);
    setInvertColor(false);
    setStartTime('');
    setEndTime('');
    
    // Auto-open right panel on select for mobile
    if (window.innerWidth < 1024) {
      setIsLeftSidebarOpen(false);
      setIsRightSidebarOpen(true);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden w-full bg-slate-50 font-sans text-slate-800">
      <Header 
        onToggleLeft={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
        onToggleRight={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
      />
      <div className="flex-1 flex overflow-hidden relative min-h-0 bg-slate-50">
        <Sidebar 
          gallery={gallery}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          resultData={resultData}
          onSelectItem={handleSelectGalleryItem}
          totalSize={totalSize}
          isOpen={isLeftSidebarOpen}
          onClose={() => setIsLeftSidebarOpen(false)}
        />
        
        <Preview 
          resultData={resultData}
          getShareUrl={() => getShareUrl(resultData?.url, scale, invertColor, startTime, endTime, true)}
        />
        
        <RightPanel 
          resultData={resultData}
          scale={scale}
          setScale={setScale}
          invertColor={invertColor}
          setInvertColor={setInvertColor}
          startTime={startTime}
          setStartTime={setStartTime}
          endTime={endTime}
          setEndTime={setEndTime}
          getShareUrl={() => getShareUrl(resultData?.url, scale, invertColor, startTime, endTime, false)}
          copyToClipboard={copyToClipboard}
          copied={copied}
          isOpen={isRightSidebarOpen}
          onClose={() => setIsRightSidebarOpen(false)}
        />

        {/* Mobile Overlays */}
        {(isLeftSidebarOpen || isRightSidebarOpen) && (
          <div 
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm z-10 lg:hidden" 
            onClick={() => {
              setIsLeftSidebarOpen(false);
              setIsRightSidebarOpen(false);
            }} 
          />
        )}
      </div>
    </div>
  );
}
