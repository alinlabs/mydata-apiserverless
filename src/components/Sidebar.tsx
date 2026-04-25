import React from 'react';
import { GalleryItem, ResultData } from '../types';
import { Search, Image, FileText, Video, Music, HardDrive, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  gallery: GalleryItem[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  resultData: ResultData | null;
  onSelectItem: (item: GalleryItem) => void;
  totalSize: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  gallery,
  searchQuery,
  setSearchQuery,
  resultData,
  onSelectItem,
  totalSize,
  isOpen = false,
  onClose
}: SidebarProps) {

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredGallery = gallery.filter(item => 
    item.filename.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedGallery = filteredGallery.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, GalleryItem[]>);

  const categories = Object.keys(groupedGallery).sort();

  const getIconForType = (type: string) => {
    switch (type) {
      case 'image': return <Image className="w-5 h-5 text-blue-500" />;
      case 'video': return <Video className="w-5 h-5 text-purple-500" />;
      case 'audio': return <Music className="w-5 h-5 text-pink-500" />;
      case 'document': return <FileText className="w-5 h-5 text-emerald-500" />;
      default: return <FileText className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <aside className={`w-[280px] sm:w-80 bg-white border-r border-slate-200 flex flex-col h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)] shrink-0 absolute inset-y-0 left-0 z-20 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
      
      {/* Header Area */}
      <div className="p-6 pb-4 flex-shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-800">
          <HardDrive className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-bold tracking-wider uppercase">Repository</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-medium">
            {filteredGallery.length}
          </span>
          {onClose && (
            <button onClick={onClose} className="lg:hidden p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          )}
        </div>
      </div>

      <div className="px-6 pb-6 border-b border-slate-100 flex-shrink-0">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all text-sm"
          />
        </div>
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <AnimatePresence>
          {categories.map((category) => (
            <motion.div 
              key={category}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 px-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {category}
                </h3>
                <div className="h-px bg-slate-100 flex-1 ml-2"></div>
              </div>
              
              <div className="space-y-1">
                {groupedGallery[category].map((item) => {
                  const isSelected = resultData?.id === item.id;
                  return (
                    <button
                      key={item.id} 
                      onClick={() => onSelectItem(item)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-colors duration-200 group ${
                        isSelected 
                          ? 'bg-primary/5 shadow-[inset_0_0_0_1px_theme(colors.primary/0.2)]' 
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className={`w-12 h-12 flex items-center justify-center shrink-0 bg-transparent ${isSelected ? 'scale-110 transition-transform' : ''}`}>
                        {item.type === 'image' ? (
                          <img src={item.url} alt="" className="w-full h-full object-contain mix-blend-multiply drop-shadow-sm" />
                        ) : (
                          getIconForType(item.type)
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : 'text-slate-700 group-hover:text-slate-900'}`}>
                          {item.filename.replace(/\.[^/.]+$/, "")}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5 font-mono">
                          {formatSize(item.size)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredGallery.length === 0 && (
          <div className="text-center py-10 px-4">
            <Filter className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">No files found</p>
            <p className="text-xs text-slate-400 mt-1">Try a different search term</p>
          </div>
        )}
      </div>
      
      {/* Footer Area */}
      <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Storage Usage</p>
        <div className="flex items-end justify-between mb-3">
          <span className="text-xl font-bold text-slate-800 font-mono tracking-tight">{formatSize(totalSize)}</span>
          <span className="text-xs text-slate-500 mb-1">Total</span>
        </div>
        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#3b82f6] via-[#8b5cf6] to-[#ec4899] w-full rounded-full"></div>
        </div>
      </div>
    </aside>
  );
}
