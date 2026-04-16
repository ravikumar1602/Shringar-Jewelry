import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productsAPI, categoriesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const INPUT_STYLE = {
  width: '100%', padding: '9px 12px', border: '1.5px solid #E5E7EB',
  borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box',
};
const LABEL_STYLE = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 };
const FIELD = ({ label, children }) => (
  <div style={{ marginBottom: 16 }}><label style={LABEL_STYLE}>{label}</label>{children}</div>
);

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [form, setForm] = useState({
    name: '', description: '', shortDescription: '', price: '', comparePrice: '',
    category: '', sku: '', stock: 0, material: '', purity: '', gemstone: '', weight: '',
    gender: 'unisex', isActive: true, isFeatured: false, tags: '', trackInventory: true,
  });

  useEffect(() => {
    categoriesAPI.getAll().then(r => setCategories(r.data.data.categories));
    if (isEdit) {
      productsAPI.getOne(id).then(r => {
        const p = r.data.data.product;
        setForm({
          name: p.name || '', description: p.description || '', shortDescription: p.shortDescription || '',
          price: p.price || '', comparePrice: p.comparePrice || '', category: p.category?._id || '',
          sku: p.sku || '', stock: p.stock || 0, material: p.material || '', purity: p.purity || '',
          gemstone: p.gemstone || '', weight: p.weight || '', gender: p.gender || 'unisex',
          isActive: p.isActive !== false, isFeatured: !!p.isFeatured, tags: p.tags?.join(', ') || '',
          trackInventory: p.trackInventory !== false,
        });
        setExistingImages(p.images || []);
      });
    }
  }, [id, isEdit]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'tags') fd.append(k, JSON.stringify(v.split(',').map(t => t.trim()).filter(Boolean)));
        else fd.append(k, v);
      });
      images.forEach(img => fd.append('images', img));

      if (isEdit) await productsAPI.update(id, fd);
      else await productsAPI.create(fd);

      toast.success(isEdit ? 'Product updated!' : 'Product created!');
      navigate('/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally { setLoading(false); }
  };

  const handleDeleteExistingImage = async (imageId) => {
    try {
      await productsAPI.deleteImage(id, imageId);
      setExistingImages(prev => prev.filter(img => img._id !== imageId));
      toast.success('Image deleted');
    } catch { toast.error('Failed to delete image'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate('/products')} style={{ background: '#F3F4F6', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13 }}>← Back</button>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1A1A2E' }}>{isEdit ? '✏️ Edit Product' : '➕ Add Product'}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          {/* Left */}
          <div>
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,.06)', marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Basic Information</h3>
              <FIELD label="Product Name *">
                <input value={form.name} onChange={e => set('name', e.target.value)} required style={INPUT_STYLE} placeholder="e.g., 22K Gold Bridal Necklace" />
              </FIELD>
              <FIELD label="Short Description">
                <textarea value={form.shortDescription} onChange={e => set('shortDescription', e.target.value)} rows={2} style={{ ...INPUT_STYLE, resize: 'vertical' }} placeholder="Brief product description..." />
              </FIELD>
              <FIELD label="Full Description *">
                <textarea value={form.description} onChange={e => set('description', e.target.value)} required rows={5} style={{ ...INPUT_STYLE, resize: 'vertical' }} placeholder="Detailed product description..." />
              </FIELD>
              <FIELD label="Tags (comma separated)">
                <input value={form.tags} onChange={e => set('tags', e.target.value)} style={INPUT_STYLE} placeholder="gold, necklace, bridal, wedding" />
              </FIELD>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,.06)', marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Jewelry Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FIELD label="Material">
                  <select value={form.material} onChange={e => set('material', e.target.value)} style={INPUT_STYLE}>
                    <option value="">Select Material</option>
                    {['gold','silver','platinum','rose_gold','stainless_steel','brass','copper','other'].map(m => (
                      <option key={m} value={m}>{m.replace('_', ' ').toUpperCase()}</option>
                    ))}
                  </select>
                </FIELD>
                <FIELD label="Purity"><input value={form.purity} onChange={e => set('purity', e.target.value)} style={INPUT_STYLE} placeholder="e.g., 22K, 925" /></FIELD>
                <FIELD label="Gemstone"><input value={form.gemstone} onChange={e => set('gemstone', e.target.value)} style={INPUT_STYLE} placeholder="e.g., Diamond, Ruby" /></FIELD>
                <FIELD label="Weight (grams)"><input type="number" value={form.weight} onChange={e => set('weight', e.target.value)} style={INPUT_STYLE} placeholder="e.g., 15" /></FIELD>
                <FIELD label="Gender">
                  <select value={form.gender} onChange={e => set('gender', e.target.value)} style={INPUT_STYLE}>
                    {['men','women','unisex','kids'].map(g => <option key={g} value={g}>{g.charAt(0).toUpperCase()+g.slice(1)}</option>)}
                  </select>
                </FIELD>
              </div>
            </div>

            {/* Images */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Product Images (max 8)</h3>
              {existingImages.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {existingImages.map(img => (
                    <div key={img._id} style={{ position: 'relative' }}>
                      <img src={img.url} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: img.isMain ? '2px solid #C8A96E' : '1px solid #E5E7EB' }} />
                      {isEdit && (
                        <button type="button" onClick={() => handleDeleteExistingImage(img._id)} style={{
                          position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%',
                          background: '#DC2626', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 10,
                        }}>✕</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <input type="file" accept="image/*" multiple onChange={e => setImages(Array.from(e.target.files))}
                style={{ ...INPUT_STYLE, padding: '8px' }} />
              {images.length > 0 && <p style={{ fontSize: 12, color: '#6B7280', marginTop: 6 }}>{images.length} new image(s) selected</p>}
            </div>
          </div>

          {/* Right */}
          <div>
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,.06)', marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Pricing & Category</h3>
              <FIELD label="Category *">
                <select value={form.category} onChange={e => set('category', e.target.value)} required style={INPUT_STYLE}>
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </FIELD>
              <FIELD label="Selling Price (₹) *">
                <input type="number" value={form.price} onChange={e => set('price', e.target.value)} required min="0" style={INPUT_STYLE} placeholder="0.00" />
              </FIELD>
              <FIELD label="Compare Price (₹) – MRP">
                <input type="number" value={form.comparePrice} onChange={e => set('comparePrice', e.target.value)} min="0" style={INPUT_STYLE} placeholder="0.00" />
              </FIELD>
              <FIELD label="SKU">
                <input value={form.sku} onChange={e => set('sku', e.target.value.toUpperCase())} style={INPUT_STYLE} placeholder="SHR-NKL-001" />
              </FIELD>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,.06)', marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Inventory</h3>
              <FIELD label="Stock Quantity">
                <input type="number" value={form.stock} onChange={e => set('stock', parseInt(e.target.value))} min="0" style={INPUT_STYLE} />
              </FIELD>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                <input type="checkbox" checked={form.trackInventory} onChange={e => set('trackInventory', e.target.checked)} />
                Track inventory
              </label>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,.06)', marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Visibility</h3>
              {[['isActive','Active (visible to customers)'],['isFeatured','Featured on homepage']].map(([k, lbl]) => (
                <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, marginBottom: 10 }}>
                  <input type="checkbox" checked={form[k]} onChange={e => set(k, e.target.checked)} />
                  {lbl}
                </label>
              ))}
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '13px', background: loading ? '#9CA3AF' : '#C8A96E',
              color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}>{loading ? '⏳ Saving...' : `💾 ${isEdit ? 'Update Product' : 'Create Product'}`}</button>
          </div>
        </div>
      </form>
    </div>
  );
}
