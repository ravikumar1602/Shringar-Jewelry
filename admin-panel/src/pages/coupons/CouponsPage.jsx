import React, { useEffect, useState } from 'react';
import { couponsAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const EMPTY = { code: '', type: 'percentage', value: '', minOrderAmount: 0, maxDiscountAmount: '', usageLimit: '', userUsageLimit: 1, endDate: '', description: '', isActive: true };

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try { const r = await couponsAPI.getAll(); setCoupons(r.data.data.coupons); }
    catch { toast.error('Failed to fetch coupons'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const openAdd = () => { setForm(EMPTY); setModal('add'); };
  const openEdit = (c) => { setForm({ ...c, endDate: c.endDate?.split('T')[0] || '' }); setModal(c); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'add') await couponsAPI.create(form);
      else await couponsAPI.update(modal._id, form);
      toast.success(modal === 'add' ? 'Coupon created!' : 'Coupon updated!');
      setModal(null);
      fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try { await couponsAPI.delete(id); toast.success('Deleted'); fetch(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1A1A2E' }}>🎟️ Coupons</h1>
        <button onClick={openAdd} style={{ background: '#C8A96E', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>+ Add Coupon</button>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.06)', overflow: 'hidden' }}>
        {loading ? <div style={{ textAlign: 'center', padding: 60, color: '#6B7280' }}>⏳ Loading...</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ background: '#F9FAFB' }}>
              <tr>{['Code','Type','Value','Min Order','Usage','Expiry','Status','Actions'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: '#6B7280', fontWeight: 600, fontSize: 12, borderBottom: '1px solid #E5E7EB' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c._id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '12px 16px' }}><span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#C8A96E', fontSize: 14 }}>{c.code}</span></td>
                  <td style={{ padding: '12px 16px', textTransform: 'capitalize' }}>{c.type}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{c.type === 'percentage' ? `${c.value}%` : formatCurrency(c.value)}</td>
                  <td style={{ padding: '12px 16px' }}>{formatCurrency(c.minOrderAmount || 0)}</td>
                  <td style={{ padding: '12px 16px' }}>{c.usedCount}/{c.usageLimit || '∞'}</td>
                  <td style={{ padding: '12px 16px', color: new Date(c.endDate) < new Date() ? '#DC2626' : '#6B7280' }}>{formatDate(c.endDate)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: c.isActive ? '#D1FAE5' : '#F3F4F6', color: c.isActive ? '#065F46' : '#374151' }}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(c)} style={{ padding: '5px 10px', background: '#EFF6FF', color: '#2563EB', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>✏️</button>
                      <button onClick={() => handleDelete(c._id)} style={{ padding: '5px 10px', background: '#FEF2F2', color: '#DC2626', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 48, color: '#9CA3AF' }}>No coupons yet</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {modal !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 460, maxHeight: '85vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 20px' }}>{modal === 'add' ? '➕ New Coupon' : '✏️ Edit Coupon'}</h3>
            <form onSubmit={handleSave}>
              {[
                { label: 'Coupon Code *', key: 'code', type: 'text', placeholder: 'SAVE20', req: true, transform: v => v.toUpperCase() },
                { label: 'Description', key: 'description', type: 'text', placeholder: '20% off on all orders' },
                { label: 'Discount Value *', key: 'value', type: 'number', req: true },
                { label: 'Minimum Order Amount (₹)', key: 'minOrderAmount', type: 'number' },
                { label: 'Maximum Discount Amount (₹)', key: 'maxDiscountAmount', type: 'number', placeholder: 'Leave blank for no cap' },
                { label: 'Total Usage Limit', key: 'usageLimit', type: 'number', placeholder: 'Leave blank for unlimited' },
                { label: 'Per User Usage Limit', key: 'userUsageLimit', type: 'number' },
                { label: 'Expiry Date *', key: 'endDate', type: 'date', req: true },
              ].map(({ label, key, type, req, placeholder, transform }) => (
                <div key={key} style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{label}</label>
                  <input type={type} value={form[key]} required={req} placeholder={placeholder}
                    onChange={e => set(key, transform ? transform(e.target.value) : e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Discount Type *</label>
                <select value={form.type} onChange={e => set('type', e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none' }}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, cursor: 'pointer', fontSize: 14 }}>
                <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} />
                Active
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setModal(null)} style={{ flex: 1, padding: '10px', border: '1.5px solid #E5E7EB', borderRadius: 8, cursor: 'pointer', background: '#fff', fontWeight: 600 }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ flex: 2, padding: '10px', background: saving ? '#9CA3AF' : '#C8A96E', color: '#fff', border: 'none', borderRadius: 8, cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
                  {saving ? '⏳ Saving...' : '💾 Save Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
