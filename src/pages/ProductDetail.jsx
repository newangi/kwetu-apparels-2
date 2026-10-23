import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Minus, Plus, ShoppingBag, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCart } from '@/lib/cartContext';
import { KES, stockStatus } from '@/lib/format';
import ProductCard from '@/components/ProductCard';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const p = await base44.entities.Product.get(id);
        setProduct(p);
        if (p.sizes?.length) setSelectedSize(p.sizes[0]);
        const all = await base44.entities.Product.list('-created_date', 100);
        setRelated(all.filter(x => x.category_id === p.category_id && x.id !== p.id).slice(0, 4));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const handleAdd = () => {
    if (!product) return;
    if (product.stock <= 0) return;
    addItem(product, selectedSize, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return <div className="container-academic py-20"><div className="grid md:grid-cols-2 gap-10"><div className="aspect-square bg-muted animate-pulse" /><div className="space-y-4"><div className="h-8 bg-muted animate-pulse w-3/4" /><div className="h-6 bg-muted animate-pulse w-1/2" /><div className="h-32 bg-muted animate-pulse" /></div></div></div>;
  }

  if (!product) {
    return (
      <div className="container-academic py-20 text-center">
        <p className="text-muted-foreground mb-4">Product not found.</p>
        <Link to="/catalog" className="btn-outline">Back to Catalog</Link>
      </div>
    );
  }

  const status = stockStatus(product.stock);
  const images = product.images?.length ? product.images : [];

  return (
    <div>
      <div className="container-academic py-6">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-muted-foreground hover:text-accent">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <div className="container-academic pb-12">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {/* Gallery */}
          <div className="flex flex-col md:flex-row gap-4">
            {images.length > 1 && (
              <div className="flex md:flex-col gap-3 order-2 md:order-1 overflow-x-auto md:overflow-visible">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImage(i)} className={`w-16 h-16 shrink-0 overflow-hidden border-2 ${activeImage === i ? 'border-accent' : 'border-transparent'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className="flex-1 order-1 md:order-2 aspect-square bg-secondary overflow-hidden">
              {images[activeImage] ? (
                <img src={images[activeImage]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No image available</div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="md:pt-4">
            <p className="text-xs uppercase tracking-[0.3em] text-accent mb-3">{product.category_name}</p>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-primary mb-4">{product.name}</h1>
            <p className="text-2xl font-bold text-primary mb-5">{KES(product.price)}</p>

            {/* Stock pulse */}
            <div className="flex items-center gap-2 mb-6 stitched-b pb-5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${status.tone === 'in' ? 'pulse-dot' : ''}`}
                style={{ backgroundColor: status.color }}
              />
              <span className="text-sm font-medium text-foreground">{status.label}</span>
              {product.stock > 0 && product.stock <= 10 && (
                <span className="text-xs text-muted-foreground">· Only {product.stock} left</span>
              )}
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed mb-6">{product.description || 'Quality school uniform essential, crafted for durability and comfort.'}</p>

            {/* Sizes */}
            {product.sizes?.length > 0 && (
              <div className="mb-6">
                <p className="label-field">Select Size</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map(s => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`min-w-[3rem] px-3 py-2.5 text-sm font-medium border transition-all ${
                        selectedSize === s
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input bg-card text-foreground hover:border-primary'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <p className="label-field">Quantity</p>
              <div className="flex items-center border border-input w-fit">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-4 py-2.5 hover:bg-secondary"><Minus className="w-4 h-4" /></button>
                <span className="px-6 text-sm font-medium">{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(product.stock || 99, q + 1))} className="px-4 py-2.5 hover:bg-secondary"><Plus className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Add to cart */}
            <button
              onClick={handleAdd}
              disabled={product.stock <= 0}
              className={`w-full md:w-auto inline-flex items-center justify-center gap-2 ${product.stock <= 0 ? 'bg-muted text-muted-foreground cursor-not-allowed' : added ? 'bg-[#3A8A4A] text-white' : 'btn-primary'}`}
            >
              {product.stock <= 0 ? 'Out of Stock' : added ? <><Check className="w-4 h-4" /> Added to Cart</> : <><ShoppingBag className="w-4 h-4" /> Add to Cart</>}
            </button>

            {/* Trust badges */}
            <div className="mt-8 grid grid-cols-3 gap-4 stitched-t pt-6">
              <div className="text-center"><p className="text-xs uppercase tracking-wider text-accent mb-1">Pickup</p><p className="text-xs text-muted-foreground">Ridgeways Mall</p></div>
              <div className="text-center"><p className="text-xs uppercase tracking-wider text-accent mb-1">Delivery</p><p className="text-xs text-muted-foreground">Within Nairobi</p></div>
              <div className="text-center"><p className="text-xs uppercase tracking-wider text-accent mb-1">Quality</p><p className="text-xs text-muted-foreground">Guaranteed</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="bg-secondary/30 py-14">
          <div className="container-academic">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-primary mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}