export const REF_PRESETS = [
  { id: 'a4', label: 'A4 paper (long edge)', cm: 29.7 },
  { id: 'a4short', label: 'A4 paper (short edge)', cm: 21.0 },
  { id: 'card', label: 'Credit / ID card (long edge)', cm: 8.56 },
  { id: 'custom', label: 'Custom size', cm: null },
];

export const MEASURE_LABELS = ['Chest', 'Waist', 'Hips', 'Shoulder Width', 'Sleeve Length', 'Inseam', 'Height', 'Neck', 'Other'];

export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const cmToIn = (v) => v / 2.54;
export const inToCm = (v) => v * 2.54;
export const formatLen = (cm, unit) => (unit === 'cm' ? `${cm.toFixed(1)} cm` : `${cmToIn(cm).toFixed(1)} in`);