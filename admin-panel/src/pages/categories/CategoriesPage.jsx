import React, { useEffect, useState } from 'react';
import { categoriesAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | category_object
  const [form, setForm] = useState({ name: '', description: '', isActive: true });
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try { const r = await categoriesAPI.getAll(); setCategories(r.data.data.categories); }
    catch { toast.error('Failed to fetch categories'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const openAdd = () => { setForm({ name: '', description: '', isActive: true }); setImage(null); setModal('add'); };
  const openEdit = (cat) => { setForm({ name: cat.name, description: cat.description || '', isActive: cat.isActive }); setImage(null); setModal(cat); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (image) fd.append('image', image);
      if (modal === 'add') await categoriesAPI.create(fd);
      else await categoriesAPI.update(modal._id, fd);
      toast.success(modal === 'add' ? 'Category created!' : 'Category updated!');
      setModal(null);
      fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try { await categoriesAPI.delete(id); toast.success('Deleted'); fetch(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1A1A2E' }}>🏷️ Categories</h1>
        <button onClick={openAdd} style={{ background: '#C8A96E', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>+ Add Category</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
        {loading ? <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: '#6B7280' }}>⏳ Loading...</div> :
          categories.map(cat => (
            <div key={cat._id} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
              <div style={{ height: 120, background: cat.image?.url ? `url(${cat.image.url}) center/cover` : 'linear-gradient(135deg,#1A1A2E,#C8A96E)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {!cat.image?.url && <span style={{ fontSize: 36 }}>🏷️</span>}
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1A1A2E' }}>{cat.name}</div>
                {cat.description && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{cat.description}</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: cat.isActive ? '#D1FAE5' : '#F3F4F6', color: cat.isActive ? '#065F46' : '#374151' }}>
                    {cat.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openEdit(cat)} style={{ padding: '5px 10px', background: '#EFF6FF', color: '#2563EB', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>✏️</button>
                    <button onClick={() => handleDelete(cat._id)} style={{ padding: '5px 10px', background: '#FEF2F2', color: '#DC2626', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>🗑️</button>
                  </div>
                </div>
              </div>
            </div>
          ))
        }
      </div>

      {/* Modal */}
      {modal !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 420 }}>
            <h3 style={{ margin: '0 0 20px' }}>{modal === 'add' ? '➕ Add Category' : '✏️ Edit Category'}</h3>
            <form onSubmit={handleSave}>
              {[['name','Category Name *','text',true],['description','Description','text',false]].map(([k,lbl,type,req]) => (
                <div key={k} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{lbl}</label>
                  <input value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} required={req} type={type}
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Category Image</label>
                <input type="file" accept="image/*" onChange={e => setImage(e.target.files[0])} style={{ width: '100%', padding: 8, border: '1.5px solid #E5E7EB', borderRadius: 8 }} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                Active
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setModal(null)} style={{ flex: 1, padding: '10px', border: '1.5px solid #E5E7EB', borderRadius: 8, cursor: 'pointer', background: '#fff', fontWeight: 600 }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ flex: 2, padding: '10px', background: saving ? '#9CA3AF' : '#C8A96E', color: '#fff', border: 'none', borderRadius: 8, cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
                  {saving ? '⏳ Saving...' : '💾 Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
