'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder, FolderPlus, FileText, Code2, Download, ExternalLink,
  Plus, Edit2, Trash2, ChevronRight, ArrowRight, Copy, Check, File, Sparkles, X
} from 'lucide-react';

interface FolderItem {
  id: number;
  folder_id: number;
  subject_id: number;
  title: string;
  content: string;
  item_type: 'note' | 'code' | 'file' | 'assignment';
  code_snippet: string;
  code_language: string;
  file_url: string;
  file_name: string;
  file_size: number;
  created_at: string;
}

interface AcademicFolder {
  id: number;
  subject_id: number;
  name: string;
  description: string;
  color: string;
  icon: string;
  itemsCount: number;
}

interface SubjectFolderExplorerProps {
  subjectId: number;
  subjectName: string;
  userRole?: 'owner' | 'assistant' | 'viewer';
  onOpenNotebookLM?: (title: string, text: string) => void;
}

export default function SubjectFolderExplorer({
  subjectId,
  subjectName,
  userRole = 'owner',
  onOpenNotebookLM
}: SubjectFolderExplorerProps) {
  const [folders, setFolders] = useState<AcademicFolder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<AcademicFolder | null>(null);
  const [items, setItems] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Modals
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [folderDesc, setFolderDesc] = useState('');

  const [showItemModal, setShowItemModal] = useState(false);
  const [itemTitle, setItemTitle] = useState('');
  const [itemType, setItemType] = useState<'note' | 'code' | 'file'>('note');
  const [itemContent, setItemContent] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [itemLang, setItemLang] = useState('python');
  const [itemFileUrl, setItemFileUrl] = useState('');
  const [itemFileName, setItemFileName] = useState('');

  const [notification, setNotification] = useState<string | null>(null);

  const isViewer = userRole === 'viewer';

  const fetchFolders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/academic/folders?subject_id=${subjectId}`);
      const data = await res.json();
      if (data.success) {
        setFolders(data.folders || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const fetchFolderItems = async (folderId: number) => {
    try {
      const res = await fetch(`/api/academic/folders/items?folder_id=${folderId}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchFolders();
  }, [subjectId]);

  useEffect(() => {
    if (currentFolder) {
      fetchFolderItems(currentFolder.id);
    }
  }, [currentFolder]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    try {
      const res = await fetch('/api/academic/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_id: subjectId,
          name: folderName.trim(),
          description: folderDesc.trim()
        })
      });
      const data = await res.json();
      if (data.success && data.folder) {
        setFolders(prev => [...prev, data.folder]);
        setShowFolderModal(false);
        setFolderName('');
        setFolderDesc('');
      }
    } catch {
      // ignore
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFolder || !itemTitle.trim()) return;

    try {
      const res = await fetch('/api/academic/folders/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folder_id: currentFolder.id,
          subject_id: subjectId,
          title: itemTitle.trim(),
          content: itemContent,
          item_type: itemType,
          code_snippet: itemCode,
          code_language: itemLang,
          file_url: itemFileUrl,
          file_name: itemFileName
        })
      });
      const data = await res.json();
      if (data.success && data.item) {
        setItems(prev => [...prev, data.item]);
        setShowItemModal(false);
        setItemTitle('');
        setItemContent('');
        setItemCode('');
        setItemFileUrl('');
        setItemFileName('');
        fetchFolders();
      }
    } catch {
      // ignore
    }
  };

  const handleDeleteFolder = async (folderId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المجلد بكل ما بداخله؟')) return;
    try {
      const res = await fetch(`/api/academic/folders?id=${folderId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        if (data.pendingApproval) {
          setNotification('تم إرسال طلب حذف المجلد للمالك للموافقة عليه.');
        } else {
          setFolders(prev => prev.filter(f => f.id !== folderId));
          if (currentFolder?.id === folderId) setCurrentFolder(null);
          setNotification('تم حذف المجلد بنجاح.');
        }
        setTimeout(() => setNotification(null), 4000);
      }
    } catch {
      // ignore
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا العنصر؟')) return;
    try {
      const res = await fetch(`/api/academic/folders/items?id=${itemId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        if (data.pendingApproval) {
          setNotification('تم إرسال طلب حذف الملف للمالك للموافقة عليه.');
        } else {
          setItems(prev => prev.filter(i => i.id !== itemId));
          setNotification('تم حذف العنصر بنجاح.');
        }
        setTimeout(() => setNotification(null), 4000);
      }
    } catch {
      // ignore
    }
  };

  const handleCopyCode = (id: number, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Notification banner */}
      {notification && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold shadow-lg">
          {notification}
        </div>
      )}

      {/* Explorer Header / Breadcrumb */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
        <div className="flex items-center gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setCurrentFolder(null)}
            className={`hover:text-amber-400 transition-colors ${!currentFolder ? 'text-amber-400 font-black' : 'text-gray-400'}`}
          >
            مجلدات المادة ({subjectName})
          </button>
          {currentFolder && (
            <>
              <ChevronRight size={14} className="text-gray-600 rotate-180" />
              <span className="text-white font-black">{currentFolder.name}</span>
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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all"
                >
                  <FolderPlus size={14} />
                  <span>مجلد جديد</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowItemModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-md transition-all"
                >
                  <Plus size={14} />
                  <span>إضافة ملف / كود / ملاحظة</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Level 1: Folders Grid */}
      {!currentFolder ? (
        loading ? (
          <div className="py-12 text-center text-gray-400 text-xs">جاري تحميل مجلدات المادة...</div>
        ) : folders.length === 0 ? (
          <div className="py-12 text-center rounded-3xl bg-white/[0.02] border border-white/5">
            <Folder size={36} className="mx-auto text-gray-600 mb-2" />
            <p className="text-xs font-bold text-gray-400">لا توجد مجلدات منظمة لهذه المادة بعد</p>
            <p className="text-[11px] text-gray-500 mt-1">
              أنشئ مجلدات مثل "محاضرة 1"، "معمل الخوارزميات"، أو "ملخصات الميدترم"
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {folders.map(folder => (
              <div
                key={folder.id}
                onClick={() => setCurrentFolder(folder)}
                className="group relative p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all cursor-pointer shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <Folder size={20} />
                    </div>

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
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  <h4 className="text-sm font-black text-white group-hover:text-blue-300 transition-colors">
                    {folder.name}
                  </h4>
                  {folder.description && (
                    <p className="text-[11px] text-gray-400 line-clamp-2 mt-1">
                      {folder.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/5 text-[10px] text-gray-400">
                  <span>{folder.itemsCount || 0} عناصر بالداخل</span>
                  <span className="text-blue-400 font-bold group-hover:translate-x-[-2px] transition-transform">
                    فتح المجلد ←
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Level 2: Inside Folder View */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentFolder(null)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white"
            >
              <ArrowRight size={14} />
              <span>العودة لكافة المجلدات</span>
            </button>
            <span className="text-xs text-gray-400">{items.length} محتوى محفوظ</span>
          </div>

          {items.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-white/[0.02] border border-white/5">
              <FileText size={36} className="mx-auto text-gray-600 mb-2" />
              <p className="text-xs font-bold text-gray-400">هذا المجلد فارغ حالياً</p>
              <p className="text-[11px] text-gray-500 mt-1">
                اضغط على زر "إضافة ملف / كود / ملاحظة" لإدراج محتوى منظم بالداخل
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map(item => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-white/5 text-amber-400 flex items-center justify-center">
                        {item.item_type === 'code' ? <Code2 size={16} /> : item.item_type === 'file' ? <Download size={16} /> : <FileText size={16} />}
                      </span>
                      <h4 className="text-sm font-black text-white">{item.title}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-gray-300">
                        {item.item_type}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {onOpenNotebookLM && (
                        <button
                          type="button"
                          onClick={() => onOpenNotebookLM(item.title, `${item.content}\n${item.code_snippet}`)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 text-xs font-bold border border-blue-500/20"
                          title="تحليل في NotebookLM AI"
                        >
                          <Sparkles size={12} className="text-amber-400" />
                          <span>تحليل AI</span>
                        </button>
                      )}

                      {!isViewer && (
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10"
                          title="حذف العنصر"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Notes / Rich Content */}
                  {item.content && (
                    <div className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap bg-white/[0.02] p-3 rounded-xl border border-white/5">
                      {item.content}
                    </div>
                  )}

                  {/* Code Snippet */}
                  {item.code_snippet && (
                    <div className="rounded-xl border border-white/10 bg-[#080b10] overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10 bg-white/[0.02] text-[10px] text-gray-400 font-mono">
                        <span>{item.code_language || 'code'}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(item.id, item.code_snippet)}
                          className="flex items-center gap-1 text-gray-300 hover:text-white"
                        >
                          {copiedId === item.id ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                          <span>{copiedId === item.id ? 'تم النسخ' : 'نسخ'}</span>
                        </button>
                      </div>
                      <pre className="p-3 text-xs text-amber-200/90 font-mono overflow-x-auto leading-relaxed">
                        {item.code_snippet}
                      </pre>
                    </div>
                  )}

                  {/* File Attachment */}
                  {item.file_url && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <File size={14} className="text-amber-400 shrink-0" />
                        <span className="font-bold text-gray-200 truncate">{item.file_name || 'ملف مرفق'}</span>
                      </div>
                      <a
                        href={item.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 rounded-lg bg-amber-500 text-black font-bold text-xs flex items-center gap-1 hover:bg-amber-400 shrink-0"
                      >
                        <Download size={12} />
                        <span>تحميل</span>
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0e1217] border border-white/10 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-base font-black text-white mb-4">إنشاء مجلد جديد</h3>
            <form onSubmit={handleCreateFolder} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-bold mb-1">اسم المجلد *</label>
                <input
                  type="text"
                  required
                  value={folderName}
                  onChange={e => setFolderName(e.target.value)}
                  placeholder="مثال: المحاضرة الأولى (مقدمة)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 font-bold mb-1">وصف المجلد</label>
                <input
                  type="text"
                  value={folderDesc}
                  onChange={e => setFolderDesc(e.target.value)}
                  placeholder="محتويات أو تاريخ السكشن"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  حفظ المجلد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Item to Folder Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#0e1217] border border-white/10 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-black text-white mb-4">إضافة عنصر داخل {currentFolder?.name}</h3>
            <form onSubmit={handleCreateItem} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-bold mb-1">العنوان *</label>
                <input
                  type="text"
                  required
                  value={itemTitle}
                  onChange={e => setItemTitle(e.target.value)}
                  placeholder="عنوان الملاحظة أو الكود أو الملف"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">النوع</label>
                <select
                  value={itemType}
                  onChange={e => setItemType(e.target.value as any)}
                  className="w-full bg-[#161b22] border border-white/10 rounded-xl px-3 py-2 text-white"
                >
                  <option value="note">شرح وملاحظات نصية (Note)</option>
                  <option value="code">كود برمجي مع تظليل (Code Snippet)</option>
                  <option value="file">رابط أو ملف دراسي (File Link)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">المحتوى / الشرح</label>
                <textarea
                  rows={4}
                  value={itemContent}
                  onChange={e => setItemContent(e.target.value)}
                  placeholder="اكتب التلخيص أو الملاحظات هنا..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white"
                />
              </div>

              {itemType === 'code' && (
                <div className="space-y-3 p-3 rounded-2xl bg-black/40 border border-white/5">
                  <div className="flex items-center justify-between">
                    <label className="text-gray-400 font-bold">لغة الكود</label>
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
                    rows={6}
                    value={itemCode}
                    onChange={e => setItemCode(e.target.value)}
                    placeholder="// اكتب أو الصق الكود هنا..."
                    className="w-full bg-[#080b10] border border-white/10 rounded-xl p-3 text-amber-200 font-mono text-xs"
                  />
                </div>
              )}

              {itemType === 'file' && (
                <div className="space-y-3 p-3 rounded-2xl bg-black/40 border border-white/5">
                  <div>
                    <label className="block text-gray-400 font-bold mb-1">رابط الملف المباشر (Drive / URL)</label>
                    <input
                      type="url"
                      value={itemFileUrl}
                      onChange={e => setItemFileUrl(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 font-bold mb-1">اسم الملف للعرض</label>
                    <input
                      type="text"
                      value={itemFileName}
                      onChange={e => setItemFileName(e.target.value)}
                      placeholder="Lecture_1_Slides.pdf"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black"
                >
                  إضافة للمجلد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
