import React, { useEffect, useRef, useState } from 'react';
import { dist, formatLen } from '@/lib/measure';

const HIT = 24;

function drawPair(ctx, pts, color, label) {
  if (!pts.length) return;
  ctx.fillStyle = color;
  pts.forEach((p) => {
    ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
  });
  if (pts.length === 2) {
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); ctx.lineTo(pts[1].x, pts[1].y); ctx.stroke();
    ctx.setLineDash([]);
    if (label) {
      const mx = (pts[0].x + pts[1].x) / 2, my = (pts[0].y + pts[1].y) / 2;
      ctx.fillStyle = color; ctx.font = 'bold 13px Inter, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, mx, my - 14);
    }
  }
}

export default function LiveStage({ facingMode, refRealCm, unit, onMeasureCm, onRefCount, onRefReady, resetSignal }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const refPts = useRef([]);
  const meaPts = useRef([]);
  const drag = useRef(null);
  const last = useRef({ ready: null, count: null, mc: null });

  useEffect(() => {
    let active = true;
    setError(''); setReady(false);
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
        if (!active) { s.getTracks().forEach((t) => t.stop()); return; }
        setStream(s);
      } catch (e) {
        setError('Could not access the camera. Please grant camera permission and try again.');
      }
    })();
    return () => { active = false; };
  }, [facingMode]);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().then(() => setReady(true)).catch(() => {});
    }
  }, [stream]);

  useEffect(() => () => { if (stream) stream.getTracks().forEach((t) => t.stop()); }, [stream]);

  useEffect(() => {
    if (resetSignal === 0) return;
    refPts.current = []; meaPts.current = []; drag.current = null;
  }, [resetSignal]);

  const relPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e) => {
    if (!ready) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const p = relPos(e);
    for (let i = 0; i < refPts.current.length; i++) {
      if (Math.hypot(p.x - refPts.current[i].x, p.y - refPts.current[i].y) <= HIT) { drag.current = { kind: 'ref', i }; return; }
    }
    for (let i = 0; i < meaPts.current.length; i++) {
      if (Math.hypot(p.x - meaPts.current[i].x, p.y - meaPts.current[i].y) <= HIT) { drag.current = { kind: 'meas', i }; return; }
    }
    if (refPts.current.length < 2) {
      refPts.current = refPts.current.length >= 2 ? [p] : [...refPts.current, p];
    } else if (meaPts.current.length < 2) {
      meaPts.current = meaPts.current.length >= 2 ? [p] : [...meaPts.current, p];
    } else {
      meaPts.current = [p];
    }
  };

  const onPointerMove = (e) => {
    if (!drag.current) return;
    const p = relPos(e);
    if (drag.current.kind === 'ref') refPts.current[drag.current.i] = p;
    else meaPts.current[drag.current.i] = p;
  };

  const onPointerUp = () => { drag.current = null; };

  useEffect(() => {
    let raf;
    const loop = () => {
      const canvas = canvasRef.current, wrap = wrapRef.current;
      if (canvas && wrap) {
        const w = wrap.clientWidth, h = wrap.clientHeight;
        if (canvas.width !== w) canvas.width = w;
        if (canvas.height !== h) canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, w, h);
        const refDone = refPts.current.length === 2 && refRealCm;
        const pxPerCm = refDone ? dist(refPts.current[0], refPts.current[1]) / refRealCm : null;
        const mc = (pxPerCm && meaPts.current.length === 2) ? dist(meaPts.current[0], meaPts.current[1]) / pxPerCm : null;
        drawPair(ctx, refPts.current, '#C58F21', refDone ? `${refRealCm} cm ref` : `Ref ${refPts.current.length}/2`);
        drawPair(ctx, meaPts.current, '#3A8A4A', mc != null ? formatLen(mc, unit) : `Meas ${meaPts.current.length}/2`);
        if (last.current.count !== refPts.current.length) { last.current.count = refPts.current.length; onRefCount(refPts.current.length); }
        if (last.current.ready !== refDone) { last.current.ready = refDone; onRefReady(refDone); }
        if (last.current.mc !== mc) { last.current.mc = mc; onMeasureCm(mc); }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [refRealCm, unit, onMeasureCm, onRefCount, onRefReady]);

  return (
    <div className="w-full">
      <div ref={wrapRef} className="relative w-full bg-primary overflow-hidden" style={{ aspectRatio: '4 / 3' }}>
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ cursor: 'crosshair', touchAction: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-primary-foreground/70 text-sm">Starting camera…</div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-primary-foreground/80 text-sm">{error}</div>
        )}
      </div>
    </div>
  );
}