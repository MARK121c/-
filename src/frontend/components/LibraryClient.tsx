'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Link as LinkIcon, Video, Wrench, Rocket, Bookmark, ExternalLink, 
  Trash2, PlusCircle, CheckCircle2, PlayCircle, Loader2, Zap, Brain, 
  ChevronRight, ArrowRight, BookOpen, Layers, Filter, Settings, X
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
  getCategories: () => fetch('/api/library/categories').then(r => r.json()),
  addCategory: (name: string) => fetch('/api/library/categories', { method: 'POST', body: JSON.stringify({ name }) }),
  deleteCategory: (id: number) => fetch(`/api/library/categories?id=${id}`, { method: 'DELETE' }),
};

export default function LibraryClient() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'video' | 'tool' | 'idea' | 'link'>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [urlInput, setUrlInput] = useState('');
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [search, setSearch] = useState('');
  const [manualType, setManualType] = useState<'video' | 'tool' | 'idea'>('video');
  const [manualThumbnail, setManualThumbnail] = useState('');
  const [manualCategory, setManualCategory] = useState('learning');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCatManager, setShowCatManager] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [resData, catData] = await Promise.all([
        api.getResources(),
        api.getCategories()
      ]);
      setResources(resData.resources || []);
      setCategories(catData.categories || []);
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
        title: meta.title || urlInput,
        url: urlInput,
        thumbnail: manualThumbnail.trim() || meta.thumbnail,
        type: manualType,
        category: manualCategory,
        notes: ''
      });
      setUrlInput('');
      setManualThumbnail('');
      loadData();
    } catch (e) {
      await api.addResource({
        title: urlInput,
        url: urlInput,
        thumbnail: manualThumbnail.trim() || null,
        type: manualType,
        category: manualCategory
      });
      setUrlInput('');
      setManualThumbnail('');
      loadData();
    }
    setFetchingMetadata(false);
  };

  const filteredResources = resources.filter(res => {
    const matchesTab = activeTab === 'all' || res.type === activeTab;
    const matchesCategory = activeCategory === 'all' || res.category === activeCategory;
    const matchesSearch = res.title.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesCategory && matchesSearch;
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
      <div className="max-w-4xl mx-auto mb-16">
         <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="grand-card p-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-emerald-500/20 border-white/10 shadow-2xl shadow-blue-500/5 overflow-hidden">
            <form onSubmit={handleQuickAdd} className="p-2 space-y-4">
               <div className="flex items-center gap-2">
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
               </div>

               <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4 pb-4 pt-2 border-t border-white/5">
                  <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 w-full md:w-auto">
                     {[
                        { id: 'video', label: '🎬 فيديو' },
                        { id: 'tool', label: '🛠️ أداة' },
                        { id: 'idea', label: '💡 فكرة' }
                     ].map(t => (
                        <button 
                          key={t.id}
                          type="button"
                          onClick={() => setManualType(t.id as any)}
                          className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-sm font-black transition-all ${manualType === t.id ? 'bg-white/10 text-white border border-white/10' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                           {t.label}
                        </button>
                     ))}
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="relative group w-full md:w-60">
                       <LinkIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600" size={16}/>
                       <input 
                          value={manualThumbnail}
                          onChange={e => setManualThumbnail(e.target.value)}
                          placeholder="رابط صورة مخصص..." 
                          className="w-full bg-black/30 border border-white/10 rounded-xl pr-12 pl-4 py-2 text-sm text-white focus:border-blue-500/50 outline-none font-bold placeholder:text-gray-700" 
                       />
                    </div>
                    <div className="relative group w-full md:w-56">
                       <Settings className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600" size={16}/>
                       <select 
                          value={manualCategory}
                          onChange={e => setManualCategory(e.target.value)}
                          className="w-full bg-black/30 border border-white/10 rounded-xl pr-12 pl-4 py-2 text-sm text-white focus:border-emerald-500/50 outline-none font-bold appearance-none cursor-pointer" 
                       >
                          <option value="learning">اختر التصنيف...</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                          ))}
                          <option value="manage">+ إدارة التصنيفات</option>
                       </select>
                    </div>
                    {manualCategory === 'manage' && (
                      <button 
                        type="button"
                        onClick={() => { setShowCatManager(true); setManualCategory('learning'); }}
                        className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 hover:bg-emerald-500 hover:text-black transition-all"
                      >
                         <PlusCircle size={20} />
                      </button>
                    )}
                  </div>
               </div>
            </form>
         </motion.div>
      </div>

      {/* 🧭 NAVIGATION & SIDEBAR LAYOUT */}
      <div className="flex flex-col lg:flex-row gap-8 mb-12 px-4 items-start">
         {/* Categories Sidebar */}
         <div className="w-full lg:w-64 flex-shrink-0 bg-gray-900/30 p-6 rounded-[2.5rem] border border-white/5 backdrop-blur-sm sticky top-8">
            <h3 className="text-gray-500 font-black text-xs uppercase tracking-[0.2em] mb-6 px-2">مكتباتك المتخصصة</h3>
            <div className="flex flex-col gap-2">
               <button 
                 onClick={() => setActiveCategory('all')}
                 className={`flex items-center justify-between w-full px-5 py-3.5 rounded-2xl font-black transition-all ${activeCategory === 'all' ? 'bg-blue-500 text-black shadow-lg shadow-blue-500/20' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}
               >
                  <div className="flex items-center gap-3"><Layers size={18} /> الكل</div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-lg ${activeCategory === 'all' ? 'bg-black/20' : 'bg-white/5'}`}>{resources.length}</span>
               </button>
               
               {categories.map(cat => (
                 <button 
                   key={cat.id}
                   onClick={() => setActiveCategory(cat.name)}
                   className={`flex items-center justify-between w-full px-5 py-3.5 rounded-2xl font-black transition-all ${activeCategory === cat.name ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}
                 >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </div>
                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-lg">
                      {resources.filter(r => r.category === cat.name).length}
                    </span>
                 </button>
               ))}

               <button 
                 onClick={() => setShowCatManager(true)}
                 className="flex items-center gap-3 w-full px-5 py-3.5 rounded-2xl font-black text-blue-400/50 hover:text-blue-400 transition-all border border-blue-500/10 border-dashed mt-4 text-sm"
               >
                  <PlusCircle size={18} /> إدارة التصنيفات
               </button>
            </div>
         </div>

         {/* Main Content Area */}
         <div className="flex-1 w-full space-y-10">
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-black/20 p-4 rounded-[2.5rem] border border-white/5">
               <div className="flex gap-2 p-1 bg-gray-900 rounded-[2rem] border border-white/5">
                  {[
                    { id: 'all', label: 'الكل', icon: <Layers size={16} /> },
                    { id: 'video', label: 'فيديوهات', icon: <Video size={16} /> },
                    { id: 'tool', label: 'أدوات', icon: <Zap size={16} /> },
                    { id: 'idea', label: 'أفكار', icon: <Brain size={16} /> }
                  ].map(tab => (
                    <button 
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-[1.5rem] font-black text-sm transition-all ${activeTab === tab.id ? 'bg-white/10 text-white border border-white/10' : 'text-gray-500 hover:text-white'}`}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  ))}
               </div>

               <div className="relative group w-full md:w-72">
                  <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-400 transition-colors" size={18} />
                  <input 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="ابحث في المخزن..." 
                    className="w-full bg-gray-900 border border-white/5 rounded-[1.5rem] pr-12 pl-6 py-3.5 outline-none focus:border-blue-500/30 transition-all font-bold text-sm" 
                  />
               </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-40 gap-6">
                 <Loader2 className="animate-spin text-blue-500" size={48} />
                 <p className="text-gray-500 font-black animate-pulse text-xl">يتم فتح مكتبتك الخاصة...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                 <AnimatePresence mode="popLayout">
                  {filteredResources.map(r => (
                    <motion.div 
                      key={r.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="grand-card bg-gray-950/40 border-white/5 overflow-hidden group hover:border-blue-500/30 transition-all flex flex-col h-full shadow-2xl"
                    >
                       <div className="relative aspect-video bg-gray-900 overflow-hidden">
                          {r.thumbnail ? (
                            <img src={r.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-70 group-hover:opacity-100" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-800 bg-gradient-to-br from-gray-900 to-black">
                               {getTypeIcon(r.type)}
                            </div>
                          )}
                          <div className="absolute top-4 right-4 p-2.5 bg-black/60 backdrop-blur-md rounded-xl text-blue-400 border border-white/10 shadow-xl">
                             {getTypeIcon(r.type)}
                          </div>
                          {r.status === 'done' && (
                             <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-[2px] flex items-center justify-center">
                                <CheckCircle2 className="text-emerald-400 drop-shadow-2xl" size={80} />
                             </div>
                          )}
                       </div>

                       <div className="p-7 flex-1 flex flex-col">
                          <div className="flex items-start justify-between mb-4 gap-3">
                             <h3 className="text-lg font-black text-white leading-snug flex-1 line-clamp-2 group-hover:text-amber-400 transition-colors uppercase">{r.title}</h3>
                             <div className="shrink-0">{getStatusIcon(r.status)}</div>
                          </div>
                          
                          <div className="flex items-center gap-3 mb-8 text-[10px] font-black text-gray-500 uppercase tracking-widest bg-white/3 w-max px-3 py-1.5 rounded-lg border border-white/5">
                             <span className="flex items-center gap-1.5 text-emerald-400"><Layers size={10}/> {r.category}</span>
                             <span className="w-1 h-1 bg-gray-700 rounded-full" />
                             <span className="eng-num">{new Date(r.createdAt).toLocaleDateString('ar-EG')}</span>
                          </div>

                          <div className="mt-auto space-y-3">
                             <div className="flex gap-2">
                                {r.url && (
                                   <a 
                                     href={r.url} 
                                     target="_blank" 
                                     className="flex-1 bg-white/5 hover:bg-blue-500 hover:text-black py-3 rounded-xl flex items-center justify-center gap-2 font-black transition-all border border-white/5 text-xs"
                                   >
                                     <ExternalLink size={14} /> فتح الرابط
                                   </a>
                                )}
                                <button 
                                  onClick={() => api.deleteResource(r.id).then(loadData)}
                                  className="p-3 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
                                >
                                   <Trash2 size={16} />
                                </button>
                             </div>

                             <div className="grid grid-cols-2 gap-2">
                                <button 
                                  onClick={async () => {
                                     await api.convertToTask(r.title);
                                     alert('تمت الإضافة للمهام بنجاح!');
                                  }}
                                  className="bg-amber-500/10 text-amber-500 py-2.5 rounded-lg font-black text-[9px] uppercase border border-amber-500/20 hover:bg-amber-500 hover:text-black transition-all tracking-tighter"
                                >
                                   تحويل لمهمة عمل
                                </button>
                                <button 
                                  onClick={() => api.updateStatus(r.id, r.status === 'done' ? 'pending' : 'done').then(loadData)}
                                  className={`py-2.5 rounded-lg font-black text-[9px] uppercase border transition-all tracking-tighter ${r.status === 'done' ? 'bg-gray-800 text-gray-500 border-white/5' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500 hover:text-black'}`}
                                >
                                   {r.status === 'done' ? 'تراجع عن الإنجاز' : 'تم التنفيذ بنجاح'}
                                </button>
                             </div>
                          </div>
                       </div>
                    </motion.div>
                  ))}
               </AnimatePresence>
            </div>
         )}
         </div>
      </div>

      {/* Manager Modal */}
      <AnimatePresence>
        {showCatManager && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
             <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-gray-900 border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative">
                <button onClick={() => setShowCatManager(false)} className="absolute top-6 left-6 p-2 text-gray-500 hover:text-white"><X size={24} /></button>
                <h2 className="text-2xl font-black text-white mb-8 border-r-4 border-emerald-500 pr-5">إدارة تصنيفات المكتبة</h2>
                
                <div className="space-y-4 mb-8">
                   <div className="flex gap-2">
                      <input 
                        value={newCatName}
                        onChange={e => setNewCatName(e.target.value)}
                        placeholder="مثل: مونتاج، برمجة، تصميم..." 
                        className="flex-1 bg-black/50 border border-white/5 rounded-xl px-4 py-3 font-bold text-white outline-none focus:border-emerald-500/50" 
                      />
                      <button 
                        onClick={async () => {
                           if (!newCatName.trim()) return;
                           await api.addCategory(newCatName);
                           setNewCatName('');
                           loadData();
                        }}
                        className="p-3 bg-emerald-500 text-black rounded-xl font-black"
                      >
                         <Plus size={24} />
                      </button>
                   </div>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                   {categories.map(cat => (
                     <div key={cat.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                        <span className="font-black text-gray-300">{cat.name}</span>
                        <button onClick={() => api.deleteCategory(cat.id).then(loadData)} className="text-rose-500 p-2 hover:bg-rose-500/10 rounded-lg transition-all"><Trash2 size={18} /></button>
                     </div>
                   ))}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
