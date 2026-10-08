'use client';
import { useState, useEffect } from 'react';

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  due_date: string;
  created_at: string;
}

export default function TaskClient() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [form, setForm] = useState({ title: '', description: '', status: 'pending', priority: 'medium', category: '', due_date: '' });
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => { fetchTasks(); }, []);

  async function fetchTasks() {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch(e) { console.error(e); }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editTask) {
        await fetch(`/api/tasks/${editTask.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      } else {
        await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      }
      setShowForm(false);
      setEditTask(null);
      setForm({ title: '', description: '', status: 'pending', priority: 'medium', category: '', due_date: '' });
      fetchTasks();
    } catch(e) { console.error(e); }
  }

  async function deleteTask(id: number) {
    if (!confirm('حذف المهمة؟')) return;
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    fetchTasks();
  }

  async function toggleStatus(task: Task) {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await fetch(`/api/tasks/${task.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...task, status: newStatus }) });
    fetchTasks();
  }

  function startEdit(task: Task) {
    setEditTask(task);
    setForm({ title: task.title, description: task.description, status: task.status, priority: task.priority, category: task.category, due_date: task.due_date || '' });
    setShowForm(true);
  }

  // Computed values
  const allCategories = [...new Set(tasks.map(t => t.category).filter(Boolean))];
  const filtered = tasks.filter(t => {
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    return true;
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const highCount = tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length;
  const mediumCount = tasks.filter(t => t.priority === 'medium' && t.status !== 'completed').length;
  const lowCount = tasks.filter(t => t.priority === 'low' && t.status !== 'completed').length;

  // Group by category
  const grouped: Record<string, Task[]> = {};
  filtered.forEach(t => {
    const cat = t.category || 'بدون تصنيف';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(t);
  });

  const priorityConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
    high: { label: '🔴 عالية', color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' },
    medium: { label: '🟡 متوسطة', color: '#FF5500', bg: 'rgba(255,85,0,0.1)', border: 'rgba(255,85,0,0.25)' },
    low: { label: '🟢 منخفضة', color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <div style={{ width: 40, height: 40, border: '3px solid rgba(255,85,0,0.2)', borderTop: '3px solid #FF5500', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ padding: '20px', direction: 'rtl' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: '20px 24px', borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, color: '#fff', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8 }}>
            📋 إدارة المهام
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#888' }}>نظام إدارة المهام بالأولويات والمشاريع</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditTask(null); setForm({ title: '', description: '', status: 'pending', priority: 'medium', category: '', due_date: '' }); }}
          style={{ background: 'linear-gradient(135deg, #FF5500, #FF3300)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 16, cursor: 'pointer', fontSize: 14, fontWeight: 900, boxShadow: '0 0 20px rgba(255,85,0,0.3)' }}>
          + مهمة جديدة
        </button>
      </div>

      {/* Daily Progress Bar */}
      <div style={{ marginBottom: 24, padding: '20px 24px', borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: '#aaa', fontWeight: 700 }}>تقدم إنجاز المهام</span>
          <span style={{ fontSize: 20, fontWeight: 900, color: '#FF5500', fontFamily: 'monospace' }}>{completionRate}%</span>
        </div>
        <div style={{ width: '100%', height: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{
            width: `${completionRate}%`,
            height: '100%',
            borderRadius: 999,
            background: 'linear-gradient(90deg, #FF5500, #FF3300)',
            boxShadow: '0 0 12px rgba(255,85,0,0.5)',
            transition: 'width 0.5s ease'
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontSize: 11, color: '#666' }}>{completedTasks} مكتملة من {totalTasks}</span>
          <span style={{ fontSize: 11, color: '#666' }}>🔴 {highCount} عالية • 🟡 {mediumCount} متوسطة • 🟢 {lowCount} منخفضة</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <div style={{ background: 'rgba(255,85,0,0.08)', borderRadius: 16, padding: 16, textAlign: 'center', border: '1px solid rgba(255,85,0,0.2)' }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#FF5500', fontFamily: 'monospace' }}>{totalTasks}</div>
          <div style={{ fontSize: 11, color: '#aaa', fontWeight: 700 }}>إجمالي</div>
        </div>
        <div style={{ background: 'rgba(245,158,11,0.08)', borderRadius: 16, padding: 16, textAlign: 'center', border: '1px solid rgba(245,158,11,0.2)' }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#f59e0b', fontFamily: 'monospace' }}>{pendingTasks}</div>
          <div style={{ fontSize: 11, color: '#aaa', fontWeight: 700 }}>معلقة</div>
        </div>
        <div style={{ background: 'rgba(59,130,246,0.08)', borderRadius: 16, padding: 16, textAlign: 'center', border: '1px solid rgba(59,130,246,0.2)' }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#3b82f6', fontFamily: 'monospace' }}>{inProgressTasks}</div>
          <div style={{ fontSize: 11, color: '#aaa', fontWeight: 700 }}>جاري التنفيذ</div>
        </div>
        <div style={{ background: 'rgba(16,185,129,0.08)', borderRadius: 16, padding: 16, textAlign: 'center', border: '1px solid rgba(16,185,129,0.2)' }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#10b981', fontFamily: 'monospace' }}>{completedTasks}</div>
          <div style={{ fontSize: 11, color: '#aaa', fontWeight: 700 }}>مكتملة</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {/* Priority Filter */}
        {[
          { key: 'all', label: 'كل الأولويات' },
          { key: 'high', label: '🔴 عالية' },
          { key: 'medium', label: '🟡 متوسطة' },
          { key: 'low', label: '🟢 منخفضة' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilterPriority(f.key)}
            style={{
              padding: '8px 14px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
              background: filterPriority === f.key ? 'linear-gradient(135deg, #FF5500, #FF3300)' : 'rgba(255,255,255,0.04)',
              color: filterPriority === f.key ? '#fff' : '#888',
              boxShadow: filterPriority === f.key ? '0 0 12px rgba(255,85,0,0.3)' : 'none'
            }}>
            {f.label}
          </button>
        ))}
        <div style={{ width: 1, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
        {/* Status Filter */}
        {[
          { key: 'all', label: 'كل الحالات' },
          { key: 'pending', label: '⏳ معلقة' },
          { key: 'in-progress', label: '🔄 جاري' },
          { key: 'completed', label: '✅ مكتملة' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilterStatus(f.key)}
            style={{
              padding: '8px 14px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
              background: filterStatus === f.key ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
              color: filterStatus === f.key ? '#fff' : '#888',
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Category Filter */}
      {allCategories.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          <button onClick={() => setFilterCategory('all')}
            style={{ padding: '6px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
              background: filterCategory === 'all' ? '#FF5500' : 'rgba(255,255,255,0.04)', color: filterCategory === 'all' ? '#fff' : '#888' }}>
            كل المشاريع
          </button>
          {allCategories.map(cat => (
            <button key={cat} onClick={() => setFilterCategory(cat)}
              style={{ padding: '6px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                background: filterCategory === cat ? '#FF5500' : 'rgba(255,255,255,0.04)', color: filterCategory === cat ? '#fff' : '#888' }}>
              📁 {cat}
            </button>
          ))}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 24, marginBottom: 24, border: '1px solid rgba(255,85,0,0.15)' }}>
          <h3 style={{ margin: '0 0 16px', color: '#FF5500', fontSize: 16, fontWeight: 900 }}>
            {editTask ? '✏️ تعديل المهمة' : '+ مهمة جديدة'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <input placeholder="عنوان المهمة *" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 14, fontWeight: 700 }} />
              <input placeholder="المشروع / التصنيف" value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 14 }} />
            </div>
            <textarea placeholder="وصف المهمة (اختياري)" value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 14, minHeight: 60, resize: 'vertical', marginBottom: 12 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 14 }}>
                <option value="high">🔴 أولوية عالية</option>
                <option value="medium">🟡 أولوية متوسطة</option>
                <option value="low">🟢 أولوية منخفضة</option>
              </select>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 14 }}>
                <option value="pending">⏳ معلقة</option>
                <option value="in-progress">🔄 جاري التنفيذ</option>
                <option value="completed">✅ مكتملة</option>
              </select>
              <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 14 }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" style={{ background: 'linear-gradient(135deg, #FF5500, #FF3300)', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 12, cursor: 'pointer', fontWeight: 900, boxShadow: '0 0 15px rgba(255,85,0,0.3)' }}>
                {editTask ? '💾 تحديث' : '+ إضافة'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditTask(null); }}
                style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 12, cursor: 'pointer', fontWeight: 700 }}>إلغاء</button>
            </div>
          </form>
        </div>
      )}

      {/* Tasks grouped by category */}
      {Object.entries(grouped).map(([category, categoryTasks]) => (
        <div key={category} style={{ marginBottom: 24 }}>
          {/* Category Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#FF5500' }}>📁 {category}</span>
            <span style={{ fontSize: 11, color: '#666', fontFamily: 'monospace' }}>({categoryTasks.length})</span>
            <div style={{ flex: 1 }} />
            {/* Mini progress for category */}
            {(() => {
              const catDone = categoryTasks.filter(t => t.status === 'completed').length;
              const catPct = categoryTasks.length > 0 ? Math.round((catDone / categoryTasks.length) * 100) : 0;
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 60, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${catPct}%`, height: '100%', background: '#FF5500', borderRadius: 999 }} />
                  </div>
                  <span style={{ fontSize: 10, color: '#888', fontFamily: 'monospace' }}>{catPct}%</span>
                </div>
              );
            })()}
          </div>

          {/* Task Cards */}
          {categoryTasks.map(task => {
            const done = task.status === 'completed';
            const pc = priorityConfig[task.priority] || priorityConfig.medium;
            return (
              <div key={task.id} style={{
                background: done ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)',
                borderRadius: 16, padding: '14px 18px', marginBottom: 8,
                border: `1px solid ${done ? 'rgba(16,185,129,0.15)' : pc.border}`,
                display: 'flex', alignItems: 'center', gap: 14,
                opacity: done ? 0.65 : 1,
                transition: 'all 0.25s ease',
                borderRight: done ? 'none' : `3px solid ${pc.color}`,
              }}>
                {/* Toggle Button */}
                <button onClick={() => toggleStatus(task)}
                  style={{
                    width: 30, height: 30, borderRadius: '50%',
                    border: done ? 'none' : `2px solid ${pc.color}`,
                    background: done ? '#10b981' : 'transparent',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 14, flexShrink: 0,
                    boxShadow: done ? '0 0 10px rgba(16,185,129,0.3)' : 'none',
                    transition: 'all 0.2s'
                  }}>
                  {done ? '✓' : ''}
                </button>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{
                      color: done ? '#888' : '#fff', fontWeight: 700, fontSize: 14,
                      textDecoration: done ? 'line-through' : 'none',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>{task.title}</span>
                  </div>
                  {task.description && !done && (
                    <div style={{ color: '#666', fontSize: 12, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.description}</div>
                  )}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ background: pc.bg, color: pc.color, padding: '2px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900, border: `1px solid ${pc.border}` }}>
                      {pc.label}
                    </span>
                    {task.status === 'in-progress' && (
                      <span style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '2px 10px', borderRadius: 8, fontSize: 10, fontWeight: 700 }}>🔄 جاري</span>
                    )}
                    {task.due_date && (
                      <span style={{ color: '#888', fontSize: 11 }}>📅 {task.due_date}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {!done && (
                  <button onClick={() => startEdit(task)} style={{ background: 'none', border: 'none', color: '#FF5500', cursor: 'pointer', fontSize: 16, padding: 4 }}>✏️</button>
                )}
                <button onClick={() => deleteTask(task.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 16, padding: 4 }}>🗑️</button>
              </div>
            );
          })}
        </div>
      ))}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>
          <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>📋</span>
          <p style={{ fontSize: 16, fontWeight: 700 }}>لا توجد مهام مطابقة</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>جرّب تغيير الفلاتر أو أضف مهمة جديدة</p>
        </div>
      )}
    </div>
  );
}
