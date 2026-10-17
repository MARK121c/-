'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, Clock, Award, CheckCircle2, XCircle, AlertTriangle,
  Play, RotateCcw, ChevronLeft, ChevronRight, CheckSquare, Plus, Trash2,
  FileCheck, ShieldCheck, Sparkles, X, Eye
} from 'lucide-react';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  points?: number;
  explanation?: string;
}

interface Exam {
  id: number;
  term: 'term1' | 'term2';
  exam_type: 'midterm' | 'final_term1' | 'final_term2' | 'quiz';
  subject_id?: number | null;
  title: string;
  description?: string;
  duration_minutes: number;
  passing_score: number;
  total_marks: number;
  questions: Question[];
  questionsCount: number;
  scheduled_date?: string;
  lastAttempt?: {
    score: number;
    total_marks: number;
    percentage: number;
    completed_at: string;
  } | null;
}

interface ExamSimulatorHubProps {
  userRole?: 'owner' | 'assistant' | 'viewer';
  currentTerm?: 'term1' | 'term2';
}

export default function ExamSimulatorHub({
  userRole = 'owner',
  currentTerm = 'term1'
}: ExamSimulatorHubProps) {
  const [selectedTerm, setSelectedTerm] = useState<'term1' | 'term2'>(currentTerm);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Simulation State
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [examResult, setExamResult] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // New Exam Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamType, setNewExamType] = useState<'midterm' | 'final_term1' | 'final_term2'>('midterm');
  const [newExamDuration, setNewExamDuration] = useState(60);
  const [newExamPassing, setNewExamPassing] = useState(50);
  const [newQuestionsText, setNewQuestionsText] = useState('');

  const isViewer = userRole === 'viewer';

  useEffect(() => {
    setSelectedTerm(currentTerm);
  }, [currentTerm]);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/academic/exams?term=${selectedTerm}&exam_type=${selectedType}`);
      const data = await res.json();
      if (data.success) {
        setExams(data.exams || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, [selectedTerm, selectedType]);

  // Timer countdown
  useEffect(() => {
    if (!activeExam || examResult) return;
    if (timeLeft <= 0) {
      handleSubmitExam();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeExam, timeLeft, examResult]);

  const startExam = (exam: Exam) => {
    setActiveExam(exam);
    setCurrentQIndex(0);
    setSelectedAnswers({});
    setExamResult(null);
    setTimeLeft(exam.duration_minutes * 60);
  };

  const selectOption = (questionId: number, optionIdx: number) => {
    if (examResult) return;
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleSubmitExam = async () => {
    if (!activeExam || submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/academic/exams/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam_id: activeExam.id,
          answers: selectedAnswers
        })
      });
      const data = await res.json();
      if (data.success && data.result) {
        setExamResult(data.result);
        fetchExams();
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamTitle || !newQuestionsText.trim()) return;

    let parsedQuestions: Question[] = [];
    try {
      parsedQuestions = JSON.parse(newQuestionsText);
    } catch {
      alert('صيغة الأسئلة يجب أن تكون JSON صالح لمصفوفة من الأسئلة');
      return;
    }

    try {
      const res = await fetch('/api/academic/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          term: selectedTerm,
          exam_type: newExamType,
          title: newExamTitle,
          duration_minutes: Number(newExamDuration),
          passing_score: Number(newExamPassing),
          questions: parsedQuestions
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setNewExamTitle('');
        setNewQuestionsText('');
        fetchExams();
      }
    } catch {
      // ignore
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Simulation Active View */}
      {activeExam ? (
        <div className="space-y-6">
          {/* Header Bar during exam */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[#0b0e14] border border-amber-500/30 shadow-2xl">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-500 text-black">
                  جلسة امتحان رسمية
                </span>
                <h2 className="text-base sm:text-lg font-black text-white">{activeExam.title}</h2>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                سؤال {currentQIndex + 1} من {activeExam.questions?.length || 0} • الدرجة الكلية: {activeExam.total_marks}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {!examResult && (
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-mono text-base font-bold ${
                    timeLeft < 300
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                      : 'bg-white/5 text-amber-300 border-white/10'
                  }`}
                >
                  <Clock size={18} className="text-amber-400" />
                  <span className="dir-ltr">{formatTimer(timeLeft)}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  if (examResult || confirm('هل أنت متأكد من الخروج من الامتحان؟')) {
                    setActiveExam(null);
                    setExamResult(null);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-bold transition-all border border-white/10"
              >
                إنهاء / خروج
              </button>
            </div>
          </div>

          {/* If Result Sheet is Available */}
          {examResult ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 space-y-6"
            >
              {/* Score Banner */}
              <div
                className={`p-6 rounded-3xl border text-center space-y-3 ${
                  examResult.passed
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-white/10 shadow-lg">
                  {examResult.passed ? <Award size={36} className="text-emerald-400" /> : <AlertTriangle size={36} className="text-rose-400" />}
                </div>

                <h3 className="text-xl sm:text-2xl font-black">
                  {examResult.passed ? '🎉 مبروك! اجتزت الامتحان بنجاح' : '⚠️ لم توفق في اجتياز الامتحان هذه المرة'}
                </h3>

                <div className="flex items-center justify-center gap-6 text-sm font-bold">
                  <div>
                    <span className="text-gray-400 block text-xs">الدرجة المحصلة</span>
                    <span className="text-2xl font-black">{examResult.score} / {examResult.totalMarks}</span>
                  </div>
                  <div className="h-8 w-px bg-white/10" />
                  <div>
                    <span className="text-gray-400 block text-xs">النسبة المئوية</span>
                    <span className="text-2xl font-black">{examResult.percentage}%</span>
                  </div>
                  <div className="h-8 w-px bg-white/10" />
                  <div>
                    <span className="text-gray-400 block text-xs">التقدير الرسمي</span>
                    <span className="text-lg font-black text-amber-300">{examResult.gradeLabel}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => startExam(activeExam)}
                    className="px-6 py-2.5 rounded-2xl bg-amber-500 text-black font-black text-xs shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition-all inline-flex items-center gap-2"
                  >
                    <RotateCcw size={14} />
                    <span>إعادة خوض الامتحان للمراجعة</span>
                  </button>
                </div>
              </div>

              {/* Question-by-Question Review */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <FileCheck size={16} className="text-blue-400" />
                  <span>المراجعة التفصيلية لجميع الأسئلة والأخطاء:</span>
                </h4>

                {examResult.evaluation?.map((qEval: any, idx: number) => (
                  <div
                    key={qEval.id || idx}
                    className={`p-5 rounded-3xl border space-y-3 ${
                      qEval.isCorrect
                        ? 'bg-emerald-500/[0.03] border-emerald-500/20'
                        : 'bg-rose-500/[0.03] border-rose-500/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-white/10 text-white flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <h5 className="text-xs sm:text-sm font-black text-white">{qEval.question}</h5>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${qEval.isCorrect ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                        {qEval.isCorrect ? `+${qEval.pointsAwarded} درجة` : '0 درجة'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {qEval.options?.map((opt: string, optIdx: number) => {
                        const isCorrectAnswer = optIdx === qEval.correctIndex;
                        const isSelectedByStudent = optIdx === qEval.selected;

                        let style = 'bg-white/5 border-white/10 text-gray-300';
                        if (isCorrectAnswer) style = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200 font-bold';
                        else if (isSelectedByStudent && !isCorrectAnswer) style = 'bg-rose-500/20 border-rose-500/50 text-rose-200 line-through';

                        return (
                          <div key={optIdx} className={`p-3 rounded-2xl border flex items-center justify-between ${style}`}>
                            <span>{opt}</span>
                            {isCorrectAnswer && <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />}
                            {isSelectedByStudent && !isCorrectAnswer && <XCircle size={14} className="text-rose-400 shrink-0" />}
                          </div>
                        );
                      })}
                    </div>

                    {qEval.explanation && (
                      <p className="text-xs text-gray-400 bg-white/[0.02] p-3 rounded-2xl border border-white/5">
                        💡 <strong>التوضيح النموذجي:</strong> {qEval.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            /* Active Question Card */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Question Content (8 cols) */}
              <div className="lg:col-span-8 p-6 rounded-3xl bg-white/[0.03] border border-white/10 space-y-6">
                {activeExam.questions && activeExam.questions[currentQIndex] ? (
                  (() => {
                    const q = activeExam.questions[currentQIndex];
                    const selected = selectedAnswers[q.id !== undefined ? q.id : currentQIndex];

                    return (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300">
                            السؤال {currentQIndex + 1}
                          </span>
                          <h3 className="text-base sm:text-lg font-black text-white leading-relaxed">
                            {q.question}
                          </h3>
                        </div>

                        {/* Options */}
                        <div className="space-y-3">
                          {q.options?.map((opt, optIdx) => (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => selectOption(q.id !== undefined ? q.id : currentQIndex, optIdx)}
                              className={`w-full p-4 rounded-2xl border text-right transition-all flex items-center justify-between text-xs sm:text-sm font-bold ${
                                selected === optIdx
                                  ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-lg shadow-amber-500/10'
                                  : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              <span>{opt}</span>
                              <div
                                className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                  selected === optIdx
                                    ? 'border-amber-500 bg-amber-500 text-black'
                                    : 'border-white/20'
                                }`}
                              >
                                {selected === optIdx && <div className="w-2 h-2 rounded-full bg-black" />}
                              </div>
                            </button>
                          ))}
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                          <button
                            type="button"
                            disabled={currentQIndex === 0}
                            onClick={() => setCurrentQIndex(prev => prev - 1)}
                            className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronRight size={16} />
                            <span>السابق</span>
                          </button>

                          {currentQIndex < (activeExam.questions.length - 1) ? (
                            <button
                              type="button"
                              onClick={() => setCurrentQIndex(prev => prev + 1)}
                              className="flex items-center gap-1 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20"
                            >
                              <span>التالي</span>
                              <ChevronLeft size={16} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={submitting}
                              onClick={handleSubmitExam}
                              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black shadow-lg shadow-emerald-500/20"
                            >
                              <FileCheck size={16} />
                              <span>{submitting ? 'جاري الرصد...' : 'تسليم الامتحان والتقييم'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()
                ) : null}
              </div>

              {/* Navigator Panel (4 cols) */}
              <div className="lg:col-span-4 p-5 rounded-3xl bg-white/[0.02] border border-white/10 space-y-4">
                <h4 className="text-xs font-bold text-gray-400">لوحة تتبع إجابات الأسئلة</h4>
                <div className="grid grid-cols-5 gap-2">
                  {activeExam.questions?.map((q, idx) => {
                    const isAnswered = selectedAnswers[q.id !== undefined ? q.id : idx] !== undefined;
                    const isCurrent = currentQIndex === idx;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentQIndex(idx)}
                        className={`h-10 rounded-xl text-xs font-bold font-mono transition-all border ${
                          isCurrent
                            ? 'bg-amber-500 text-black border-amber-400 scale-105 shadow-md'
                            : isAnswered
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-white/5 space-y-2 text-xs text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md bg-emerald-500/20 border border-emerald-500/40" />
                    <span>تمت الإجابة عليه</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md bg-white/5 border border-white/10" />
                    <span>لم يتم الإجابة بعد</span>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleSubmitExam}
                    className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs shadow-lg shadow-emerald-500/20"
                  >
                    تسليم ورقة الإجابة الآن
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Regular Exams Hub View */
        <div className="space-y-6">
          {/* Top Header & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <GraduationCap className="text-amber-400" size={24} />
                  <span>محاكي امتحانات الكلية والتقييم الأكاديمي</span>
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Official College Simulator
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                محاكاة حية لاختبارات الميدترم، امتحانات نهاية الترم الأول (يناير/فبراير)، وفاينل نهاية العام (مايو/يونيو) ونقل الفرقة الثانية
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Term Switcher */}
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
                    setNewQuestionsText(JSON.stringify([
                      {
                        id: 1,
                        question: "اكتب نص السؤال هنا؟",
                        options: ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],
                        correctIndex: 0,
                        points: 25,
                        explanation: "توضيح الإجابة النموذجية"
                      }
                    ], null, 2));
                    setShowAddModal(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-lg shadow-amber-500/20"
                >
                  <Plus size={16} />
                  <span>إضافة نموذج امتحان</span>
                </button>
              )}
            </div>
          </div>

          {/* Exam Type Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {[
              { id: 'all', label: 'جميع الاختبارات' },
              { id: 'midterm', label: '📌 امتحانات الميدترم (Midterm)' },
              { id: 'final_term1', label: '🎓 فاينل الترم الأول (يناير)' },
              { id: 'final_term2', label: '🏆 فاينل الترم الثاني وسنة النقل (مايو/يونيو)' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedType(tab.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                  selectedType === tab.id
                    ? 'bg-amber-500 text-black font-black shadow-lg shadow-amber-500/20'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Exam Cards Grid */}
          {loading ? (
            <div className="py-20 text-center text-gray-400 text-sm">
              جاري تحميل نماذج الامتحانات الرسمية...
            </div>
          ) : exams.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-white/[0.02] border border-white/5">
              <GraduationCap size={40} className="mx-auto text-gray-600 mb-3" />
              <h4 className="text-sm font-bold text-gray-300">لا توجد امتحانات مسجلة في هذا القسم</h4>
              <p className="text-xs text-gray-500 mt-1">
                يمكنك إضافة نماذج امتحانات جديدة للتدريب عبر زر "إضافة نموذج امتحان"
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {exams.map(exam => (
                <div
                  key={exam.id}
                  className="flex flex-col justify-between p-6 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-amber-500/30 transition-all shadow-xl group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {exam.exam_type === 'midterm' ? 'ميدترم منتصف الفصل' : exam.exam_type === 'final_term1' ? 'فاينل الترم الأول' : 'فاينل نهاية العام'}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">
                        {exam.questionsCount || 0} أسئلة
                      </span>
                    </div>

                    <h3 className="text-base font-black text-white leading-snug group-hover:text-amber-300 transition-colors">
                      {exam.title}
                    </h3>
                    {exam.description && (
                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                        {exam.description}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-black/40 border border-white/5 text-xs text-gray-300">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-amber-400 shrink-0" />
                        <span>{exam.duration_minutes} دقيقة</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award size={14} className="text-purple-400 shrink-0" />
                        <span>الدرجة: {exam.total_marks}</span>
                      </div>
                    </div>

                    {/* Previous attempt indicator */}
                    {exam.lastAttempt && (
                      <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
                        <span>آخر محاولة لك:</span>
                        <span className="font-bold">{exam.lastAttempt.score} / {exam.lastAttempt.total_marks} ({exam.lastAttempt.percentage}%)</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-5 mt-4 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => startExam(exam)}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
                    >
                      <Play size={14} />
                      <span>بدء محاكاة الامتحان الآن</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Exam Modal */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <div className="w-full max-w-lg bg-[#0e1217] border border-white/10 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <GraduationCap className="text-amber-400" size={18} />
                    <span>إضافة نموذج امتحان جديد</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="p-1.5 rounded-xl bg-white/5 text-gray-400 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleCreateExam} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-gray-400 font-bold mb-1">عنوان الامتحان *</label>
                    <input
                      type="text"
                      required
                      value={newExamTitle}
                      onChange={e => setNewExamTitle(e.target.value)}
                      placeholder="امتحان ميدترم خوارزميات وهندسة برمجيات"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-400 font-bold mb-1">نوع التقييم</label>
                      <select
                        value={newExamType}
                        onChange={e => setNewExamType(e.target.value as any)}
                        className="w-full bg-[#161b22] border border-white/10 rounded-xl px-3 py-2 text-white"
                      >
                        <option value="midterm">ميدترم (Midterm)</option>
                        <option value="final_term1">فاينل الترم الأول (Final Term 1)</option>
                        <option value="final_term2">فاينل الترم الثاني وسنة النقل (Final Term 2)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-400 font-bold mb-1">المدة (بالدقائق)</label>
                      <input
                        type="number"
                        min={10}
                        max={180}
                        value={newExamDuration}
                        onChange={e => setNewExamDuration(Number(e.target.value))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold mb-1">
                      الأسئلة بصيغة JSON (السؤال، الخيارات، ومؤشر الإجابة الصحيحة)
                    </label>
                    <textarea
                      rows={8}
                      required
                      value={newQuestionsText}
                      onChange={e => setNewQuestionsText(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-amber-200 font-mono text-[11px] leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black"
                    >
                      حفظ الامتحان
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
