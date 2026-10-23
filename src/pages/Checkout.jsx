import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, Truck, CreditCard, Smartphone, Wallet, Check, ChevronLeft } from 'lucide-react';
import { useCart } from '@/lib/cartContext';
import { base44 } from '@/api/base44Client';
import { KES } from '@/lib/format';

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [fulfillment, setFulfillment] = useState('pickup');
  const [payment, setPayment] = useState('cash_on_pickup');
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', notes: '' });
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const DELIVERY_FEE = 300;
  const deliveryFee = fulfillment === 'delivery' ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  const validPayment = () => {
    if (fulfillment === 'pickup') return ['cash_on_pickup', 'card', 'mpesa'].includes(payment);
    return ['cash_on_delivery', 'card', 'mpesa'].includes(payment);
  };

  const handleFulfillmentChange = (f) => {
    setFulfillment(f);
    if (f === 'pickup' && payment === 'cash_on_delivery') setPayment('cash_on_pickup');
    if (f === 'delivery' && payment === 'cash_on_pickup') setPayment('cash_on_delivery');
  };

  const placeOrder = async () => {
    setError('');
    if (!form.name || !form.phone) { setError('Please provide your name and phone number.'); return; }
    if (fulfillment === 'delivery' && !form.address) { setError('Please provide a delivery address.'); return; }
    if (payment === 'mpesa' && !mpesaPhone) { setError('Please enter your M-Pesa phone number.'); return; }
    if (items.length === 0) { setError('Your cart is empty.'); return; }

    setSubmitting(true);
    try {
      const orderNumber = 'KW-' + Date.now().toString().slice(-8);
      const order = await base44.entities.Order.create({
        order_number: orderNumber,
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone,
        items: items.map(i => ({
          product_id: i.product_id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          size: i.size,
          image: i.image
        })),
        subtotal,
        delivery_fee: deliveryFee,
        total,
        fulfillment_method: fulfillment,
        payment_method: payment,
        payment_status: payment === 'cash_on_pickup' || payment === 'cash_on_delivery' ? 'pending' : 'pending',
        status: 'pending',
        delivery_address: fulfillment === 'delivery' ? form.address : '',
        notes: form.notes
      });

      // Decrement stock
      await Promise.all(items.map(i =>
        base44.entities.Product.update(i.product_id, {}).catch(() => {})
      ));

      clearCart();
      navigate(`/order/${order.id}`);
    } catch (e) {
      console.error(e);
      setError('Could not place your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container-academic py-20 text-center">
        <p className="text-muted-foreground mb-4">Your cart is empty.</p>
        <Link to="/catalog" className="btn-primary">Shop Products</Link>
      </div>
    );
  }

  const steps = ['Fulfillment', 'Payment', 'Review'];

  return (
    <div className="bg-secondary/20 min-h-screen">
      <div className="container-academic py-8 md:py-12">
        <Link to="/catalog" className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-muted-foreground hover:text-accent mb-6">
          <ChevronLeft className="w-4 h-4" /> Continue Shopping
        </Link>

        <h1 className="font-heading text-3xl md:text-4xl font-bold text-primary mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6">
              {steps.map((s, i) => (
                <React.Fragment key={s}>
                  <div className={`flex items-center gap-2 ${step >= i + 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${step > i + 1 ? 'bg-primary text-primary-foreground border-primary' : step === i + 1 ? 'border-primary text-primary' : 'border-muted-foreground/30'}`}>
                      {step > i + 1 ? <Check className="w-3.5 h-3.5" /> : i + 1}
                    </span>
                    <span className="text-xs uppercase tracking-wider hidden sm:inline">{s}</span>
                  </div>
                  {i < steps.length - 1 && <div className={`flex-1 h-px ${step > i + 1 ? 'bg-primary' : 'bg-border'}`} />}
                </React.Fragment>
              ))}
            </div>

            {/* Step 1: Fulfillment */}
            {step === 1 && (
              <div className="bg-card p-6 md:p-8 space-y-5 animate-fade-in">
                <h2 className="font-heading text-xl font-bold text-primary">Fulfillment Method</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleFulfillmentChange('pickup')}
                    className={`p-5 text-left border-2 transition-all ${fulfillment === 'pickup' ? 'border-accent bg-accent/5' : 'border-input hover:border-primary/40'}`}
                  >
                    <MapPin className="w-5 h-5 text-accent mb-3" />
                    <p className="font-medium text-foreground mb-1">Store Pickup</p>
                    <p className="text-xs text-muted-foreground">Ridgeways Mall · Free</p>
                  </button>
                  <button
                    onClick={() => handleFulfillmentChange('delivery')}
                    className={`p-5 text-left border-2 transition-all ${fulfillment === 'delivery' ? 'border-accent bg-accent/5' : 'border-input hover:border-primary/40'}`}
                  >
                    <Truck className="w-5 h-5 text-accent mb-3" />
                    <p className="font-medium text-foreground mb-1">Nairobi Delivery</p>
                    <p className="text-xs text-muted-foreground">2–3 days · {KES(DELIVERY_FEE)}</p>
                  </button>
                </div>

                <div className="pt-4 stitched-t space-y-4">
                  <div>
                    <label className="label-field">Full Name *</label>
                    <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Jane Wanjiru" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label-field">Phone Number *</label>
                      <input className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="07XX XXX XXX" />
                    </div>
                    <div>
                      <label className="label-field">Email (optional)</label>
                      <input className="input-field" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jane@example.com" />
                    </div>
                  </div>
                  {fulfillment === 'delivery' && (
                    <div className="animate-fade-in">
                      <label className="label-field">Delivery Address *</label>
                      <textarea className="input-field min-h-[80px]" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Estate, Street, House No., Nairobi" />
                    </div>
                  )}
                  {fulfillment === 'pickup' && (
                    <div className="bg-secondary/40 p-4 flex items-start gap-3 animate-fade-in">
                      <MapPin className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Ridgeways Mall</p>
                        <p className="text-xs text-muted-foreground">Kiambu Road, Nairobi. Collect your order at our store, Level 1.</p>
                      </div>
                    </div>
                  )}
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
                <button onClick={() => { if (!form.name || !form.phone) { setError('Please provide your name and phone number.'); return; } if (fulfillment === 'delivery' && !form.address) { setError('Please provide a delivery address.'); return; } setError(''); setStep(2); }} className="btn-primary w-full sm:w-auto">Continue to Payment</button>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <div className="bg-card p-6 md:p-8 space-y-5 animate-fade-in">
                <h2 className="font-heading text-xl font-bold text-primary">Payment Method</h2>
                <div className="space-y-3">
                  {fulfillment === 'pickup' && (
                    <button onClick={() => setPayment('cash_on_pickup')} className={`w-full p-4 flex items-center gap-4 border-2 transition-all text-left ${payment === 'cash_on_pickup' ? 'border-accent bg-accent/5' : 'border-input hover:border-primary/40'}`}>
                      <Wallet className="w-5 h-5 text-accent" />
                      <div className="flex-1"><p className="font-medium text-foreground">Cash on Pickup</p><p className="text-xs text-muted-foreground">Pay at the store when you collect</p></div>
                      {payment === 'cash_on_pickup' && <Check className="w-5 h-5 text-accent" />}
                    </button>
                  )}
                  {fulfillment === 'delivery' && (
                    <button onClick={() => setPayment('cash_on_delivery')} className={`w-full p-4 flex items-center gap-4 border-2 transition-all text-left ${payment === 'cash_on_delivery' ? 'border-accent bg-accent/5' : 'border-input hover:border-primary/40'}`}>
                      <Wallet className="w-5 h-5 text-accent" />
                      <div className="flex-1"><p className="font-medium text-foreground">Cash on Delivery</p><p className="text-xs text-muted-foreground">Pay when your order arrives</p></div>
                      {payment === 'cash_on_delivery' && <Check className="w-5 h-5 text-accent" />}
                    </button>
                  )}
                  <button onClick={() => setPayment('mpesa')} className={`w-full p-4 flex items-center gap-4 border-2 transition-all text-left ${payment === 'mpesa' ? 'border-accent bg-accent/5' : 'border-input hover:border-primary/40'}`}>
                    <Smartphone className="w-5 h-5 text-accent" />
                    <div className="flex-1"><p className="font-medium text-foreground">M-Pesa Express</p><p className="text-xs text-muted-foreground">STK push to your phone</p></div>
                    {payment === 'mpesa' && <Check className="w-5 h-5 text-accent" />}
                  </button>
                  <button onClick={() => setPayment('card')} className={`w-full p-4 flex items-center gap-4 border-2 transition-all text-left ${payment === 'card' ? 'border-accent bg-accent/5' : 'border-input hover:border-primary/40'}`}>
                    <CreditCard className="w-5 h-5 text-accent" />
                    <div className="flex-1"><p className="font-medium text-foreground">Card Payment</p><p className="text-xs text-muted-foreground">Visa / Mastercard</p></div>
                    {payment === 'card' && <Check className="w-5 h-5 text-accent" />}
                  </button>
                </div>

                {payment === 'mpesa' && (
                  <div className="bg-secondary/40 p-5 space-y-4 animate-fade-in">
                    <p className="text-sm text-foreground">Enter your M-Pesa registered phone number. You'll receive a payment prompt on your phone.</p>
                    <input className="input-field" value={mpesaPhone} onChange={e => setMpesaPhone(e.target.value)} placeholder="2547XX XXX XXX" />
                    <p className="text-xs text-muted-foreground">A payment request will be sent via STK push. Enter your M-Pesa PIN to complete.</p>
                  </div>
                )}
                {payment === 'card' && (
                  <div className="bg-secondary/40 p-5 space-y-4 animate-fade-in">
                    <p className="text-sm text-muted-foreground">You'll be redirected to our secure card payment page after placing your order.</p>
                  </div>
                )}

                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="btn-outline">Back</button>
                  <button onClick={() => { if (payment === 'mpesa' && !mpesaPhone) { setError('Please enter your M-Pesa phone number.'); return; } setError(''); setStep(3); }} className="btn-primary">Review Order</button>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="bg-card p-6 md:p-8 space-y-5 animate-fade-in">
                <h2 className="font-heading text-xl font-bold text-primary">Review Your Order</h2>
                <div className="space-y-3">
                  <div className="flex justify-between stitched-b pb-2"><span className="text-xs uppercase tracking-wider text-muted-foreground">Fulfillment</span><span className="text-sm font-medium">{fulfillment === 'pickup' ? 'Store Pickup (Ridgeways Mall)' : 'Nairobi Delivery'}</span></div>
                  <div className="flex justify-between stitched-b pb-2"><span className="text-xs uppercase tracking-wider text-muted-foreground">Payment</span><span className="text-sm font-medium capitalize">{payment.replace(/_/g, ' ')}</span></div>
                  <div className="flex justify-between stitched-b pb-2"><span className="text-xs uppercase tracking-wider text-muted-foreground">Customer</span><span className="text-sm font-medium">{form.name} · {form.phone}</span></div>
                  {fulfillment === 'delivery' && <div className="flex justify-between stitched-b pb-2"><span className="text-xs uppercase tracking-wider text-muted-foreground">Address</span><span className="text-sm font-medium text-right max-w-[60%]">{form.address}</span></div>}
                </div>

                <div className="stitched-t pt-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Items</p>
                  <div className="space-y-3">
                    {items.map(item => (
                      <div key={`${item.product_id}-${item.size}`} className="flex gap-3">
                        <div className="w-12 h-12 bg-secondary overflow-hidden shrink-0">{item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}</div>
                        <div className="flex-1"><p className="text-sm font-medium">{item.name}</p><p className="text-xs text-muted-foreground">Size {item.size} · Qty {item.quantity}</p></div>
                        <span className="text-sm font-medium">{KES(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} className="btn-outline" disabled={submitting}>Back</button>
                  <button onClick={placeOrder} className="btn-accent flex-1" disabled={submitting}>
                    {submitting ? 'Placing Order...' : `Place Order · ${KES(total)}`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card p-6 sticky top-24">
              <h3 className="font-heading text-lg font-bold text-primary mb-5">Order Summary</h3>
              <div className="space-y-3 mb-5 max-h-64 overflow-y-auto">
                {items.map(item => (
                  <div key={`${item.product_id}-${item.size}`} className="flex gap-3">
                    <div className="w-12 h-12 bg-secondary overflow-hidden shrink-0">{item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}</div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{item.name}</p><p className="text-xs text-muted-foreground">Size {item.size} · Qty {item.quantity}</p></div>
                    <span className="text-sm">{KES(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 stitched-t pt-4">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{KES(subtotal)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Delivery</span><span>{deliveryFee === 0 ? 'Free' : KES(deliveryFee)}</span></div>
                <div className="flex justify-between text-base font-bold pt-2 stitched-t"><span className="text-primary">Total</span><span className="text-primary">{KES(total)}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}