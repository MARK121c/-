'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Link as LinkIcon, Video, Wrench, Rocket, Bookmark, ExternalLink, 
  Trash2, PlusCircle, CheckCircle2, PlayCircle, Loader2, Zap, Brain, 
  ChevronRight, ArrowRight, BookOpen, Layers, Filter
} from 'lucide-react';

interface Resource {
  id: number;
  title: string;
  type: 'video' | 'tool' | 'idea' | 'link';
  url: string | null;
  thumbnail: string | null;
  category: string;
  status: 'pending' | 'in_progress' | 'done';
  notes: string | null;
  createdAt: string;
}

const api = {
  getResources: () => fetch('/api/library').then(r => r.json()),
  getMetadata: (url: string) => fetch(`/api/library/metadata?url=${encodeURIComponent(url)}`).then(r => r.json()),
  addResource: (data: any) => fetch('/api/library', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id: number, status: string) => fetch('/api/library', { method: 'PATCH', body: JSON.stringify({ id, status }) }),
  deleteResource: (id: number) => fetch(`/api/library?id=${id}`, { method: 'DELETE' }),
  convertToTask: (title: string) => fetch('/api/tasks', { method: 'POST', body: JSON.stringify({ title, type: 'today', priority: 'medium', date: new Date().toISOString().split('T')[0] }) }),
  convertToSub: (name: string, amount: number) => fetch('/api/subscriptions', { method: 'POST', body: JSON.stringify({ name, amount, startDate: new Date().toISOString().split('T')[0], billingCycle: 'monthly' }) }),
};

