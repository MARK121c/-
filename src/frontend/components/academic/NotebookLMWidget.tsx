'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Maximize2, Minimize2, X, Send, Bot, User, ExternalLink,
  BookOpen, HelpCircle, Lightbulb, ClipboardList, Copy, Check, RefreshCw
} from 'lucide-react';

interface NotebookLMWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  contextTitle?: string;
  contextText?: string;
  subjectName?: string;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export default function NotebookLMWidget({
  isOpen,
  onClose,
  contextTitle = '',
  contextText = '',
  subjectName = ''
}: NotebookLMWidgetProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `مرحباً بك في **Google NotebookLM Academic AI** 🎓\nأنا مساعدك الذكي المخصص لمراجعة وتلخيص موادك الأكاديمية والجامعية.\n\nيمكنك استخدام الأزرار السريعة بالأسفل أو كتابة أي سؤال عن ${subjectName ? `مادة **${subjectName}**` : 'المحتوى الأكاديمي'} لتلخيصه وتحليله فوراً!`,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const executePrompt = async (promptText: string, mode: 'chat' | 'summary' | 'questions' | 'simplify' | 'study_plan' = 'chat') => {
    if (!promptText.trim() && mode === 'chat') return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/academic/ai-notebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          contextText,
          mode,
          subjectName,
          lectureTitle: contextTitle
        })
      });

      const data = await res.json();
      if (data.success && data.reply) {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: data.reply,
            timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        throw new Error(data.error || 'فشل معالجة الرد');
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: 'عذراً، حدث خطأ أثناء معالجة السؤال. يمكنك المحاولة مجدداً أو فتح رابط Google NotebookLM المباشر.',
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className={`flex flex-col bg-[#0d1117] border border-blue-500/30 rounded-3xl shadow-[0_0_50px_rgba(59,130,246,0.2)] overflow-hidden transition-all duration-300 ${
            isMaximized
              ? 'fixed inset-2 sm:inset-4 w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] h-[calc(100%-1rem)] sm:h-[calc(100%-2rem)] max-w-none max-h-none z-50'
              : 'w-full max-w-2xl h-[85vh] max-h-[750px]'
          }`}
          dir="rtl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-blue-950/40 via-purple-950/20 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 p-0.5 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <div className="w-full h-full bg-[#0d1117] rounded-[14px] flex items-center justify-center">
                  <Sparkles size={20} className="text-amber-400 animate-pulse" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-white tracking-wide">
                    Google NotebookLM Academic AI
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                    PRO 2026
                  </span>
                </div>
                <p className="text-xs text-gray-400 truncate max-w-xs sm:max-w-md">
                  {contextTitle ? `سياق: ${contextTitle}` : subjectName ? `مادة: ${subjectName}` : 'المساعد الأكاديمي الذكي'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <a
                href="https://notebook.google.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-bold transition-all border border-white/10"
                title="فتح موقع Google NotebookLM الرسمي"
              >
                <ExternalLink size={13} />
                <span className="hidden sm:inline">NotebookLM الرسمي</span>
              </a>

              <button
                type="button"
                onClick={() => setIsMaximized(!isMaximized)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/10"
                title={isMaximized ? 'تصغير النافذة' : 'تكبير ملء الشاشة'}
              >
                {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all border border-red-500/20"
                title="إغلاق"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Quick Prompt Pills Bar */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.02] border-b border-white/5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shrink-0">
            {[
              {
                id: 'summary',
                label: '🧠 تلخيص المحاضرة',
                prompt: 'قم بتلخيص هذه المحاضرة وأهم النقاط الأساسية فيها بأسلوب منظم.',
                mode: 'summary' as const,
                icon: <BookOpen size={13} />
              },
              {
                id: 'questions',
                label: '❓ 5 أسئلة امتحانية',
                prompt: 'استخرج 5 أسئلة امتحانية متوقعة مع الإجابات النموذجية.',
                mode: 'questions' as const,
                icon: <HelpCircle size={13} />
              },
              {
                id: 'simplify',
                label: '💡 تبسيط المفاهيم الصعبة',
                prompt: 'اشرح المفاهيم المعقدة في هذا الموضوع بأسلوب مبسط وأمثلة واقعية.',
                mode: 'simplify' as const,
                icon: <Lightbulb size={13} />
              },
              {
                id: 'study_plan',
                label: '📝 خطة مراجعة سريعة',
                prompt: 'ضع لي خطة مراجعة سريعة ومركزة على هذا المحتوى في ساعة واحدة.',
                mode: 'study_plan' as const,
                icon: <ClipboardList size={13} />
              }
            ].map(pill => (
              <button
                key={pill.id}
                type="button"
                disabled={loading}
                onClick={() => executePrompt(pill.prompt, pill.mode)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-blue-500/20 hover:border-blue-500/40 border border-white/10 text-xs text-gray-300 hover:text-blue-300 font-bold whitespace-nowrap transition-all shrink-0 disabled:opacity-50"
              >
                {pill.icon}
                <span>{pill.label}</span>
              </button>
            ))}
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-black ${
                    msg.sender === 'user'
                      ? 'bg-amber-500 text-black'
                      : 'bg-blue-600/30 border border-blue-500/40 text-blue-400'
                  }`}
                >
                  {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed relative group ${
                    msg.sender === 'user'
                      ? 'bg-amber-500/10 border border-amber-500/30 text-amber-200'
                      : 'bg-white/[0.04] border border-white/10 text-gray-200'
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[10px] text-gray-500">
                    <span>{msg.timestamp}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-gray-400 hover:text-white"
                      title="نسخ النص"
                    >
                      {copiedId === msg.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{copiedId === msg.id ? 'تم النسخ' : 'نسخ'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
                  <RefreshCw size={15} className="animate-spin" />
                </div>
                <div className="bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3 text-xs text-gray-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                  <span>NotebookLM يحلل المحتوى الأكاديمي ويستخرج الإجابة...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              executePrompt(input, 'chat');
            }}
            className="p-3 sm:p-4 border-t border-white/10 bg-black/40 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اطرح أي سؤال حول المادة أو المحاضرة..."
              disabled={loading}
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>إرسال</span>
              <Send size={14} className="rotate-180" />
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
