import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, ArrowUp, ArrowDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { slugify } from '@/lib/format';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const c = await base44.entities.Category.list('sort_order', 50);
      setCategories(c);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing.name) return;
    const payload = { ...editing, slug: editing.slug || slugify(editing.name), sort_order: Number(editing.sort_order) || 0 };
    if (editing.id) await base44.entities.Category.update(editing.id, payload);
    else await base44.entities.Category.create(payload);
    setShowForm(false); setEditing(null); load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this category?')) return;
    await base44.entities.Category.delete(id);
    load();
  };

  const reorder = async (id, dir) => {
    const idx = categories.findIndex(c => c.id === id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= categories.length) return;
    const a = categories[idx], b = categories[swapIdx];
    await base44.entities.Category.bulkUpdate([
      { id: a.id, sort_order: b.sort_order },
      { id: b.id, sort_order: a.sort_order }
    ]);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-accent mb-2">Manage</p>
          <h1 className="font-heading text-3xl font-bold text-primary">Categories</h1>
        </div>
        <button onClick={() => { setEditing({ name: '', slug: '', description: '', image_url: '', sort_order: categories.length }); setShowForm(true); }} className="btn-primary text-xs inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Add Category</button>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-muted animate-pulse" />)}</div>
      ) : (
        <div className="bg-card">
          {categories.map((c, i) => (
            <div key={c.id} className="flex items-center gap-4 p-4 stitched-b last:border-0">
              <div className="flex flex-col">
                <button onClick={() => reorder(c.id, 'up')} disabled={i === 0} className="text-muted-foreground hover:text-accent disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
                <button onClick={() => reorder(c.id, 'down')} disabled={i === categories.length - 1} className="text-muted-foreground hover:text-accent disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
              </div>
              <div className="w-12 h-12 bg-secondary overflow-hidden shrink-0">{c.image_url && <img src={c.image_url} alt="" className="w-full h-full object-cover" />}</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground">/{c.slug}</p>
              </div>
              {c.description && <p className="text-xs text-muted-foreground hidden md:block max-w-xs truncate">{c.description}</p>}
              <div className="flex gap-2">
                <button onClick={() => { setEditing({ ...c }); setShowForm(true); }} className="p-2 hover:bg-secondary"><Pencil className="w-4 h-4 text-primary" /></button>
                <button onClick={() => remove(c.id)} className="p-2 hover:bg-secondary"><Trash2 className="w-4 h-4 text-destructive" /></button>
              </div>
            </div>
          ))}
          {categories.length === 0 && <p className="p-8 text-center text-muted-foreground">No categories yet.</p>}
        </div>
      )}

      {showForm && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-card w-full max-w-md p-6 md:p-8 animate-fade-in">
            <div className="flex items-center justify-between mb-6 stitched-b pb-4">
              <h2 className="font-heading text-xl font-bold text-primary">{editing.id ? 'Edit Category' : 'New Category'}</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-primary" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label-field">Name *</label>
                <input className="input-field" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Sportswear" />
              </div>
              <div>
                <label className="label-field">Slug (auto-generated)</label>
                <input className="input-field" value={editing.slug} onChange={e => setEditing({ ...editing, slug: e.target.value })} placeholder={slugify(editing.name)} />
              </div>
              <div>
                <label className="label-field">Description</label>
                <textarea className="input-field min-h-[60px]" value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div>
                <label className="label-field">Image URL</label>
                <input className="input-field" value={editing.image_url} onChange={e => setEditing({ ...editing, image_url: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <label className="label-field">Sort Order</label>
                <input type="number" className="input-field" value={editing.sort_order} onChange={e => setEditing({ ...editing, sort_order: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3 mt-6 stitched-t pt-5">
              <button onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
              <button onClick={save} className="btn-primary flex-1">Save Category</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}