export default function LibraryClient() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'video' | 'tool' | 'idea' | 'link'>('all');
  const [urlInput, setUrlInput] = useState('');
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getResources();
      setResources(data.resources || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleQuickAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!urlInput.trim()) return;

    setFetchingMetadata(true);
    try {
      const meta = await api.getMetadata(urlInput);
      await api.addResource({
        title: meta.title,
        url: urlInput,
        thumbnail: meta.thumbnail,
        type: meta.type,
        category: 'learning',
        notes: ''
      });
      setUrlInput('');
      loadData();
    } catch (e) {
      // Fallback if metadata fails
      await api.addResource({
        title: urlInput,
        url: urlInput,
        type: 'link',
        category: 'learning'
      });
      setUrlInput('');
      loadData();
    }
    setFetchingMetadata(false);
  };

  const filteredResources = resources.filter(r => {
    const matchesTab = activeTab === 'all' || r.type === activeTab;
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    if (status === 'done') return <CheckCircle2 className="text-emerald-400" size={18} />;
    if (status === 'in_progress') return <PlayCircle className="text-blue-400" size={18} />;
    return <Bookmark className="text-gray-500" size={18} />;
  };

  const getTypeIcon = (type: string) => {
    if (type === 'video') return <Video size={20} />;
    if (type === 'tool') return <Wrench size={20} />;
    if (type === 'idea') return <Brain size={20} />;
    return <LinkIcon size={20} />;
  };

  return (
    <div className="text-gray-100 min-h-screen pb-20">
      {/* 🚀 QUICK ADD SEARCH SECTION */}
      <div className="max-w-4xl mx-auto mb-16 text-center">
         <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="grand-card p-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-emerald-500/20 border-white/10 shadow-2xl shadow-blue-500/5">
            <form onSubmit={handleQuickAdd} className="flex items-center gap-2 p-2">
               <div className="p-4 text-blue-400"><Plus size={28} /></div>
               <input 
                 value={urlInput}
                 onChange={e => setUrlInput(e.target.value)}
                 placeholder="أضف رابط فيديو، أداة، أو فكرة جديدة بسرعة..." 
                 className="flex-1 bg-transparent border-none outline-none text-2xl font-black text-white placeholder-gray-600 px-4" 
               />
               <button 
                 disabled={fetchingMetadata || !urlInput.trim()}
                 className={`px-10 py-5 rounded-2.5xl font-black text-xl transition-all ${fetchingMetadata ? 'bg-gray-800 text-gray-500' : 'bg-blue-500 text-black hover:scale-105 active:scale-95 shadow-xl shadow-blue-500/20'}`}
               >
                 {fetchingMetadata ? <Loader2 className="animate-spin" /> : 'حفظ'}
               </button>
            </form>
         </motion.div>
         <p className="mt-4 text-gray-500 font-bold uppercase tracking-widest text-[10px]">نظام المخزن الذكي: أضف الروابط وسأقوم بالباقي</p>
      </div>

      {/* 🧭 NAVIGATION TABS */}
      <div className="flex flex-col lg:flex-row gap-8 items-center justify-between mb-12 px-4">
         <div className="flex gap-2 p-2 bg-gray-900/50 rounded-[2.5rem] border border-white/5 backdrop-blur-md">
            {[
              { id: 'all', label: 'الكل', icon: <Layers size={18} /> },
              { id: 'video', label: 'فيديوهات التعليم', icon: <Video size={18} /> },
              { id: 'tool', label: 'أدوات ومواقع', icon: <Zap size={18} /> },
              { id: 'idea', label: 'أفكار للتنفيذ', icon: <Brain size={18} /> }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 px-8 py-4 rounded-[2rem] font-black transition-all ${activeTab === tab.id ? 'bg-blue-500 text-black shadow-xl shadow-blue-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
         </div>

         <div className="relative group w-full lg:w-72">
            <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-400 transition-colors" size={20} />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث في المخزن..." 
              className="w-full bg-gray-900 border border-white/10 rounded-[2rem] pr-14 pl-6 py-4 outline-none focus:border-blue-500/50 transition-all font-bold" 
            />
         </div>
      </div>

      {/* 🖼️ RESOURCES GRID */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-6">
           <Loader2 className="animate-spin text-blue-500" size={48} />
           <p className="text-gray-500 font-black animate-pulse">يتم فتح مكتبتك الخاصة...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
           <AnimatePresence>
            {filteredResources.map(r => (
              <motion.div 
                key={r.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="grand-card bg-gray-950/50 border-white/5 overflow-hidden group hover:border-blue-500/30 transition-all flex flex-col"
              >
                 {/* Thumbnail / Header */}
                 <div className="relative aspect-video bg-gray-900 overflow-hidden">
                    {r.thumbnail ? (
                      <img src={r.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-100" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-800">
                         {getTypeIcon(r.type)}
                      </div>
                    )}
                    <div className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-md rounded-xl text-blue-400 border border-white/10">
                       {getTypeIcon(r.type)}
                    </div>
                    {r.status === 'done' && (
                       <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center">
                          <CheckCircle2 className="text-emerald-400" size={64} />
                       </div>
                    )}
                 </div>

                 {/* Content */}
                 <div className="p-8 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                       <h3 className="text-xl font-black text-white leading-tight flex-1 line-clamp-2">{r.title}</h3>
                       <div className="mr-2">{getStatusIcon(r.status)}</div>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-8 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                       <span className="flex items-center gap-1"><Layers size={12}/> {r.category}</span>
                       <span className="w-1 h-1 bg-gray-700 rounded-full" />
                       <span>{new Date(r.createdAt).toLocaleDateString('ar-EG')}</span>
                    </div>

                    <div className="mt-auto space-y-4">
                       <div className="flex gap-2">
                          {r.url && (
                             <a 
                               href={r.url} 
                               target="_blank" 
                               className="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl flex items-center justify-center gap-2 font-black transition-all border border-white/5"
                             >
                               <ExternalLink size={16} /> فتح
                             </a>
                          )}
                          <button 
                            onClick={() => api.deleteResource(r.id).then(loadData)}
                            className="p-3 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
                          >
                             <Trash2 size={18} />
                          </button>
                       </div>

                       <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={async () => {
                               await api.convertToTask(r.title);
                               alert('تمت الإضافة للمهام بنجاح!');
                            }}
                            className="bg-blue-500/10 text-blue-400 py-3 rounded-xl font-black text-[10px] uppercase border border-blue-500/20 hover:bg-blue-500 hover:text-black transition-all"
                          >
                             تطوير لمهمة
                          </button>
                          <button 
                            onClick={() => api.updateStatus(r.id, r.status === 'done' ? 'pending' : 'done').then(loadData)}
                            className={`py-3 rounded-xl font-black text-[10px] uppercase border transition-all ${r.status === 'done' ? 'bg-gray-800 text-gray-500 border-white/5' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500 hover:text-black'}`}
                          >
                             {r.status === 'done' ? 'تراجع' : 'تم الإنجاز'}
                          </button>
                       </div>
                    </div>
                 </div>
              </motion.div>
            ))}
           </AnimatePresence>
           
           {filteredResources.length === 0 && (
             <div className="col-span-full py-40 text-center flex flex-col items-center gap-6">
                <BookOpen className="text-gray-800" size={64} />
                <p className="text-gray-600 text-2xl font-black italic">المخزن فارغ في هذا القسم... ابدأ بجمع المعرفة 📚</p>
             </div>
           )}
        </div>
      )}
    </div>
  );
}
