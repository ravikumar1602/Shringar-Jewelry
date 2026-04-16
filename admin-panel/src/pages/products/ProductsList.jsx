import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI } from '../../services/api';
import { formatCurrency, formatDate, truncate } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function ProductsList() {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productsAPI.getAll({ page, limit: 15, search });
      setProducts(res.data.data.products);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to fetch products'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async (id) => {
    try {
      await productsAPI.delete(id);
      toast.success('Product deleted');
      setDeleteId(null);
      fetchProducts();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const handleToggleStock = async (id, newStock) => {
    try {
      await productsAPI.updateInventory(id, { stock: newStock });
      toast.success('Stock updated');
      fetchProducts();
    } catch { toast.error('Stock update failed'); }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1A1A2E' }}>💍 Products</h1>
        <button onClick={() => navigate('/products/add')} style={{
          background: '#C8A96E', color: '#fff', border: 'none', borderRadius: 8,
          padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>+ Add Product</button>
      </div>

      {/* Search + filters */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,.06)', display: 'flex', gap: 12 }}>
        <input
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="🔍 Search products..."
          style={{ flex: 1, padding: '9px 14px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none' }}
        />
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.06)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, fontSize: 16, color: '#6B7280' }}>⏳ Loading products...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ background: '#F9FAFB' }}>
              <tr>
                {['Product','Category','Price','Stock','Status','Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: '#6B7280', fontWeight: 600, fontSize: 12, borderBottom: '1px solid #E5E7EB' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} style={{ borderBottom: '1px solid #F3F4F6', transition: 'background .1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {p.images?.[0]?.url ? (
                        <img src={p.images[0].url} alt={p.name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 44, height: 44, borderRadius: 8, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>💍</div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, color: '#1A1A2E' }}>{truncate(p.name, 30)}</div>
                        {p.sku && <div style={{ fontSize: 11, color: '#9CA3AF' }}>SKU: {p.sku}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6B7280' }}>{p.category?.name || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600 }}>{formatCurrency(p.price)}</div>
                    {p.comparePrice > p.price && (
                      <div style={{ fontSize: 11, color: '#9CA3AF', textDecoration: 'line-through' }}>{formatCurrency(p.comparePrice)}</div>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: p.stock === 0 ? '#FEE2E2' : p.stock <= 5 ? '#FEF3C7' : '#D1FAE5',
                      color: p.stock === 0 ? '#991B1B' : p.stock <= 5 ? '#92400E' : '#065F46',
                    }}>{p.stock === 0 ? 'Out of Stock' : p.stock <= 5 ? `Low (${p.stock})` : p.stock}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: p.isActive ? '#D1FAE5' : '#F3F4F6',
                      color: p.isActive ? '#065F46' : '#374151',
                    }}>{p.isActive ? '● Active' : '○ Inactive'}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => navigate(`/products/edit/${p._id}`)} style={{
                        padding: '6px 12px', background: '#EFF6FF', color: '#2563EB',
                        border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 500,
                      }}>✏️ Edit</button>
                      <button onClick={() => setDeleteId(p._id)} style={{
                        padding: '6px 12px', background: '#FEF2F2', color: '#DC2626',
                        border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 500,
                      }}>🗑️ Del</button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: '#9CA3AF' }}>No products found</td></tr>
              )}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 16, borderTop: '1px solid #F3F4F6' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '7px 14px', border: '1px solid #E5E7EB', borderRadius: 6, cursor: page === 1 ? 'not-allowed' : 'pointer', background: '#fff', fontSize: 13 }}>← Prev</button>
            <span style={{ fontSize: 13, color: '#6B7280' }}>Page {page} of {pagination.pages} ({pagination.total} total)</span>
            <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
              style={{ padding: '7px 14px', border: '1px solid #E5E7EB', borderRadius: 6, cursor: page === pagination.pages ? 'not-allowed' : 'pointer', background: '#fff', fontSize: 13 }}>Next →</button>
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, width: 380, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ margin: '0 0 8px', color: '#1A1A2E' }}>Delete Product?</h3>
            <p style={{ color: '#6B7280', marginBottom: 24, fontSize: 14 }}>This will permanently delete the product and all its images. This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: '10px', border: '1.5px solid #E5E7EB', borderRadius: 8, cursor: 'pointer', background: '#fff', fontWeight: 600 }}>Cancel</button>
              <button onClick={() => handleDelete(deleteId)} style={{ flex: 1, padding: '10px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
