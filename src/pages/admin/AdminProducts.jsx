import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Search, AlertTriangle, Save } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { KES, stockStatus, slugify } from '@/lib/format';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkStocks, setBulkStocks] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([
        base44.entities.Product.list('-created_date', 200),
        base44.entities.Category.list('sort_order', 50)
      ]);
      setProducts(p); setCategories(c);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const blankProduct = () => ({
    name: '', slug: '', category_id: categories[0]?.id || '', category_name: categories[0]?.name || '',
    price: 0, description: '', images: [], sizes: [], stock: 0, featured: false, best_seller: false
  });

  const openNew = () => { setEditing(blankProduct()); setShowForm(true); };
  const openEdit = (p) => { setEditing({ ...p }); setShowForm(true); };

  const save = async () => {
    if (!editing.name) return;
    const payload = {
      ...editing,
      slug: editing.slug || slugify(editing.name),
      category_name: categories.find(c => c.id === editing.category_id)?.name || editing.category_name,
      price: Number(editing.price),
      stock: Number(editing.stock),
      images: editing.images.filter(Boolean),
      sizes: editing.sizes.filter(Boolean)
    };
    if (editing.id) {
      await base44.entities.Product.update(editing.id, payload);
    } else {
      await base44.entities.Product.create(payload);
    }
    setShowForm(false); setEditing(null); load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this product?')) return;
    await base44.entities.Product.delete(id);
    load();
  };

  const saveBulk = async () => {
    const updates = Object.entries(bulkStocks)
      .filter(([id, stock]) => stock !== '' && stock !== undefined)
      .map(([id, stock]) => ({ id, stock: Number(stock) }));
    if (updates.length === 0) return;
    await base44.entities.Product.bulkUpdate(updates);
    setBulkMode(false); setBulkStocks({}); load();
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-accent mb-2">Manage</p>
          <h1 className="font-heading text-3xl font-bold text-primary">Products</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setBulkMode(!bulkMode)} className="btn-outline text-xs">{bulkMode ? 'Cancel Bulk' : 'Bulk Stock'}</button>
          <button onClick={openNew} className="btn-primary text-xs inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Add Product</button>
        </div>
      </div>

      <div className="mb-5 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input className="input-field pl-10" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {bulkMode && (
        <div className="bg-accent/10 p-4 mb-5 flex items-center justify-between">
          <p className="text-sm text-foreground">Enter new stock values, then save.</p>
          <button onClick={saveBulk} className="btn-primary text-xs inline-flex items-center gap-2"><Save className="w-4 h-4" /> Save Stock</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-muted animate-pulse" />)}</div>
      ) : (
        <div className="bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="stitched-b">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="p-4">Product</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const status = stockStatus(p.stock);
                return (
                  <tr key={p.id} className="stitched-b hover:bg-secondary/30">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-secondary overflow-hidden shrink-0">{p.images?.[0] && <img src={p.images[0]} alt="" className="w-full h-full object-cover" />}</div>
                        <span className="font-medium text-foreground">{p.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">{p.category_name}</td>
                    <td className="p-4 font-medium">{KES(p.price)}</td>
                    <td className="p-4">
                      {bulkMode ? (
                        <input type="number" value={bulkStocks[p.id] ?? ''} onChange={e => setBulkStocks({ ...bulkStocks, [p.id]: e.target.value })} placeholder={String(p.stock)} className="w-20 border border-input px-2 py-1 text-sm" />
                      ) : (
                        <span className={p.stock <= 5 ? 'text-accent font-medium' : ''}>{p.stock}</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                        <span className="text-xs">{status.label}</span>
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(p)} className="p-2 hover:bg-secondary"><Pencil className="w-4 h-4 text-primary" /></button>
                        <button onClick={() => remove(p.id)} className="p-2 hover:bg-secondary"><Trash2 className="w-4 h-4 text-destructive" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Product form modal */}
      {showForm && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 animate-fade-in">
            <div className="flex items-center justify-between mb-6 stitched-b pb-4">
              <h2 className="font-heading text-xl font-bold text-primary">{editing.id ? 'Edit Product' : 'New Product'}</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-primary" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label-field">Name *</label>
                <input className="input-field" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-field">Category *</label>
                  <select className="input-field" value={editing.category_id} onChange={e => setEditing({ ...editing, category_id: e.target.value })}>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-field">Price (KES) *</label>
                  <input type="number" className="input-field" value={editing.price} onChange={e => setEditing({ ...editing, price: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label-field">Description</label>
                <textarea className="input-field min-h-[80px]" value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div>
                <label className="label-field">Image URLs (one per line)</label>
                <textarea className="input-field min-h-[60px]" value={editing.images.join('\n')} onChange={e => setEditing({ ...editing, images: e.target.value.split('\n') })} placeholder="https://..." />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-field">Sizes (comma separated)</label>
                  <input className="input-field" value={editing.sizes.join(', ')} onChange={e => setEditing({ ...editing, sizes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="S, M, L, XL" />
                </div>
                <div>
                  <label className="label-field">Stock Quantity</label>
                  <input type="number" className="input-field" value={editing.stock} onChange={e => setEditing({ ...editing, stock: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={editing.featured} onChange={e => setEditing({ ...editing, featured: e.target.checked })} className="accent-accent" /> Featured
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={editing.best_seller} onChange={e => setEditing({ ...editing, best_seller: e.target.checked })} className="accent-accent" /> Best Seller
                </label>
              </div>
              {Number(editing.stock) <= 5 && Number(editing.stock) > 0 && (
                <p className="flex items-center gap-2 text-xs text-accent"><AlertTriangle className="w-3.5 h-3.5" /> This product will be flagged as low stock.</p>
              )}
            </div>
            <div className="flex gap-3 mt-6 stitched-t pt-5">
              <button onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
              <button onClick={save} className="btn-primary flex-1">Save Product</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}