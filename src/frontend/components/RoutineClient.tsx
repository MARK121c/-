'use client';
import { useState, useEffect } from 'react';

interface Routine {
  id: number;
  title: string;
  category: string;
  time_of_day: string;
  duration_minutes: number;
  is_active: number;
  streak: number;
  last_completed: string | null;
}

interface GroomingItem {
  id: number;
  title: string;
  category: string;
  frequency: string;
  last_done: string | null;
  next_due: string | null;
  notes: string;
}

export default function RoutineClient() {
  const [tab, setTab] = useState<'today' | 'library' | 'grooming'>('today');
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [grooming, setGrooming] = useState<GroomingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState<{ routineId: number; seconds: number } | null>(null);

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (!timer) return;
    const interval = setInterval(() => {
      setTimer(prev => prev ? { ...prev, seconds: prev.seconds + 1 } : null);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  async function fetchAll() {
    try {
      const [rRes, gRes] = await Promise.all([
        fetch('/api/routines'),
        fetch('/api/grooming')
      ]);
      const rData = await rRes.json();
      const gData = await gRes.json();
      setRoutines(rData.routines || []);
      setGrooming(gData.items || []);
    } catch(e) { console.error(e); }
    setLoading(false);
  }

  async function toggleComplete(routine: Routine) {
    const today = new Date().toISOString().split('T')[0];
    const isCompletedToday = routine.last_completed === today;
    await fetch(`/api/routines/${routine.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...routine,
        last_completed: isCompletedToday ? null : today,
        streak: isCompletedToday ? Math.max(0, routine.streak - 1) : routine.streak + 1
      })
    });
    fetchAll();
  }

  async function completeGrooming(item: GroomingItem) {
    const today = new Date().toISOString().split('T')[0];
    await fetch(`/api/grooming/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item, last_done: today })
    });
    fetchAll();
  }

  const today = new Date().toISOString().split('T')[0];
  const activeRoutines = routines.filter(r => r.is_active);
  const completedToday = activeRoutines.filter(r => r.last_completed === today);
  const completionRate = activeRoutines.length > 0 ? Math.round((completedToday.length / activeRoutines.length) * 100) : 0;

  const timeGroups = {
    morning: activeRoutines.filter(r => r.time_of_day === 'morning'),
    afternoon: activeRoutines.filter(r => r.time_of_day === 'afternoon'),
    evening: activeRoutines.filter(r => r.time_of_day === 'evening'),
    anytime: activeRoutines.filter(r => !r.time_of_day || r.time_of_day === 'anytime'),
  };

  const timeLabels: Record<string, { label: string; color: string }> = {
    morning: { label: '🌅 الصباح', color: '#F59E0B' },
    afternoon: { label: '☀️ الظهر', color: '#FF5500' },
    evening: { label: '🌙 المساء', color: '#8B5CF6' },
    anytime: { label: '⏰ أي وقت', color: '#3B82F6' },
  };

  const formatTime = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <div style={{ width: 40, height: 40, border: '3px solid rgba(255,85,0,0.2)', borderTop: '3px solid #FF5500', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ padding: '20px', direction: 'rtl' }}>
      {/* Header with Progress */}
      <div style={{ marginBottom: 24, padding: '24px', borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* Circular Progress */}
          <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="#FF5500" strokeWidth="8"
                strokeDasharray={`${completionRate * 2.64} 264`} strokeLinecap="round"
                transform="rotate(-90 50 50)"
                style={{ filter: 'drop-shadow(0 0 6px rgba(255,85,0,0.5))', transition: 'stroke-dasharray 0.5s ease' }} />
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#FF5500', fontFamily: 'monospace' }}>{completionRate}%</div>
            </div>
          </div>
          
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 22, color: '#fff', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8 }}>
              ✨ العادات والروتين اليومي
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#888' }}>
              أكملت {completedToday.length} من {activeRoutines.length} عادة اليوم
            </p>
            {/* Total streak display */}
            {routines.some(r => r.streak > 0) && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <span style={{ fontSize: 12, color: '#FF5500', fontWeight: 700 }}>
                  🔥 أعلى سلسلة: {Math.max(...routines.map(r => r.streak))} يوم
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[
          { key: 'today' as const, label: '📅 قائمة اليوم', count: activeRoutines.length },
          { key: 'library' as const, label: '📚 كل الروتينات', count: routines.length },
          { key: 'grooming' as const, label: '✨ العناية الشخصية', count: grooming.length }
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              padding: '10px 20px', borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 900,
              background: tab === t.key ? 'linear-gradient(135deg, #FF5500, #FF3300)' : 'rgba(255,255,255,0.04)',
              color: tab === t.key ? '#fff' : '#888',
              boxShadow: tab === t.key ? '0 0 15px rgba(255,85,0,0.3)' : 'none',
              display: 'flex', alignItems: 'center', gap: 6
            }}>
            {t.label}
            <span style={{ 
              fontSize: 10, fontFamily: 'monospace', 
              background: tab === t.key ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.08)', 
              padding: '2px 6px', borderRadius: 8 
            }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* ── TODAY TAB ── */}
      {tab === 'today' && (
        <div>
          {Object.entries(timeGroups).map(([key, items]) => items.length > 0 && (
            <div key={key} style={{ marginBottom: 24 }}>
              {/* Time Group Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 8, borderBottom: `2px solid ${timeLabels[key]?.color || '#555'}20` }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: timeLabels[key]?.color || '#aaa' }}>
                  {timeLabels[key]?.label || key}
                </span>
                <span style={{ fontSize: 10, color: '#666', fontFamily: 'monospace' }}>
                  ({items.filter(r => r.last_completed === today).length}/{items.length})
                </span>
              </div>

              {/* Routine Items as Checklist */}
              {items.map(routine => {
                const done = routine.last_completed === today;
                return (
                  <div key={routine.id} style={{
                    background: done ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)',
                    borderRadius: 16, padding: '14px 18px', marginBottom: 8,
                    border: `1px solid ${done ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)'}`,
                    display: 'flex', alignItems: 'center', gap: 14,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                  }}
                  onClick={() => toggleComplete(routine)}
                  >
                    {/* One-tap toggle */}
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      border: done ? 'none' : '2px solid rgba(255,85,0,0.4)',
                      background: done ? '#10b981' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 16, flexShrink: 0,
                      boxShadow: done ? '0 0 12px rgba(16,185,129,0.4)' : 'none',
                      transition: 'all 0.3s ease'
                    }}>
                      {done ? '✓' : ''}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      <div style={{
                        color: done ? '#888' : '#fff', fontWeight: 700, fontSize: 14,
                        textDecoration: done ? 'line-through' : 'none',
                        transition: 'all 0.3s'
                      }}>{routine.title}</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                        {routine.duration_minutes > 0 && (
                          <span style={{ fontSize: 11, color: '#888' }}>⏱️ {routine.duration_minutes} د</span>
                        )}
                        {routine.streak > 0 && (
                          <span style={{ fontSize: 11, color: '#FF5500', fontWeight: 700 }}>🔥 {routine.streak}</span>
                        )}
                        {routine.category && (
                          <span style={{ fontSize: 10, color: '#FF5500', background: 'rgba(255,85,0,0.1)', padding: '1px 8px', borderRadius: 6, fontWeight: 700 }}>{routine.category}</span>
                        )}
                      </div>
                    </div>

                    {/* Timer */}
                    {timer?.routineId === routine.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={e => e.stopPropagation()}>
                        <span style={{ color: '#FF5500', fontFamily: 'monospace', fontSize: 16, fontWeight: 900 }}>{formatTime(timer.seconds)}</span>
                        <button onClick={(e) => { e.stopPropagation(); toggleComplete(routine); setTimer(null); }}
                          style={{ background: '#10b981', border: 'none', color: '#fff', padding: '4px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>إنهاء</button>
                      </div>
                    ) : !done && (
                      <button onClick={(e) => { e.stopPropagation(); setTimer({ routineId: routine.id, seconds: 0 }); }}
                        style={{ background: 'rgba(255,85,0,0.12)', border: 'none', color: '#FF5500', padding: '6px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>▶️ بدء</button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {activeRoutines.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>
              <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>✨</span>
              <p style={{ fontSize: 16, fontWeight: 700 }}>لا توجد عادات نشطة</p>
            </div>
          )}
        </div>
      )}

      {/* ── LIBRARY TAB ── */}
      {tab === 'library' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 900 }}>📚 مكتبة كل الروتينات</h3>
          </div>
          {routines.map(routine => (
            <div key={routine.id} style={{ 
              background: 'rgba(255,255,255,0.02)', borderRadius: 16, padding: 16, marginBottom: 8, 
              border: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
            }}>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{routine.title}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: '#888', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 6 }}>
                    {routine.time_of_day || 'أي وقت'}
                  </span>
                  <span style={{ fontSize: 10, color: '#888' }}>⏱️ {routine.duration_minutes || 0} د</span>
                  <span style={{ fontSize: 10, color: routine.is_active ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                    {routine.is_active ? '✅ نشط' : '⏸️ متوقف'}
                  </span>
                  {routine.streak > 0 && (
                    <span style={{ fontSize: 10, color: '#FF5500', fontWeight: 700 }}>🔥 {routine.streak}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {routines.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>لا توجد روتينات مسجلة</div>
          )}
        </div>
      )}

      {/* ── GROOMING TAB ── */}
      {tab === 'grooming' && (
        <div>
          <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 900, marginBottom: 16 }}>✨ جدول العناية الشخصية</h3>
          {grooming.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>
              <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>✨</span>
              <p style={{ fontSize: 16, fontWeight: 700 }}>لا توجد عناصر عناية مسجلة</p>
            </div>
          ) : (
            grooming.map(item => {
              const isDue = item.next_due && new Date(item.next_due) <= new Date();
              return (
                <div key={item.id} style={{ 
                  background: isDue ? 'rgba(255,85,0,0.06)' : 'rgba(255,255,255,0.02)', 
                  borderRadius: 16, padding: 16, marginBottom: 8, 
                  border: `1px solid ${isDue ? 'rgba(255,85,0,0.2)' : 'rgba(255,255,255,0.06)'}`, 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{item.title}</span>
                      {isDue && (
                        <span style={{ background: '#FF5500', color: '#fff', padding: '2px 8px', borderRadius: 6, fontSize: 9, fontWeight: 900 }}>
                          ⚠️ مستحق
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, color: '#FF5500', fontWeight: 700 }}>{item.frequency}</span>
                      {item.last_done && <span style={{ fontSize: 10, color: '#888' }}>آخر مرة: {item.last_done}</span>}
                      {item.next_due && <span style={{ fontSize: 10, color: isDue ? '#FF5500' : '#888' }}>التالي: {item.next_due}</span>}
                    </div>
                  </div>
                  <button onClick={() => completeGrooming(item)}
                    style={{ background: 'linear-gradient(135deg, #FF5500, #FF3300)', border: 'none', color: '#fff', padding: '8px 18px', borderRadius: 12, cursor: 'pointer', fontSize: 12, fontWeight: 900, boxShadow: '0 0 10px rgba(255,85,0,0.2)' }}>
                    ✅ تم
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
