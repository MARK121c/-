'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, BookOpen, FileText, CheckSquare, Link as LinkIcon, Video,
  Plus, Edit2, Trash2, CheckCircle, Circle, RefreshCw, Settings, Users,
  ArrowLeft, ArrowRight, Download, ExternalLink, Play, Clock, Calendar,
  AlertCircle, ChevronRight, X, Search, Shield, Sparkles, Folder, Eye, FolderPlus,
  ImageIcon, Upload, Camera
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
  drive_folder_url?: string;
  driveFolderUrl?: string;
  cover_image?: string;
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

function parseEmbedPreviewUrl(url: string): { embedUrl: string; type: 'youtube' | 'drive' | 'generic' } {
  if (!url) return { embedUrl: '', type: 'generic' };
  const clean = url.trim();

  // YouTube
  const ytMatch = clean.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return {
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`,
      type: 'youtube',
    };
  }

  // Google Drive File
  if (clean.includes('drive.google.com')) {
    let fileId: string | null = null;
    const matchD = clean.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (matchD && matchD[1]) fileId = matchD[1];
    if (!fileId) {
      const matchParam = clean.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (matchParam && matchParam[1]) fileId = matchParam[1];
    }
    if (fileId) {
      return {
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        type: 'drive',
      };
    }
  }

  // Google Docs / Sheets / Slides
  if (clean.includes('docs.google.com')) {
    const previewUrl = clean.replace(/\/edit.*$/, '/preview');
    return {
      embedUrl: previewUrl,
      type: 'drive',
    };
  }

  return { embedUrl: clean, type: 'generic' };
}

interface AcademicClientProps {
  userRole?: 'owner' | 'assistant' | 'viewer';
}

export default function AcademicClient({ userRole }: AcademicClientProps = {}) {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [role, setRole] = useState<'owner' | 'assistant' | 'viewer'>(() => {
    if (userRole) return userRole;
    if (typeof window !== 'undefined') {
      try {
        const u = JSON.parse(localStorage.getItem('academic_user') || '{}');
        if (u.role === 'assistant' || u.role === 'viewer' || u.role === 'owner') return u.role;
      } catch {}
    }
    return 'owner';
  });

  useEffect(() => {
    if (userRole) {
      setRole(userRole);
    } else {
      try {
        const u = JSON.parse(localStorage.getItem('academic_user') || '{}');
        if (u.role) setRole(u.role);
      } catch {}
    }
  }, [userRole]);

  const isOwner = role === 'owner';
  const isAssistant = role === 'assistant';
  const isViewer = role === 'viewer';

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
  const [previewModal, setPreviewModal] = useState<{ open: boolean; title: string; url: string; embedUrl: string; type: string }>({
    open: false,
    title: '',
    url: '',
    embedUrl: '',
    type: 'generic',
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; type: string; id: number; title: string }>({ open: false, type: '', id: 0, title: '' });

  // Form states
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    code: '',
    color: '#FF6B00',
    icon: '📘',
    drive_folder_url: '',
    cover_image: '',
  });

  const [materialForm, setMaterialForm] = useState({
    title: '',
    description: '',
    file_path: '',
    url: '',
    video_url: '',
    video_type: 'youtube',
    due_date: '',
    material_date: new Date().toISOString().split('T')[0],
  });

  const [assistantForm, setAssistantForm] = useState({ username: '', password: '', display_name: '', role: 'assistant' });

  const t = {
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
      linkUrl: 'رابط الملف أو المستند (Google Drive / PDF / Dropbox / خارجي)',
      dueDate: 'الموعد النهائي للتسليم',
      materialDate: 'تاريخ المادة',
      videoType: 'نوع الفيديو',
      subjectName: 'اسم المادة',
      subjectCode: 'كود / رمز المادة',
      driveFolderUrl: 'رابط مجلد Google Drive الخاص بالمادة (لتخزين المحاضرات والملفات)',
      openDriveFolder: 'فتح مجلد Google Drive للمادة',
      setDriveFolder: 'ربط مجلد Google Drive للمادة',
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
      previewDoc: 'معاينة داخل السيستم',
      openLink: 'فتح الرابط الأصلي',
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
      linkUrl: 'File / Document URL (Google Drive / PDF / Dropbox / External)',
      dueDate: 'Due Date',
      materialDate: 'Material Date',
      videoType: 'Video Type',
      subjectName: 'Subject Name',
      subjectCode: 'Subject Code',
      driveFolderUrl: 'Subject Google Drive Folder URL',
      openDriveFolder: 'Open Subject Google Drive Folder',
      setDriveFolder: 'Link Google Drive Folder',
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
      previewDoc: 'In-App Preview',
      openLink: 'Open Link',
      watchVideo: 'Watch Video',
      searchPlaceholder: 'Search subjects or materials...',
      items: 'items',
      completed: 'completed',
      allComplete: 'Completed 👏',
      activeProgress: 'In Progress',
    }
  }[lang];

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
    if (!isOwner) return;
    try {
      await fetch('/api/academic/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      setShowSettingsModal(false);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // Save Subject
  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer || !subjectForm.name.trim()) return;

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
      setSubjectForm({ name: '', code: '', color: '#FF6B00', icon: '📘', drive_folder_url: '', cover_image: '' });
      fetchData();
      if (currentSubject && currentSubject.id === editSubjectId) {
        loadSubjectDetail(editSubjectId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save Material (Lectures / Assignments / Resources / Videos) — 100% Links, Zero Server Storage
  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer || !currentSubject || !materialForm.title.trim()) return;

    const endpointMap: Record<string, string> = {
      lectures: '/api/academic/materials/lectures',
      assignments: '/api/academic/materials/assignments',
      resources: '/api/academic/materials/resources',
      videos: '/api/academic/materials/videos',
    };

    const endpoint = endpointMap[activeTab];
    if (!endpoint) return;

    try {
      const payload: any = {
        subject_id: currentSubject.id,
        title: materialForm.title.trim(),
        description: materialForm.description.trim(),
        material_date: materialForm.material_date,
      };

      if (activeTab === 'lectures') {
        payload.file_path = materialForm.file_path.trim();
        payload.url = materialForm.file_path.trim();
      } else if (activeTab === 'assignments') {
        payload.file_path = materialForm.file_path.trim();
        payload.due_date = materialForm.due_date;
      } else if (activeTab === 'resources') {
        payload.url = materialForm.url.trim() || materialForm.file_path.trim();
      } else if (activeTab === 'videos') {
        payload.video_url = materialForm.video_url.trim();
        payload.video_type = materialForm.video_type;
      }

      if (editMaterialId) {
        await fetch(endpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editMaterialId,
            ...payload,
          }),
        });
      } else {
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      setShowMaterialModal(false);
      setEditMaterialId(null);
      setMaterialForm({
        title: '',
        description: '',
        file_path: '',
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

  // Toggle item completion (per-account progress)
  const handleToggleCompleted = async (tab: string, id: number, currentVal: boolean) => {
    const endpointMap: Record<string, string> = {
      lectures: '/api/academic/materials/lectures',
      assignments: '/api/academic/materials/assignments',
      resources: '/api/academic/materials/resources',
      videos: '/api/academic/materials/videos',
    };

    const endpoint = endpointMap[tab];
    if (!endpoint) return;

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
    if (isViewer) return;
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
    if (isViewer) return;
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
  // Load assistants
  const loadAssistants = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('academic_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/academic/assistants', { headers }).then(r => r.json());
      if (res.success && res.assistants) setAssistants(res.assistants);
    } catch (e) {
      console.error(e);
    }
  };

  const [assistantSubmitting, setAssistantSubmitting] = useState(false);
  const [assistantFeedback, setAssistantFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Create Assistant (Owner Only)
  const handleCreateAssistant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistantForm.username.trim() || !assistantForm.password.trim()) {
      setAssistantFeedback({ type: 'error', message: 'يرجى كتابة اسم المستخدم وكلمة المرور' });
      return;
    }
    setAssistantSubmitting(true);
    setAssistantFeedback(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('academic_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/academic/assistants', {
        method: 'POST',
        headers,
        body: JSON.stringify(assistantForm),
      }).then(r => r.json());

      if (res.success) {
        setAssistantForm({ username: '', password: '', display_name: '', role: 'assistant' });
        setAssistantFeedback({ type: 'success', message: 'تم إنشاء الحساب بنجاح! يمكن للمستخدم الآن تسجيل الدخول.' });
        loadAssistants();
      } else {
        const errorMsg = res.error === 'Username already exists'
          ? 'اسم المستخدم مسجل بالفعل، يرجى اختيار اسم مستخدم آخر'
          : (res.error || 'فشل إنشاء الحساب');
        setAssistantFeedback({ type: 'error', message: errorMsg });
      }
    } catch (e: any) {
      console.error(e);
      setAssistantFeedback({ type: 'error', message: e.message || 'حدث خطأ في الاتصال بالخادم' });
    } finally {
      setAssistantSubmitting(false);
    }
  };

  // Delete Assistant (Owner Only)
  const handleDeleteAssistant = async (id: number) => {
    if (!confirm(t.confirmDeleteMsg || 'هل أنت متأكد من حذف هذا الحساب؟')) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('academic_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/academic/assistants?id=${id}`, { method: 'DELETE', headers }).then(r => r.json());
      if (res.success) {
        loadAssistants();
      } else {
        alert(res.error || 'فشل حذف الحساب');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredSubjects = subjects.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.code && s.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* ── TOP HEADER BAR ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-8 rounded-[2.5rem] border border-white/10 bg-white/[0.03] backdrop-blur-2xl">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
              <GraduationCap size={26} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                {t.academicHub}
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  COLLEGE OS
                </span>
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {settings.college_name || 'الكلية'} • {settings.department || 'القسم'} • {settings.academic_year || 'السنة الدراسية'}
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {pendingSync > 0 && !isViewer && (
            <button
              onClick={handleSyncContent}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-black shadow-lg animate-pulse"
            >
              <RefreshCw size={14} className="animate-spin" />
              <span>{t.syncNow} ({pendingSync})</span>
            </button>
          )}

          {isOwner && (
            <>
              <button
                onClick={() => {
                  loadAssistants();
                  setShowAssistantsModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white transition-all"
              >
                <Users size={16} />
                <span>حسابات المساعدين</span>
              </button>

              <button
                onClick={() => setShowSettingsModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white transition-all"
              >
                <Settings size={16} />
                <span>إعدادات الكلية</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── OVERALL PROGRESS STRIP ── */}
      <div className="p-6 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl space-y-3">
        <div className="flex justify-between items-center text-xs font-bold">
          <span className="text-gray-400 flex items-center gap-2">
            <Sparkles size={14} className="text-amber-400" />
            <span>{t.overallProgress}</span>
          </span>
          <span className="font-mono text-amber-400 text-sm font-black">
            {overallProgress.completed} / {overallProgress.total} {t.items} ({overallProgress.percentage}%)
          </span>
        </div>
        <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden p-0.5 border border-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-300 transition-all duration-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
            style={{ width: `${overallProgress.percentage}%` }}
          />
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      {!currentSubject ? (
        /* ── SUBJECTS GRID VIEW ── */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-4 pr-9 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {!isViewer && (
              <button
                onClick={() => {
                  setEditSubjectId(null);
                  setSubjectForm({ name: '', code: '', color: '#FF6B00', icon: '📘', drive_folder_url: '', cover_image: '' });
                  setShowSubjectModal(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
              >
                <Plus size={18} />
                <span>{t.addSubject}</span>
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <RefreshCw className="animate-spin text-amber-400 mr-3" size={24} />
              <span>جاري تحميل المواد...</span>
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-3xl border border-white/10 bg-white/[0.02] space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-3xl">
                📚
              </div>
              <h3 className="text-lg font-bold text-white">{t.noSubjects}</h3>
              {!isViewer && (
                <button
                  onClick={() => setShowSubjectModal(true)}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-sm hover:bg-amber-400 shadow-lg"
                >
                  + {t.addSubject}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSubjects.map(sub => {
                const percentage = sub.stats?.percentage || 0;
                const driveUrl = sub.drive_folder_url || sub.driveFolderUrl;

                return (
                  <motion.div
                    key={sub.id}
                    whileHover={{ y: -4 }}
                    onClick={() => handleSelectSubject(sub)}
                    className="group relative flex flex-col justify-between rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] hover:border-amber-500/40 hover:shadow-2xl hover:shadow-amber-500/5 transition-all cursor-pointer overflow-hidden"
                  >
                    {/* Cover Image */}
                    {sub.cover_image && (
                      <div className="relative w-full h-32 overflow-hidden">
                        <img
                          src={sub.cover_image}
                          alt={sub.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d12] via-transparent to-transparent" />
                      </div>
                    )}

                    <div className={`p-6 space-y-5 ${sub.cover_image ? 'pt-3' : ''}`}>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border shadow-lg"
                          style={{
                            backgroundColor: `${sub.color}20`,
                            borderColor: `${sub.color}50`,
                          }}
                        >
                          {sub.icon || '📘'}
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                            {sub.name}
                          </h3>
                          {sub.code && (
                            <span className="text-xs font-mono font-bold text-gray-400">{sub.code}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {driveUrl && (
                          <a
                            href={driveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition-all"
                            title="فتح مجلد Google Drive للمادة"
                          >
                            <Folder size={14} />
                          </a>
                        )}
                        <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono font-bold text-gray-300">
                          {percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-gray-400 font-mono">
                        <span>{sub.stats?.completed || 0} / {sub.stats?.total || 0} {t.completed}</span>
                        <span>{sub.stats?.total ? `${sub.stats.total} مواد` : 'فارغ'}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: sub.color || '#FF6B00',
                          }}
                        />
                      </div>
                    </div>

                    {/* Material Counters Strip */}
                    <div className="grid grid-cols-4 gap-2 pt-3 border-t border-white/5 text-center">
                      <div className="p-2 rounded-xl bg-white/[0.02]">
                        <span className="text-[11px] text-gray-400 block font-bold">محاضرات</span>
                        <strong className="text-xs font-mono text-white">{sub.stats?.lectures || 0}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-white/[0.02]">
                        <span className="text-[11px] text-gray-400 block font-bold">واجبات</span>
                        <strong className="text-xs font-mono text-white">{sub.stats?.assignments || 0}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-white/[0.02]">
                        <span className="text-[11px] text-gray-400 block font-bold">مراجع</span>
                        <strong className="text-xs font-mono text-white">{sub.stats?.resources || 0}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-white/[0.02]">
                        <span className="text-[11px] text-gray-400 block font-bold">فيديوهات</span>
                        <strong className="text-xs font-mono text-white">{sub.stats?.videos || 0}</strong>
                      </div>
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
          {/* Cover Image Banner */}
          {currentSubject.cover_image && (
            <div className="relative w-full h-40 sm:h-52 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
              <img
                src={currentSubject.cover_image}
                alt={currentSubject.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex items-end p-6">
                <span className="px-3 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs font-bold text-white/80">
                  كفر المادة الأكاديمية
                </span>
              </div>
            </div>
          )}

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

            {!isViewer && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditSubjectId(currentSubject.id);
                    setSubjectForm({
                      name: currentSubject.name,
                      code: currentSubject.code || '',
                      color: currentSubject.color || '#FF6B00',
                      icon: currentSubject.icon || '📘',
                      drive_folder_url: currentSubject.drive_folder_url || currentSubject.driveFolderUrl || '',
                      cover_image: currentSubject.cover_image || '',
                    });
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
            )}
          </div>

          {/* ── GOOGLE DRIVE FOLDER HERO BANNER ── */}
          <div className="p-5 rounded-3xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-blue-900/20 to-black backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-blue-500/5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center text-xl shadow-inner">
                <Folder size={24} />
              </div>
              <div>
                <strong className="text-base font-black text-white block">
                  مجلد Google Drive المخصص لهذه المادة
                </strong>
                <span className="text-xs text-gray-400 block">
                  {currentSubject.drive_folder_url || currentSubject.driveFolderUrl
                    ? 'تم ربط المجلد السحابي: يمكنك رفع وتصفح الملفات والـ PDFs مباشرة عبر درايف'
                    : 'لم يتم ربط مجلد درايف بعد'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {currentSubject.drive_folder_url || currentSubject.driveFolderUrl ? (
                <>
                  <a
                    href={currentSubject.drive_folder_url || currentSubject.driveFolderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-black font-black text-xs shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
                  >
                    <span>🚀 {t.openDriveFolder}</span>
                    <ExternalLink size={14} />
                  </a>
                  {!isViewer && (
                    <button
                      onClick={() => {
                        setEditSubjectId(currentSubject.id);
                        setSubjectForm({
                          name: currentSubject.name,
                          code: currentSubject.code || '',
                          color: currentSubject.color || '#FF6B00',
                          icon: currentSubject.icon || '📘',
                          drive_folder_url: currentSubject.drive_folder_url || currentSubject.driveFolderUrl || '',
                          cover_image: currentSubject.cover_image || '',
                        });
                        setShowSubjectModal(true);
                      }}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white"
                      title="تعديل رابط المجلد"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                </>
              ) : (
                !isViewer && (
                  <button
                    onClick={() => {
                      setEditSubjectId(currentSubject.id);
                      setSubjectForm({
                        name: currentSubject.name,
                        code: currentSubject.code || '',
                        color: currentSubject.color || '#FF6B00',
                        icon: currentSubject.icon || '📘',
                        drive_folder_url: '',
                        cover_image: currentSubject.cover_image || '',
                      });
                      setShowSubjectModal(true);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500/20 hover:bg-blue-500 text-blue-300 hover:text-black font-black text-xs border border-blue-500/40 transition-all"
                  >
                    <FolderPlus size={16} />
                    <span>+ {t.setDriveFolder}</span>
                  </button>
                )
              )}
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

            {!isViewer && (
              <button
                onClick={() => {
                  setEditMaterialId(null);
                  setMaterialForm({
                    title: '',
                    description: '',
                    file_path: '',
                    url: '',
                    video_url: '',
                    video_type: 'youtube',
                    due_date: '',
                    material_date: new Date().toISOString().split('T')[0],
                  });
                  setShowMaterialModal(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-lg shrink-0"
              >
                <Plus size={16} />
                <span>{t.add}</span>
              </button>
            )}
          </div>

          {/* Material Items List */}
          <div className="space-y-3">
            {(() => {
              const items = currentSubject[activeTab] || [];
              if (items.length === 0) {
                return (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-sm font-bold">{t.noItems}</p>
                  </div>
                );
              }

              return items.map((item: any) => {
                const isCompleted = item.completed === 1 || item.completed === true;
                const isOverdue = item.due_date && new Date(item.due_date) < new Date() && !isCompleted;
                const itemLink = item.file_path || item.url || item.video_url || '';
                const { embedUrl, type: previewType } = parseEmbedPreviewUrl(itemLink);

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
                    <div className="flex items-start gap-4 w-full sm:w-auto flex-1 min-w-0">
                      <button
                        onClick={() => handleToggleCompleted(activeTab, item.id, isCompleted)}
                        className={`mt-1 w-6 h-6 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-500 border-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                            : 'border-gray-500 hover:border-emerald-400 text-transparent'
                        }`}
                        title="تحديد كمكتمل لهذا الحساب"
                      >
                        <CheckCircle size={14} className={isCompleted ? 'stroke-[3]' : 'opacity-0'} />
                      </button>

                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className={`text-base font-bold truncate ${isCompleted ? 'line-through text-gray-500' : 'text-white'}`}>
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
                          {itemLink && (
                            <span className="flex items-center gap-1 text-cyan-400 font-mono truncate max-w-xs">
                              <LinkIcon size={12} />
                              <span className="truncate">{itemLink}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions on item */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {/* In-App Live Preview Button for Documents / Drive / Videos */}
                      {itemLink && (
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewModal({
                              open: true,
                              title: item.title,
                              url: itemLink,
                              embedUrl: embedUrl,
                              type: previewType,
                            });
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-bold hover:bg-amber-500 hover:text-black transition-all shadow-sm"
                          title={t.previewDoc}
                        >
                          <Eye size={14} />
                          <span>{t.previewDoc}</span>
                        </button>
                      )}

                      {/* Direct External Link */}
                      {itemLink && (
                        <a
                          href={itemLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                          title={t.openLink}
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}

                      {/* Edit & Delete Buttons for non-viewers only */}
                      {!isViewer && (
                        <>
                          <button
                            onClick={() => {
                              setEditMaterialId(item.id);
                              setMaterialForm({
                                title: item.title,
                                description: item.description || '',
                                file_path: item.file_path || item.url || '',
                                url: item.url || item.file_path || '',
                                video_url: item.video_url || item.file_path || '',
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
                        </>
                      )}
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

      {/* 2. Subject Modal (Add / Edit) with Google Drive Folder Link */}
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

                {/* Google Drive Folder Link */}
                <div className="space-y-1.5 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                  <label className="text-xs font-black text-blue-400 flex items-center gap-1.5">
                    <Folder size={14} />
                    <span>{t.driveFolderUrl}</span>
                  </label>
                  <input
                    type="url"
                    value={subjectForm.drive_folder_url}
                    onChange={e => setSubjectForm({ ...subjectForm, drive_folder_url: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-white focus:outline-none focus:border-blue-400"
                    placeholder="https://drive.google.com/drive/folders/..."
                  />
                  <span className="text-[10px] text-gray-400 block">
                    ضع رابط مجلد درايف المخصص لهذه المادة لفتحه وتخزين كافة المحاضرات والماتريال فيه.
                  </span>
                </div>

                {/* Cover Image Upload */}
                <div className="space-y-2 p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20">
                  <label className="text-xs font-black text-purple-400 flex items-center gap-1.5">
                    <Camera size={14} />
                    <span>صورة غلاف المادة (اختياري)</span>
                  </label>

                  {subjectForm.cover_image ? (
                    <div className="relative group">
                      <img
                        src={subjectForm.cover_image}
                        alt="Cover"
                        className="w-full h-36 object-cover rounded-xl border border-white/10"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all rounded-xl flex items-center justify-center gap-3">
                        <label className="cursor-pointer p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all">
                          <Upload size={18} />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const formData = new FormData();
                              formData.append('file', file);
                              try {
                                const res = await fetch('/api/academic/upload', { method: 'POST', body: formData });
                                const data = await res.json();
                                if (data.success) {
                                  setSubjectForm({ ...subjectForm, cover_image: data.url });
                                }
                              } catch (err) { console.error(err); }
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setSubjectForm({ ...subjectForm, cover_image: '' })}
                          className="p-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-white/10 hover:border-purple-500/40 bg-white/[0.02] hover:bg-purple-500/5 transition-all">
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                        <ImageIcon size={24} className="text-purple-400" />
                      </div>
                      <span className="text-xs font-bold text-gray-400">اضغط لاختيار صورة غلاف</span>
                      <span className="text-[10px] text-gray-500">PNG, JPG, WEBP — حد أقصى 5MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 5 * 1024 * 1024) {
                            alert('الصورة كبيرة جداً. الحد الأقصى 5MB');
                            return;
                          }
                          const formData = new FormData();
                          formData.append('file', file);
                          try {
                            const res = await fetch('/api/academic/upload', { method: 'POST', body: formData });
                            const data = await res.json();
                            if (data.success) {
                              setSubjectForm({ ...subjectForm, cover_image: data.url });
                            } else {
                              alert(data.error || 'فشل رفع الصورة');
                            }
                          } catch (err) { console.error(err); }
                        }}
                      />
                    </label>
                  )}
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

      {/* 3. Material Modal (Lectures / Assignments / Resources / Videos) — ZERO FILE UPLOAD */}
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
                    placeholder="عنوان المحاضرة أو الواجب أو المرجع..."
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

                {/* Direct Link / Google Drive / PDF URL */}
                {activeTab !== 'videos' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 block mb-1">{t.linkUrl}</label>
                    <input
                      type="url"
                      value={activeTab === 'resources' ? materialForm.url : materialForm.file_path}
                      onChange={e => {
                        const val = e.target.value;
                        if (activeTab === 'resources') setMaterialForm({ ...materialForm, url: val });
                        else setMaterialForm({ ...materialForm, file_path: val });
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:border-amber-500"
                      placeholder="https://drive.google.com/file/d/... أو رابط PDF خارجي"
                    />
                    <span className="text-[10px] text-gray-500">
                      يدعم روابط Google Drive و Dropbox و مستندات الـ PDF مع إمكانية المعاينة المباشرة داخل السيستم.
                    </span>
                  </div>
                )}

                {/* Video URL */}
                {activeTab === 'videos' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 block mb-1">رابط الفيديو (YouTube / Drive / Loom)</label>
                    <input
                      type="url"
                      required
                      value={materialForm.video_url}
                      onChange={e => setMaterialForm({ ...materialForm, video_url: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:border-amber-500"
                      placeholder="https://www.youtube.com/watch?v=... أو Google Drive Video"
                    />
                  </div>
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

      {/* 4. Live In-App Document / Video Preview Modal */}
      <AnimatePresence>
        {previewModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-6xl rounded-[2rem] border border-white/10 bg-[#0c0d12] p-5 sm:p-6 space-y-4 shadow-2xl flex flex-col max-h-[95vh]"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Eye size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white truncate max-w-lg">{previewModal.title}</h3>
                    <span className="text-[11px] text-gray-400 font-mono block truncate max-w-md">{previewModal.url}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={previewModal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 hover:text-white border border-white/10 transition-all"
                  >
                    <span>{t.openLink}</span>
                    <ExternalLink size={12} />
                  </a>
                  <button
                    onClick={() => setPreviewModal({ open: false, title: '', url: '', embedUrl: '', type: 'generic' })}
                    className="p-2 text-gray-400 hover:text-white rounded-xl bg-white/5"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Embedded Frame with Guaranteed Full Height */}
              <div className="relative w-full h-[72vh] min-h-[480px] rounded-2xl overflow-hidden bg-black border border-white/10 shadow-inner">
                <iframe
                  src={previewModal.embedUrl || previewModal.url}
                  title={previewModal.title}
                  className="absolute inset-0 w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Assistants & Sync Modal */}
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

                {/* Account Role Selector: Assistant vs View-Only */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-bold text-gray-400 block">نوع الحساب والصلاحية الممنوحة:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAssistantForm({ ...assistantForm, role: 'assistant' })}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between text-right ${
                        assistantForm.role === 'assistant'
                          ? 'border-amber-500 bg-amber-500/20 text-amber-300 shadow-md shadow-amber-500/10'
                          : 'border-white/10 bg-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>✏️ مساعد (إضافة وتعديل المحتوى)</span>
                      </div>
                      {assistantForm.role === 'assistant' && <CheckCircle size={15} className="text-amber-400" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setAssistantForm({ ...assistantForm, role: 'viewer' })}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between text-right ${
                        assistantForm.role === 'viewer'
                          ? 'border-purple-500 bg-purple-500/20 text-purple-300 shadow-md shadow-purple-500/10'
                          : 'border-white/10 bg-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>👁️ عرض فقط لا غير (مشاهدة المحتوى فقط)</span>
                      </div>
                      {assistantForm.role === 'viewer' && <CheckCircle size={15} className="text-purple-400" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-gray-500 block">
                    * الحسابات المُنشأة هنا مقيدة بصلاحية قسم الكلية فقط وممنوعة تماماً من الوصول لأي بيانات أخرى في النظام.
                  </span>
                </div>

                {assistantFeedback && (
                  <div className={`p-3 rounded-xl text-xs font-bold ${
                    assistantFeedback.type === 'success'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    {assistantFeedback.message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={assistantSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 text-black text-xs font-black hover:bg-amber-400 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {assistantSubmitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>جاري الإضافة...</span>
                    </>
                  ) : (
                    <span>+ {t.create}</span>
                  )}
                </button>
              </form>

              {/* Assistants List */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-400">الحسابات المسجلة</h4>
                {assistants.length === 0 ? (
                  <p className="text-xs text-gray-500">{t.noAssistants}</p>
                ) : (
                  assistants.map(asst => (
                    <div key={asst.id} className="flex items-center justify-between p-3.5 rounded-xl border border-white/10 bg-white/[0.02]">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-sm text-white block">{asst.display_name || asst.username}</strong>
                          {asst.role === 'viewer' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              👁️ عرض فقط لا غير
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              ✏️ مساعد
                            </span>
                          )}
                        </div>
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
                  className="px-6 py-2 rounded-xl bg-red-500 text-white font-bold text-xs hover:bg-red-400 shadow-lg"
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
