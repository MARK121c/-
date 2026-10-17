'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, MapPin, User, AlertCircle, CheckCircle2, Circle,
  Plus, Edit2, Trash2, Shield, Wrench, CheckSquare, Sparkles, Filter, X
} from 'lucide-react';

interface ScheduleItem {
  id: number;
  term: string;
  subject_id?: number | null;
  subject_name: string;
  item_type: 'lecture' | 'lab' | 'section';
  day_of_week: string;
  start_time: string;
  end_time: string;
  location: string;
  instructor?: string;
  takes_attendance: number;
  importance: 'high' | 'medium' | 'low';
  required_tools: string;
  notes?: string;
}

const DAYS = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

const DAY_MAP_EN_TO_AR: Record<string, string> = {
  'Saturday': 'السبت',
  'Sunday': 'الأحد',
  'Monday': 'الإثنين',
  'Tuesday': 'الثلاثاء',
  'Wednesday': 'الأربعاء',
  'Thursday': 'الخميس',
  'Friday': 'الجمعة'
};

interface ScheduleDashboardProps {
  userRole?: 'owner' | 'assistant' | 'viewer';
  currentTerm?: 'term1' | 'term2';
}

export default function ScheduleDashboard({
  userRole = 'owner',
  currentTerm = 'term1'
}: ScheduleDashboardProps) {
  const [selectedTerm, setSelectedTerm] = useState<'term1' | 'term2'>(currentTerm);
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkedTools, setCheckedTools] = useState<Record<string, boolean>>({});

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<ScheduleItem | null>(null);
  const [formData, setFormData] = useState({
    subject_name: '',
    item_type: 'lecture',
    day_of_week: 'الأحد',
    start_time: '09:00',
    end_time: '11:00',
    location: '',
    instructor: '',
    takes_attendance: true,
    importance: 'high',
    required_tools_text: '',
    notes: ''
  });

  const [notification, setNotification] = useState<string | null>(null);

  const isOwner = userRole === 'owner';
  const isViewer = userRole === 'viewer';

  // Determine current day in Arabic
  const todayEn = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
  const todayAr = DAY_MAP_EN_TO_AR[todayEn] || 'الأحد';

  useEffect(() => {
    setSelectedTerm(currentTerm);
  }, [currentTerm]);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/academic/schedule?term=${selectedTerm}&day=${selectedDay}`);
      const data = await res.json();
      if (data.success) {
        setSchedule(data.schedule || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [selectedTerm, selectedDay]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject_name || !formData.location) return;

    // Parse tools text into array
    const toolsArray = formData.required_tools_text
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const payload = {
      id: editItem?.id,
      term: selectedTerm,
      subject_name: formData.subject_name,
      item_type: formData.item_type,
      day_of_week: formData.day_of_week,
      start_time: formData.start_time,
      end_time: formData.end_time,
      location: formData.location,
      instructor: formData.instructor,
      takes_attendance: formData.takes_attendance ? 1 : 0,
      importance: formData.importance,
      required_tools: toolsArray,
      notes: formData.notes
    };

    try {
      const method = editItem ? 'PUT' : 'POST';
      const res = await fetch('/api/academic/schedule', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchSchedule();
      }
    } catch {
      // ignore
    }
  };

  const handleDelete = async (item: ScheduleItem) => {
    if (!confirm(`هل أنت متأكد من حذف (${item.subject_name})؟`)) return;

    try {
      const res = await fetch(`/api/academic/schedule?id=${item.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        if (data.pendingApproval) {
          setNotification('تم إرسال طلب حذف المحاضرة للمالك للموافقة عليه.');
        } else {
          setNotification('تم حذف المحاضرة بنجاح.');
        }
        setTimeout(() => setNotification(null), 4000);
        fetchSchedule();
      }
    } catch {
      // ignore
    }
  };

  const toggleTool = (itemId: number, toolName: string) => {
    const key = `${itemId}:${toolName}`;
    setCheckedTools(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Alert / Notification banner */}
      {notification && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg">
          <AlertCircle size={18} className="shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Header & Term Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <Calendar className="text-amber-400" size={22} />
              <span>جدول المحاضرات والسكاشن الأكاديمي</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              تفاعلي حي
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            متابعة مواعيد القاعات والمعامل، تتبع الحضور والغياب، وقائمة الأدوات المطلوبة لكل سكشن
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Term Selector */}
          <div className="flex bg-black/40 p-1 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => setSelectedTerm('term1')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedTerm === 'term1'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              الترم الأول
            </button>
            <button
              type="button"
              onClick={() => setSelectedTerm('term2')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedTerm === 'term2'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              الترم الثاني
            </button>
          </div>

          {!isViewer && (
            <button
              type="button"
              onClick={() => {
                setEditItem(null);
                setFormData({
                  subject_name: '',
                  item_type: 'lecture',
                  day_of_week: todayAr,
                  start_time: '09:00',
                  end_time: '11:00',
                  location: '',
                  instructor: '',
                  takes_attendance: true,
                  importance: 'high',
                  required_tools_text: 'لابتوب 💻\nكشكول محاضرات 📓',
                  notes: ''
                });
                setShowModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-lg shadow-amber-500/20 transition-all"
            >
              <Plus size={16} />
              <span>إضافة موعد</span>
            </button>
          )}
        </div>
      </div>

      {/* Days of the Week Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => setSelectedDay('all')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            selectedDay === 'all'
              ? 'bg-white text-black font-black shadow-lg'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
          }`}
        >
          الأسبوع كامل ({schedule.length})
        </button>

        <button
          type="button"
          onClick={() => setSelectedDay(todayAr)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            selectedDay === todayAr
              ? 'bg-amber-500 text-black font-black shadow-lg shadow-amber-500/30'
              : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30'
          }`}
        >
          <Sparkles size={13} />
          <span>اليوم ({todayAr})</span>
        </button>

        {DAYS.map(day => {
          const count = schedule.filter(s => s.day_of_week === day).length;
          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                selectedDay === day
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              <span>{day}</span>
              {count > 0 && (
                <span className="mr-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-white/10 font-mono">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Schedule Items Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-gray-400 text-sm">
          جاري تحميل الجدول الأكاديمي...
        </div>
      ) : schedule.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-white/[0.02] border border-white/5">
          <Calendar size={40} className="mx-auto text-gray-600 mb-3" />
          <h4 className="text-sm font-bold text-gray-300">لا توجد محاضرات مجدولة لهذا اليوم</h4>
          <p className="text-xs text-gray-500 mt-1">
            يمكنك إضافة مواعيد المحاضرات والسكاشن عبر زر "إضافة موعد" بالأعلى
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedule.map(item => {
            let tools: string[] = [];
            try {
              tools = typeof item.required_tools === 'string' ? JSON.parse(item.required_tools) : item.required_tools;
            } catch (_) {}

            const isToday = item.day_of_week === todayAr;

            return (
              <motion.div
                key={item.id}
                layout
                className={`relative flex flex-col justify-between p-5 rounded-3xl border transition-all ${
                  isToday
                    ? 'bg-gradient-to-br from-amber-500/10 via-white/[0.03] to-transparent border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.1)]'
                    : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                }`}
              >
                <div>
                  {/* Card Header badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white/10 text-white">
                        {item.day_of_week}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          item.item_type === 'lab'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : item.item_type === 'section'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {item.item_type === 'lab' ? 'معمل عملي' : item.item_type === 'section' ? 'سكشن' : 'محاضرة نظرية'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          item.importance === 'high'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : item.importance === 'medium'
                            ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                            : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                        }`}
                      >
                        {item.importance === 'high' ? 'عالي الأهمية 🔴' : item.importance === 'medium' ? 'متوسط 🟡' : 'عادي'}
                      </span>

                      {!isViewer && (
                        <div className="flex items-center gap-1 mr-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditItem(item);
                              let toolsText = '';
                              try {
                                const t = typeof item.required_tools === 'string' ? JSON.parse(item.required_tools) : item.required_tools;
                                toolsText = Array.isArray(t) ? t.join('\n') : '';
                              } catch (_) {}
                              setFormData({
                                subject_name: item.subject_name,
                                item_type: item.item_type,
                                day_of_week: item.day_of_week,
                                start_time: item.start_time,
                                end_time: item.end_time,
                                location: item.location,
                                instructor: item.instructor || '',
                                takes_attendance: item.takes_attendance === 1,
                                importance: item.importance,
                                required_tools_text: toolsText,
                                notes: item.notes || ''
                              });
                              setShowModal(true);
                            }}
                            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
                            title="تعديل"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            className="p-1 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            title="حذف (طلب موافقة المالك)"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Subject Name & Instructor */}
                  <h3 className="text-base font-black text-white leading-snug">
                    {item.subject_name}
                  </h3>
                  {item.instructor && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                      <User size={13} />
                      <span>{item.instructor}</span>
                    </div>
                  )}

                  {/* Time & Location */}
                  <div className="grid grid-cols-2 gap-2 my-3 p-3 rounded-2xl bg-black/30 border border-white/5 text-xs">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Clock size={14} className="text-amber-400 shrink-0" />
                      <span className="font-mono font-bold dir-ltr">
                        {item.start_time} - {item.end_time}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <MapPin size={14} className="text-blue-400 shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </div>
                  </div>

                  {/* Attendance Tracker Flag */}
                  <div className="mb-3">
                    {item.takes_attendance === 1 ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold">
                        <AlertCircle size={14} className="shrink-0 text-rose-400" />
                        <span>يسجل حضور وغياب بالسكشن ⚠️</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gray-500/10 text-gray-400 text-xs">
                        <span>بدون تسجيل غياب إلزامي</span>
                      </div>
                    )}
                  </div>

                  {/* Required Tools Checklist */}
                  {tools.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 mb-2">
                        <Wrench size={12} className="text-amber-400" />
                        <span>الأدوات والتجهيزات المطلوبة:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {tools.map((tool, idx) => {
                          const isDone = !!checkedTools[`${item.id}:${tool}`];
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => toggleTool(item.id, tool)}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                                isDone
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 line-through opacity-70'
                                  : 'bg-white/5 text-gray-300 hover:text-white border border-white/10 hover:border-amber-500/30'
                              }`}
                            >
                              {isDone ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Circle size={12} />}
                              <span>{tool}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {item.notes && (
                    <p className="mt-3 text-xs text-gray-400 italic bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                      📌 {item.notes}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Schedule Item Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#0e1217] border border-white/10 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Calendar className="text-amber-400" size={18} />
                <span>{editItem ? 'تعديل موعد دراسي' : 'إضافة موعد جديد للجدول'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl bg-white/5 text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-bold mb-1">اسم المادة / المقرر *</label>
                <input
                  type="text"
                  required
                  value={formData.subject_name}
                  onChange={e => setFormData({ ...formData, subject_name: e.target.value })}
                  placeholder="مثال: هندسة البرمجيات"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-bold mb-1">اليوم *</label>
                  <select
                    value={formData.day_of_week}
                    onChange={e => setFormData({ ...formData, day_of_week: e.target.value })}
                    className="w-full bg-[#161b22] border border-white/10 rounded-xl px-3 py-2.5 text-white"
                  >
                    {DAYS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 font-bold mb-1">النوع</label>
                  <select
                    value={formData.item_type}
                    onChange={e => setFormData({ ...formData, item_type: e.target.value as any })}
                    className="w-full bg-[#161b22] border border-white/10 rounded-xl px-3 py-2.5 text-white"
                  >
                    <option value="lecture">محاضرة نظرية</option>
                    <option value="lab">معمل عملي</option>
                    <option value="section">سكشن تمارين</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-bold mb-1">وقت البدء *</label>
                  <input
                    type="time"
                    required
                    value={formData.start_time}
                    onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-bold mb-1">وقت الانتهاء *</label>
                  <input
                    type="time"
                    required
                    value={formData.end_time}
                    onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-bold mb-1">المكان (المدرج / المعمل) *</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    placeholder="مدرج A أو معمل 3"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-bold mb-1">المحاضر / المعيد</label>
                  <input
                    type="text"
                    value={formData.instructor}
                    onChange={e => setFormData({ ...formData, instructor: e.target.value })}
                    placeholder="د. فلان أو م. فلان"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-bold mb-1">الأهمية</label>
                  <select
                    value={formData.importance}
                    onChange={e => setFormData({ ...formData, importance: e.target.value as any })}
                    className="w-full bg-[#161b22] border border-white/10 rounded-xl px-3 py-2.5 text-white"
                  >
                    <option value="high">عالي الأهمية (High)</option>
                    <option value="medium">متوسط (Medium)</option>
                    <option value="low">منخفض (Low)</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.takes_attendance}
                      onChange={e => setFormData({ ...formData, takes_attendance: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-0"
                    />
                    <span className="text-gray-300 font-bold">يسجل حضور وغياب ⚠️</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">
                  الأدوات المطلوبة (أداة في كل سطر)
                </label>
                <textarea
                  rows={3}
                  value={formData.required_tools_text}
                  onChange={e => setFormData({ ...formData, required_tools_text: e.target.value })}
                  placeholder={"لابتوب 💻\nبالطو معمل 🥼\nآلة حاسبة 🧮"}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">ملاحظات إضافية</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="ملاحظات للكويز أو تسليم الشيت"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black"
                >
                  حفظ في الجدول
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
