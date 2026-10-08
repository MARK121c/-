'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, BookOpen, FileText, CheckSquare, Link as LinkIcon, Video,
  Plus, Edit2, Trash2, CheckCircle, Circle, RefreshCw, Settings, Users,
  ArrowLeft, ArrowRight, Download, ExternalLink, Play, Clock, Calendar,
  AlertCircle, ChevronRight, X, UploadCloud, Search, Shield, Sparkles
} from 'lucide-react';

interface AcademicSettings {
  id?: number;
  college_name: string;
  department: string;
  academic_year: string;
  section_number: string;
}

interface Subject {
  id: number;
  name: string;
  code: string;
  color: string;
  icon: string;
  sort_order: number;
  stats?: {
    lectures: number;
    assignments: number;
    resources: number;
    videos: number;
    total: number;
    completed: number;
    percentage: number;
  };
  lectures?: any[];
  assignments?: any[];
  resources?: any[];
  videos?: any[];
}

const EMOJIS = ['📘', '📗', '📕', '📙', '📓', '🔬', '💻', '📐', '🧮', '⚡', '🌐', '📡', '📊', '🧠', '⚙️', '🎯'];
const COLORS = ['#FF6B00', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#06B6D4', '#6366F1'];

const T = {
  ar: {
    academicHub: 'الدراسة والكلية',
    collegeName: 'اسم الكلية',
    department: 'القسم / التخصص',
    academicYear: 'الفرقة / السنة الدراسية',
    sectionNumber: 'رقم السكشن',
    overallProgress: 'الإنجاز الأكاديمي الكلي',
    subjects: 'المواد الدراسية',
    addSubject: 'إضافة مادة',
    editSubject: 'تعديل مادة',
    noSubjects: 'لا توجد مواد مسجلة بعد. أضف مادتك الأولى للبدء!',
    tabLectures: 'المحاضرات والملفات',
    tabAssignments: 'الواجبات والتاسكات',
    tabResources: 'المصادر والروابط',
    tabVideos: 'الفيديوهات والشروحات',
    add: 'إضافة',
    edit: 'تعديل',
    delete: 'حذف',
    back: 'الرجوع للمواد',
    save: 'حفظ التعديلات',
    cancel: 'إلغاء',
    create: 'إنشاء',
    noItems: 'لا توجد عناصر مضافة في هذا القسم حتى الآن',
    title: 'العنوان',
    description: 'الوصف أو الملاحظات',
    uploadFile: 'رفع ملف (PDF / Word / PPT / صور)',
    url: 'الرابط الإلكتروني',
    dueDate: 'الموعد النهائي للتسليم',
    materialDate: 'تاريخ المادة',
    videoType: 'نوع الفيديو',
    subjectName: 'اسم المادة',
    subjectCode: 'كود / رمز المادة',
    color: 'اللون المميز',
    icon: 'الأيقونة',
    confirmDelete: 'تأكيد الحذف',
    confirmDeleteMsg: 'هل أنت متأكد من الحذف؟ لا يمكن التراجع عن هذا الإجراء.',
    settingsTitle: 'إعدادات الكلية والدراسة',
    assistantsTitle: 'إدارة حسابات المساعدين والمزامنة',
    createAssistant: 'إنشاء حساب مساعد',
    noAssistants: 'لا توجد حسابات مساعدين حالياً',
    username: 'اسم المستخدم',
    password: 'كلمة المرور',
    displayName: 'الاسم المعروض',
    pendingSync: 'محتوى في انتظار المزامنة:',
    syncNow: 'مزامنة المحتوى الآن',
    synced: 'تمت المزامنة',
    overdue: 'متأخر!',
    dueIn: 'الموعد:',
    download: 'تحميل الملف',
    openLink: 'فتح الرابط',
    watchVideo: 'مشاهدة الفيديو',
    searchPlaceholder: 'ابحث في المواد أو المحتوى...',
    items: 'عناصر',
    completed: 'مكتمل',
    allComplete: 'مكتمل بالكامل 👏',
    activeProgress: 'قيد الإنجاز',
  },
  en: {
    academicHub: 'Academic Hub',
    collegeName: 'College Name',
    department: 'Department',
    academicYear: 'Academic Year',
    sectionNumber: 'Section Number',
    overallProgress: 'Overall Academic Progress',
    subjects: 'Courses & Subjects',
    addSubject: 'Add Subject',
    editSubject: 'Edit Subject',
    noSubjects: 'No courses added yet. Add your first subject to start!',
    tabLectures: 'Lectures & Files',
    tabAssignments: 'Assignments & Tasks',
    tabResources: 'Resources & Links',
    tabVideos: 'Videos & Tutorials',
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    back: 'Back to Subjects',
    save: 'Save Changes',
    cancel: 'Cancel',
    create: 'Create',
    noItems: 'No items in this section yet',
    title: 'Title',
    description: 'Description / Notes',
    uploadFile: 'Upload File (PDF / Word / PPT / Images)',
    url: 'URL Link',
    dueDate: 'Due Date',
    materialDate: 'Material Date',
    videoType: 'Video Type',
    subjectName: 'Subject Name',
    subjectCode: 'Subject Code',
    color: 'Theme Color',
    icon: 'Icon',
    confirmDelete: 'Confirm Delete',
    confirmDeleteMsg: 'Are you sure you want to delete this? This action cannot be undone.',
    settingsTitle: 'Academic Settings',
    assistantsTitle: 'Assistant Accounts & Sync',
    createAssistant: 'Create Assistant Account',
    noAssistants: 'No assistant accounts yet',
    username: 'Username',
    password: 'Password',
    displayName: 'Display Name',
    pendingSync: 'Content pending sync:',
    syncNow: 'Sync Content Now',
    synced: 'Synced',
    overdue: 'Overdue!',
    dueIn: 'Due:',
    download: 'Download File',
    openLink: 'Open Link',
    watchVideo: 'Watch Video',
    searchPlaceholder: 'Search subjects or materials...',
    items: 'items',
    completed: 'completed',
    allComplete: 'Completed 👏',
    activeProgress: 'In Progress',
  }
};

export default function AcademicClient() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const t = T[lang];

  const [settings, setSettings] = useState<AcademicSettings>({
    college_name: '',
    department: '',
    academic_year: '',
    section_number: '',
  });
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [activeTab, setActiveTab] = useState<'lectures' | 'assignments' | 'resources' | 'videos'>('lectures');
  const [overallProgress, setOverallProgress] = useState({ total: 0, completed: 0, percentage: 0 });
  const [pendingSync, setPendingSync] = useState(0);
  const [assistants, setAssistants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editSubjectId, setEditSubjectId] = useState<number | null>(null);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [editMaterialId, setEditMaterialId] = useState<number | null>(null);
  const [showAssistantsModal, setShowAssistantsModal] = useState(false);
  const [showVideoPlayerModal, setShowVideoPlayerModal] = useState<{ open: boolean; video: any | null }>({ open: false, video: null });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; type: string; id: number; title: string }>({ open: false, type: '', id: 0, title: '' });

  // Form states
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', color: '#FF6B00', icon: '📘' });
  const [materialForm, setMaterialForm] = useState({
    title: '',
    description: '',
    url: '',
    video_url: '',
    video_type: 'youtube',
    due_date: '',
    material_date: new Date().toISOString().split('T')[0],
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [assistantForm, setAssistantForm] = useState({ username: '', password: '', display_name: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [settRes, subsRes, progRes, syncRes] = await Promise.all([
        fetch('/api/academic/settings').then(r => r.json()),
        fetch('/api/academic/subjects').then(r => r.json()),
        fetch('/api/academic/progress').then(r => r.json()),
        fetch('/api/academic/sync').then(r => r.json()),
      ]);

      if (settRes.success && settRes.settings) setSettings(settRes.settings);
      if (subsRes.success && subsRes.subjects) setSubjects(subsRes.subjects);
      if (progRes.success && progRes.progress) setOverallProgress(progRes.progress);
      if (syncRes.success && syncRes.pending) setPendingSync(syncRes.pending.total);
    } catch (e) {
      console.error('Failed to fetch academic data:', e);
    }
    setLoading(false);
  }, []);

  const loadSubjectDetail = useCallback(async (id: number) => {
    try {
      const res = await fetch(`/api/academic/subjects/${id}`).then(r => r.json());
      if (res.success && res.subject) {
        setCurrentSubject(res.subject);
      }
    } catch (e) {
      console.error('Failed to load subject detail:', e);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load subject when selected
  const handleSelectSubject = (sub: Subject) => {
    loadSubjectDetail(sub.id);
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/academic/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      }).then(r => r.json());
      if (res.success) {
        setShowSettingsModal(false);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save Subject (Add/Edit)
  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.name.trim()) return;

    try {
      if (editSubjectId) {
        await fetch(`/api/academic/subjects/${editSubjectId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subjectForm),
        });
      } else {
        await fetch('/api/academic/subjects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subjectForm),
        });
      }
      setShowSubjectModal(false);
      setEditSubjectId(null);
      setSubjectForm({ name: '', code: '', color: '#FF6B00', icon: '📘' });
      fetchData();
      if (currentSubject && currentSubject.id === editSubjectId) {
        loadSubjectDetail(editSubjectId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save Material (Lecture / Assignment / Resource / Video)
  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSubject || !materialForm.title.trim()) return;

    const endpointMap: Record<string, string> = {
      lectures: '/api/academic/materials/lectures',
      assignments: '/api/academic/materials/assignments',
      resources: '/api/academic/materials/resources',
      videos: '/api/academic/materials/videos',
    };

    const endpoint = endpointMap[activeTab];
    if (!endpoint) return;

    try {
      if (editMaterialId) {
        await fetch(endpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editMaterialId,
            ...materialForm,
          }),
        });
      } else {
        if (selectedFile) {
          const formData = new FormData();
          formData.append('title', materialForm.title);
          formData.append('description', materialForm.description);
          formData.append('subject_id', String(currentSubject.id));
          formData.append('material_date', materialForm.material_date);
          if (activeTab === 'assignments' && materialForm.due_date) {
            formData.append('due_date', materialForm.due_date);
          }
          if (activeTab === 'videos') {
            formData.append('video_url', materialForm.video_url);
            formData.append('video_type', materialForm.video_type);
          }
          formData.append('file', selectedFile);

          await fetch(endpoint, {
            method: 'POST',
            body: formData,
          });
        } else {
          await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subject_id: currentSubject.id,
              ...materialForm,
            }),
          });
        }
      }

      setShowMaterialModal(false);
      setEditMaterialId(null);
      setSelectedFile(null);
      setMaterialForm({
        title: '',
        description: '',
        url: '',
        video_url: '',
        video_type: 'youtube',
        due_date: '',
        material_date: new Date().toISOString().split('T')[0],
      });

      loadSubjectDetail(currentSubject.id);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle item completion
  const handleToggleCompleted = async (tab: string, id: number, currentVal: boolean) => {
    const endpointMap: Record<string, string> = {
      lectures: '/api/academic/materials/lectures',
      assignments: '/api/academic/materials/assignments',
      resources: '/api/academic/materials/resources',
      videos: '/api/academic/materials/videos',
    };

    const endpoint = endpointMap[tab];
    if (!endpoint) return;

    // Optimistic UI update
    if (currentSubject) {
      const listKey = tab as 'lectures' | 'assignments' | 'resources' | 'videos';
      const updatedList = (currentSubject[listKey] || []).map((item: any) =>
        item.id === id ? { ...item, completed: !currentVal ? 1 : 0 } : item
      );
      setCurrentSubject({ ...currentSubject, [listKey]: updatedList });
    }

    try {
      await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, toggle: true }),
      });
      if (currentSubject) loadSubjectDetail(currentSubject.id);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // Delete item handler
  const executeDelete = async () => {
    const { type, id } = deleteConfirm;
    try {
      if (type === 'subject') {
        await fetch(`/api/academic/subjects/${id}`, { method: 'DELETE' });
        setCurrentSubject(null);
        fetchData();
      } else {
        const endpointMap: Record<string, string> = {
          lectures: '/api/academic/materials/lectures',
          assignments: '/api/academic/materials/assignments',
          resources: '/api/academic/materials/resources',
          videos: '/api/academic/materials/videos',
        };
        const endpoint = endpointMap[type];
        if (endpoint) {
          await fetch(`${endpoint}?id=${id}`, { method: 'DELETE' });
          if (currentSubject) loadSubjectDetail(currentSubject.id);
          fetchData();
        }
      }
    } catch (e) {
      console.error(e);
    }
    setDeleteConfirm({ open: false, type: '', id: 0, title: '' });
  };

  // Sync content
  const handleSyncContent = async () => {
    try {
      const res = await fetch('/api/academic/sync', { method: 'POST' }).then(r => r.json());
      if (res.success) {
        setPendingSync(0);
        fetchData();
        if (currentSubject) loadSubjectDetail(currentSubject.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Load assistants
  const loadAssistants = async () => {
    try {
      const res = await fetch('/api/academic/assistants').then(r => r.json());
      if (res.success && res.assistants) setAssistants(res.assistants);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateAssistant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistantForm.username || !assistantForm.password) return;
    try {
      await fetch('/api/academic/assistants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assistantForm),
      });
      setAssistantForm({ username: '', password: '', display_name: '' });
      loadAssistants();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAssistant = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف حساب المساعد؟')) return;
    try {
      await fetch(`/api/academic/assistants?id=${id}`, { method: 'DELETE' });
      loadAssistants();
    } catch (e) {
      console.error(e);
    }
  };

  // Filter subjects / materials
  const filteredSubjects = subjects.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.code && s.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : url;
  };

  return (
    <div className="space-y-8 animate-fade-in" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* ── TOP ACADEMIC BANNER ── */}
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <GraduationCap size={36} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{t.academicHub}</h1>
                <button
                  onClick={() => setLang(l => (l === 'ar' ? 'en' : 'ar'))}
                  className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:text-white transition-all"
                >
                  {lang === 'ar' ? 'EN' : 'العربية'}
                </button>
              </div>
              <p className="text-sm font-medium text-gray-400 mt-1">
                {settings.college_name || 'كلية التكنولوجيا'} {settings.department ? `• ${settings.department}` : ''} {settings.academic_year ? `• ${settings.academic_year}` : ''} {settings.section_number ? `• ${settings.section_number}` : ''}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setShowAssistantsModal(true);
                loadAssistants();
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-bold text-gray-300 hover:bg-white/10 hover:text-white transition-all"
            >
              <Users size={16} />
              <span>{t.assistantsTitle}</span>
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-bold text-gray-300 hover:bg-white/10 hover:text-white transition-all"
            >
              <Settings size={16} />
              <span>{t.settingsTitle}</span>
            </button>
          </div>
        </div>

        {/* Sync Pending Alert */}
        {pendingSync > 0 && (
          <div className="mt-6 flex items-center justify-between p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-md">
            <div className="flex items-center gap-3 text-amber-300 text-sm font-bold">
              <RefreshCw size={18} className="animate-spin text-amber-400" />
              <span>{t.pendingSync} <strong>{pendingSync}</strong> {t.items}</span>
            </div>
            <button
              onClick={handleSyncContent}
              className="px-4 py-2 rounded-lg bg-amber-500 text-black text-xs font-black hover:bg-amber-400 transition-all shadow-lg"
            >
              {t.syncNow}
            </button>
          </div>
        )}

        {/* Overall Progress Bar */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex justify-between items-center text-sm font-bold mb-2">
            <span className="text-gray-400 flex items-center gap-2">
              <Sparkles size={16} className="text-emerald-400" />
              {t.overallProgress}
            </span>
            <span className="text-white font-mono text-base">
              {overallProgress.completed} / {overallProgress.total} ({overallProgress.percentage}%)
            </span>
          </div>
          <div className="w-full h-3.5 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress.percentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* ── SEARCH & CONTROLS ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-500" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-3 rounded-2xl border border-white/10 bg-white/[0.03] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 transition-all"
          />
        </div>

        {!currentSubject && (
          <button
            onClick={() => {
              setEditSubjectId(null);
              setSubjectForm({ name: '', code: '', color: '#FF6B00', icon: '📘' });
              setShowSubjectModal(true);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-105"
          >
            <Plus size={18} />
            <span>{t.addSubject}</span>
          </button>
        )}
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      {!currentSubject ? (
        /* ── SUBJECTS GRID VIEW ── */
        <div>
          {filteredSubjects.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-[2rem] border border-white/10 bg-white/[0.02]">
              <BookOpen size={48} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-lg font-bold text-gray-300">{t.noSubjects}</h3>
              <button
                onClick={() => setShowSubjectModal(true)}
                className="mt-4 px-6 py-2.5 rounded-xl bg-amber-500 text-black text-sm font-bold hover:bg-amber-400 transition-all shadow-lg"
              >
                {t.addSubject}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSubjects.map(sub => {
                const p = sub.stats?.percentage || 0;
                return (
                  <motion.div
                    key={sub.id}
                    whileHover={{ y: -4 }}
                    className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 backdrop-blur-xl transition-all hover:border-white/20 hover:shadow-2xl cursor-pointer"
                    onClick={() => handleSelectSubject(sub)}
                  >
                    {/* Top Subject Info */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border shadow-lg"
                          style={{
                            backgroundColor: `${sub.color}20`,
                            borderColor: `${sub.color}50`,
                          }}
                        >
                          {sub.icon || '📘'}
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-white group-hover:text-amber-400 transition-colors">
                            {sub.name}
                          </h3>
                          {sub.code && (
                            <span className="text-xs font-mono font-bold text-gray-400 uppercase">
                              {sub.code}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Menu Edit/Delete on card */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setEditSubjectId(sub.id);
                            setSubjectForm({ name: sub.name, code: sub.code, color: sub.color, icon: sub.icon });
                            setShowSubjectModal(true);
                          }}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ open: true, type: 'subject', id: sub.id, title: sub.name })}
                          className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 my-4">
                      <div className="flex justify-between text-xs font-bold text-gray-400">
                        <span>{t.completed}</span>
                        <span className="font-mono text-white">{p}%</span>
                      </div>
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${p}%`,
                            backgroundColor: sub.color || '#10B981',
                            boxShadow: `0 0 10px ${sub.color || '#10B981'}80`
                          }}
                        />
                      </div>
                    </div>

                    {/* Material Counters */}
                    <div className="grid grid-cols-4 gap-2 pt-3 border-t border-white/5 text-center">
                      <div className="p-2 rounded-xl bg-white/[0.02]">
                        <span className="text-xs text-gray-400 block">{t.tabLectures.split(' ')[0]}</span>
                        <strong className="text-sm font-mono text-white">{sub.stats?.lectures || 0}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-white/[0.02]">
                        <span className="text-xs text-gray-400 block">{t.tabAssignments.split(' ')[0]}</span>
                        <strong className="text-sm font-mono text-white">{sub.stats?.assignments || 0}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-white/[0.02]">
                        <span className="text-xs text-gray-400 block">{t.tabResources.split(' ')[0]}</span>
                        <strong className="text-sm font-mono text-white">{sub.stats?.resources || 0}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-white/[0.02]">
                        <span className="text-xs text-gray-400 block">{t.tabVideos.split(' ')[0]}</span>
                        <strong className="text-sm font-mono text-white">{sub.stats?.videos || 0}</strong>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ── SUBJECT DETAIL VIEW ── */
        <div className="space-y-6">
          {/* Back & Subject Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-[2rem] border border-white/10 bg-white/[0.03] backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentSubject(null)}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-all"
                title={t.back}
              >
                {lang === 'ar' ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
              </button>

              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border shadow-lg"
                style={{
                  backgroundColor: `${currentSubject.color}20`,
                  borderColor: `${currentSubject.color}50`,
                }}
              >
                {currentSubject.icon || '📘'}
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-white">{currentSubject.name}</h2>
                  {currentSubject.code && (
                    <span className="px-2.5 py-0.5 rounded-lg bg-white/10 text-xs font-mono font-bold text-gray-300">
                      {currentSubject.code}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1 font-mono">
                  {currentSubject.stats?.completed || 0} / {currentSubject.stats?.total || 0} {t.items} {t.completed} ({currentSubject.stats?.percentage || 0}%)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditSubjectId(currentSubject.id);
                  setSubjectForm({ name: currentSubject.name, code: currentSubject.code, color: currentSubject.color, icon: currentSubject.icon });
                  setShowSubjectModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-bold text-gray-300 hover:bg-white/10 hover:text-white"
              >
                <Edit2 size={16} />
                <span>{t.edit}</span>
              </button>
              <button
                onClick={() => setDeleteConfirm({ open: true, type: 'subject', id: currentSubject.id, title: currentSubject.name })}
                className="p-2.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 overflow-x-auto gap-2">
            <div className="flex items-center gap-2 shrink-0">
              {[
                { id: 'lectures', label: t.tabLectures, icon: <FileText size={18} />, count: currentSubject.lectures?.length || 0 },
                { id: 'assignments', label: t.tabAssignments, icon: <CheckSquare size={18} />, count: currentSubject.assignments?.length || 0 },
                { id: 'resources', label: t.tabResources, icon: <LinkIcon size={18} />, count: currentSubject.resources?.length || 0 },
                { id: 'videos', label: t.tabVideos, icon: <Video size={18} />, count: currentSubject.videos?.length || 0 },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all ${
                    activeTab === tab.id
                      ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${activeTab === tab.id ? 'bg-black/20 text-black' : 'bg-white/10 text-gray-300'}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setEditMaterialId(null);
                setSelectedFile(null);
                setMaterialForm({
                  title: '',
                  description: '',
                  url: '',
                  video_url: '',
                  video_type: 'youtube',
                  due_date: '',
                  material_date: new Date().toISOString().split('T')[0],
                });
                setShowMaterialModal(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/10 shrink-0"
            >
              <Plus size={16} />
              <span>{t.add}</span>
            </button>
          </div>

          {/* Materials List Render */}
          <div className="space-y-4">
            {(() => {
              const items = (currentSubject as any)[activeTab] || [];
              if (items.length === 0) {
                return (
                  <div className="text-center py-16 px-4 rounded-[2rem] border border-white/10 bg-white/[0.02]">
                    <FileText size={40} className="mx-auto text-gray-600 mb-3" />
                    <p className="text-gray-400 font-bold">{t.noItems}</p>
                  </div>
                );
              }

              return items.map((item: any) => {
                const isCompleted = item.completed === 1 || item.completed === true;
                const isOverdue = item.due_date && new Date(item.due_date) < new Date() && !isCompleted;

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border transition-all ${
                      isCompleted
                        ? 'border-emerald-500/20 bg-emerald-500/[0.02] opacity-75'
                        : isOverdue
                        ? 'border-red-500/30 bg-red-500/[0.02]'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                    }`}
                  >
                    {/* Checkbox and info */}
                    <div className="flex items-start gap-4 w-full sm:w-auto">
                      <button
                        onClick={() => handleToggleCompleted(activeTab, item.id, isCompleted)}
                        className={`mt-1 w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                          isCompleted
                            ? 'bg-emerald-500 border-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                            : 'border-gray-500 hover:border-emerald-400 text-transparent'
                        }`}
                      >
                        <CheckCircle size={14} className={isCompleted ? 'stroke-[3]' : 'opacity-0'} />
                      </button>

                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className={`text-base font-bold ${isCompleted ? 'line-through text-gray-500' : 'text-white'}`}>
                            {item.title}
                          </h4>
                          {isOverdue && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold">
                              <AlertCircle size={12} />
                              {t.overdue}
                            </span>
                          )}
                        </div>

                        {item.description && (
                          <p className="text-sm text-gray-400 line-clamp-2">{item.description}</p>
                        )}

                        {/* Metadata row */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 pt-1">
                          {item.material_date && (
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {item.material_date}
                            </span>
                          )}
                          {item.due_date && (
                            <span className={`flex items-center gap-1 font-bold ${isOverdue ? 'text-red-400' : 'text-amber-400'}`}>
                              <Clock size={12} />
                              {t.dueIn} {item.due_date}
                            </span>
                          )}
                          {item.file_name && (
                            <span className="flex items-center gap-1 text-cyan-400 font-mono">
                              <FileText size={12} />
                              {item.file_name} {item.file_size ? `(${Math.round(item.file_size / 1024)} KB)` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions on item */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {item.file_path && (
                        <a
                          href={item.file_path}
                          download={item.file_name || true}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-bold hover:bg-cyan-500/20"
                        >
                          <Download size={14} />
                          <span>{t.download}</span>
                        </a>
                      )}

                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-bold hover:bg-blue-500/20"
                        >
                          <ExternalLink size={14} />
                          <span>{t.openLink}</span>
                        </a>
                      )}

                      {(item.video_url || item.file_path) && activeTab === 'videos' && (
                        <button
                          onClick={() => setShowVideoPlayerModal({ open: true, video: item })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-bold hover:bg-rose-500/20"
                        >
                          <Play size={14} />
                          <span>{t.watchVideo}</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setEditMaterialId(item.id);
                          setMaterialForm({
                            title: item.title,
                            description: item.description || '',
                            url: item.url || '',
                            video_url: item.video_url || '',
                            video_type: item.video_type || 'youtube',
                            due_date: item.due_date || '',
                            material_date: item.material_date || '',
                          });
                          setShowMaterialModal(true);
                        }}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                      >
                        <Edit2 size={14} />
                      </button>

                      <button
                        onClick={() => setDeleteConfirm({ open: true, type: activeTab, id: item.id, title: item.title })}
                        className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* ── MODALS ── */}

      {/* 1. Academic Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-[2.5rem] border border-white/10 bg-[#0c0d12] p-6 sm:p-8 space-y-6 shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h3 className="text-xl font-black text-white">{t.settingsTitle}</h3>
                <button onClick={() => setShowSettingsModal(false)} className="p-2 text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">{t.collegeName}</label>
                  <input
                    type="text"
                    value={settings.college_name}
                    onChange={e => setSettings({ ...settings, college_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:border-amber-500"
                    placeholder="الكلية المصرية الصينية للتكنولوجيا المتقدمة"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">{t.department}</label>
                  <input
                    type="text"
                    value={settings.department}
                    onChange={e => setSettings({ ...settings, department: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:border-amber-500"
                    placeholder="اتصالات"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">{t.academicYear}</label>
                    <input
                      type="text"
                      value={settings.academic_year}
                      onChange={e => setSettings({ ...settings, academic_year: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:border-amber-500"
                      placeholder="الفرقة الأولى"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">{t.sectionNumber}</label>
                    <input
                      type="text"
                      value={settings.section_number}
                      onChange={e => setSettings({ ...settings, section_number: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:border-amber-500"
                      placeholder="سكشن 3"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:text-white"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-amber-500 text-black font-black text-sm hover:bg-amber-400 shadow-lg"
                  >
                    {t.save}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Subject Modal (Add / Edit) */}
      <AnimatePresence>
        {showSubjectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-[2.5rem] border border-white/10 bg-[#0c0d12] p-6 sm:p-8 space-y-6 shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h3 className="text-xl font-black text-white">
                  {editSubjectId ? t.editSubject : t.addSubject}
                </h3>
                <button onClick={() => setShowSubjectModal(false)} className="p-2 text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveSubject} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">{t.subjectName}</label>
                  <input
                    type="text"
                    required
                    value={subjectForm.name}
                    onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:border-amber-500"
                    placeholder="مثال: هندسة الإلكترونيات"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">{t.subjectCode}</label>
                  <input
                    type="text"
                    value={subjectForm.code}
                    onChange={e => setSubjectForm({ ...subjectForm, code: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:border-amber-500"
                    placeholder="مثال: ELEC101"
                  />
                </div>

                {/* Color Selection */}
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">{t.color}</label>
                  <div className="flex flex-wrap gap-3">
                    {COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSubjectForm({ ...subjectForm, color: c })}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          subjectForm.color === c ? 'scale-125 border-white shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Emoji Icon Selection */}
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">{t.icon}</label>
                  <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-white/[0.02] border border-white/5 max-h-32 overflow-y-auto">
                    {EMOJIS.map(em => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setSubjectForm({ ...subjectForm, icon: em })}
                        className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                          subjectForm.icon === em ? 'bg-amber-500/20 border border-amber-500 scale-110' : 'hover:bg-white/5'
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowSubjectModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:text-white"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-amber-500 text-black font-black text-sm hover:bg-amber-400 shadow-lg"
                  >
                    {t.save}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Material Modal (Lectures / Assignments / Resources / Videos) */}
      <AnimatePresence>
        {showMaterialModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-[2.5rem] border border-white/10 bg-[#0c0d12] p-6 sm:p-8 space-y-6 shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h3 className="text-xl font-black text-white">
                  {editMaterialId ? t.edit : t.add} ({activeTab === 'lectures' ? t.tabLectures : activeTab === 'assignments' ? t.tabAssignments : activeTab === 'resources' ? t.tabResources : t.tabVideos})
                </h3>
                <button onClick={() => setShowMaterialModal(false)} className="p-2 text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveMaterial} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">{t.title}</label>
                  <input
                    type="text"
                    required
                    value={materialForm.title}
                    onChange={e => setMaterialForm({ ...materialForm, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:border-amber-500"
                    placeholder="عنوان المحاضرة أو الواجب أو الرابط..."
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">{t.description}</label>
                  <textarea
                    rows={2}
                    value={materialForm.description}
                    onChange={e => setMaterialForm({ ...materialForm, description: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:border-amber-500"
                    placeholder="ملاحظات أو تفاصيل إضافية..."
                  />
                </div>

                {/* File Upload for Lectures, Assignments, Videos */}
                {(activeTab === 'lectures' || activeTab === 'assignments' || (activeTab === 'videos' && materialForm.video_type === 'upload')) && !editMaterialId && (
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">{t.uploadFile}</label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-white/10 hover:border-amber-500/50 rounded-2xl p-6 text-center cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] transition-all"
                    >
                      <UploadCloud size={32} className="mx-auto text-gray-500 mb-2" />
                      <p className="text-xs text-gray-300 font-bold">
                        {selectedFile ? selectedFile.name : 'اضغط لاختيار ملف أو اسحبه هنا'}
                      </p>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>
                )}

                {/* URL field for Resources */}
                {activeTab === 'resources' && (
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">{t.url}</label>
                    <input
                      type="url"
                      value={materialForm.url}
                      onChange={e => setMaterialForm({ ...materialForm, url: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:border-amber-500"
                      placeholder="https://example.com"
                    />
                  </div>
                )}

                {/* Video URL & Type */}
                {activeTab === 'videos' && (
                  <>
                    <div>
                      <label className="text-xs font-bold text-gray-400 block mb-1">{t.videoType}</label>
                      <select
                        value={materialForm.video_type}
                        onChange={e => setMaterialForm({ ...materialForm, video_type: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#161821] text-sm text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="youtube">YouTube</option>
                        <option value="external">رابط خارجي</option>
                        <option value="upload">رفع ملف فيديو</option>
                      </select>
                    </div>

                    {materialForm.video_type !== 'upload' && (
                      <div>
                        <label className="text-xs font-bold text-gray-400 block mb-1">رابط الفيديو</label>
                        <input
                          type="url"
                          value={materialForm.video_url}
                          onChange={e => setMaterialForm({ ...materialForm, video_url: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:border-amber-500"
                          placeholder="https://www.youtube.com/watch?v=..."
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">{t.materialDate}</label>
                    <input
                      type="date"
                      value={materialForm.material_date}
                      onChange={e => setMaterialForm({ ...materialForm, material_date: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {activeTab === 'assignments' && (
                    <div>
                      <label className="text-xs font-bold text-gray-400 block mb-1">{t.dueDate}</label>
                      <input
                        type="date"
                        value={materialForm.due_date}
                        onChange={e => setMaterialForm({ ...materialForm, due_date: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowMaterialModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:text-white"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-amber-500 text-black font-black text-sm hover:bg-amber-400 shadow-lg"
                  >
                    {t.save}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Assistants & Sync Modal */}
      <AnimatePresence>
        {showAssistantsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl rounded-[2.5rem] border border-white/10 bg-[#0c0d12] p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h3 className="text-xl font-black text-white">{t.assistantsTitle}</h3>
                <button onClick={() => setShowAssistantsModal(false)} className="p-2 text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              {/* Create Assistant Form */}
              <form onSubmit={handleCreateAssistant} className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
                <h4 className="text-sm font-black text-amber-400">{t.createAssistant}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    placeholder={t.username}
                    value={assistantForm.username}
                    onChange={e => setAssistantForm({ ...assistantForm, username: e.target.value })}
                    className="px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-white"
                  />
                  <input
                    type="password"
                    required
                    placeholder={t.password}
                    value={assistantForm.password}
                    onChange={e => setAssistantForm({ ...assistantForm, password: e.target.value })}
                    className="px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder={t.displayName}
                    value={assistantForm.display_name}
                    onChange={e => setAssistantForm({ ...assistantForm, display_name: e.target.value })}
                    className="px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-black text-xs font-black hover:bg-amber-400"
                >
                  {t.create}
                </button>
              </form>

              {/* Assistants List */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-400">حسابات المساعدين المسجلة</h4>
                {assistants.length === 0 ? (
                  <p className="text-xs text-gray-500">{t.noAssistants}</p>
                ) : (
                  assistants.map(asst => (
                    <div key={asst.id} className="flex items-center justify-between p-3.5 rounded-xl border border-white/10 bg-white/[0.02]">
                      <div>
                        <strong className="text-sm text-white block">{asst.display_name || asst.username}</strong>
                        <span className="text-xs font-mono text-gray-500">@{asst.username}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteAssistant(asst.id)}
                        className="p-2 rounded-lg text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Video Player Modal */}
      <AnimatePresence>
        {showVideoPlayerModal.open && showVideoPlayerModal.video && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-4xl rounded-[2rem] border border-white/10 bg-[#0c0d12] p-6 space-y-4 shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h3 className="text-lg font-black text-white">{showVideoPlayerModal.video.title}</h3>
                <button
                  onClick={() => setShowVideoPlayerModal({ open: false, video: null })}
                  className="p-2 text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/10">
                {showVideoPlayerModal.video.file_path ? (
                  <video controls className="w-full h-full" src={showVideoPlayerModal.video.file_path} />
                ) : (
                  <iframe
                    src={getYoutubeEmbedUrl(showVideoPlayerModal.video.video_url)}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Confirm Delete Modal */}
      <AnimatePresence>
        {deleteConfirm.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-[2rem] border border-red-500/20 bg-[#0c0d12] p-6 space-y-6 shadow-2xl text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/30">
                <AlertCircle size={24} />
              </div>

              <div>
                <h3 className="text-lg font-black text-white">{t.confirmDelete}</h3>
                <p className="text-xs text-gray-400 mt-1">{t.confirmDeleteMsg}</p>
                <p className="text-sm font-bold text-red-400 mt-2 font-mono">"{deleteConfirm.title}"</p>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setDeleteConfirm({ open: false, type: '', id: 0, title: '' })}
                  className="px-5 py-2 rounded-xl border border-white/10 text-xs font-bold text-gray-400 hover:text-white"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={executeDelete}
                  className="px-6 py-2 rounded-xl bg-red-500 text-white text-xs font-black hover:bg-red-400 shadow-lg"
                >
                  {t.delete}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
