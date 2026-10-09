'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb, Plus, Search, Pin, PinOff, Trash2, Edit3, Copy, Check,
  Sparkles, CheckSquare, Square, Tag, ArrowRight, CornerDownLeft,
  X, RefreshCw, FolderPlus, ListTodo, Bookmark, FileText, CheckCircle2,
  Calendar, Layers, Filter
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

interface Note {
  id: number;
  title: string;
  content: string;
  category: string;
  color: string;
  tags: string[];
  isPinned: boolean;
  isArchived: boolean;
  checklist: ChecklistItem[];
  createdAt: string;
  updatedAt?: string;
}

interface BrainDumpClientProps {
  lang?: 'ar' | 'en';
}

const CATEGORIES = [
  { id: 'all', labelAr: 'الكل', labelEn: 'All', icon: '✨' },
  { id: 'عام', labelAr: 'عام', labelEn: 'General', icon: '📝' },
  { id: 'بزنس', labelAr: 'بزنس وريادة', labelEn: 'Business', icon: '💼' },
  { id: 'أفكار محتوى', labelAr: 'أفكار محتوى وفيديو', labelEn: 'Content Ideas', icon: '🎬' },
  { id: 'مشاريع', labelAr: 'مشاريع قادمة', labelEn: 'Projects', icon: '🚀' },
  { id: 'تطوير شخصي', labelAr: 'تطوير شخصي وعادات', labelEn: 'Self Growth', icon: '🧠' },
  { id: 'دراسة', labelAr: 'دراسة وتلخيص', labelEn: 'Study', icon: '📚' },
  { id: 'عشوائي', labelAr: 'خواطر سريعة', labelEn: 'Quick Thoughts', icon: '⚡' },
];

const COLOR_MAP: Record<string, { bg: string; border: string; glow: string; badge: string; accent: string }> = {
  orange: {
    bg: 'from-orange-500/10 to-orange-500/5',
    border: 'border-orange-500/30 hover:border-orange-500/60',
    glow: 'shadow-[0_0_20px_rgba(255,85,0,0.15)]',
    badge: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
    accent: '#FF5500',
  },
  amber: {
    bg: 'from-amber-500/10 to-amber-500/5',
    border: 'border-amber-500/30 hover:border-amber-500/60',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]',
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    accent: '#F59E0B',
  },
  emerald: {
    bg: 'from-emerald-500/10 to-emerald-500/5',
    border: 'border-emerald-500/30 hover:border-emerald-500/60',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
    badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    accent: '#10B981',
  },
  cyan: {
    bg: 'from-cyan-500/10 to-cyan-500/5',
    border: 'border-cyan-500/30 hover:border-cyan-500/60',
    glow: 'shadow-[0_0_20px_rgba(6,182,212,0.15)]',
    badge: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
    accent: '#06B6D4',
  },
  purple: {
    bg: 'from-purple-500/10 to-purple-500/5',
    border: 'border-purple-500/30 hover:border-purple-500/60',
    glow: 'shadow-[0_0_20px_rgba(168,85,247,0.15)]',
    badge: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    accent: '#A855F7',
  },
  rose: {
    bg: 'from-rose-500/10 to-rose-500/5',
    border: 'border-rose-500/30 hover:border-rose-500/60',
    glow: 'shadow-[0_0_20px_rgba(244,63,94,0.15)]',
    badge: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
    accent: '#F43F5E',
  },
  midnight: {
    bg: 'from-blue-900/20 to-slate-900/30',
    border: 'border-blue-500/30 hover:border-blue-500/60',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)]',
    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    accent: '#3B82F6',
  },
};

