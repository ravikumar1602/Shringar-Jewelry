import React, { useEffect, useState, useCallback } from 'react';
import { ordersAPI } from '../../services/api';
import { formatCurrency, formatDateTime, STATUS_COLORS } from '../../utils/helpers';
import toast from 'react-hot-toast';

const ORDER_STATUSES = ['pending','confirmed','processing','shipped','out_for_delivery','delivered','cancelled'];

function StatusBadge({ status }) {
  const { bg, text } = STATUS_COLORS[status] || { bg: '#F3F4F6', text: '#374151' };
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: bg, color: text, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

export default function OrdersList() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [updateForm, setUpdateForm] = useState({ status: '', trackingNumber: '', courierName: '', adminNotes: '' });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (filterStatus) params.status = filterStatus;
      const res = await ordersAPI.getAll(params);
      setOrders(res.data.data.orders);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to fetch orders'); }
    finally { setLoading(false); }
  }, [page, filterStatus]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const openUpdate = (order) => {
    setSelected(order);
    setUpdateForm({ status: order.status, trackingNumber: order.trackingNumber || '', courierName: order.courierName || '', adminNotes: order.adminNotes || '' });
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      await ordersAPI.update(selected._id, updateForm);
      toast.success('Order updated!');
      setSelected(null);
      fetchOrders();
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
    finally { setUpdating(false); }
  };

  return (
    <div>
      <h1 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 700, color: '#1A1A2E' }}>📦 Orders</h1>

      {/* Filter bar */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '14px 20px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,.06)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {['', ...ORDER_STATUSES].map(s => (
          <button key={s} onClick={() => { setFilterStatus(s); setPage(1); }} style={{
            padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            background: filterStatus === s ? '#1A1A2E' : '#F3F4F6',
            color: filterStatus === s ? '#fff' : '#374151',
          }}>{s ? s.replace(/_/g, ' ') : 'All'}</button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.06)', overflow: 'hidden' }}>
        {loading ? <div style={{ textAlign: 'center', padding: 60, color: '#6B7280' }}>⏳ Loading...</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ background: '#F9FAFB' }}>
              <tr>{['Order #','Customer','Items','Amount','Payment','Status','Date','Actions'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: '#6B7280', fontWeight: 600, fontSize: 12, borderBottom: '1px solid #E5E7EB' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o._id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#C8A96E' }}>{o.orderNumber}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 500 }}>{o.user?.name || 'N/A'}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>{o.user?.email}</div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6B7280' }}>{o.items?.length} item(s)</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700 }}>{formatCurrency(o.totalAmount)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                      background: o.paymentStatus === 'paid' ? '#D1FAE5' : o.paymentMethod === 'cod' ? '#FEF3C7' : '#FEE2E2',
                      color: o.paymentStatus === 'paid' ? '#065F46' : o.paymentMethod === 'cod' ? '#92400E' : '#991B1B',
                    }}>
                      {o.paymentMethod === 'cod' ? '💵 COD' : `💳 ${o.paymentStatus}`}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}><StatusBadge status={o.status} /></td>
                  <td style={{ padding: '12px 16px', color: '#6B7280', fontSize: 12 }}>{formatDateTime(o.createdAt)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => openUpdate(o)} style={{ padding: '6px 12px', background: '#EFF6FF', color: '#2563EB', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                      Update
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 48, color: '#9CA3AF' }}>No orders found</td></tr>}
            </tbody>
          </table>
        )}

        {pagination.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 16, borderTop: '1px solid #F3F4F6' }}>
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} style={{ padding: '7px 14px', border: '1px solid #E5E7EB', borderRadius: 6, cursor: page===1?'not-allowed':'pointer', background: '#fff', fontSize: 13 }}>← Prev</button>
            <span style={{ fontSize: 13, color: '#6B7280', display: 'flex', alignItems: 'center' }}>Page {page} of {pagination.pages}</span>
            <button onClick={() => setPage(p => Math.min(pagination.pages, p+1))} disabled={page===pagination.pages} style={{ padding: '7px 14px', border: '1px solid #E5E7EB', borderRadius: 6, cursor: page===pagination.pages?'not-allowed':'pointer', background: '#fff', fontSize: 13 }}>Next →</button>
          </div>
        )}
      </div>

      {/* Update Order Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 480, maxHeight: '85vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 20px', color: '#1A1A2E' }}>Update Order #{selected.orderNumber}</h3>

            {/* Order summary */}
            <div style={{ background: '#F9FAFB', borderRadius: 8, padding: 14, marginBottom: 20, fontSize: 13 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Items:</div>
              {selected.items?.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>{item.name} × {item.quantity}</span>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid #E5E7EB', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>Total</span><span>{formatCurrency(selected.totalAmount)}</span>
              </div>
              <div style={{ marginTop: 8, color: '#6B7280' }}>
                📍 {selected.shippingAddress?.city}, {selected.shippingAddress?.state} - {selected.shippingAddress?.pincode}
              </div>
            </div>

            {[
              { label: 'Order Status', key: 'status', type: 'select', options: ORDER_STATUSES },
              { label: 'Courier Name', key: 'courierName', type: 'text', placeholder: 'e.g., BlueDart, DTDC' },
              { label: 'Tracking Number', key: 'trackingNumber', type: 'text', placeholder: 'AWB number' },
              { label: 'Admin Notes', key: 'adminNotes', type: 'textarea', placeholder: 'Internal notes...' },
            ].map(({ label, key, type, options, placeholder }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{label}</label>
                {type === 'select' ? (
                  <select value={updateForm[key]} onChange={e => setUpdateForm(f => ({ ...f, [key]: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none' }}>
                    {options.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
                  </select>
                ) : type === 'textarea' ? (
                  <textarea value={updateForm[key]} onChange={e => setUpdateForm(f => ({ ...f, [key]: e.target.value }))} rows={3} placeholder={placeholder} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
                ) : (
                  <input value={updateForm[key]} onChange={e => setUpdateForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                )}
              </div>
            ))}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setSelected(null)} style={{ flex: 1, padding: '10px', border: '1.5px solid #E5E7EB', borderRadius: 8, cursor: 'pointer', background: '#fff', fontWeight: 600 }}>Cancel</button>
              <button onClick={handleUpdate} disabled={updating} style={{ flex: 2, padding: '10px', background: updating ? '#9CA3AF' : '#C8A96E', color: '#fff', border: 'none', borderRadius: 8, cursor: updating ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
                {updating ? '⏳ Updating...' : '✅ Update Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
