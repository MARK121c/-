'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder, FolderPlus, FileText, Code2, Download, ExternalLink,
  Plus, Edit2, Trash2, ChevronRight, ArrowRight, Copy, Check, File, Sparkles, X,
  CheckSquare, Link2, Video, Calendar, Clock, BookOpen, AlertCircle,
  CheckCircle2, Circle, Maximize2, Eye
} from 'lucide-react';

export interface FolderItem {
  id: number;
  folder_id: number;
  subject_id: number;
  title: string;
  content: string;
  item_type: 'lecture' | 'assignment' | 'resource' | 'video' | 'note' | 'code' | 'file';
  code_snippet: string;
  code_language: string;
  file_url: string;
  file_name: string;
  file_size: number;
  due_date?: string;
  is_completed?: number;
  created_at: string;
}

export interface AcademicFolder {
  id: number;
  subject_id: number;
  name: string;
  description: string;
  color: string;
  icon: string;
  itemsCount: number;
  completedCount?: number;
  lecturesCount?: number;
  assignmentsCount?: number;
  resourcesCount?: number;
  videosCount?: number;
}

interface SubjectFolderExplorerProps {
  subjectId: number;
  subjectName: string;
  userRole?: 'owner' | 'assistant' | 'viewer';
  initialOpenCreateModal?: boolean;
  onOpenNotebookLM?: (title: string, text: string) => void;
}

type CategoryType = 'lecture' | 'assignment' | 'resource' | 'video';

