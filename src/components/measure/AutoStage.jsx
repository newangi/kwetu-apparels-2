import React, { useEffect, useRef, useState } from 'react';
import { Camera, Save, AlertCircle, Loader2 } from 'lucide-react';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import { formatLen, inToCm } from '@/lib/measure';

const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm';

const NOSE = 0, L_SH = 11, R_SH = 12, L_EL = 13, R_EL = 14, L_WR = 15, R_WR = 16, L_HIP = 23, R_HIP = 24, L_AN = 27, R_AN = 28;
const CIRC_FACTOR = { chest: 2.45, waist: 2.45, hip: 2.30 };

const MEAS_DEFS = [
  { key: 'height', label: 'Height' },
  { key: 'shoulder', label: 'Shoulder Width' },
  { key: 'chest', label: 'Chest (est. circ.)' },
  { key: 'waist', label: 'Waist (est. circ.)' },
  { key: 'hip', label: 'Hip (est. circ.)' },
  { key: 'inseam', label: 'Inseam' },
  { key: 'sleeve', label: 'Sleeve Length' },
];

const CONN = [[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28],[27,31],[28,32]];

const px = (lm, i, W, H) => { const p = lm[i]; return { x: p.x * W, y: p.y * H, v: p.visibility ?? 1 }; };
const vis = (p) => p.v > 0.5;
const midPt = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const lerp = (a, b, t) => a + (b - a) * t;

function compute(lm, W, H, heightCm) {
  const nose = px(lm, NOSE, W, H), lsh = px(lm, L_SH, W, H), rsh = px(lm, R_SH, W, H);
  const lhip = px(lm, L_HIP, W, H), rhip = px(lm, R_HIP, W, H), lan = px(lm, L_AN, W, H), ran = px(lm, R_AN, W, H);
  const lel = px(lm, L_EL, W, H), lwr = px(lm, L_WR, W, H), rel = px(lm, R_EL, W, H), rwr = px(lm, R_WR, W, H);
  if (!(vis(lsh) && vis(rsh) && vis(lhip) && vis(rhip) && vis(lan) && vis(ran))) return null;

  const faceTopY = Math.min(nose.y, px(lm, 1, W, H).y, px(lm, 4, W, H).y, px(lm, 7, W, H).y, px(lm, 8, W, H).y);
  const ankleY = Math.max(lan.y, ran.y);
  const bodyPx = (ankleY - faceTopY) * 1.10;
  if (bodyPx <= 0) return null;
  const pxPerCm = bodyPx / heightCm;

  const widthAt = (t) => Math.abs(lerp(lsh.x, lhip.x, t) - lerp(rsh.x, rhip.x, t));
  const shY = (lsh.y + rsh.y) / 2, hipY = (lhip.y + rhip.y) / 2;
  void shY; void hipY;

  let sleeve = null;
  if (vis(lel) && vis(lwr)) sleeve = (d(lsh, lel) + d(lel, lwr)) / pxPerCm;
  else if (vis(rel) && vis(rwr)) sleeve = (d(rsh, rel) + d(rel, rwr)) / pxPerCm;

  return {
    height: heightCm,
    shoulder: d(lsh, rsh) / pxPerCm,
    chest: (widthAt(0.30) / pxPerCm) * CIRC_FACTOR.chest,
    waist: (widthAt(0.62) / pxPerCm) * CIRC_FACTOR.waist,
    hip: (d(lhip, rhip) / pxPerCm) * CIRC_FACTOR.hip,
    inseam: d(midPt(lhip, rhip), midPt(lan, ran)) / pxPerCm,
    sleeve,
    _shPx: d(lsh, rsh),
  };
}

function drawTemplate(ctx, W, H) {
  ctx.save();
  ctx.strokeStyle = 'rgba(197,143,33,0.65)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  const cx = W / 2;
  ctx.beginPath(); ctx.arc(cx, H * 0.13, H * 0.06, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - H * 0.11, H * 0.27); ctx.lineTo(cx + H * 0.11, H * 0.27); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - H * 0.11, H * 0.27); ctx.lineTo(cx - H * 0.08, H * 0.58); ctx.moveTo(cx + H * 0.11, H * 0.27); ctx.lineTo(cx + H * 0.08, H * 0.58); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - H * 0.08, H * 0.58); ctx.lineTo(cx + H * 0.08, H * 0.58); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - H * 0.08, H * 0.58); ctx.lineTo(cx - H * 0.07, H * 0.95); ctx.moveTo(cx + H * 0.08, H * 0.58); ctx.lineTo(cx + H * 0.07, H * 0.95); ctx.stroke();
  ctx.restore();
}

function drawSkeleton(ctx, lm, W, H) {
  const to = (i) => ({ x: lm[i].x * W, y: lm[i].y * H, v: lm[i].visibility ?? 1 });
  ctx.strokeStyle = 'rgba(58,138,74,0.95)'; ctx.lineWidth = 3;
  CONN.forEach(([a, b]) => {
    const pa = to(a), pb = to(b);
    if (pa.v > 0.4 && pb.v > 0.4) { ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke(); }
  });
  ctx.fillStyle = 'rgba(58,138,74,1)';
  for (let i = 0; i < 33; i++) {
    const p = to(i);
    if (p.v > 0.4) { ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill(); }
  }
}

