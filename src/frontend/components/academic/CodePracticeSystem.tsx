'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2, Upload, FileCode, CheckCircle, XCircle, HelpCircle,
  Play, RefreshCw, Trash2, Sparkles, Terminal, FileText, ChevronDown, ChevronUp, Copy, Check
} from 'lucide-react';

interface Exercise {
  id: number;
  type: string;
  title: string;
  prompt: string;
  hint: string;
  solution: string;
}

interface CodePractice {
  id: number;
  file_name: string;
  language: string;
  code_content: string;
  analysis: string;
  exercises: Exercise[];
  created_at: string;
}

interface CodePracticeSystemProps {
  userRole?: 'owner' | 'assistant' | 'viewer';
}

export default function CodePracticeSystem({ userRole = 'owner' }: CodePracticeSystemProps) {
  const [practices, setPractices] = useState<CodePractice[]>([]);
  const [selectedPractice, setSelectedPractice] = useState<CodePractice | null>(null);
  const [loading, setLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  // Upload state
  const [fileName, setFileName] = useState('');
  const [language, setLanguage] = useState('python');
  const [codeContent, setCodeContent] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);

  const isViewer = userRole === 'viewer';

  const fetchPractices = async () => {
    try {
      const res = await fetch('/api/academic/code-practice');
      const data = await res.json();
      if (data.success) {
        setPractices(data.practices || []);
        if (data.practices && data.practices.length > 0 && !selectedPractice) {
          setSelectedPractice(data.practices[0]);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchPractices();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'py') setLanguage('python');
    else if (ext === 'js') setLanguage('javascript');
    else if (ext === 'cpp' || ext === 'cc' || ext === 'c') setLanguage('cpp');
    else if (ext === 'java') setLanguage('java');
    else if (ext === 'sql') setLanguage('sql');

    const reader = new FileReader();
    reader.onload = (event) => {
      setCodeContent(event.target?.result as string || '');
    };
    reader.readAsText(file);
  };

  const handleCreatePractice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName || !codeContent.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/academic/code-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_name: fileName,
          language,
          code_content: codeContent
        })
      });
      const data = await res.json();
      if (data.success && data.practice) {
        setPractices(prev => [data.practice, ...prev]);
        setSelectedPractice(data.practice);
        setShowUploadForm(false);
        setFileName('');
        setCodeContent('');
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا التدريب؟')) return;
    try {
      const res = await fetch(`/api/academic/code-practice?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setPractices(prev => prev.filter(p => p.id !== id));
        if (selectedPractice?.id === id) {
          setSelectedPractice(null);
        }
      }
    } catch {
      // ignore
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <Code2 className="text-cyan-400" size={22} />
              <span>نظام التدريب التفاعلي على ملفات الأكواد البرمجية</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Interactive Logic & Output
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            ارفع ملف الكود (.py, .js, .cpp...) لاختبار فهمك للمنطق، تتبع المخرجات، وصيد الأخطاء وتحليل التعقيد الخوارزمي
          </p>
        </div>

        {!isViewer && (
          <button
            type="button"
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs shadow-lg shadow-cyan-500/20 transition-all shrink-0"
          >
            <Upload size={16} />
            <span>{showUploadForm ? 'إغلاق نافذة الرفع' : 'رفع ملف كود جديد'}</span>
          </button>
        )}
      </div>

      {/* Upload & Analysis Form Drawer */}
      <AnimatePresence>
        {showUploadForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-5 rounded-3xl bg-cyan-950/20 border border-cyan-500/30 overflow-hidden"
          >
            <form onSubmit={handleCreatePractice} className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <FileCode className="text-cyan-400" size={16} />
                  <span>رفع ملف أو لصق كود للتدريب</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">اختيار ملف من جهازك</label>
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/20 hover:border-cyan-500/60 rounded-2xl cursor-pointer bg-white/[0.02] hover:bg-cyan-500/5 transition-all">
                    <Upload size={24} className="text-cyan-400 mb-2" />
                    <span className="text-gray-300 font-bold">اضغط لاختيار ملف (.py, .js, .cpp, .java...)</span>
                    <span className="text-[10px] text-gray-500 mt-1">يدعم جميع اللغات البرمجية الشائعة</span>
                    <input type="file" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-gray-300 font-bold mb-1">اسم الملف / التدريب *</label>
                    <input
                      type="text"
                      required
                      value={fileName}
                      onChange={e => setFileName(e.target.value)}
                      placeholder="binary_search.py أو logic_test.cpp"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 font-bold mb-1">لغة البرمجة</label>
                    <select
                      value={language}
                      onChange={e => setLanguage(e.target.value)}
                      className="w-full bg-[#161b22] border border-white/10 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="python">Python</option>
                      <option value="javascript">JavaScript / TypeScript</option>
                      <option value="cpp">C++ / C</option>
                      <option value="java">Java</option>
                      <option value="sql">SQL Database</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">محتوى الكود البرمجي *</label>
                <textarea
                  rows={8}
                  required
                  value={codeContent}
                  onChange={e => setCodeContent(e.target.value)}
                  placeholder="// الصق الكود البرمجي هنا أو ارفع الملف من الأعلى..."
                  className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-500 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading || !fileName || !codeContent.trim()}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black flex items-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                >
                  {loading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  <span>بدء تحليل الكود وتوليد التمارين</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Layout */}
      {practices.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-white/[0.02] border border-white/5">
          <FileCode size={40} className="mx-auto text-gray-600 mb-3" />
          <h4 className="text-sm font-bold text-gray-300">لا توجد تدريبات برمجية مضافة حتى الآن</h4>
          <p className="text-xs text-gray-500 mt-1">
            اضغط على "رفع ملف كود جديد" لتوليد تمارين تفاعلية وفحص الكود فوراً
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar: Practices list (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold text-gray-400 px-1">الملفات البرمجية المحفوظة ({practices.length})</h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {practices.map(p => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPractice(p)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedPractice?.id === p.id
                      ? 'bg-cyan-500/10 border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                      : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs uppercase font-mono">
                      {p.language.slice(0, 3)}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">{p.file_name}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {p.code_content.split('\n').length} سطر • {p.exercises?.length || 0} تمارين
                      </p>
                    </div>
                  </div>

                  {!isViewer && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(p.id);
                      }}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10"
                      title="حذف التدريب"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Area: Interactive Workspace (8 cols) */}
          {selectedPractice && (
            <div className="lg:col-span-8 space-y-6">
              {/* Code Viewer */}
              <div className="rounded-3xl border border-white/10 bg-[#0b0e14] overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <Terminal size={15} className="text-cyan-400" />
                    <span className="text-xs font-mono font-bold text-white">{selectedPractice.file_name}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-cyan-500/20 text-cyan-300">
                      {selectedPractice.language}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => copyCode(selectedPractice.code_content)}
                    className="flex items-center gap-1 text-[11px] font-bold text-gray-400 hover:text-white px-2.5 py-1 rounded-lg bg-white/5"
                  >
                    {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copied ? 'تم النسخ' : 'نسخ الكود'}</span>
                  </button>
                </div>

                <div className="p-4 overflow-x-auto max-h-[300px] overflow-y-auto font-mono text-xs text-cyan-200/90 leading-relaxed bg-[#07090e]">
                  <pre className="whitespace-pre-wrap">{selectedPractice.code_content}</pre>
                </div>
              </div>

              {/* Analysis & Exercises Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-400" />
                    <span>التمارين والتحديات التفاعلية ({selectedPractice.exercises?.length || 0})</span>
                  </h3>
                  <span className="text-xs text-gray-400">تحقق من فهمك واكتب إجابتك ثم طابقها مع الحل</span>
                </div>

                <div className="space-y-3">
                  {selectedPractice.exercises?.map((ex, idx) => {
                    const isSolved = !!revealedSolutions[`${selectedPractice.id}:${ex.id}`];
                    const isHinted = !!revealedHints[`${selectedPractice.id}:${ex.id}`];

                    return (
                      <div
                        key={ex.id || idx}
                        className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs">
                              {idx + 1}
                            </span>
                            <h4 className="text-xs sm:text-sm font-black text-white">{ex.title}</h4>
                          </div>

                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-gray-300">
                            {ex.type}
                          </span>
                        </div>

                        <p className="text-xs text-gray-300 leading-relaxed">{ex.prompt}</p>

                        {/* Interactive User Answer Box */}
                        <div>
                          <textarea
                            rows={2}
                            value={userAnswers[`${selectedPractice.id}:${ex.id}`] || ''}
                            onChange={(e) =>
                              setUserAnswers({
                                ...userAnswers,
                                [`${selectedPractice.id}:${ex.id}`]: e.target.value
                              })
                            }
                            placeholder="اكتب تحليلك أو توقعك للحل هنا قبل الكشف عن الإجابة النموذجية..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                          />
                        </div>

                        {/* Action buttons (Hint / Reveal) */}
                        <div className="flex items-center justify-between pt-2">
                          <button
                            type="button"
                            onClick={() =>
                              setRevealedHints({
                                ...revealedHints,
                                [`${selectedPractice.id}:${ex.id}`]: !isHinted
                              })
                            }
                            className="flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300"
                          >
                            <HelpCircle size={13} />
                            <span>{isHinted ? 'إخفاء التلميح' : 'إظهار تلميح'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setRevealedSolutions({
                                ...revealedSolutions,
                                [`${selectedPractice.id}:${ex.id}`]: !isSolved
                              })
                            }
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-xs border border-cyan-500/30 transition-all"
                          >
                            <span>{isSolved ? 'إخفاء الحل النموذجي' : 'كشف الحل النموذجي والتحليل'}</span>
                            {isSolved ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>

                        {/* Hint box */}
                        {isHinted && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs"
                          >
                            💡 <strong>تلميح:</strong> {ex.hint}
                          </motion.div>
                        )}

                        {/* Solution box */}
                        {isSolved && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs leading-relaxed space-y-1"
                          >
                            <div className="flex items-center gap-1.5 font-bold text-emerald-400 mb-1">
                              <CheckCircle size={14} />
                              <span>الحل النموذجي والشرح التفصيلي:</span>
                            </div>
                            <p>{ex.solution}</p>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
