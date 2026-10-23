import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ProductCard from '@/components/ProductCard';

export default function Catalog() {
  const { categorySlug } = useParams();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('featured');
  const [sizeFilter, setSizeFilter] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [prods, cats] = await Promise.all([
          base44.entities.Product.list('-created_date', 100),
          base44.entities.Category.list('sort_order', 30)
        ]);
        setProducts(prods);
        setCategories(cats);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const activeCategory = useMemo(
    () => categories.find(c => c.slug === categorySlug),
    [categories, categorySlug]
  );

  const filtered = useMemo(() => {
    let result = [...products];
    if (activeCategory) result = result.filter(p => p.category_id === activeCategory.id || p.category_name?.toLowerCase() === activeCategory.name.toLowerCase());
    else if (categorySlug) result = result.filter(p => p.category_name?.toLowerCase() === categorySlug || p.slug?.includes(categorySlug));
    if (sizeFilter) result = result.filter(p => p.sizes?.includes(sizeFilter));
    if (inStockOnly) result = result.filter(p => p.stock > 0);
    if (maxPrice) result = result.filter(p => p.price <= Number(maxPrice));
    switch (sort) {
      case 'price-asc': result.sort((a, b) => a.price - b.price); break;
      case 'price-desc': result.sort((a, b) => b.price - a.price); break;
      case 'name': result.sort((a, b) => a.name.localeCompare(b.name)); break;
      default: result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }
    return result;
  }, [products, activeCategory, categorySlug, sizeFilter, inStockOnly, maxPrice, sort]);

  const allSizes = useMemo(() => {
    const s = new Set();
    products.forEach(p => p.sizes?.forEach(sz => s.add(sz)));
    return Array.from(s).sort();
  }, [products]);

  const title = activeCategory?.name || (categorySlug ? categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1) : 'All Products');

  return (
    <div>
      {/* Page header */}
      <div className="bg-secondary/30 stitched-b">
        <div className="container-academic py-10 md:py-14">
          <p className="text-xs uppercase tracking-[0.3em] text-accent mb-2">Catalog</p>
          <h1 className="font-heading text-3xl md:text-5xl font-bold text-primary">{title}</h1>
          <p className="text-sm text-muted-foreground mt-3">{filtered.length} {filtered.length === 1 ? 'product' : 'products'}</p>
        </div>
      </div>

      {/* Category pills */}
      <div className="stitched-b bg-background">
        <div className="container-academic py-4 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            <Link to="/catalog" className={`px-4 py-2 text-xs uppercase tracking-wider whitespace-nowrap transition-colors ${!categorySlug ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-secondary/60'}`}>
              All
            </Link>
            {categories.map(c => (
              <Link key={c.id} to={`/catalog/${c.slug}`} className={`px-4 py-2 text-xs uppercase tracking-wider whitespace-nowrap transition-colors ${categorySlug === c.slug ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-secondary/60'}`}>
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="container-academic py-8 md:py-12">
        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-3 mb-8 stitched-b pb-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)} className="text-sm border border-input bg-card px-3 py-2 focus:outline-none focus:border-primary">
            <option value="featured">Sort: Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name">Name: A–Z</option>
          </select>
          <select value={sizeFilter} onChange={e => setSizeFilter(e.target.value)} className="text-sm border border-input bg-card px-3 py-2 focus:outline-none focus:border-primary">
            <option value="">All Sizes</option>
            {allSizes.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="number" placeholder="Max Price" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="text-sm border border-input bg-card px-3 py-2 w-32 focus:outline-none focus:border-primary" />
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input type="checkbox" checked={inStockOnly} onChange={e => setInStockOnly(e.target.checked)} className="accent-accent" />
            In Stock Only
          </label>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => <div key={i} className="aspect-square bg-muted animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">No products match your filters.</p>
            <button onClick={() => { setSizeFilter(''); setMaxPrice(''); setInStockOnly(false); }} className="btn-outline">Clear Filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {filtered.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}