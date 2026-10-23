import React, { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';

export default function CameraStage({ facingMode, onCapture, onCancel }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    setError('');
    setReady(false);
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
        if (!active) { s.getTracks().forEach(t => t.stop()); return; }
        setStream(s);
      } catch (e) {
        setError('Could not access the camera. Please grant camera permission and try again on a device with a camera.');
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

  useEffect(() => () => { if (stream) stream.getTracks().forEach(t => t.stop()); }, [stream]);

  const capture = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement('canvas');
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    onCapture(c.toDataURL('image/jpeg', 0.85), { naturalWidth: c.width, naturalHeight: c.height });
  };

  return (
    <div className="w-full">
      <div className="relative w-full bg-primary overflow-hidden" style={{ aspectRatio: '4 / 3' }}>
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-primary-foreground/70 text-sm">
            Starting camera…
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-primary-foreground/80 text-sm">
            {error}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 mt-4">
        <button onClick={onCancel} className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" /> Cancel
        </button>
        <button
          onClick={capture}
          disabled={!ready}
          className="inline-flex items-center gap-2 btn-primary disabled:opacity-40"
        >
          <Camera className="w-4 h-4" /> Capture
        </button>
      </div>
    </div>
  );
}