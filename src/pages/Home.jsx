import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, Clock, Sun, ShoppingBag } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ProductCard from '@/components/ProductCard';
import { KES } from '@/lib/format';

const HERO_IMG = 'https://media.base44.com/images/public/6ab49724e5041348c31b7a14/7d67f56b6_generated_370de774.jpg';
const MACRO_IMG = 'https://media.base44.com/images/public/6ab49724e5041348c31b7a14/63b8e0195_generated_4e5bbbf1.jpg';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [cats, prods] = await Promise.all([
          base44.entities.Category.list('sort_order', 20),
          base44.entities.Product.list('-created_date', 50)
        ]);
        setCategories(cats);
        setProducts(prods);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const featured = products.filter(p => p.featured || p.best_seller).slice(0, 8);
  const displayProducts = featured.length ? featured : products.slice(0, 8);

  const categoryTiles = [
    { name: 'Shirts', slug: 'shirts', img: 'https://media.base44.com/images/public/6ab49724e5041348c31b7a14/7a7942e3a_generated_115c42a4.jpg' },
    { name: 'Sweaters', slug: 'sweaters', img: 'https://media.base44.com/images/public/6ab49724e5041348c31b7a14/e50d675a3_generated_bc742ec1.jpg' },
    { name: 'Trousers', slug: 'trousers', img: 'https://media.base44.com/images/public/6ab49724e5041348c31b7a14/c4f9a5a39_generated_78483963.jpg' },
    { name: 'Skirts', slug: 'skirts', img: 'https://media.base44.com/images/public/6ab49724e5041348c31b7a14/ade479623_generated_8f6ff0b7.jpg' },
  ];

  return (
    <div>
      {/* HERO */}
      <section className="relative">
        <div className="grid md:grid-cols-2 min-h-[70vh] md:min-h-[80vh]">
          <div className="relative order-2 md:order-1 flex items-center bg-background">
            <div className="container-academic py-12 md:py-0 md:pr-12">
              <p className="text-xs uppercase tracking-[0.3em] text-accent mb-5">Nairobi's Trusted School Uniforms</p>
              <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold text-primary leading-[1.05] mb-6">
                Excellence<br />Every Wear
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-md mb-9 leading-relaxed">
                Quality, durable school uniforms for Nairobi's students. Shop online and pick up at Ridgeways Mall, or get delivery across the city.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/catalog" className="btn-primary inline-flex items-center justify-center gap-2">
                  Shop Catalog <ArrowRight className="w-4 h-4" />
                </Link>
                <a href="#location" className="btn-outline inline-flex items-center justify-center gap-2">
                  <MapPin className="w-4 h-4" /> Visit Ridgeways Mall
                </a>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2 relative overflow-hidden bg-secondary min-h-[40vh] md:min-h-0">
            <img src={HERO_IMG} alt="Students in Kwetu school uniforms" className="absolute inset-0 w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container-academic py-16 md:py-24">
        <div className="flex items-end justify-between mb-10 stitched-b pb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-accent mb-2">Browse</p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary">Featured Categories</h2>
          </div>
          <Link to="/catalog" className="hidden sm:flex items-center gap-2 text-xs uppercase tracking-wider text-primary hover:text-accent">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {categoryTiles.map((c) => (
            <Link key={c.slug} to={`/catalog/${c.slug}`} className="group relative aspect-[3/4] overflow-hidden bg-secondary">
              <img src={c.img} alt={c.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-primary/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="font-heading text-xl md:text-2xl font-bold text-white">{c.name}</h3>
                <span className="inline-flex items-center gap-1 text-xs text-white/80 uppercase tracking-wider mt-1 group-hover:text-accent transition-colors">
                  Shop <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="bg-secondary/30 py-16 md:py-24">
        <div className="container-academic">
          <div className="flex items-end justify-between mb-10 stitched-b pb-5">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-accent mb-2">Best Sellers</p>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary">Featured Products</h2>
            </div>
            <Link to="/catalog" className="hidden sm:flex items-center gap-2 text-xs uppercase tracking-wider text-primary hover:text-accent">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => <div key={i} className="aspect-square bg-muted animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {displayProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* MACRO / QUALITY BAND */}
      <section className="container-academic py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
            <img src={MACRO_IMG} alt="Quality stitching detail" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-accent mb-3">Crafted to Last</p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary mb-5">Built for the School Year</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Every Kwetu uniform is made from durable, comfortable fabrics that withstand daily wear and frequent washing. Reinforced stitching, quality buttons, and true-to-size fits — so parents buy once and trust the quality.
            </p>
            <ul className="space-y-3">
              {['Reinforced seams for durability', 'Breathable, comfortable fabrics', 'True-to-size fitting', 'Easy-care, wash-and-wear'].map(f => (
                <li key={f} className="flex items-center gap-3 text-sm text-foreground">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full" /> {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* LOCATION */}
      <section id="location" className="bg-primary text-primary-foreground py-16 md:py-24">
        <div className="container-academic">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-accent mb-3">Find Us</p>
              <h2 className="font-heading text-3xl md:text-4xl font-bold mb-5">Ridgeways Mall, Nairobi</h2>
              <p className="text-primary-foreground/70 leading-relaxed mb-6">
                Visit our store at Ridgeways Mall along Kiambu Road. Try on sizes, meet our team, and pick up online orders in person.
              </p>
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Ridgeways Mall, Kiambu Road</p>
                    <p className="text-sm text-primary-foreground/60">Nairobi, Kenya</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Mon–Sat: 9:00am – 7:00pm</p>
                    <p className="text-sm text-primary-foreground/60">Sun: 10:00am – 5:00pm</p>
                  </div>
                </div>
              </div>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Ridgeways+Mall+Nairobi"
                target="_blank"
                rel="noreferrer"
                className="btn-accent inline-flex items-center gap-2"
              >
                <MapPin className="w-4 h-4" /> Get Directions
              </a>
            </div>
            <div className="relative aspect-video bg-primary-foreground/10 overflow-hidden rounded-sm border border-primary-foreground/15">
              <iframe
                title="Ridgeways Mall location"
                src="https://www.google.com/maps?q=Ridgeways%20Mall%20Nairobi&output=embed"
                className="w-full h-full"
                style={{ border: 0, filter: 'grayscale(0.3) invert(0.9) hue-rotate(180deg)' }}
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}