export default function SubjectFolderExplorer({
  subjectId,
  subjectName,
  userRole = 'owner',
  initialOpenCreateModal = false,
  onOpenNotebookLM
}: SubjectFolderExplorerProps) {
  const [folders, setFolders] = useState<AcademicFolder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<AcademicFolder | null>(null);
  const [items, setItems] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Active Category inside currentFolder
  const [activeCategory, setActiveCategory] = useState<CategoryType>('lecture');

  // Modals
  const [showFolderModal, setShowFolderModal] = useState(initialOpenCreateModal);
  const [folderName, setFolderName] = useState('');
  const [folderDesc, setFolderDesc] = useState('');
  const [savingFolder, setSavingFolder] = useState(false);

  const [showItemModal, setShowItemModal] = useState(false);
  const [itemCategory, setItemCategory] = useState<CategoryType>('lecture');
  const [itemTitle, setItemTitle] = useState('');
  const [itemContent, setItemContent] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [itemLang, setItemLang] = useState('python');
  const [itemFileUrl, setItemFileUrl] = useState('');
  const [itemFileName, setItemFileName] = useState('');
  const [itemDueDate, setItemDueDate] = useState('');
  const [savingItem, setSavingItem] = useState(false);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [previewItem, setPreviewItem] = useState<FolderItem | null>(null);

  const isViewer = userRole === 'viewer';

  // Convert any Google Drive / YouTube URL to an embeddable iframe src
  const getEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    const clean = url.trim();

    // YouTube
    const ytMatch = clean.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))(?:[\w-]{11})/);
    if (ytMatch) {
      const videoId = ytMatch[0].split('/').pop()?.split('=').pop()?.split('&')[0];
      if (videoId) return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
    }

    // Google Drive file -> embed
    if (clean.includes('drive.google.com')) {
      let fileId: string | null = null;
      const m1 = clean.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (m1) fileId = m1[1];
      if (!fileId) {
        const m2 = clean.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (m2) fileId = m2[1];
      }
      if (fileId) return `https://drive.google.com/file/d/${fileId}/preview`;
    }

    // Google Slides or Docs -> embed
    if (clean.includes('docs.google.com')) {
      if (clean.includes('/presentation/')) {
        const m = clean.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/);
        if (m) return `https://docs.google.com/presentation/d/${m[1]}/embed?start=false&loop=false&delayms=3000`;
      }
      if (clean.includes('/document/')) {
        const m = clean.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
        if (m) return `https://docs.google.com/document/d/${m[1]}/preview`;
      }
      if (clean.includes('/spreadsheets/')) {
        const m = clean.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
        if (m) return `https://docs.google.com/spreadsheets/d/${m[1]}/preview`;
      }
    }

    return null;
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchFolders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/academic/folders?subject_id=${subjectId}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setFolders(data.folders || []);
      } else {
        console.error('Failed to load folders:', data.error);
      }
    } catch (err: any) {
      console.error('Network error loading folders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFolderItems = async (folderId: number) => {
    try {
      const res = await fetch(`/api/academic/folders/items?folder_id=${folderId}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
      }
    } catch (err) {
      console.error('Failed to load items:', err);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, [subjectId]);

  useEffect(() => {
    if (initialOpenCreateModal) {
      setShowFolderModal(true);
    }
  }, [initialOpenCreateModal]);

  useEffect(() => {
    if (currentFolder) {
      fetchFolderItems(currentFolder.id);
    }
  }, [currentFolder]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) {
      showToast('يرجى إدخال اسم المجلد', 'error');
      return;
    }

    setSavingFolder(true);
    try {
      const res = await fetch('/api/academic/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          subject_id: subjectId,
          name: folderName.trim(),
          description: folderDesc.trim()
        })
      });

      const data = await res.json();
      if (data.success && data.folder) {
        setFolders(prev => [...prev, { ...data.folder, itemsCount: 0 }]);
        setShowFolderModal(false);
        setFolderName('');
        setFolderDesc('');
        showToast('تم حفظ وإنشاء المجلد بنجاح', 'success');
      } else {
        showToast(data.error || 'فشل في حفظ المجلد، تأكد من الصلاحيات', 'error');
      }
    } catch (err: any) {
      showToast('خطأ بالاتصال أثناء حفظ المجلد: ' + (err?.message || ''), 'error');
    } finally {
      setSavingFolder(false);
    }
  };

  const openAddItemModal = (cat: CategoryType) => {
    setItemCategory(cat);
    setItemTitle('');
    setItemContent('');
    setItemCode('');
    setItemFileUrl('');
    setItemFileName('');
    setItemDueDate('');
    setShowItemModal(true);
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFolder || !itemTitle.trim()) {
      showToast('يرجى كتابة عنوان العنصر', 'error');
      return;
    }

    setSavingItem(true);
    try {
      const res = await fetch('/api/academic/folders/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          folder_id: currentFolder.id,
          subject_id: subjectId,
          title: itemTitle.trim(),
          content: itemContent,
          item_type: itemCategory,
          code_snippet: itemCode,
          code_language: itemLang,
          file_url: itemFileUrl,
          file_name: itemFileName || (itemFileUrl ? 'رابط ملف' : ''),
          due_date: itemDueDate
        })
      });

      const data = await res.json();
      if (data.success && data.item) {
        setItems(prev => [...prev, data.item]);
        setShowItemModal(false);
        showToast('تمت الإضافة للمجلد بنجاح', 'success');
        fetchFolders(); // refresh folder count
      } else {
        showToast(data.error || 'فشل إضافة العنصر', 'error');
      }
    } catch (err: any) {
      showToast('خطأ أثناء الإضافة: ' + (err?.message || ''), 'error');
    } finally {
      setSavingItem(false);
    }
  };

  const handleToggleTaskCompleted = async (item: FolderItem) => {
    try {
      const newStatus = item.is_completed ? 0 : 1;
      const res = await fetch('/api/academic/folders/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: item.id,
          is_completed: newStatus
        })
      });
      const data = await res.json();
      if (data.success) {
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_completed: newStatus } : i));
        // Refresh folder list to update completedCount on folder card
        fetchFolders();
      }
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  const handleDeleteFolder = async (folderId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المجلد بكل ما بداخله؟')) return;
    try {
      const res = await fetch(`/api/academic/folders?id=${folderId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        if (data.pendingApproval) {
          showToast('تم إرسال طلب حذف المجلد للمالك للموافقة عليه.', 'success');
        } else {
          setFolders(prev => prev.filter(f => f.id !== folderId));
          if (currentFolder?.id === folderId) setCurrentFolder(null);
          showToast('تم حذف المجلد بنجاح.', 'success');
        }
      } else {
        showToast(data.error || 'فشل حذف المجلد', 'error');
      }
    } catch (err: any) {
      showToast('خطأ أثناء الحذف: ' + (err?.message || ''), 'error');
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا العنصر؟')) return;
    try {
      const res = await fetch(`/api/academic/folders/items?id=${itemId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        if (data.pendingApproval) {
          showToast('تم إرسال طلب حذف العنصر للمالك للموافقة عليه.', 'success');
        } else {
          setItems(prev => prev.filter(i => i.id !== itemId));
          showToast('تم حذف العنصر بنجاح.', 'success');
          fetchFolders();
        }
      } else {
        showToast(data.error || 'فشل حذف العنصر', 'error');
      }
    } catch (err: any) {
      showToast('خطأ أثناء الحذف: ' + (err?.message || ''), 'error');
    }
  };

  const handleCopyCode = (id: number, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Group items inside folder by the 4 required categories
  const lectureItems = items.filter(i =>
    i.item_type === 'lecture' || i.item_type === 'note' || i.item_type === 'file' || i.item_type === 'code'
  );
  const assignmentItems = items.filter(i => i.item_type === 'assignment');
  const resourceItems = items.filter(i => i.item_type === 'resource');
  const videoItems = items.filter(i => i.item_type === 'video');

  const categoriesConfig = [
    {
      id: 'lecture' as CategoryType,
      title: 'المحاضرات والملفات',
      icon: BookOpen,
      count: lectureItems.length,
      color: 'blue',
      badge: 'سلايدات، ملخصات، أكواد، ملاحظات',
      items: lectureItems
    },
    {
      id: 'assignment' as CategoryType,
      title: 'الواجبات والتاسكات',
      icon: CheckSquare,
      count: assignmentItems.length,
      color: 'amber',
      badge: 'تكليفات، مواعيد تسليم، مهام',
      items: assignmentItems
    },
    {
      id: 'resource' as CategoryType,
      title: 'المصادر والروابط',
      icon: Link2,
      count: resourceItems.length,
      color: 'emerald',
      badge: 'مراجع، روابط خارجية، ملفات درايف',
      items: resourceItems
    },
    {
      id: 'video' as CategoryType,
      title: 'الفيديوهات والشروحات',
      icon: Video,
      count: videoItems.length,
      color: 'rose',
      badge: 'يوتيوب، تسجيلات، شروحات مسجلة',
      items: videoItems
    }
  ];

  const currentCategoryData = categoriesConfig.find(c => c.id === activeCategory) || categoriesConfig[0];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold shadow-xl flex items-center justify-between ${
            notification.type === 'error'
              ? 'bg-red-500/10 border-red-500/30 text-red-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="opacity-70 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Explorer Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
        <div className="flex items-center gap-2 text-xs font-bold flex-wrap">
          <button
            type="button"
            onClick={() => setCurrentFolder(null)}
            className={`transition-colors hover:text-amber-400 ${
              !currentFolder ? 'text-amber-400 font-black' : 'text-gray-400'
            }`}
          >
            مجلدات مادة ({subjectName})
          </button>
          {currentFolder && (
            <>
              <ChevronRight size={14} className="text-gray-600 rotate-180" />
              <span className="text-white font-black bg-white/5 px-2.5 py-1 rounded-lg">
                📁 {currentFolder.name}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isViewer && (
            <>
              {!currentFolder ? (
                <button
                  type="button"
                  onClick={() => setShowFolderModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-lg shadow-blue-600/20 transition-all hover:scale-105"
                >
                  <FolderPlus size={15} />
                  <span>إنشاء مجلد جديد</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openAddItemModal(activeCategory)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
                >
                  <Plus size={15} />
                  <span>+ إضافة {currentCategoryData.title}</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* VIEW LEVEL 1: LIST OF FOLDERS */}
      {!currentFolder ? (
        loading ? (
          <div className="py-16 text-center text-gray-400 text-xs">جاري تحميل مجلدات المادة...</div>
        ) : folders.length === 0 ? (
          <div className="py-16 text-center rounded-3xl bg-white/[0.02] border border-white/5 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto text-2xl">
              <Folder size={32} />
            </div>
            <p className="text-sm font-black text-white">لا توجد مجلدات لهذه المادة بعد</p>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              اضغط على زر <strong className="text-blue-400">"إنشاء مجلد جديد"</strong> لتنظيم محاضراتك، واجباتك، ومصادرك الأكاديمية بدقة.
            </p>
            {!isViewer && (
              <button
                type="button"
                onClick={() => setShowFolderModal(true)}
                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-lg"
              >
                <FolderPlus size={15} />
                <span>+ إنشاء أول مجلد الآن</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {folders.map(folder => {
              // Completion tracking: determine if folder is fully done
              const total = folder.itemsCount || 0;
              const completedCount = folder.completedCount ?? 0;
              const allDone = total > 0 && completedCount >= total;
              const hasItems = total > 0;

              return (
                <div
                  key={folder.id}
                  onClick={() => setCurrentFolder(folder)}
                  className={`group relative p-5 rounded-2xl border transition-all cursor-pointer shadow-lg flex flex-col justify-between ${
                    allDone
                      ? 'border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-400/60'
                      : 'border-white/10 bg-white/[0.03] hover:border-blue-500/50 hover:bg-blue-500/5'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                        allDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {allDone ? <Check size={20} /> : <Folder size={20} />}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Completion badge */}
                        {allDone && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                            <Check size={10} className="stroke-[3]" />
                            <span>مكتمل</span>
                          </span>
                        )}

                        {!isViewer && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFolder(folder.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-opacity"
                            title="حذف المجلد"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <h4 className={`text-sm font-black transition-colors ${
                      allDone ? 'text-emerald-300 group-hover:text-emerald-200' : 'text-white group-hover:text-blue-300'
                    }`}>
                      {folder.name}
                    </h4>
                    {folder.description && (
                      <p className="text-[11px] text-gray-400 line-clamp-2 mt-1">
                        {folder.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 mt-4 border-t border-white/5 space-y-2">
                    {/* Mini progress bar */}
                    {hasItems && !allDone && (
                      <div className="w-full h-1 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-500 transition-all"
                          style={{ width: `${Math.round((completedCount / total) * 100)}%` }}
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
                      <span>{total} محتوى{allDone ? ' ✓ جميعها مكتملة' : hasItems ? ` (${completedCount} منجز)` : ' محفوظ'}</span>
                      <span className={`font-bold group-hover:translate-x-[-2px] transition-transform ${allDone ? 'text-emerald-400' : 'text-blue-400'}`}>
                        {allDone ? 'عُرض ←' : 'فتح المجلد ←'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* VIEW LEVEL 2: INSIDE SPECIFIC FOLDER */
        <div className="space-y-6">
          {/* Back button & folder header */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentFolder(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300 hover:text-white transition-all"
            >
              <ArrowRight size={14} />
              <span>العودة لكافة مجلدات المادة</span>
            </button>
            <div className="text-xs text-gray-400 font-mono">
              إجمالي محتويات المجلد: <strong className="text-white font-bold">{items.length}</strong>
            </div>
          </div>

          {/* ── THE 4 REQUIRED CATEGORIES INSIDE THE FOLDER ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categoriesConfig.map(cat => {
              const IconComp = cat.icon;
              const isActive = activeCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`text-right p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                    isActive
                      ? 'bg-white/[0.08] border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/50'
                      : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <span className={`p-2 rounded-xl ${
                      cat.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                      cat.color === 'amber' ? 'bg-amber-500/20 text-amber-400' :
                      cat.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-rose-500/20 text-rose-400'
                    }`}>
                      <IconComp size={18} />
                    </span>

                    {/* Counter prominently displayed as requested */}
                    <span className={`text-xl font-black font-mono px-2.5 py-0.5 rounded-lg ${
                      isActive ? 'bg-amber-500 text-black' : 'bg-white/10 text-white'
                    }`}>
                      {cat.count}
                    </span>
                  </div>

                  <div>
                    <strong className={`block text-xs font-black ${isActive ? 'text-amber-400' : 'text-gray-200'}`}>
                      {cat.title}
                    </strong>
                    <span className="text-[10px] text-gray-400 line-clamp-1 mt-0.5 block">
                      {cat.badge}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Category Content Area */}
          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-white/5 text-amber-400">
                  <currentCategoryData.icon size={18} />
                </span>
                <div>
                  <h3 className="text-sm font-black text-white">{currentCategoryData.title}</h3>
                  <p className="text-[11px] text-gray-400 font-mono">
                    {currentCategoryData.count} عناصر مسجلة داخل هذا المجلد
                  </p>
                </div>
              </div>

              {!isViewer && (
                <button
                  type="button"
                  onClick={() => openAddItemModal(activeCategory)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-md transition-all"
                >
                  <Plus size={14} />
                  <span>+ إضافة {currentCategoryData.title}</span>
                </button>
              )}
            </div>

            {/* Category Items List */}
            {currentCategoryData.items.length === 0 ? (
              <div className="py-12 text-center rounded-2xl bg-white/[0.01] border border-dashed border-white/10">
                <currentCategoryData.icon size={36} className="mx-auto text-gray-600 mb-2" />
                <p className="text-xs font-bold text-gray-400">
                  لا توجد {currentCategoryData.title} مضافة في هذا المجلد بعد (0)
                </p>
                <p className="text-[11px] text-gray-500 mt-1">
                  اضغط على الزر أعلاه لإضافة أول محتوى
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentCategoryData.items.map(item => {
                  const embedUrl = getEmbedUrl(item.file_url || '');
                  const isDone = Boolean(item.is_completed);
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all space-y-3 ${
                        isDone
                          ? 'bg-emerald-500/5 border-emerald-500/30'
                          : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                      }`}
                    >
                      {/* Header row: completion + title + actions */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Universal completion toggle — for ALL types */}
                          <button
                            type="button"
                            onClick={() => handleToggleTaskCompleted(item)}
                            title={isDone ? 'إلغاء الإكمال' : 'تعليم كمكتمل'}
                            className={`mt-0.5 shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110 ${
                              isDone
                                ? 'bg-emerald-500 border-emerald-400 text-white shadow-emerald-500/30 shadow-md'
                                : 'border-white/30 hover:border-emerald-400 bg-white/5 hover:bg-emerald-500/10'
                            }`}
                          >
                            {isDone ? <CheckCircle2 size={14} className="stroke-[2.5]" /> : <Circle size={12} className="opacity-50" />}
                          </button>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className={`text-sm font-black transition-colors ${
                                isDone ? 'line-through text-gray-400' : 'text-white'
                              }`}>
                                {item.title}
                              </h4>
                              {isDone && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/20">
                                  ✓ مكتمل
                                </span>
                              )}
                              {item.due_date && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                  <Clock size={10} />
                                  <span>تسليم: {item.due_date}</span>
                                </span>
                              )}
                            </div>

                            {item.content && (
                              <p className="text-xs text-gray-300 leading-relaxed mt-1 whitespace-pre-wrap">
                                {item.content}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Preview button — only if there's an embeddable URL */}
                          {embedUrl && (
                            <button
                              type="button"
                              onClick={() => setPreviewItem(previewItem?.id === item.id ? null : item)}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                previewItem?.id === item.id
                                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                                  : 'bg-white/5 border-white/10 text-gray-300 hover:border-blue-500/50 hover:text-blue-300'
                              }`}
                              title="معاينة داخل الصفحة"
                            >
                              <Eye size={13} />
                              <span>{previewItem?.id === item.id ? 'إخفاء' : 'معاينة'}</span>
                            </button>
                          )}

                          {/* Open external link */}
                          {item.file_url && (
                            <a
                              href={item.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 p-1.5 rounded-lg text-gray-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors"
                              title="فتح الرابط في تبويب جديد"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}

                          {/* Google NotebookLM */}
                          <button
                            type="button"
                            onClick={() => {
                              const fullContent = `${item.title}\n\n${item.content || ''}${item.code_snippet ? `\n\nكود برمجي:\n${item.code_snippet}` : ''}${item.file_url ? `\n\nرابط:\n${item.file_url}` : ''}`;
                              try { navigator.clipboard.writeText(fullContent.trim()); showToast('تم النسخ! جاري فتح NotebookLM...', 'success'); } catch {}
                              window.open('https://notebooklm.google.com', '_blank', 'noopener,noreferrer');
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors"
                            title="فتح في Google NotebookLM"
                          >
                            <Sparkles size={14} />
                          </button>

                          {!isViewer && (
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="حذف العنصر"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Attached Code */}
                      {item.code_snippet && (
                        <div className="rounded-xl border border-white/10 bg-[#080b10] overflow-hidden text-xs">
                          <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10 bg-white/[0.02] text-[10px] text-gray-400 font-mono">
                            <span>{item.code_language || 'code'}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(item.id, item.code_snippet)}
                              className="flex items-center gap-1 text-gray-300 hover:text-white"
                            >
                              {copiedId === item.id ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                              <span>{copiedId === item.id ? 'تم النسخ' : 'نسخ الكود'}</span>
                            </button>
                          </div>
                          <pre className="p-3 text-amber-200/90 font-mono overflow-x-auto leading-relaxed">
                            {item.code_snippet}
                          </pre>
                        </div>
                      )}

                      {/* File / Link bar */}
                      {item.file_url && !embedUrl && (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
                          <div className="flex items-center gap-2 truncate">
                            {item.item_type === 'video' ? (
                              <Video size={14} className="text-rose-400 shrink-0" />
                            ) : (
                              <File size={14} className="text-amber-400 shrink-0" />
                            )}
                            <span className="font-bold text-gray-200 truncate">
                              {item.file_name || item.file_url}
                            </span>
                          </div>
                          <a
                            href={item.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shrink-0"
                          >
                            <ExternalLink size={12} />
                            <span>فتح الرابط</span>
                          </a>
                        </div>
                      )}

                      {/* Inline Preview (Drive / YouTube / Slides) */}
                      {embedUrl && previewItem?.id === item.id && (
                        <div className="rounded-2xl overflow-hidden border border-amber-500/30 bg-black shadow-xl">
                          <div className="flex items-center justify-between px-3 py-2 bg-white/[0.03] border-b border-white/10">
                            <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                              <Eye size={12} />
                              معاينة: {item.file_name || item.title}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <a
                                href={item.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-gray-400 hover:text-blue-300 flex items-center gap-1"
                              >
                                <Maximize2 size={12} />
                                <span>فتح كامل</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => setPreviewItem(null)}
                                className="text-gray-500 hover:text-white ml-1"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                          <iframe
                            src={embedUrl}
                            className="w-full"
                            style={{ height: '480px', border: 'none' }}
                            allow="autoplay; fullscreen"
                            allowFullScreen
                            title={item.title}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW FOLDER */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0e1217] border border-white/10 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <FolderPlus size={18} className="text-blue-400" />
                <span>إنشاء مجلد جديد ({subjectName})</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowFolderModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-bold mb-1">اسم المجلد الأكاديمي *</label>
                <input
                  type="text"
                  required
                  value={folderName}
                  onChange={e => setFolderName(e.target.value)}
                  placeholder="مثال: المحاضرة 1 (مقدمة الذكاء الاصطناعي)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">وصف المجلد (اختياري)</label>
                <input
                  type="text"
                  value={folderDesc}
                  onChange={e => setFolderDesc(e.target.value)}
                  placeholder="مثال: يضم السلايدات، الواجب الأول، والمراجع"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingFolder}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black shadow-lg disabled:opacity-50"
                >
                  {savingFolder ? 'جاري الحفظ...' : 'حفظ المجلد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD ITEM INSIDE FOLDER */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#0e1217] border border-white/10 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-white">
                إضافة {currentCategoryData.title} داخل "{currentFolder?.name}"
              </h3>
              <button
                type="button"
                onClick={() => setShowItemModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-4 text-xs">
              {/* Category picker inside modal */}
              <div>
                <label className="block text-gray-300 font-bold mb-1.5">القسم المستهدف داخل المجلد</label>
                <div className="grid grid-cols-2 gap-2">
                  {categoriesConfig.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setItemCategory(c.id)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                        itemCategory === c.id
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-white/5 border-white/10 text-gray-400'
                      }`}
                    >
                      <c.icon size={14} />
                      <span>{c.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">العنوان *</label>
                <input
                  type="text"
                  required
                  value={itemTitle}
                  onChange={e => setItemTitle(e.target.value)}
                  placeholder="مثال: ملخص الخوارزميات، أو تكليف 1"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">الشرح / المحتوى / التفاصيل</label>
                <textarea
                  rows={4}
                  value={itemContent}
                  onChange={e => setItemContent(e.target.value)}
                  placeholder="اكتب التلخيص أو تفاصيل التكليف هنا..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white"
                />
              </div>

              {/* Assignment-specific fields */}
              {itemCategory === 'assignment' && (
                <div>
                  <label className="block text-gray-300 font-bold mb-1">موعد التسليم (Deadline)</label>
                  <input
                    type="date"
                    value={itemDueDate}
                    onChange={e => setItemDueDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              )}

              {/* File / Link fields */}
              <div>
                <label className="block text-gray-300 font-bold mb-1">
                  {itemCategory === 'video' ? 'رابط الفيديو (YouTube / Drive)' : 'رابط الملف أو المرجع (Google Drive / URL)'}
                </label>
                <input
                  type="url"
                  value={itemFileUrl}
                  onChange={e => setItemFileUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white"
                />
              </div>

              {/* Code Snippet for lectures/resources */}
              {itemCategory === 'lecture' && (
                <div className="space-y-2 p-3 rounded-2xl bg-black/40 border border-white/5">
                  <div className="flex items-center justify-between">
                    <label className="text-gray-300 font-bold">كود برمجي اختياري مع تظليل</label>
                    <select
                      value={itemLang}
                      onChange={e => setItemLang(e.target.value)}
                      className="bg-[#161b22] border border-white/10 rounded-lg px-2 py-1 text-white text-xs"
                    >
                      <option value="python">Python</option>
                      <option value="javascript">JavaScript / TypeScript</option>
                      <option value="cpp">C++ / C</option>
                      <option value="java">Java</option>
                      <option value="sql">SQL</option>
                    </select>
                  </div>
                  <textarea
                    rows={4}
                    value={itemCode}
                    onChange={e => setItemCode(e.target.value)}
                    placeholder="// الصق الكود هنا إن وجد..."
                    className="w-full bg-[#080b10] border border-white/10 rounded-xl p-3 text-amber-200 font-mono text-xs"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingItem}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black disabled:opacity-50"
                >
                  {savingItem ? 'جاري الإضافة...' : 'إضافة إلى المجلد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
