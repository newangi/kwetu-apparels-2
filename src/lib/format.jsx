export const KES = (amount) => {
  const n = Number(amount) || 0;
  return 'KES ' + n.toLocaleString('en-KE');
};

export const slugify = (s) =>
  String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const stockStatus = (stock) => {
  if (stock <= 0) return { label: 'Out of Stock', tone: 'out', color: '#94918B' };
  if (stock <= 5) return { label: 'Low Stock', tone: 'low', color: '#C58F21' };
  return { label: 'In Stock', tone: 'in', color: '#3A8A4A' };
};

export const ORDER_STATUS_LABELS = {
  pending: 'Pending',
  processing: 'Processing',
  ready_for_pickup: 'Ready for Pickup',
  out_for_delivery: 'Out for Delivery',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

export const ORDER_STATUS_FLOW = ['pending', 'processing', 'ready_for_pickup', 'out_for_delivery', 'completed'];