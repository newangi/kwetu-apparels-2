import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Check, MapPin, Truck, Smartphone, CreditCard, Wallet } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { KES, ORDER_STATUS_LABELS } from '@/lib/format';

export default function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const o = await base44.entities.Order.get(id);
        setOrder(o);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <div className="container-academic py-20"><div className="h-40 bg-muted animate-pulse max-w-2xl mx-auto" /></div>;

  if (!order) return (
    <div className="container-academic py-20 text-center">
      <p className="text-muted-foreground mb-4">Order not found.</p>
      <Link to="/catalog" className="btn-primary">Back to Catalog</Link>
    </div>
  );

  const paymentIcon = { mpesa: Smartphone, card: CreditCard, cash_on_pickup: Wallet, cash_on_delivery: Wallet }[order.payment_method] || Wallet;
  const PaymentIcon = paymentIcon;

  return (
    <div className="bg-secondary/20 min-h-screen">
      <div className="container-academic py-12 md:py-20">
        <div className="max-w-2xl mx-auto">
          {/* Success header */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-[#3A8A4A] rounded-full flex items-center justify-center mx-auto mb-5">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-primary mb-3">Order Confirmed</h1>
            <p className="text-muted-foreground">Thank you, {order.customer_name}. We've received your order.</p>
          </div>

          {/* Order card */}
          <div className="bg-card p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4 stitched-b pb-5">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Order Number</p>
                <p className="text-lg font-bold text-primary">{order.order_number}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Status</p>
                <p className="text-sm font-medium text-foreground">{ORDER_STATUS_LABELS[order.status]}</p>
              </div>
            </div>

            {/* Items */}
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Items</p>
              <div className="space-y-3">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-12 h-12 bg-secondary overflow-hidden shrink-0">{item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}</div>
                    <div className="flex-1"><p className="text-sm font-medium">{item.name}</p><p className="text-xs text-muted-foreground">Size {item.size} · Qty {item.quantity}</p></div>
                    <span className="text-sm">{KES(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fulfillment & payment */}
            <div className="grid sm:grid-cols-2 gap-4 stitched-t pt-5">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Fulfillment</p>
                <div className="flex items-start gap-2">
                  {order.fulfillment_method === 'pickup' ? <MapPin className="w-4 h-4 text-accent mt-0.5" /> : <Truck className="w-4 h-4 text-accent mt-0.5" />}
                  <div>
                    <p className="text-sm font-medium">{order.fulfillment_method === 'pickup' ? 'Store Pickup' : 'Nairobi Delivery'}</p>
                    {order.fulfillment_method === 'pickup'
                      ? <p className="text-xs text-muted-foreground">Ridgeways Mall, Kiambu Road</p>
                      : <p className="text-xs text-muted-foreground">{order.delivery_address}</p>}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Payment</p>
                <div className="flex items-start gap-2">
                  <PaymentIcon className="w-4 h-4 text-accent mt-0.5" />
                  <div>
                    <p className="text-sm font-medium capitalize">{order.payment_method.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-muted-foreground">Status: {order.payment_status}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="stitched-t pt-5 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{KES(order.subtotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Delivery</span><span>{order.delivery_fee === 0 ? 'Free' : KES(order.delivery_fee)}</span></div>
              <div className="flex justify-between text-base font-bold pt-2 stitched-t"><span className="text-primary">Total</span><span className="text-primary">{KES(order.total)}</span></div>
            </div>
          </div>

          {/* Next steps */}
          <div className="bg-primary text-primary-foreground p-6 mt-6">
            <h3 className="font-heading text-lg font-bold mb-2">What happens next?</h3>
            {order.fulfillment_method === 'pickup' ? (
              <p className="text-sm text-primary-foreground/80 leading-relaxed">We'll prepare your order and notify you when it's ready for collection at Ridgeways Mall. Please bring your order number.</p>
            ) : (
              <p className="text-sm text-primary-foreground/80 leading-relaxed">Our team will process your order and contact you on {order.customer_phone} to coordinate delivery within Nairobi (2–3 business days).</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
            <Link to="/account" className="btn-outline text-center">Track My Orders</Link>
            <Link to="/catalog" className="btn-primary text-center">Continue Shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
}