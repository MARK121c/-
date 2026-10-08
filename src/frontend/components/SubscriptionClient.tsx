'use client';
import { useState, useEffect } from 'react';

interface Subscription {
  id: number;
  name: string;
  cost: number;
  currency: string;
  billing_cycle: string;
  category: string;
  next_renewal: string;
  status: string;
  notes: string;
}

export default function SubscriptionClient() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [form, setForm] = useState({ name: '', cost: '', currency: 'USD', billing_cycle: 'monthly', category: '', next_renewal: '', status: 'active', notes: '' });

  useEffect(() => { fetchSubs(); }, []);

  async function fetchSubs() {
    try {
      const res = await fetch('/api/subscriptions');
      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
    } catch(e) { console.error(e); }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, cost: parseFloat(form.cost) })
      });
      setShowForm(false);
      setForm({ name: '', cost: '', currency: 'USD', billing_cycle: 'monthly', category: '', next_renewal: '', status: 'active', notes: '' });
      fetchSubs();
    } catch(e) { console.error(e); }
  }

  async function deleteSub(id: number) {
    if (!confirm('حذف الاشتراك؟')) return;
    await fetch(`/api/subscriptions/${id}`, { method: 'DELETE' });
    fetchSubs();
  }

  // Computed values
  const activeSubs = subscriptions.filter(s => s.status === 'active');
  const categories = [...new Set(subscriptions.map(s => s.category).filter(Boolean))];
  
  const totalMonthly = activeSubs.reduce((sum, s) => {
    if (s.billing_cycle === 'monthly') return sum + s.cost;
    if (s.billing_cycle === 'yearly') return sum + (s.cost / 12);
    if (s.billing_cycle === 'weekly') return sum + (s.cost * 4.33);
    return sum + s.cost;
  }, 0);

  const totalAnnual = totalMonthly * 12;

  const getDaysUntilRenewal = (date: string) => {
    if (!date) return 999;
    return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const expiringSoon = activeSubs.filter(s => {
    const days = getDaysUntilRenewal(s.next_renewal);
    return days >= 0 && days <= 7;
  }).length;

  const getRenewalStyle = (date: string) => {
    const days = getDaysUntilRenewal(date);
    if (days <= 3) return { border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.06)', shadow: '0 0 15px rgba(239,68,68,0.15)', color: '#EF4444', label: `⚠️ ${days} يوم`, urgent: true };
    if (days <= 7) return { border: '1px solid rgba(255,85,0,0.3)', background: 'rgba(255,85,0,0.06)', shadow: '0 0 10px rgba(255,85,0,0.1)', color: '#FF5500', label: `⏰ ${days} أيام`, urgent: true };
    return { border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', shadow: 'none', color: '#10B981', label: `${days} يوم`, urgent: false };
  };

  const filtered = filterCategory === 'all' 
    ? subscriptions 
    : subscriptions.filter(s => s.category === filterCategory);

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
          <h2 style={{ margin: 0, fontSize: 24, color: '#fff', fontWeight: 900 }}>💳 الاشتراكات والخدمات</h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#888' }}>تتبع اشتراكاتك وتنبيهات التجديد</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ background: 'linear-gradient(135deg, #FF5500, #FF3300)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 16, cursor: 'pointer', fontSize: 14, fontWeight: 900, boxShadow: '0 0 20px rgba(255,85,0,0.3)' }}>
          + اشتراك جديد
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <div style={{ background: 'rgba(255,85,0,0.08)', borderRadius: 16, padding: 16, textAlign: 'center', border: '1px solid rgba(255,85,0,0.2)' }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#FF5500', fontFamily: 'monospace' }}>{activeSubs.length}</div>
          <div style={{ fontSize: 11, color: '#aaa', fontWeight: 700 }}>اشتراك نشط</div>
        </div>
        <div style={{ background: 'rgba(245,158,11,0.08)', borderRadius: 16, padding: 16, textAlign: 'center', border: '1px solid rgba(245,158,11,0.2)' }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#f59e0b', fontFamily: 'monospace' }}>${totalMonthly.toFixed(0)}</div>
          <div style={{ fontSize: 11, color: '#aaa', fontWeight: 700 }}>شهرياً</div>
        </div>
        <div style={{ background: 'rgba(239,68,68,0.08)', borderRadius: 16, padding: 16, textAlign: 'center', border: '1px solid rgba(239,68,68,0.2)' }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#ef4444', fontFamily: 'monospace' }}>${totalAnnual.toFixed(0)}</div>
          <div style={{ fontSize: 11, color: '#aaa', fontWeight: 700 }}>سنوياً</div>
        </div>
        <div style={{ background: expiringSoon > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', borderRadius: 16, padding: 16, textAlign: 'center', border: `1px solid ${expiringSoon > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}` }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: expiringSoon > 0 ? '#ef4444' : '#10b981', fontFamily: 'monospace' }}>{expiringSoon}</div>
          <div style={{ fontSize: 11, color: '#aaa', fontWeight: 700 }}>تجديد قريب</div>
        </div>
      </div>

      {/* Category Filters */}
      {categories.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          <button onClick={() => setFilterCategory('all')}
            style={{ padding: '6px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 900,
              background: filterCategory === 'all' ? '#FF5500' : 'rgba(255,255,255,0.04)', color: filterCategory === 'all' ? '#fff' : '#888' }}>
            الكل
          </button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilterCategory(cat)}
              style={{ padding: '6px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 900,
                background: filterCategory === cat ? '#FF5500' : 'rgba(255,255,255,0.04)', color: filterCategory === cat ? '#fff' : '#888' }}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 24, marginBottom: 24, border: '1px solid rgba(255,85,0,0.15)' }}>
          <h3 style={{ margin: '0 0 16px', color: '#FF5500', fontSize: 16, fontWeight: 900 }}>+ اشتراك جديد</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <input placeholder="اسم الاشتراك *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 14, fontWeight: 700 }} />
              <input placeholder="التكلفة *" type="number" step="0.01" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} required
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 14 }} />
              <select value={form.billing_cycle} onChange={e => setForm({...form, billing_cycle: e.target.value})}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 14 }}>
                <option value="monthly">شهري</option>
                <option value="yearly">سنوي</option>
                <option value="weekly">أسبوعي</option>
              </select>
              <input placeholder="التصنيف" value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 14 }} />
              <input type="date" value={form.next_renewal} onChange={e => setForm({...form, next_renewal: e.target.value})}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 14 }} />
              <select value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 14 }}>
                <option value="USD">USD</option>
                <option value="EGP">EGP</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" style={{ background: 'linear-gradient(135deg, #FF5500, #FF3300)', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 12, cursor: 'pointer', fontWeight: 900, boxShadow: '0 0 15px rgba(255,85,0,0.3)' }}>إضافة</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 12, cursor: 'pointer', fontWeight: 700 }}>إلغاء</button>
            </div>
          </form>
        </div>
      )}

      {/* Subscription Cards */}
      {filtered.map(sub => {
        const renewal = getRenewalStyle(sub.next_renewal);
        const monthlyEquiv = sub.billing_cycle === 'yearly' ? (sub.cost / 12) : sub.billing_cycle === 'weekly' ? (sub.cost * 4.33) : sub.cost;
        const annualEquiv = monthlyEquiv * 12;
        
        return (
          <div key={sub.id} style={{
            background: renewal.background,
            borderRadius: 20, padding: '18px 20px', marginBottom: 12,
            border: renewal.border,
            boxShadow: renewal.shadow,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            transition: 'all 0.3s',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                {/* Icon circle */}
                <div style={{ 
                  width: 36, height: 36, borderRadius: 12, 
                  background: 'rgba(255,85,0,0.15)', border: '1px solid rgba(255,85,0,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 
                }}>
                  💳
                </div>
                <div>
                  <span style={{ color: '#fff', fontWeight: 900, fontSize: 15 }}>{sub.name}</span>
                  <div style={{ display: 'flex', gap: 6, marginTop: 2, alignItems: 'center' }}>
                    {/* Status badge */}
                    <span style={{ 
                      background: sub.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', 
                      color: sub.status === 'active' ? '#10b981' : '#ef4444', 
                      padding: '1px 8px', borderRadius: 6, fontSize: 9, fontWeight: 900 
                    }}>
                      {sub.status === 'active' ? '● نشط' : '⏸ متوقف'}
                    </span>
                    {renewal.urgent && (
                      <span style={{ background: `${renewal.color}22`, color: renewal.color, padding: '1px 8px', borderRadius: 6, fontSize: 9, fontWeight: 900 }}>
                        {renewal.label}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Details row */}
              <div style={{ display: 'flex', gap: 14, marginTop: 4, paddingRight: 46 }}>
                {sub.category && <span style={{ fontSize: 11, color: '#888' }}>📂 {sub.category}</span>}
                <span style={{ fontSize: 11, color: '#888' }}>🔄 {sub.billing_cycle === 'monthly' ? 'شهري' : sub.billing_cycle === 'yearly' ? 'سنوي' : 'أسبوعي'}</span>
                {sub.next_renewal && (
                  <span style={{ fontSize: 11, color: renewal.color }}>📅 {sub.next_renewal}</span>
                )}
              </div>
            </div>

            {/* Cost display */}
            <div style={{ textAlign: 'left', marginLeft: 12 }}>
              <div style={{ color: '#fff', fontWeight: 900, fontSize: 20, fontFamily: 'monospace' }}>
                ${sub.cost}
                <span style={{ fontSize: 11, color: '#888', fontWeight: 400 }}>/{sub.billing_cycle === 'monthly' ? 'شهر' : sub.billing_cycle === 'yearly' ? 'سنة' : 'أسبوع'}</span>
              </div>
              {sub.billing_cycle !== 'monthly' && (
                <div style={{ fontSize: 10, color: '#888', fontFamily: 'monospace' }}>
                  ≈ ${monthlyEquiv.toFixed(0)}/شهر
                </div>
              )}
            </div>

            <button onClick={() => deleteSub(sub.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 16, padding: 8, marginRight: 4 }}>🗑️</button>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>
          <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>💳</span>
          <p style={{ fontSize: 16, fontWeight: 700 }}>لا توجد اشتراكات مسجلة</p>
        </div>
      )}
    </div>
  );
}
