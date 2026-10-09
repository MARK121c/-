'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, BookOpen, Play, CheckCircle2, Circle, Plus, Edit, Trash2,
  ChevronDown, ChevronRight, ArrowLeft, ArrowRight, ExternalLink, Download,
  FileText, Video, Sparkles, FolderPlus, Check, Award, Layers, Search, RefreshCw, X, Link as LinkIcon,
  Upload
} from 'lucide-react';

interface Attachment {
  name: string;
  url: string;
  type?: string;
}

interface Lesson {
  id: number;
  course_id: number;
  module_id: number;
  title: string;
  description: string;
  video_url: string;
  duration: string;
  notes: string;
  attachments: string; // JSON string
  completed: boolean | number;
  sort_order: number;
}

interface Module {
  id: number;
  course_id: number;
  title: string;
  sort_order: number;
  lessons?: Lesson[];
}

interface Course {
  id: number;
  title: string;
  description: string;
  thumbnail_url: string;
  category: string;
  instructor: string;
  sort_order: number;
  stats?: {
    totalLessons: number;
    completedLessons: number;
    progressPercentage: number;
  };
  modules?: Module[];
}

interface CoursesClientProps {
  lang?: 'ar' | 'en';
}

// ── VIDEO RESUME HELPERS ──────────────────────────────────────────────────────
const RESUME_KEY_PREFIX = 'lesson_resume_';

function saveResumeTime(lessonId: number, seconds: number) {
  if (!lessonId || seconds < 3) return; // don't save if watched < 3 seconds
  try {
    localStorage.setItem(`${RESUME_KEY_PREFIX}${lessonId}`, Math.floor(seconds).toString());
  } catch {}
}

function loadResumeTime(lessonId: number): number {
  try {
    const saved = localStorage.getItem(`${RESUME_KEY_PREFIX}${lessonId}`);
    return saved ? parseInt(saved, 10) : 0;
  } catch {
    return 0;
  }
}

function clearResumeTime(lessonId: number) {
  try {
    localStorage.removeItem(`${RESUME_KEY_PREFIX}${lessonId}`);
  } catch {}
}

// Build the embed URL with optional start time
function parseVideoEmbedUrl(url: string, startSeconds: number = 0): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();
  const startParam = startSeconds > 3 ? startSeconds : 0;

  // YouTube standard, short, embed, shorts, or live
  const ytMatch = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    const base = `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0&modestbranding=1&enablejsapi=1`;
    return startParam > 0 ? `${base}&start=${startParam}` : base;
  }

  // Loom
  if (cleanUrl.includes('loom.com/share/')) {
    const loomEmbed = cleanUrl.replace('loom.com/share/', 'loom.com/embed/');
    return startParam > 0 ? `${loomEmbed}?t=${startParam}` : loomEmbed;
  }

  // Vimeo
  const vimeoMatch = cleanUrl.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|)(\d+)(?:|\/\?)/);
  if (vimeoMatch && vimeoMatch[2]) {
    const base = `https://player.vimeo.com/video/${vimeoMatch[2]}`;
    return startParam > 0 ? `${base}#t=${startParam}s` : base;
  }

  // Google Drive
  if (cleanUrl.includes('drive.google.com/file/d/')) {
    const fileIdMatch = cleanUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
    }
  }
  if (cleanUrl.includes('drive.google.com/open?id=') || cleanUrl.includes('drive.google.com/uc?id=')) {
    const idMatch = cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      return `https://drive.google.com/file/d/${idMatch[1]}/preview`;
    }
  }

  return cleanUrl;
}



