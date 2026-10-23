import React, { useEffect, useRef, useState } from 'react';
import { Ruler, RotateCcw, Trash2, Save, Camera, Info, Radio, ImageIcon, Scan } from 'lucide-react';
import CameraStage from '@/components/measure/CameraStage';
import LiveStage from '@/components/measure/LiveStage';
import AutoStage from '@/components/measure/AutoStage';
import { REF_PRESETS, MEASURE_LABELS, dist, inToCm, formatLen } from '@/lib/measure';

export default function Measure() {
  const [unit, setUnit] = useState('cm');
  const [stageMode, setStageMode] = useState('live');
  const [live, setLive] = useState(false);
  const [facingMode] = useState('environment');
  const [captured, setCaptured] = useState(null);
  const [dims, setDims] = useState({ naturalWidth: 0, naturalHeight: 0 });
  const [refPoints, setRefPoints] = useState([]);
  const [refPreset, setRefPreset] = useState('a4');
  const [customRef, setCustomRef] = useState('');
  const [measurePoints, setMeasurePoints] = useState([]);
  const [measureLabel, setMeasureLabel] = useState(MEASURE_LABELS[0]);
  const [saved, setSaved] = useState([]);
  const [liveRefCount, setLiveRefCount] = useState(0);
  const [liveRefReady, setLiveRefReady] = useState(false);
  const [liveMeasureCm, setLiveMeasureCm] = useState(null);
  const [resetSignal, setResetSignal] = useState(0);
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [dispSize, setDispSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    try { setSaved(JSON.parse(localStorage.getItem('kwetu_measurements') || '[]')); } catch { setSaved([]); }
  }, []);
  useEffect(() => { localStorage.setItem('kwetu_measurements', JSON.stringify(saved)); }, [saved]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || !captured) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setDispSize({ w: r.width, h: r.height });
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [captured]);

  const refRealCm = (() => {
    const p = REF_PRESETS.find((r) => r.id === refPreset);
    if (!p) return null;
    if (p.cm !== null) return p.cm;
    const val = parseFloat(customRef);
    if (!val || isNaN(val)) return null;
    return unit === 'cm' ? val : inToCm(val);
  })();

  const refPlacedCount = stageMode === 'capture' ? refPoints.length : liveRefCount;
  const refDone = refPlacedCount === 2 && refRealCm;

  const capturePxPerCm = stageMode === 'capture' && refPoints.length === 2 && refRealCm
    ? dist(refPoints[0], refPoints[1]) / refRealCm : null;
  const measureCm = stageMode === 'capture'
    ? (measurePoints.length === 2 && capturePxPerCm ? dist(measurePoints[0], measurePoints[1]) / capturePxPerCm : null)
    : liveMeasureCm;

  const mode = refDone ? 'measure' : 'reference';

  const handleCapture = (dataUrl, imageDims) => {
    setCaptured(dataUrl);
    setDims(imageDims);
    setRefPoints([]);
    setMeasurePoints([]);
    setLive(false);
  };

  const handleStageClick = (e) => {
    if (!captured) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (dims.naturalWidth / rect.width);
    const y = (e.clientY - rect.top) * (dims.naturalHeight / rect.height);
    if (mode === 'reference') {
      setRefPoints((prev) => (prev.length >= 2 ? [{ x, y }] : [...prev, { x, y }]));
      setMeasurePoints([]);
    } else {
      setMeasurePoints((prev) => (prev.length >= 2 ? [{ x, y }] : [...prev, { x, y }]));
    }
  };

  const resetReference = () => {
    if (stageMode === 'capture') { setRefPoints([]); setMeasurePoints([]); }
    else { setResetSignal((n) => n + 1); }
  };
  const retake = () => { setCaptured(null); setRefPoints([]); setMeasurePoints([]); setLive(true); };

  const saveMeasurement = () => {
    if (measureCm == null) return;
    setSaved((prev) => [
      { id: Date.now(), label: measureLabel === 'Other' ? 'Measurement' : measureLabel, cm: measureCm, unit, date: new Date().toISOString() },
      ...prev,
    ]);
    if (stageMode === 'capture') setMeasurePoints([]);
    else setResetSignal((n) => n + 1);
  };

  const handleSaveMany = (items) => {
    const base = Date.now();
    setSaved((prev) => [
      ...items.map((it, i) => ({ id: base + i, label: it.label, cm: it.cm, unit, date: new Date().toISOString() })),
      ...prev,
    ]);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !captured || !dispSize.w) return;
    canvas.width = dispSize.w; canvas.height = dispSize.h;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const sx = dispSize.w / dims.naturalWidth;
    const sy = dispSize.h / dims.naturalHeight;
    const toDisp = (p) => ({ x: p.x * sx, y: p.y * sy });
    const drawPair = (points, color, label) => {
      if (!points.length) return;
      const dp = points.map(toDisp);
      ctx.fillStyle = color;
      dp.forEach((p) => { ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); });
      if (dp.length === 2) {
        ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.setLineDash([6, 4]);
        ctx.beginPath(); ctx.moveTo(dp[0].x, dp[0].y); ctx.lineTo(dp[1].x, dp[1].y); ctx.stroke(); ctx.setLineDash([]);
        if (label) {
          const mx = (dp[0].x + dp[1].x) / 2, my = (dp[0].y + dp[1].y) / 2;
          ctx.fillStyle = color; ctx.font = 'bold 13px Inter, sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(label, mx, my - 14);
        }
      }
    };
    drawPair(refPoints, '#C58F21', refDone ? `${refRealCm} cm ref` : `Ref ${refPoints.length}/2`);
    drawPair(measurePoints, '#3A8A4A', measureCm != null ? formatLen(measureCm, unit) : `Meas ${measurePoints.length}/2`);
  }, [captured, refPoints, measurePoints, dispSize, refDone, refRealCm, measureCm, unit, dims]);

  const stageInstruction = stageMode === 'capture'
    ? (mode === 'reference' ? `Tap the two ends of your reference object (${refPoints.length}/2)` : `Tap two points to measure (${measurePoints.length}/2)`)
    : stageMode === 'live'
      ? (refDone ? 'Tap two points on the feed to measure' : 'Tap the two ends of your reference object')
      : 'Stand back to fit the template, enter your height to calibrate.';

  return (
    <div className="bg-secondary/20 min-h-screen">
      <div className="container-academic py-10 md:py-14">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-accent mb-2">Size Assistant</p>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-primary flex items-center gap-3">
              <Ruler className="w-7 h-7 text-accent" /> Measure Yourself
            </h1>
          </div>
          <div className="flex items-center border border-input bg-card">
            {['cm', 'in'].map((u) => (
              <button key={u} onClick={() => setUnit(u)}
                className={`px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${unit === u ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-secondary'}`}>
                {u}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          {/* Stage */}
          <div className="bg-card p-4 md:p-6">
            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={() => setStageMode('live')}
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider border transition-colors ${stageMode === 'live' ? 'border-primary bg-primary text-primary-foreground' : 'border-input hover:border-primary'}`}>
                <Radio className="w-4 h-4" /> Live
              </button>
              <button onClick={() => setStageMode('capture')}
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider border transition-colors ${stageMode === 'capture' ? 'border-primary bg-primary text-primary-foreground' : 'border-input hover:border-primary'}`}>
                <ImageIcon className="w-4 h-4" /> Photo
              </button>
              <button onClick={() => setStageMode('auto')}
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider border transition-colors ${stageMode === 'auto' ? 'border-primary bg-primary text-primary-foreground' : 'border-input hover:border-primary'}`}>
                <Scan className="w-4 h-4" /> Auto
              </button>
            </div>

            {stageMode === 'capture' && !live && !captured && (
              <div className="text-center py-16">
                <Camera className="w-12 h-12 text-muted-foreground/40 mx-auto mb-5" />
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                  Capture a photo holding a reference object (A4 paper or a credit card) next to the area you want to measure, then tap two points on the object to set scale, and two points on yourself to measure.
                </p>
                <button onClick={() => setLive(true)} className="btn-primary inline-flex items-center gap-2">
                  <Camera className="w-4 h-4" /> Start Camera
                </button>
              </div>
            )}

            {stageMode === 'capture' && live && (
              <CameraStage facingMode={facingMode} onCapture={handleCapture} onCancel={() => setLive(false)} />
            )}

            {stageMode === 'capture' && captured && (
              <div>
                <div className="relative inline-block w-full" ref={wrapRef} onClick={handleStageClick} style={{ cursor: 'crosshair' }}>
                  <img src={captured} alt="Measurement" className="block w-full h-auto max-h-[68vh] mx-auto select-none" draggable={false} />
                  <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
                </div>
              </div>
            )}

            {stageMode === 'live' && (
              <LiveStage
                facingMode={facingMode}
                refRealCm={refRealCm}
                unit={unit}
                onMeasureCm={setLiveMeasureCm}
                onRefCount={setLiveRefCount}
                onRefReady={setLiveRefReady}
                resetSignal={resetSignal}
              />
            )}

            {stageMode === 'auto' && (
              <AutoStage unit={unit} onSave={handleSaveMany} />
            )}

            {stageMode !== 'auto' && (
              <div className="flex flex-wrap items-center justify-between gap-3 mt-4 stitched-t pt-4">
                <div className="flex gap-3">
                  {stageMode === 'capture' && captured && (
                    <button onClick={retake} className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-foreground hover:text-accent">
                      <RotateCcw className="w-4 h-4" /> Retake
                    </button>
                  )}
                  {refDone && (
                    <button onClick={resetReference} className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-foreground hover:text-accent">
                      <RotateCcw className="w-4 h-4" /> {stageMode === 'live' ? 'Clear points' : 'Reset reference'}
                    </button>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{stageInstruction}</span>
              </div>
            )}
          </div>

          {/* Side panel */}
          <div className="space-y-6">
            {stageMode !== 'auto' && (
              <>
                <div className="bg-card p-5">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Reference Object</p>
                  {refPlacedCount < 2 ? (
                    <p className="text-sm text-muted-foreground">
                      {stageMode === 'live'
                        ? 'Tap both ends of your reference object on the live feed to set the scale.'
                        : 'Tap both ends of your reference object on the photo to set the scale.'}
                    </p>
                  ) : (
                    <>
                      <div className="space-y-2 mb-3">
                        {REF_PRESETS.map((r) => (
                          <button key={r.id} onClick={() => setRefPreset(r.id)}
                            className={`w-full text-left px-3 py-2 text-sm border transition-colors ${refPreset === r.id ? 'border-primary bg-primary text-primary-foreground' : 'border-input hover:border-primary'}`}>
                            {r.label}{r.cm !== null ? ` · ${r.cm} cm` : ''}
                          </button>
                        ))}
                      </div>
                      {refPreset === 'custom' && (
                        <input type="number" min="0" step="0.1" value={customRef} onChange={(e) => setCustomRef(e.target.value)} placeholder={`Length in ${unit}`}
                          className="input-field" />
                      )}
                    </>
                  )}
                </div>

                <div className="bg-card p-5">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Measurement</p>
                  {measureCm != null ? (
                    <>
                      <p className="font-heading text-3xl font-bold text-primary mb-4">{formatLen(measureCm, unit)}</p>
                      <div className="flex gap-2 mb-4">
                        <select value={measureLabel} onChange={(e) => setMeasureLabel(e.target.value)} className="input-field flex-1">
                          {MEASURE_LABELS.map((l) => <option key={l} value={l}>{l}</option>)}
                        </select>
                        <button onClick={saveMeasurement} className="btn-accent inline-flex items-center gap-2">
                          <Save className="w-4 h-4" /> Save
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {refDone ? 'Tap two points to take a measurement.' : 'Set the reference scale first.'}
                    </p>
                  )}
                </div>
              </>
            )}

            <div className="bg-card p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Saved Measurements</p>
              {saved.length === 0 ? (
                <p className="text-sm text-muted-foreground">No saved measurements yet.</p>
              ) : (
                <ul className="space-y-2">
                  {saved.map((m) => (
                    <li key={m.id} className="flex items-center justify-between stitched-b pb-2 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-foreground">{m.label}</p>
                        <p className="text-xs text-muted-foreground">{new Date(m.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-primary">{formatLen(m.cm, unit)}</span>
                        <button onClick={() => setSaved((prev) => prev.filter((x) => x.id !== m.id))} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-secondary/40 p-4 flex gap-3">
              <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                {stageMode === 'auto'
                  ? 'Auto mode uses on-device pose AI. Enter your height to calibrate, stand back to fit the dashed template, and your measurements update live. Circumferences are estimates.'
                  : stageMode === 'live'
                    ? 'Live mode: the camera stays on — tap to place points and drag them to fine-tune. Keep the reference object at roughly the same distance as what you are measuring.'
                    : 'Tip: keep the reference object at roughly the same distance from the camera as the body part you are measuring, and capture straight-on for the most accurate result.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}