export default function BrainDumpClient({ lang = 'ar' }: BrainDumpClientProps) {
  const isRtl = lang === 'ar';
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Quick Capture State
  const [quickTitle, setQuickTitle] = useState('');
  const [quickContent, setQuickContent] = useState('');
  const [quickCategory, setQuickCategory] = useState('عام');
  const [quickColor, setQuickColor] = useState('orange');
  const [quickTags, setQuickTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isQuickPinned, setIsQuickPinned] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [checkInput, setCheckInput] = useState('');
  const [showChecklistInput, setShowChecklistInput] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit Modal State
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('عام');
  const [editColor, setEditColor] = useState('orange');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editTagInput, setEditTagInput] = useState('');
  const [editChecklist, setEditChecklist] = useState<ChecklistItem[]>([]);
  const [editCheckInput, setEditCheckInput] = useState('');
  const [editPinned, setEditPinned] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Action Feedbacks
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [convertedTaskId, setConvertedTaskId] = useState<number | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    try {
      setLoading(true);
      const res = await fetch('/api/notes');
      const data = await res.json();
      if (data.notes) {
        setNotes(data.notes);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  }

  // Handle Quick Add Note
  async function handleCreateNote(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!quickContent.trim() && !quickTitle.trim() && checklistItems.length === 0) return;

    setSaving(true);
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: quickTitle.trim(),
          content: quickContent.trim(),
          category: quickCategory,
          color: quickColor,
          tags: quickTags,
          isPinned: isQuickPinned,
          checklist: checklistItems,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Reset form
        setQuickTitle('');
        setQuickContent('');
        setQuickCategory('عام');
        setQuickColor('orange');
        setQuickTags([]);
        setTagInput('');
        setIsQuickPinned(false);
        setChecklistItems([]);
        setCheckInput('');
        setShowChecklistInput(false);
        fetchNotes();
      }
    } catch (err) {
      console.error('Error creating note:', err);
    } finally {
      setSaving(false);
    }
  }

  // Handle Note Update
  async function handleUpdateNote(e: React.FormEvent) {
    e.preventDefault();
    if (!editingNote) return;

    setUpdating(true);
    try {
      const res = await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingNote.id,
          title: editTitle.trim(),
          content: editContent.trim(),
          category: editCategory,
          color: editColor,
          tags: editTags,
          isPinned: editPinned,
          checklist: editChecklist,
        }),
      });
      if (res.ok) {
        setEditingNote(null);
        fetchNotes();
      }
    } catch (err) {
      console.error('Error updating note:', err);
    } finally {
      setUpdating(false);
    }
  }

  // Toggle Pin
  async function handleTogglePin(note: Note) {
    const updatedPinned = !note.isPinned;
    // Optimistic UI
    setNotes(prev =>
      prev.map(n => (n.id === note.id ? { ...n, isPinned: updatedPinned } : n))
    );

    try {
      await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: note.id,
          isPinned: updatedPinned,
        }),
      });
      fetchNotes();
    } catch (err) {
      console.error('Error pinning note:', err);
      fetchNotes();
    }
  }

  // Delete Note
  async function handleDeleteNote(id: number) {
    if (!confirm(isRtl ? '⚠️ هل أنت متأكد من حذف هذه الفكرة/الملاحظة؟' : 'Are you sure you want to delete this note?')) return;
    setNotes(prev => prev.filter(n => n.id !== id));
    try {
      await fetch(`/api/notes?id=${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Error deleting note:', err);
      fetchNotes();
    }
  }

  // Toggle Checklist item in a note
  async function handleToggleChecklistItem(note: Note, itemId: string) {
    const updatedChecklist = (note.checklist || []).map(item =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );

    setNotes(prev =>
      prev.map(n => (n.id === note.id ? { ...n, checklist: updatedChecklist } : n))
    );

    try {
      await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: note.id,
          checklist: updatedChecklist,
        }),
      });
    } catch (err) {
      console.error('Error updating checklist:', err);
      fetchNotes();
    }
  }

  // Copy Note Content
  function handleCopyNote(note: Note) {
    let text = note.title ? `${note.title}\n\n` : '';
    text += note.content;
    if (note.checklist && note.checklist.length > 0) {
      text += '\n\n' + note.checklist.map(i => `${i.done ? '[x]' : '[ ]'} ${i.text}`).join('\n');
    }
    navigator.clipboard.writeText(text);
    setCopiedId(note.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // Convert Note to Task
  async function handleConvertToTask(note: Note) {
    const title = note.title ? note.title : note.content.slice(0, 60);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `[فكرة] ${title}`,
          type: 'inbox',
          priority: 'medium',
          estimatedTime: 30,
          date: new Date().toISOString().split('T')[0],
        }),
      });
      if (res.ok) {
        setConvertedTaskId(note.id);
        setTimeout(() => setConvertedTaskId(null), 2500);
      }
    } catch (err) {
      console.error('Error converting to task:', err);
    }
  }

  // Open Edit Modal
  function openEditModal(note: Note) {
    setEditingNote(note);
    setEditTitle(note.title || '');
    setEditContent(note.content || '');
    setEditCategory(note.category || 'عام');
    setEditColor(note.color || 'orange');
    setEditTags(note.tags || []);
    setEditTagInput('');
    setEditChecklist(note.checklist || []);
    setEditCheckInput('');
    setEditPinned(note.isPinned || false);
  }

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      const matchCat = selectedCategory === 'all' || n.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        (Array.isArray(n.tags) && n.tags.some(t => t.toLowerCase().includes(q))) ||
        (Array.isArray(n.checklist) && n.checklist.some(c => c.text.toLowerCase().includes(q)));
      return matchCat && matchSearch;
    });
  }, [notes, selectedCategory, searchQuery]);

  const pinnedNotes = useMemo(() => filteredNotes.filter(n => n.isPinned), [filteredNotes]);
  const unpinnedNotes = useMemo(() => filteredNotes.filter(n => !n.isPinned), [filteredNotes]);

  return (
    <div className="space-y-8" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* ── TOP HERO HEADER BANNER ── */}
      <div className="relative overflow-hidden rounded-[2.5rem] border border-orange-500/30 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 sm:p-8 backdrop-blur-2xl shadow-[0_0_50px_rgba(255,85,0,0.12)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF5500]/15 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-[#FF5500] to-[#FF3300] flex items-center justify-center text-white shadow-[0_0_25px_rgba(255,85,0,0.5)] shrink-0">
              <Lightbulb size={30} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                  {isRtl ? 'تفريغ الأفكار والملاحظات الذكية' : 'Brain Dump & Quick Notes'}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/40 text-[10px] font-black">
                  NOTION STYLE
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-xl">
                {isRtl
                  ? 'مساحتك السريعة لتدوين أي فكرة خاطفة، خطة مشروع، ملاحظة فيديو، أو مهام مصغرة دون تشتيت.'
                  : 'Capture fast ideas, brainstorm projects, create checklists, and organize thoughts seamlessly.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-gray-300 font-bold">
              <span>{isRtl ? 'إجمالي الأفكار:' : 'Total Notes:'}</span>
              <span className="text-orange-400 font-mono font-black text-sm">{notes.length}</span>
            </div>
            {pinnedNotes.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-xs text-orange-300 font-bold">
                <Pin size={13} className="text-orange-400" />
                <span>{pinnedNotes.length} مثبتة</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 1. QUICK CAPTURE CARD (THE BRAIN DUMP ENGINE) ── */}
      <div className="relative overflow-hidden rounded-[2.2rem] border border-orange-500/40 bg-[#0c0d14]/90 p-5 sm:p-7 backdrop-blur-2xl shadow-[0_0_30px_rgba(255,85,0,0.15)] space-y-4">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 text-sm font-black text-orange-400">
            <Sparkles size={16} />
            <span>{isRtl ? 'تفريغ فكرة أو ملاحظة جديدة فوراً' : 'Quick Capture New Idea / Note'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsQuickPinned(!isQuickPinned)}
              className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isQuickPinned
                  ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(255,85,0,0.5)]'
                  : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
              }`}
              title="تثبيت الفكرة في المقدمة"
            >
              <Pin size={14} />
              <span className="hidden sm:inline">{isQuickPinned ? 'مثبتة 📌' : 'تثبيت'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowChecklistInput(!showChecklistInput)}
              className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                showChecklistInput || checklistItems.length > 0
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
              }`}
              title="إضافة قائمة مهام مصغرة داخل الملاحظة"
            >
              <CheckSquare size={14} />
              <span className="hidden sm:inline">قائمة مهام</span>
            </button>
          </div>
        </div>

        {/* Title (Optional) */}
        <input
          type="text"
          value={quickTitle}
          onChange={e => setQuickTitle(e.target.value)}
          placeholder={isRtl ? '💡 عنوان الفكرة أو الموضوع (اختياري)...' : '💡 Note title (optional)...'}
          className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.03] border border-white/10 text-sm font-bold text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-all"
        />

        {/* Note Content Textarea */}
        <textarea
          ref={textareaRef}
          rows={3}
          value={quickContent}
          onChange={e => setQuickContent(e.target.value)}
          onKeyDown={e => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              handleCreateNote();
            }
          }}
          placeholder={
            isRtl
              ? 'اكتب أفكارك بحرية، ملاحظات، روابط، أفكار مشاريع، نصوص... (اضغط Ctrl + Enter للحفظ السريع)'
              : 'Brain dump your thoughts, video takeaways, links, ideas... (Press Ctrl + Enter to quick save)'
          }
          className="w-full px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-all leading-relaxed"
        />

        {/* Inline Checklist Items Builder */}
        {(showChecklistInput || checklistItems.length > 0) && (
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckSquare size={13} />
              <span>عناصر القائمة السريعة (Checklist):</span>
            </div>

            {checklistItems.map(item => (
              <div key={item.id} className="flex items-center gap-2 text-xs text-gray-200">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                <span className="flex-1 font-medium">{item.text}</span>
                <button
                  type="button"
                  onClick={() => setChecklistItems(prev => prev.filter(i => i.id !== item.id))}
                  className="text-gray-500 hover:text-rose-400 p-1"
                >
                  <X size={12} />
                </button>
              </div>
            ))}

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={checkInput}
                onChange={e => setCheckInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && checkInput.trim()) {
                    e.preventDefault();
                    setChecklistItems(prev => [
                      ...prev,
                      { id: Date.now().toString(), text: checkInput.trim(), done: false },
                    ]);
                    setCheckInput('');
                  }
                }}
                placeholder="أضف بنداً واضغط Enter..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (checkInput.trim()) {
                    setChecklistItems(prev => [
                      ...prev,
                      { id: Date.now().toString(), text: checkInput.trim(), done: false },
                    ]);
                    setCheckInput('');
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black font-bold text-xs transition-all"
              >
                + إضافة
              </button>
            </div>
          </div>
        )}

        {/* Tags Builder */}
        {quickTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {quickTags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2.5 py-0.5 rounded-lg bg-white/10 border border-white/15 text-[11px] font-bold text-orange-300 flex items-center gap-1"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => setQuickTags(prev => prev.filter((_, i) => i !== idx))}
                  className="hover:text-rose-400"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Bottom Options Bar: Category + Color + Submit */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Select */}
            <select
              value={quickCategory}
              onChange={e => setQuickCategory(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#14161f] border border-white/15 text-xs font-bold text-gray-200 focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                <option key={c.id} value={c.id}>
                  {c.icon} {isRtl ? c.labelAr : c.labelEn}
                </option>
              ))}
            </select>

            {/* Color Theme Selector */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/10">
              {Object.keys(COLOR_MAP).map(cKey => (
                <button
                  key={cKey}
                  type="button"
                  onClick={() => setQuickColor(cKey)}
                  style={{ backgroundColor: COLOR_MAP[cKey].accent }}
                  className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                    quickColor === cKey ? 'scale-125 ring-2 ring-white' : 'opacity-60 hover:opacity-100'
                  }`}
                  title={cKey}
                />
              ))}
            </div>

            {/* Tag quick input */}
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && tagInput.trim()) {
                    e.preventDefault();
                    const cleanTag = tagInput.trim().replace(/^#/, '');
                    if (!quickTags.includes(cleanTag)) {
                      setQuickTags(prev => [...prev, cleanTag]);
                    }
                    setTagInput('');
                  }
                }}
                placeholder="#وسم..."
                className="w-20 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={saving || (!quickContent.trim() && !quickTitle.trim() && checklistItems.length === 0)}
            onClick={() => handleCreateNote()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#FF3300] hover:from-orange-500 hover:to-orange-600 text-white font-black text-xs shadow-lg shadow-orange-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:hover:scale-100"
          >
            {saving ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <Plus size={15} />
                <span>{isRtl ? 'حفظ الفكرة الآن' : 'Save Thought'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── 2. SEARCH & CATEGORY FILTER BAR ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat.id;
            const count =
              cat.id === 'all'
                ? notes.length
                : notes.filter(n => n.category === cat.id).length;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(255,85,0,0.4)] font-black scale-102'
                    : 'bg-white/[0.03] text-gray-400 hover:text-white border border-white/5 hover:border-white/15'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{isRtl ? cat.labelAr : cat.labelEn}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-mono ${
                    isSelected ? 'bg-black/30 text-white' : 'bg-white/10 text-gray-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search size={14} className="absolute top-3.5 right-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={isRtl ? 'بحث في الأفكار والملاحظات...' : 'Search thoughts...'}
            className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute top-2.5 left-3 text-gray-400 hover:text-white p-1"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── 3. NOTES LIST & PINNED SECTION ── */}
      {loading ? (
        <div className="py-24 text-center space-y-4">
          <RefreshCw size={36} className="animate-spin text-orange-400 mx-auto opacity-70" />
          <p className="text-xs text-gray-400 font-bold">جاري تحميل صندوق الأفكار والملاحظات...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center mx-auto shadow-lg">
            <Lightbulb size={32} />
          </div>
          <h3 className="text-lg font-bold text-white">لا توجد أفكار أو ملاحظات هنا</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            {searchQuery
              ? 'لم يتم العثور على أي فكرة مطابقة لبحثك. جرب كلمة بحث مختلفة.'
              : 'ابدأ بتدوين أول فكرة خاطفة أو مشروع أو ملخص من صندوق التدوين السريع بالأعلى!'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Pinned Notes Section */}
          {pinnedNotes.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-black text-orange-400 border-b border-orange-500/20 pb-2">
                <Pin size={14} className="text-orange-400 fill-orange-400" />
                <span>الأفكار والملاحظات المثبتة في المقدمة ({pinnedNotes.length})</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {pinnedNotes.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    isRtl={isRtl}
                    copiedId={copiedId}
                    convertedTaskId={convertedTaskId}
                    onTogglePin={handleTogglePin}
                    onDelete={handleDeleteNote}
                    onEdit={openEditModal}
                    onCopy={handleCopyNote}
                    onConvertToTask={handleConvertToTask}
                    onToggleChecklistItem={handleToggleChecklistItem}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Regular Notes Section */}
          {unpinnedNotes.length > 0 && (
            <div className="space-y-4">
              {pinnedNotes.length > 0 && (
                <div className="flex items-center gap-2 text-xs font-black text-gray-400 border-b border-white/10 pb-2">
                  <FileText size={14} />
                  <span>باقي الأفكار والملاحظات ({unpinnedNotes.length})</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {unpinnedNotes.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    isRtl={isRtl}
                    copiedId={copiedId}
                    convertedTaskId={convertedTaskId}
                    onTogglePin={handleTogglePin}
                    onDelete={handleDeleteNote}
                    onEdit={openEditModal}
                    onCopy={handleCopyNote}
                    onConvertToTask={handleConvertToTask}
                    onToggleChecklistItem={handleToggleChecklistItem}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 4. EDIT NOTE MODAL ── */}
      <AnimatePresence>
        {editingNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl rounded-3xl border border-white/15 bg-[#0d0e14] p-6 sm:p-8 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-base font-black text-white">
                  <Edit3 size={18} className="text-orange-400" />
                  <span>تعديل الملاحظة / الفكرة</span>
                </div>
                <button
                  onClick={() => setEditingNote(null)}
                  className="p-1.5 text-gray-400 hover:text-white rounded-lg bg-white/5"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleUpdateNote} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">العنوان (اختياري)</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-white focus:outline-none focus:border-orange-500"
                    placeholder="عنوان الفكرة..."
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">المحتوى</label>
                  <textarea
                    rows={5}
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-orange-500 leading-relaxed"
                    placeholder="الملاحظات والتفاصيل..."
                  />
                </div>

                {/* Edit Checklist */}
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                  <div className="text-xs font-bold text-emerald-400 flex items-center justify-between">
                    <span>قائمة المهام الفرعية (Checklist):</span>
                    <span className="text-[10px] text-gray-400">{editChecklist.length} بنود</span>
                  </div>

                  {editChecklist.map(item => (
                    <div key={item.id} className="flex items-center gap-2 text-xs text-gray-200">
                      <button
                        type="button"
                        onClick={() =>
                          setEditChecklist(prev =>
                            prev.map(i => (i.id === item.id ? { ...i, done: !i.done } : i))
                          )
                        }
                        className="text-emerald-400"
                      >
                        {item.done ? <CheckCircle2 size={14} /> : <Square size={14} className="text-gray-500" />}
                      </button>
                      <span className={`flex-1 ${item.done ? 'line-through text-gray-500' : ''}`}>
                        {item.text}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditChecklist(prev => prev.filter(i => i.id !== item.id))}
                        className="text-gray-500 hover:text-rose-400"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={editCheckInput}
                      onChange={e => setEditCheckInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && editCheckInput.trim()) {
                          e.preventDefault();
                          setEditChecklist(prev => [
                            ...prev,
                            { id: Date.now().toString(), text: editCheckInput.trim(), done: false },
                          ]);
                          setEditCheckInput('');
                        }
                      }}
                      placeholder="أضف بنداً جديداً..."
                      className="flex-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (editCheckInput.trim()) {
                          setEditChecklist(prev => [
                            ...prev,
                            { id: Date.now().toString(), text: editCheckInput.trim(), done: false },
                          ]);
                          setEditCheckInput('');
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 text-black font-bold text-xs"
                    >
                      + إضافة
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">التصنيف</label>
                    <select
                      value={editCategory}
                      onChange={e => setEditCategory(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#14161f] border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-orange-500"
                    >
                      {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                        <option key={c.id} value={c.id}>
                          {c.icon} {c.labelAr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">لون التمييز</label>
                    <div className="flex items-center gap-2 pt-1">
                      {Object.keys(COLOR_MAP).map(cKey => (
                        <button
                          key={cKey}
                          type="button"
                          onClick={() => setEditColor(cKey)}
                          style={{ backgroundColor: COLOR_MAP[cKey].accent }}
                          className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                            editColor === cKey ? 'scale-125 ring-2 ring-white' : 'opacity-60 hover:opacity-100'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editPinned}
                      onChange={e => setEditPinned(e.target.checked)}
                      className="rounded accent-orange-500"
                    />
                    <span>📌 تثبيت في المقدمة</span>
                  </label>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingNote(null)}
                      className="px-4 py-2 rounded-xl border border-white/10 text-xs font-bold text-gray-400 hover:text-white"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      disabled={updating}
                      className="px-6 py-2 rounded-xl bg-orange-500 text-white font-black text-xs hover:bg-orange-400 transition-all shadow-lg"
                    >
                      {updating ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── NOTE CARD COMPONENT ───────────────────────────────────────────────────────
function NoteCard({
  note,
  isRtl,
  copiedId,
  convertedTaskId,
  onTogglePin,
  onDelete,
  onEdit,
  onCopy,
  onConvertToTask,
  onToggleChecklistItem,
}: {
  note: Note;
  isRtl: boolean;
  copiedId: number | null;
  convertedTaskId: number | null;
  onTogglePin: (note: Note) => void;
  onDelete: (id: number) => void;
  onEdit: (note: Note) => void;
  onCopy: (note: Note) => void;
  onConvertToTask: (note: Note) => void;
  onToggleChecklistItem: (note: Note, itemId: string) => void;
}) {
  const colorStyle = COLOR_MAP[note.color] || COLOR_MAP.orange;
  const isCopied = copiedId === note.id;
  const isConverted = convertedTaskId === note.id;

  const formattedDate = useMemo(() => {
    if (!note.createdAt) return '';
    try {
      const d = new Date(note.createdAt);
      return d.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return note.createdAt;
    }
  }, [note.createdAt, isRtl]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`group relative flex flex-col justify-between p-5 rounded-[1.8rem] bg-gradient-to-b ${colorStyle.bg} border ${colorStyle.border} ${colorStyle.glow} backdrop-blur-xl transition-all hover:scale-[1.01]`}
    >
      {/* Top Header: Category Badge + Pinned Icon + Action Tools */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-lg border text-[10px] font-black tracking-tight ${colorStyle.badge}`}
            >
              {note.category || 'عام'}
            </span>
            {note.isPinned && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-lg border border-orange-500/30">
                <Pin size={10} className="fill-orange-400" />
                <span>مثبتة</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            {/* Pin Toggle */}
            <button
              onClick={() => onTogglePin(note)}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                note.isPinned
                  ? 'text-orange-400 hover:text-orange-300'
                  : 'text-gray-400 hover:text-white'
              }`}
              title={note.isPinned ? 'إلغاء التثبيت' : 'تثبيت في المقدمة'}
            >
              <Pin size={13} className={note.isPinned ? 'fill-orange-400' : ''} />
            </button>

            {/* Edit */}
            <button
              onClick={() => onEdit(note)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white transition-colors"
              title="تعديل الملاحظة"
            >
              <Edit3 size={13} />
            </button>

            {/* Delete */}
            <button
              onClick={() => onDelete(note.id)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 transition-colors"
              title="حذف"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Title */}
        {note.title && (
          <h3 className="text-sm font-black text-white mb-2 line-clamp-2 leading-snug">
            {note.title}
          </h3>
        )}

        {/* Content */}
        {note.content && (
          <p className="text-xs text-gray-300 whitespace-pre-wrap break-words leading-relaxed line-clamp-8 font-normal">
            {note.content}
          </p>
        )}

        {/* Checklist */}
        {note.checklist && note.checklist.length > 0 && (
          <div className="mt-3 space-y-1.5 pt-2 border-t border-white/5">
            {note.checklist.map(item => (
              <div
                key={item.id}
                onClick={() => onToggleChecklistItem(note, item.id)}
                className="flex items-start gap-2 text-xs text-gray-300 cursor-pointer group/item hover:text-white transition-colors"
              >
                <button
                  type="button"
                  className="mt-0.5 text-emerald-400 shrink-0"
                >
                  {item.done ? (
                    <CheckCircle2 size={13} className="text-emerald-400 fill-emerald-400/20" />
                  ) : (
                    <Square size={13} className="text-gray-500 group-hover/item:text-emerald-400" />
                  )}
                </button>
                <span className={`text-[11px] leading-tight ${item.done ? 'line-through text-gray-500' : ''}`}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {note.tags.map((tag, tIdx) => (
              <span
                key={tIdx}
                className="px-2 py-0.2 rounded-md bg-white/5 text-[9px] font-mono font-bold text-gray-400 border border-white/5"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Footer: Date + Copy Button + Convert to Task */}
      <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-white/10 text-[10px] text-gray-500">
        <span className="font-mono">{formattedDate}</span>

        <div className="flex items-center gap-1.5">
          {/* Convert to Task */}
          <button
            onClick={() => onConvertToTask(note)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all text-[10px] font-bold ${
              isConverted
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-white/5 text-gray-400 hover:text-amber-300 hover:bg-white/10 border border-white/5'
            }`}
            title="تحويل الفكرة إلى مهمة في قائمة المهام"
          >
            {isConverted ? (
              <>
                <Check size={11} />
                <span>تم التحويل لمهمة ✓</span>
              </>
            ) : (
              <>
                <ListTodo size={11} />
                <span>تحويل لمهمة</span>
              </>
            )}
          </button>

          {/* Copy */}
          <button
            onClick={() => onCopy(note)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all text-[10px] font-bold ${
              isCopied
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
            title="نسخ نص الفكرة"
          >
            {isCopied ? (
              <>
                <Check size={11} />
                <span>تم النسخ</span>
              </>
            ) : (
              <>
                <Copy size={11} />
                <span>نسخ</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