export default function CoursesClient({ lang = 'ar' }: CoursesClientProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [collapsedModules, setCollapsedModules] = useState<Record<number, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Video Resume State
  const [videoResumeSeconds, setVideoResumeSeconds] = useState<number>(0);
  const [showResumeBar, setShowResumeBar] = useState(false);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const currentVideoTimeRef = React.useRef<number>(0);
  const saveIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const activeLessonIdRef = React.useRef<number | null>(null);

  // Modals state
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [showAddModuleModal, setShowAddModuleModal] = useState(false);
  const [showAddLessonModal, setShowAddLessonModal] = useState(false);
  const [targetModuleId, setTargetModuleId] = useState<number | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  // Form states
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    thumbnail_url: '',
    category: 'تطوير شخصي',
    instructor: 'Mark Emad',
  });

  const [moduleForm, setModuleForm] = useState({
    title: '',
  });

  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    video_url: '',
    notes: '',
    attachmentName: '',
    attachmentUrl: '',
  });

  const [attachmentsList, setAttachmentsList] = useState<Attachment[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    setUploadingImage(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setCourseForm(prev => ({ ...prev, thumbnail_url: data.url }));
      } else {
        setUploadError(data.error || 'فشل رفع الصورة');
      }
    } catch (err: any) {
      setUploadError(err.message || 'حدث خطأ أثناء رفع الصورة');
    } finally {
      setUploadingImage(false);
    }
  };

  const activeLessonVideoUrl = (activeLesson?.video_url || (activeLesson as any)?.videoUrl || '').trim();

  // ── YouTube IFrame postMessage listener for time tracking ──────────────────
  React.useEffect(() => {
    function onYTMessage(event: MessageEvent) {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        // YouTube sends: { event: "infoDelivery", info: { currentTime: X } }
        if (data?.event === 'infoDelivery' && data?.info?.currentTime !== undefined) {
          const secs = data.info.currentTime as number;
          currentVideoTimeRef.current = secs;
        }
        // Also handle: { event: "video-progress", progressData: { elapsed: X } } (Loom)
        if (data?.type === 'TIME_UPDATE' && data?.data?.time !== undefined) {
          currentVideoTimeRef.current = data.data.time;
        }
      } catch {}
    }

    window.addEventListener('message', onYTMessage);
    return () => {
      window.removeEventListener('message', onYTMessage);
    };
  }, []);

  // ── Auto-save current time every 5 seconds while a video lesson is open ────
  React.useEffect(() => {
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
    }

    if (activeLesson && activeLessonVideoUrl) {
      activeLessonIdRef.current = activeLesson.id;

      saveIntervalRef.current = setInterval(() => {
        // Ask YouTube iFrame for time via postMessage
        if (iframeRef.current?.contentWindow) {
          try {
            iframeRef.current.contentWindow.postMessage(
              JSON.stringify({ event: 'listening' }),
              '*'
            );
            iframeRef.current.contentWindow.postMessage(
              JSON.stringify({ event: 'command', func: 'getVideoData' }),
              '*'
            );
          } catch {}
        }

        // Save whatever we last captured
        if (activeLessonIdRef.current && currentVideoTimeRef.current > 3) {
          saveResumeTime(activeLessonIdRef.current, currentVideoTimeRef.current);
        }
      }, 5000);
    }

    return () => {
      // Save on unmount / lesson change
      if (activeLessonIdRef.current && currentVideoTimeRef.current > 3) {
        saveResumeTime(activeLessonIdRef.current, currentVideoTimeRef.current);
      }
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
        saveIntervalRef.current = null;
      }
    };
  }, [activeLesson?.id, activeLessonVideoUrl]);

  // ── When activeLesson changes, load saved resume time ──────────────────────
  React.useEffect(() => {
    if (!activeLesson) {
      setVideoResumeSeconds(0);
      setShowResumeBar(false);
      currentVideoTimeRef.current = 0;
      return;
    }
    currentVideoTimeRef.current = 0;
    const saved = loadResumeTime(activeLesson.id);
    setVideoResumeSeconds(saved);
    setShowResumeBar(saved > 5); // show resume bar only if meaningful progress (> 5 secs)
  }, [activeLesson?.id]);




  // Translations
  const t = {
    ar: {
      hubTitle: 'الكورسات والتعلم الذاتي',
      hubSubtitle: 'منصة التعلم المتكاملة وتطوير المهارات بنظام Skool الاحترافي',
      addCourse: 'إضافة كورس جديد',
      editCourse: 'تعديل الكورس',
      noCourses: 'لا توجد كورسات مضافة بعد. ابدأ بإضافة أول كورس الآن!',
      progress: 'نسبة الإنجاز',
      completed: 'مكتمل',
      lessonsCount: 'درس',
      openCourse: 'دخول قاعة التعلم',
      backToCourses: 'العودة لقائمة الكورسات',
      addModule: 'إضافة وحدة / فصل',
      addLesson: 'إضافة درس جديد',
      editLesson: 'تعديل الدرس',
      markComplete: 'تمييز كمكتمل',
      completedBadge: 'تم الإنجاز ✓',
      prevLesson: 'الدرس السابق',
      nextLesson: 'الدرس التالي',
      notesTab: 'ملاحظات وملخص الدرس',
      resourcesTab: 'المرفقات والمصادر',
      noResources: 'لا توجد ملفات مرفقة لهذا الدرس',
      downloadFile: 'فتح / تحميل المرفق',
      addAttachment: 'إضافة مرفق',
      save: 'حفظ',
      cancel: 'إلغاء',
      delete: 'حذف',
      confirmDelete: 'هل أنت متأكد من الحذف؟',
      courseTitle: 'عنوان الكورس',
      courseDesc: 'وصف الكورس',
      thumbnailUrl: 'رابط صورة الغلاف',
      category: 'التصنيف',
      instructor: 'المحاضر / المدرّب',
      moduleTitle: 'عنوان الفصل / الوحدة',
      lessonTitle: 'عنوان الدرس',
      videoUrl: 'رابط الفيديو (YouTube / Drive / Loom / Vimeo)',
      duration: 'المدة (مثال: 15:30)',
      notes: 'ملاحظات الدرس (Markdown / نص عادي)',
      searchPlaceholder: 'بحث في الكورسات والدروس...',
      noVideo: 'لم يتم إرفاق فيديو لهذا الدرس حتى الآن',
      addVideoPrompt: 'يمكنك إضافة رابط يوتيوب أو جوجل درايف للدرس لعرضه مباشرة هنا',
    },
    en: {
      hubTitle: 'Courses & Learning Hub',
      hubSubtitle: 'Skool-style platform for mastering high-income skills & personal growth',
      addCourse: 'Add New Course',
      editCourse: 'Edit Course',
      noCourses: 'No courses added yet. Start by creating your first course!',
      progress: 'Progress',
      completed: 'Completed',
      lessonsCount: 'lessons',
      openCourse: 'Open Classroom',
      backToCourses: 'Back to Courses',
      addModule: 'Add Module / Chapter',
      addLesson: 'Add Lesson',
      editLesson: 'Edit Lesson',
      markComplete: 'Mark as Complete',
      completedBadge: 'Completed ✓',
      prevLesson: 'Previous Lesson',
      nextLesson: 'Next Lesson',
      notesTab: 'Lesson Notes & Summary',
      resourcesTab: 'Resources & Attachments',
      noResources: 'No attachments for this lesson',
      downloadFile: 'Open / Download',
      addAttachment: 'Add Attachment',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      confirmDelete: 'Are you sure you want to delete?',
      courseTitle: 'Course Title',
      courseDesc: 'Course Description',
      thumbnailUrl: 'Thumbnail URL',
      category: 'Category',
      instructor: 'Instructor',
      moduleTitle: 'Module Title',
      lessonTitle: 'Lesson Title',
      videoUrl: 'Video URL (YouTube / Drive / Loom / Vimeo)',
      duration: 'Duration (e.g. 15:30)',
      notes: 'Lesson Notes (Markdown / Text)',
      searchPlaceholder: 'Search courses and lessons...',
      noVideo: 'No video attached to this lesson yet',
      addVideoPrompt: 'Add a YouTube or Google Drive link to watch inside the classroom',
    }
  }[lang];

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    try {
      setLoading(true);
      const res = await fetch('/api/courses');
      const data = await res.json();
      if (data.courses) {
        setCourses(data.courses);
        // If a course is currently open, refresh it
        if (selectedCourse) {
          const updatedSelected = data.courses.find((c: Course) => c.id === selectedCourse.id);
          if (updatedSelected) {
            setSelectedCourse(updatedSelected);
            if (activeLesson) {
              // Refresh active lesson if exists
              let foundLesson: Lesson | null = null;
              for (const mod of updatedSelected.modules || []) {
                const l = mod.lessons?.find((les: Lesson) => les.id === activeLesson.id);
                if (l) {
                  foundLesson = l;
                  break;
                }
              }
              if (foundLesson) setActiveLesson(foundLesson);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  }

  // Open a course into Classroom view
  function handleOpenCourse(course: Course) {
    setSelectedCourse(course);
    // Find first lesson to auto-select
    let firstLesson: Lesson | null = null;
    for (const mod of course.modules || []) {
      if (mod.lessons && mod.lessons.length > 0) {
        firstLesson = mod.lessons[0];
        break;
      }
    }
    setActiveLesson(firstLesson);
  }

  // Toggle Module accordion collapse
  function toggleModule(modId: number) {
    setCollapsedModules(prev => ({ ...prev, [modId]: !prev[modId] }));
  }

  // Add / Edit Course
  async function handleSaveCourse(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingCourse) {
        await fetch('/api/courses', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingCourse.id, ...courseForm }),
        });
      } else {
        await fetch('/api/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(courseForm),
        });
      }
      setShowAddCourseModal(false);
      setEditingCourse(null);
      setCourseForm({ title: '', description: '', thumbnail_url: '', category: 'تطوير شخصي', instructor: 'Mark Emad' });
      await fetchCourses();
    } catch (err) {
      console.error(err);
    }
  }

  // Delete Course
  async function handleDeleteCourse(id: number) {
    if (!confirm(t.confirmDelete)) return;
    try {
      await fetch(`/api/courses?id=${id}`, { method: 'DELETE' });
      if (selectedCourse?.id === id) {
        setSelectedCourse(null);
        setActiveLesson(null);
      }
      await fetchCourses();
    } catch (err) {
      console.error(err);
    }
  }

  // Add Module
  async function handleSaveModule(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCourse || !moduleForm.title.trim()) return;
    try {
      await fetch('/api/courses/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          title: moduleForm.title,
          sortOrder: (selectedCourse.modules?.length || 0) + 1,
        }),
      });
      setShowAddModuleModal(false);
      setModuleForm({ title: '' });
      await fetchCourses();
    } catch (err) {
      console.error(err);
    }
  }

  // Delete Module
  async function handleDeleteModule(modId: number) {
    if (!confirm(t.confirmDelete)) return;
    try {
      await fetch(`/api/courses/modules?id=${modId}`, { method: 'DELETE' });
      await fetchCourses();
    } catch (err) {
      console.error(err);
    }
  }

  // Add / Edit Lesson
  async function handleSaveLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCourse || !targetModuleId || !lessonForm.title.trim()) return;
    try {
      const trimmedVideo = lessonForm.video_url.trim();
      const payload = {
        title: lessonForm.title.trim(),
        description: lessonForm.description.trim(),
        videoUrl: trimmedVideo,
        video_url: trimmedVideo,
        notes: lessonForm.notes,
        attachments: attachmentsList,
      };

      if (editingLesson) {
        await fetch('/api/courses/lessons', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingLesson.id, ...payload }),
        });
      } else {
        await fetch('/api/courses/lessons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId: selectedCourse.id,
            course_id: selectedCourse.id,
            moduleId: targetModuleId,
            module_id: targetModuleId,
            sortOrder: 0,
            ...payload,
          }),
        });
      }

      setShowAddLessonModal(false);
      setEditingLesson(null);
      setLessonForm({ title: '', description: '', video_url: '', notes: '', attachmentName: '', attachmentUrl: '' });
      setAttachmentsList([]);
      await fetchCourses();
    } catch (err) {
      console.error(err);
    }
  }

  // Delete Lesson
  async function handleDeleteLesson(lessonId: number) {
    if (!confirm(t.confirmDelete)) return;
    try {
      await fetch(`/api/courses/lessons?id=${lessonId}`, { method: 'DELETE' });
      if (activeLesson?.id === lessonId) {
        setActiveLesson(null);
      }
      await fetchCourses();
    } catch (err) {
      console.error(err);
    }
  }

  // Toggle Lesson Completion
  async function handleToggleLessonComplete(lesson: Lesson) {
    const isCompleted = lesson.completed === 1 || lesson.completed === true;
    const newStatus = !isCompleted;

    // Optimistic UI update
    if (activeLesson && activeLesson.id === lesson.id) {
      setActiveLesson({ ...activeLesson, completed: newStatus });
    }

    try {
      await fetch('/api/courses/lessons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: lesson.id, completed: newStatus }),
      });
      await fetchCourses();
    } catch (err) {
      console.error(err);
    }
  }

  // Flattened list of all lessons for Prev / Next navigation
  const allLessons = useMemo(() => {
    if (!selectedCourse || !selectedCourse.modules) return [];
    const list: Lesson[] = [];
    for (const mod of selectedCourse.modules) {
      if (mod.lessons) {
        for (const les of mod.lessons) {
          list.push(les);
        }
      }
    }
    return list;
  }, [selectedCourse]);

  const currentLessonIndex = useMemo(() => {
    if (!activeLesson) return -1;
    return allLessons.findIndex(l => l.id === activeLesson.id);
  }, [allLessons, activeLesson]);

  const prevLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex >= 0 && currentLessonIndex < allLessons.length - 1 ? allLessons[currentLessonIndex + 1] : null;

  // Parsed attachments for active lesson
  const activeAttachments: Attachment[] = useMemo(() => {
    if (!activeLesson || !activeLesson.attachments) return [];
    try {
      if (typeof activeLesson.attachments === 'string') {
        return JSON.parse(activeLesson.attachments);
      }
      return activeLesson.attachments;
    } catch {
      return [];
    }
  }, [activeLesson]);

  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courses;
    const q = searchQuery.toLowerCase();
    return courses.filter(c => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
  }, [courses, searchQuery]);

  return (
    <div className="min-h-screen text-gray-100 font-sans p-4 sm:p-6 lg:p-8 space-y-8">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. COURSES GRID VIEW (OVERVIEW)                            */}
      {/* ─────────────────────────────────────────────────────────── */}
      {!selectedCourse && (
        <div className="space-y-8 max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                  <GraduationCap size={28} />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                    {t.hubTitle}
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                      SKOOL ENGINE
                    </span>
                  </h1>
                  <p className="text-sm text-gray-400 mt-0.5">{t.hubSubtitle}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search size={16} className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-400" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 pl-4 pr-9 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all"
                />
              </div>

              <button
                onClick={() => {
                  setEditingCourse(null);
                  setCourseForm({ title: '', description: '', thumbnail_url: '', category: 'تطوير شخصي', instructor: 'Mark Emad' });
                  setShowAddCourseModal(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-black text-sm hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus size={18} />
                <span>{t.addCourse}</span>
              </button>
            </div>
          </div>

          {/* Courses Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-24 text-gray-400">
              <RefreshCw className="animate-spin text-emerald-400 mr-3" size={24} />
              <span>جاري تحميل الكورسات...</span>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-20 px-4 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-3xl">
                📚
              </div>
              <h3 className="text-lg font-bold text-white">{t.noCourses}</h3>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                قم بتنظيم رحلتك التعليمية، أضف كورسات الفيديو مع تتبع التقدم التلقائي ومصادر التعلم المنظمة.
              </p>
              <button
                onClick={() => setShowAddCourseModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-black font-bold text-sm hover:bg-emerald-400 shadow-lg"
              >
                <Plus size={18} />
                <span>{t.addCourse}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map(course => {
                const progress = course.stats?.progressPercentage || 0;
                const totalLessons = course.stats?.totalLessons || 0;
                const completedLessons = course.stats?.completedLessons || 0;

                return (
                  <motion.div
                    key={course.id}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="group relative flex flex-col rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] backdrop-blur-xl overflow-hidden hover:border-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all"
                  >
                    {/* Course Thumbnail */}
                    <div className="relative w-full aspect-video bg-black/40 overflow-hidden">
                      {(course.thumbnail_url || course.thumbnailUrl) ? (
                        <img
                          src={course.thumbnail_url || course.thumbnailUrl}
                          alt={course.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-black p-6 text-center">
                          <BookOpen size={42} className="text-emerald-400/60 mb-2" />
                          <span className="text-xs font-semibold tracking-wider text-emerald-400/80 uppercase">
                            {course.category}
                          </span>
                        </div>
                      )}

                      <div className="absolute top-3 right-3 flex gap-2">
                        <span className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[11px] font-bold text-white border border-white/10 shadow">
                          {course.category || 'General'}
                        </span>
                      </div>

                      <div className="absolute top-3 left-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCourse(course);
                            setCourseForm({
                              title: course.title,
                              description: course.description,
                              thumbnail_url: course.thumbnail_url,
                              category: course.category,
                              instructor: course.instructor,
                            });
                            setShowAddCourseModal(true);
                          }}
                          className="p-2 rounded-xl bg-black/80 hover:bg-white text-gray-300 hover:text-black border border-white/10 transition-colors shadow"
                          title={t.editCourse}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCourse(course.id);
                          }}
                          className="p-2 rounded-xl bg-black/80 hover:bg-rose-500 text-gray-300 hover:text-white border border-white/10 transition-colors shadow"
                          title={t.delete}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Course Progress Floating Pill */}
                      <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 flex items-center gap-1.5 shadow">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-mono font-bold text-emerald-400">{progress}%</span>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <h3 className="text-xl font-black text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                          {course.title}
                        </h3>
                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                          {course.description || 'لا يوجد وصف متاح لهذا الكورس.'}
                        </p>
                      </div>

                      {/* Progress Bar & Stats */}
                      <div className="space-y-3 pt-4 border-t border-white/5">
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Layers size={14} className="text-emerald-400" />
                            {totalLessons} {t.lessonsCount}
                          </span>
                          <span className="font-mono text-emerald-400 font-bold">
                            {completedLessons}/{totalLessons} {t.completed}
                          </span>
                        </div>

                        {/* Vivid Progress Bar */}
                        <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden p-0.5 border border-white/5">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>

                        {/* Open Button */}
                        <button
                          onClick={() => handleOpenCourse(course)}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 hover:bg-emerald-500 text-gray-200 hover:text-black font-bold text-sm border border-white/10 hover:border-emerald-400 transition-all shadow-lg group-hover:bg-emerald-500 group-hover:text-black"
                        >
                          <Play size={16} className="fill-current" />
                          <span>{t.openCourse}</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. CLASSROOM & LESSON PLAYER VIEW (SKOOL STYLE)            */}
      {/* ─────────────────────────────────────────────────────────── */}
      {selectedCourse && (
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Top Classroom Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setSelectedCourse(null);
                  setActiveLesson(null);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-all"
              >
                {lang === 'ar' ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
                <span className="text-xs font-bold">{t.backToCourses}</span>
              </button>

              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  {selectedCourse.title}
                </h2>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                  <span>{selectedCourse.instructor || 'Mark Emad'}</span>
                  <span>•</span>
                  <span>{allLessons.length} {t.lessonsCount}</span>
                </div>
              </div>
            </div>

            {/* Course Progress & Controls */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end gap-1.5 w-44">
                <div className="flex justify-between w-full text-xs font-mono">
                  <span className="text-gray-400">{t.progress}</span>
                  <span className="text-emerald-400 font-bold">
                    {selectedCourse.stats?.progressPercentage || 0}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                    style={{ width: `${selectedCourse.stats?.progressPercentage || 0}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddModuleModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-200 hover:text-white transition-all"
                >
                  <FolderPlus size={16} />
                  <span>{t.addModule}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main 2-Column Classroom Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ─── SIDEBAR: MODULES & LESSONS (COL 1-4) ─── */}
            <div className="lg:col-span-4 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-4 sm:p-5 space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Layers size={18} className="text-emerald-400" />
                  <span>فهرس ومحتويات الكورس</span>
                </h3>
                <span className="text-xs font-mono text-gray-400">
                  {selectedCourse.modules?.length || 0} وحدات
                </span>
              </div>

              {(!selectedCourse.modules || selectedCourse.modules.length === 0) ? (
                <div className="text-center py-10 space-y-3">
                  <p className="text-xs text-gray-400">لا توجد فصول مضافة في هذا الكورس بعد.</p>
                  <button
                    onClick={() => setShowAddModuleModal(true)}
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400"
                  >
                    + {t.addModule}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedCourse.modules.map((mod, modIndex) => {
                    const isCollapsed = !!collapsedModules[mod.id];
                    const modLessons = mod.lessons || [];
                    const modCompleted = modLessons.filter(l => l.completed === 1 || l.completed === true).length;

                    return (
                      <div
                        key={mod.id}
                        className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden transition-all"
                      >
                        {/* Module Accordion Header */}
                        <div
                          onClick={() => toggleModule(mod.id)}
                          className="flex items-center justify-between p-3.5 hover:bg-white/5 cursor-pointer select-none transition-colors"
                        >
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <span className="text-gray-400">
                              {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                            </span>
                            <div className="truncate">
                              <h4 className="text-xs font-black text-white truncate">
                                {mod.title}
                              </h4>
                              <span className="text-[10px] text-gray-400 font-mono">
                                {modCompleted}/{modLessons.length} مكتمل
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setTargetModuleId(mod.id);
                                setEditingLesson(null);
                                setLessonForm({ title: '', description: '', video_url: '', notes: '', attachmentName: '', attachmentUrl: '' });
                                setAttachmentsList([]);
                                setShowAddLessonModal(true);
                              }}
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/20 transition-all"
                              title={t.addLesson}
                            >
                              <Plus size={13} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteModule(mod.id);
                              }}
                              className="p-1.5 rounded-lg hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition-all"
                              title={t.delete}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Lessons List in Module */}
                        {!isCollapsed && (
                          <div className="px-2 pb-2 space-y-1 border-t border-white/5 pt-2">
                            {modLessons.length === 0 ? (
                              <p className="text-[11px] text-gray-500 p-2 text-center">لا توجد دروس في هذا الفصل</p>
                            ) : (
                              modLessons.map((lesson, lessonIndex) => {
                                const isActive = activeLesson?.id === lesson.id;
                                const isDone = lesson.completed === 1 || lesson.completed === true;

                                return (
                                  <div
                                    key={lesson.id}
                                    onClick={() => setActiveLesson(lesson)}
                                    className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                                      isActive
                                        ? 'bg-emerald-500/15 border border-emerald-500/40 text-white shadow-md'
                                        : 'hover:bg-white/5 border border-transparent text-gray-300'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleLessonComplete(lesson);
                                        }}
                                        className={`transition-colors p-0.5 rounded-full ${
                                          isDone ? 'text-emerald-400 hover:text-emerald-300' : 'text-gray-500 hover:text-white'
                                        }`}
                                      >
                                        {isDone ? (
                                          <CheckCircle2 size={16} className="fill-emerald-500/20" />
                                        ) : (
                                          <Circle size={16} />
                                        )}
                                      </button>

                                      <div className="truncate">
                                        <p className={`text-xs font-medium truncate ${isDone ? 'line-through text-gray-400' : ''}`}>
                                          {lesson.title}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingLesson(lesson);
                                          setTargetModuleId(mod.id);
                                          setLessonForm({
                                            title: lesson.title,
                                            description: lesson.description || '',
                                            video_url: lesson.video_url || (lesson as any).videoUrl || '',
                                            notes: lesson.notes || '',
                                            attachmentName: '',
                                            attachmentUrl: '',
                                          });
                                          try {
                                            setAttachmentsList(typeof lesson.attachments === 'string' ? JSON.parse(lesson.attachments) : lesson.attachments || []);
                                          } catch {
                                            setAttachmentsList([]);
                                          }
                                          setShowAddLessonModal(true);
                                        }}
                                        className="p-1 text-gray-400 hover:text-white"
                                        title={t.editLesson}
                                      >
                                        <Edit size={12} />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteLesson(lesson.id);
                                        }}
                                        className="p-1 text-gray-400 hover:text-rose-400"
                                        title={t.delete}
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ─── MAIN CONTENT: LESSON PLAYER & NOTES (COL 5-12) ─── */}
            <div className="lg:col-span-8 space-y-6">
              {activeLesson ? (
                <div className="space-y-6">
                  {/* Video Player Container */}
                  <div className="relative rounded-3xl border border-white/10 bg-black/60 overflow-hidden shadow-2xl">
                    {/* ── Resume Progress Banner ── */}
                    {showResumeBar && activeLessonVideoUrl && (
                      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between gap-3 px-4 py-2.5 bg-black/90 backdrop-blur-sm border-b border-emerald-500/30">
                        <div className="flex items-center gap-2 text-xs text-emerald-300 font-bold">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>
                            ▶ استكمال من الدقيقة {Math.floor(videoResumeSeconds / 60)}:{String(Math.floor(videoResumeSeconds % 60)).padStart(2, '0')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              clearResumeTime(activeLesson.id);
                              setVideoResumeSeconds(0);
                              setShowResumeBar(false);
                            }}
                            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-gray-300 hover:text-white transition-all"
                          >
                            ابدأ من الأول
                          </button>
                          <button
                            onClick={() => setShowResumeBar(false)}
                            className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-xs font-bold text-emerald-300 hover:text-black border border-emerald-500/40 transition-all"
                          >
                            ✓ استكمال من دقيقة {Math.floor(videoResumeSeconds / 60)}:{String(Math.floor(videoResumeSeconds % 60)).padStart(2, '0')}
                          </button>
                        </div>
                      </div>
                    )}

                    {activeLessonVideoUrl ? (
                      <div className={`relative w-full aspect-video ${showResumeBar ? 'pt-10' : ''}`}>
                        <iframe
                          ref={iframeRef}
                          key={`${activeLesson.id}-${activeLessonVideoUrl}-${videoResumeSeconds}`}
                          src={parseVideoEmbedUrl(activeLessonVideoUrl, videoResumeSeconds) || ''}
                          title={activeLesson.title}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-video flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-white/[0.03] to-transparent">
                        <Video size={56} className="text-gray-600 mb-3" />
                        <h4 className="text-base font-bold text-white mb-1">{t.noVideo}</h4>
                        <p className="text-xs text-gray-400 max-w-sm mb-4">{t.addVideoPrompt}</p>
                        <button
                          onClick={() => {
                            setEditingLesson(activeLesson);
                            setTargetModuleId(activeLesson.module_id || (activeLesson as any).moduleId);
                            setLessonForm({
                              title: activeLesson.title,
                              description: activeLesson.description || '',
                              video_url: activeLessonVideoUrl,
                              notes: activeLesson.notes || '',
                              attachmentName: '',
                              attachmentUrl: '',
                            });
                            try {
                              setAttachmentsList(typeof activeLesson.attachments === 'string' ? JSON.parse(activeLesson.attachments) : activeLesson.attachments || []);
                            } catch {
                              setAttachmentsList([]);
                            }
                            setShowAddLessonModal(true);
                          }}
                          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 transition-all"
                        >
                          + إضافة رابط الفيديو
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Lesson Controls & Completion Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
                    <div className="space-y-1">
                      <h2 className="text-xl font-black text-white">{activeLesson.title}</h2>
                      {activeLesson.description && (
                        <p className="text-xs text-gray-400">{activeLesson.description}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Mark Complete Toggle Button */}
                      <button
                        onClick={() => handleToggleLessonComplete(activeLesson)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm transition-all shadow-lg ${
                          activeLesson.completed === 1 || activeLesson.completed === true
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
                        }`}
                      >
                        <Check size={18} />
                        <span>
                          {activeLesson.completed === 1 || activeLesson.completed === true
                            ? t.completedBadge
                            : t.markComplete}
                        </span>
                      </button>

                      {/* Prev / Next Buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          disabled={!prevLesson}
                          onClick={() => prevLesson && setActiveLesson(prevLesson)}
                          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 hover:text-white border border-white/10 transition-all"
                          title={t.prevLesson}
                        >
                          {lang === 'ar' ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                        </button>
                        <button
                          disabled={!nextLesson}
                          onClick={() => nextLesson && setActiveLesson(nextLesson)}
                          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 hover:text-white border border-white/10 transition-all"
                          title={t.nextLesson}
                        >
                          {lang === 'ar' ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Notes & Summary Section */}
                  <div className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                      <FileText size={18} className="text-emerald-400" />
                      <h3 className="text-sm font-black text-white">{t.notesTab}</h3>
                    </div>

                    {activeLesson.notes ? (
                      <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-sans bg-white/[0.01] p-4 rounded-2xl border border-white/5">
                        {activeLesson.notes}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic">لا توجد ملاحظات أو ملخص مكتوب لهذا الدرس.</p>
                    )}
                  </div>

                  {/* Attachments & Downloadables Section */}
                  <div className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <Download size={18} className="text-emerald-400" />
                        <h3 className="text-sm font-black text-white">{t.resourcesTab}</h3>
                      </div>
                      <span className="text-xs font-mono text-gray-400">
                        {activeAttachments.length} مرفقات
                      </span>
                    </div>

                    {activeAttachments.length === 0 ? (
                      <p className="text-xs text-gray-500 italic">{t.noResources}</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activeAttachments.map((att, idx) => (
                          <a
                            key={idx}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 transition-all group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                                <LinkIcon size={16} />
                              </div>
                              <span className="text-xs font-bold text-white truncate">
                                {att.name || 'ملف مرفق'}
                              </span>
                            </div>
                            <ExternalLink size={14} className="text-gray-400 group-hover:text-emerald-400 transition-colors" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-16 text-center space-y-4">
                  <Play size={48} className="text-emerald-400 mx-auto opacity-60" />
                  <h3 className="text-lg font-bold text-white">اختر درساً للبدء</h3>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    حدد أحد الدروس من القائمة الجانبية لتشغيل الشرح واستعراض الملاحظات والمرفقات.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. MODALS (Add/Edit Course, Add Module, Add/Edit Lesson)    */}
      {/* ─────────────────────────────────────────────────────────── */}

      {/* Add / Edit Course Modal */}
      <AnimatePresence>
        {showAddCourseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0d0e12] p-6 sm:p-8 space-y-6 shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h3 className="text-xl font-black text-white">
                  {editingCourse ? t.editCourse : t.addCourse}
                </h3>
                <button onClick={() => setShowAddCourseModal(false)} className="p-2 text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveCourse} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">{t.courseTitle}</label>
                  <input
                    type="text"
                    required
                    value={courseForm.title}
                    onChange={e => setCourseForm({ ...courseForm, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="مثال: Master Video Editing & Motion Graphics"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">{t.courseDesc}</label>
                  <textarea
                    rows={3}
                    value={courseForm.description}
                    onChange={e => setCourseForm({ ...courseForm, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="نبذة مختصرة عن أهداف الكورس ومحتواه..."
                  />
                </div>

                <div className="space-y-3">
                  {/* Dimension Guidelines Banner */}
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold">
                      <Sparkles size={16} className="text-emerald-400 shrink-0" />
                      <span>المقاس المثالي للغلاف: <strong>1280 × 720 بكسل</strong> (نسبة 16:9 العريضة)</span>
                    </div>
                    <span className="text-[10px] text-emerald-400/80 font-mono">JPG, PNG, WebP • أقصى حجم 5MB</span>
                  </div>

                  {/* Device File Upload Button + Direct Link Options */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/png, image/jpeg, image/webp, image/gif"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleImageUpload(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />

                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                    >
                      {uploadingImage ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>جاري رفع الصورة من جهازك...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={15} />
                          <span>📤 رفع غلاف من الجهاز</span>
                        </>
                      )}
                    </button>

                    <span className="text-[11px] text-gray-400 font-bold text-center sm:text-start">أو ضع رابط مباشر أدناه:</span>
                  </div>

                  {uploadError && (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold">
                      ⚠️ {uploadError}
                    </div>
                  )}

                  <input
                    type="url"
                    value={courseForm.thumbnail_url}
                    onChange={e => setCourseForm({ ...courseForm, thumbnail_url: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:border-emerald-500 placeholder-gray-500"
                    placeholder="https://images.unsplash.com/... أو /uploads/courses/..."
                  />

                  {/* One-click preset banners */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] text-gray-400 py-1 font-bold">أغلفة جاهزة فورية:</span>
                    {[
                      { label: '🎬 مونتاج وفيديو', url: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=800&auto=format&fit=crop' },
                      { label: '🤖 ذكاء اصطناعي وبرمجة', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop' },
                      { label: '💼 بزنس ووكالات', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop' },
                      { label: '🧠 عقلية وتطوير', url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop' },
                      { label: '🎨 تصميم وموشن', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop' },
                    ].map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setCourseForm({ ...courseForm, thumbnail_url: preset.url })}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-gray-300 hover:text-emerald-300 border border-white/10 hover:border-emerald-500/40 text-[10px] font-bold transition-all cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Live Thumbnail Preview Box */}
                  {courseForm.thumbnail_url && (
                    <div className="mt-2 rounded-2xl overflow-hidden border border-emerald-500/30 aspect-video relative bg-black/60 shadow-lg">
                      <img
                        src={courseForm.thumbnail_url}
                        alt="Preview"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop';
                        }}
                      />
                      <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/85 text-[10px] text-emerald-400 font-bold backdrop-blur-md border border-emerald-500/30 flex items-center gap-1.5">
                        <Check size={12} />
                        <span>معاينة الغلاف الحية (16:9)</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">{t.category}</label>
                    <input
                      type="text"
                      value={courseForm.category}
                      onChange={e => setCourseForm({ ...courseForm, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:border-emerald-500"
                      placeholder="مونتاج / بزنس / برمجة"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">{t.instructor}</label>
                    <input
                      type="text"
                      value={courseForm.instructor}
                      onChange={e => setCourseForm({ ...courseForm, instructor: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:border-emerald-500"
                      placeholder="Mark Emad"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowAddCourseModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:text-white"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 text-black font-black text-sm hover:bg-emerald-400 shadow-lg"
                  >
                    {t.save}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Module Modal */}
      <AnimatePresence>
        {showAddModuleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0d0e12] p-6 space-y-6 shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h3 className="text-lg font-black text-white">{t.addModule}</h3>
                <button onClick={() => setShowAddModuleModal(false)} className="p-2 text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveModule} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">{t.moduleTitle}</label>
                  <input
                    type="text"
                    required
                    value={moduleForm.title}
                    onChange={e => setModuleForm({ title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="مثال: الفصل 1: الأساسيات والقواعد الجوهرية"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowAddModuleModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:text-white"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 text-black font-black text-sm hover:bg-emerald-400 shadow-lg"
                  >
                    {t.save}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add / Edit Lesson Modal */}
      <AnimatePresence>
        {showAddLessonModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0d0e12] p-6 sm:p-8 space-y-6 shadow-2xl my-8"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h3 className="text-xl font-black text-white">
                  {editingLesson ? t.editLesson : t.addLesson}
                </h3>
                <button onClick={() => setShowAddLessonModal(false)} className="p-2 text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveLesson} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">{t.lessonTitle}</label>
                  <input
                    type="text"
                    required
                    value={lessonForm.title}
                    onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="مثال: مقدمة في هندسة الأوامر والمفاهيم الأساسية"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">{t.videoUrl}</label>
                  <input
                    type="text"
                    value={lessonForm.video_url}
                    onChange={e => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="https://youtube.com/watch?v=... أو Drive/Loom/Vimeo"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">{t.notes}</label>
                  <textarea
                    rows={4}
                    value={lessonForm.notes}
                    onChange={e => setLessonForm({ ...lessonForm, notes: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="اكتب النقاط الرئيسية، الملخص، روابط سريعة..."
                  />
                </div>

                {/* Attachments list manager */}
                <div className="space-y-3 pt-2 border-t border-white/5">
                  <label className="text-xs font-bold text-gray-400 block">المرفقات والمصادر الخارجية</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={lessonForm.attachmentName}
                      onChange={e => setLessonForm({ ...lessonForm, attachmentName: e.target.value })}
                      placeholder="اسم المرفق (مثال: Project File .prproj)"
                      className="flex-1 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-xs text-white"
                    />
                    <input
                      type="url"
                      value={lessonForm.attachmentUrl}
                      onChange={e => setLessonForm({ ...lessonForm, attachmentUrl: e.target.value })}
                      placeholder="رابط التحميل / درايف"
                      className="flex-1 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!lessonForm.attachmentUrl.trim()) return;
                        setAttachmentsList([
                          ...attachmentsList,
                          {
                            name: lessonForm.attachmentName.trim() || 'ملف مرفق',
                            url: lessonForm.attachmentUrl.trim(),
                          },
                        ]);
                        setLessonForm({ ...lessonForm, attachmentName: '', attachmentUrl: '' });
                      }}
                      className="px-3 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black rounded-xl text-xs font-bold transition-colors"
                    >
                      + إضافة
                    </button>
                  </div>

                  {attachmentsList.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      {attachmentsList.map((att, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 text-xs">
                          <span className="text-white truncate max-w-xs">{att.name} ({att.url})</span>
                          <button
                            type="button"
                            onClick={() => setAttachmentsList(attachmentsList.filter((_, idx) => idx !== i))}
                            className="text-rose-400 hover:text-rose-300 p-1"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowAddLessonModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:text-white"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 text-black font-black text-sm hover:bg-emerald-400 shadow-lg"
                  >
                    {t.save}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