export default function AutoStage({ unit, onSave }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const landmarkerRef = useRef(null);
  const rafRef = useRef(0);
  const lastTsRef = useRef(0);
  const smoothRef = useRef(null);
  const lastSetRef = useRef(0);
  const fitMsgRef = useRef('');
  const [stream, setStream] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [err, setErr] = useState('');
  const [aspect, setAspect] = useState('4 / 3');
  const [heightInput, setHeightInput] = useState('');
  const [fitMsg, setFitMsg] = useState('Enter your height, then start the camera.');
  const [measurements, setMeasurements] = useState(null);

  const heightCm = (() => { const v = parseFloat(heightInput); if (!v) return null; return unit === 'cm' ? v : inToCm(v); })();

  const start = async () => {
    setErr(''); setStatus('loading');
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(s);
      if (!landmarkerRef.current) {
        const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
        try {
          landmarkerRef.current = await PoseLandmarker.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
            runningMode: 'VIDEO', numPoses: 1,
          });
        } catch {
          landmarkerRef.current = await PoseLandmarker.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: MODEL_URL, delegate: 'CPU' },
            runningMode: 'VIDEO', numPoses: 1,
          });
        }
      }
      setStatus('ready');
    } catch (e) {
      setErr('Could not start the camera or load the pose model. Check your connection and camera permission, then try again.');
      setStatus('error');
    }
  };

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);
  useEffect(() => () => { if (stream) stream.getTracks().forEach((t) => t.stop()); }, [stream]);
  useEffect(() => () => { landmarkerRef.current?.close?.(); }, []);

  useEffect(() => {
    if (status !== 'ready') return;
    const loop = () => {
      const video = videoRef.current, canvas = canvasRef.current, wrap = wrapRef.current;
      if (video && canvas && wrap && video.videoWidth > 0 && landmarkerRef.current) {
        const W = wrap.clientWidth, H = wrap.clientHeight;
        if (canvas.width !== W) canvas.width = W;
        if (canvas.height !== H) canvas.height = H;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, W, H);
        drawTemplate(ctx, W, H);
        let ts = performance.now();
        if (ts <= lastTsRef.current) ts = lastTsRef.current + 1;
        lastTsRef.current = ts;
        try {
          const res = landmarkerRef.current.detectForVideo(video, ts);
          const lm = res?.landmarks?.[0];
          if (lm) {
            drawSkeleton(ctx, lm, W, H);
            if (heightCm && heightCm > 0) {
              const m = compute(lm, W, H, heightCm);
              let msg;
              if (!m) msg = 'Stand back so your whole body is in frame.';
              else if (m._shPx < 0.10 * W) msg = 'Move a little closer.';
              else if (m._shPx > 0.45 * W) msg = 'Move back a little.';
              else msg = 'Ready ✓ — hold still.';
              if (msg !== fitMsgRef.current) { fitMsgRef.current = msg; setFitMsg(msg); }
              if (m) {
                const now = performance.now();
                if (now - lastSetRef.current > 140) {
                  lastSetRef.current = now;
                  const prev = smoothRef.current;
                  const a = 0.35;
                  const out = {};
                  MEAS_DEFS.forEach((def) => {
                    const v = m[def.key];
                    out[def.key] = v == null ? null : (prev && prev[def.key] != null ? prev[def.key] + (v - prev[def.key]) * a : v);
                  });
                  smoothRef.current = out;
                  setMeasurements(out);
                }
              }
            } else if (fitMsgRef.current !== 'Enter your height to calibrate measurements.') {
              fitMsgRef.current = 'Enter your height to calibrate measurements.';
              setFitMsg('Enter your height to calibrate measurements.');
            }
          } else if (fitMsgRef.current !== 'Stand back so your whole body is in frame.') {
            fitMsgRef.current = 'Stand back so your whole body is in frame.';
            setFitMsg('Stand back so your whole body is in frame.');
          }
        } catch (e) { /* swallow per-frame errors */ }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [status, heightCm, unit]);

  const handleSave = () => {
    if (!measurements) return;
    const items = MEAS_DEFS.filter((def) => measurements[def.key] != null).map((def) => ({ label: def.label, cm: measurements[def.key] }));
    if (items.length) onSave(items);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="number" min="0" step="0.1" value={heightInput}
          onChange={(e) => setHeightInput(e.target.value)}
          placeholder={`Your height (${unit})`}
          className="input-field"
        />
        {status !== 'ready' && (
          <button onClick={start} disabled={status === 'loading'}
            className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-60">
            {status === 'loading' ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading model…</> : <><Camera className="w-4 h-4" /> Start Camera</>}
          </button>
        )}
      </div>

      <div ref={wrapRef} className="relative w-full bg-primary overflow-hidden" style={{ aspectRatio: aspect }}>
        <video ref={videoRef} onLoadedMetadata={(e) => { const v = e.target; if (v.videoWidth) setAspect(`${v.videoWidth} / ${v.videoHeight}`); }}
          className="absolute inset-0 w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} playsInline muted />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ transform: 'scaleX(-1)' }} />
        {status !== 'ready' && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-primary-foreground/70 text-sm">
            {status === 'error' ? (
              <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {err}</span>
            ) : status === 'loading' ? 'Starting camera and loading the pose model…' : 'Auto body measurement — pose landmark ML'}
          </div>
        )}
      </div>

      <div className="mt-3 text-sm font-medium text-accent">{fitMsg}</div>

      {measurements && (
        <div className="mt-5 stitched-t pt-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Live Measurements</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {MEAS_DEFS.map((def) => (
              <div key={def.key}>
                <p className="text-[11px] text-muted-foreground">{def.label}</p>
                <p className="text-base font-bold text-primary">{measurements[def.key] != null ? formatLen(measurements[def.key], unit) : '—'}</p>
              </div>
            ))}
          </div>
          <button onClick={handleSave} className="btn-accent inline-flex items-center justify-center gap-2 w-full mt-5">
            <Save className="w-4 h-4" /> Save Measurements
          </button>
          <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
            Circumference values are estimates derived from a front-facing view. For best accuracy, verify with a tape measure before ordering.
          </p>
        </div>
      )}
    </div>
  );
}