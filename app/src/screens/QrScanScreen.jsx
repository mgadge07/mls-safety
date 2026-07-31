import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { COLOR, button } from '../theme';
import { supabase } from '../lib/supabase';

export default function QrScanScreen({ unitType, onSuccess, onCancel }) {
  const [manualMode, setManualMode] = useState(false);
  const [manualNumber, setManualNumber] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  // 'starting' | 'active' | 'unavailable'
  const [cameraState, setCameraState] = useState('starting');

  const videoRef = useRef(null);
  const busyRef = useRef(false);
  const lastScanRef = useRef({ text: null, at: 0 });

  async function lookupUnit(number) {
    setBusy(true);
    busyRef.current = true;
    setError(null);
    try {
      const table = unitType === 'vehicle' ? 'vehicles' : 'trailers';
      const column = unitType === 'vehicle' ? 'vehicle_number' : 'trailer_number';

      const { data, error: qErr } = await supabase
        .from(table)
        .select('*')
        .eq(column, number.trim().toUpperCase())
        .eq('active', true)
        .maybeSingle();

      if (qErr) throw qErr;
      if (!data) {
        setError(`No active ${unitType} found with number "${number.trim()}"`);
        return;
      }
      onSuccess(data);
    } catch (e) {
      setError(e.message || 'Lookup failed');
    } finally {
      setBusy(false);
      busyRef.current = false;
    }
  }

  function handleScan(text) {
    const now = Date.now();
    // Ignore repeats of the same code within 3 seconds so a failed lookup
    // doesn't fire over and over while the label is still in frame.
    if (lastScanRef.current.text === text && now - lastScanRef.current.at < 3000) return;
    lastScanRef.current = { text, at: now };
    lookupUnit(text);
  }

  useEffect(() => {
    let stream = null;
    let raf = null;
    let cancelled = false;
    const video = videoRef.current;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        video.srcObject = stream;
        await video.play();
        setCameraState('active');

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        let last = 0;

        const tick = ts => {
          if (cancelled) return;
          if (ts - last > 200 && video.readyState === 4 && !busyRef.current) {
            last = ts;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            if (canvas.width > 0) {
              ctx.drawImage(video, 0, 0);
              const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(img.data, img.width, img.height, {
                inversionAttempts: 'dontInvert',
              });
              if (code && code.data && code.data.trim()) handleScan(code.data.trim());
            }
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch {
        if (!cancelled) {
          setCameraState('unavailable');
          setManualMode(true);
        }
      }
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      start();
    } else {
      setCameraState('unavailable');
      setManualMode(true);
    }

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ padding: '24px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <button
        onClick={onCancel}
        style={{ background: 'none', border: 'none', color: COLOR.textDim, fontSize: 15, marginBottom: 20, textAlign: 'left', cursor: 'pointer' }}
      >
        ← Cancel
      </button>

      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
        Scan {unitType === 'vehicle' ? 'Vehicle' : 'Trailer'} QR Code
      </h2>
      <p style={{ color: COLOR.textDim, fontSize: 14, marginBottom: 28 }}>
        Point the camera at the code posted inside the unit.
      </p>

      <div style={{
        flex: 1,
        minHeight: 280,
        background: 'rgba(0,0,0,.4)',
        borderRadius: 16,
        border: `2px dashed ${COLOR.border}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <video
          ref={videoRef}
          muted
          playsInline
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: cameraState === 'active' ? 'block' : 'none',
          }}
        />

        {cameraState === 'active' && (
          <div style={{
            position: 'relative',
            width: 200, height: 200,
            border: `3px solid ${COLOR.accent}`,
            borderRadius: 12,
            boxShadow: '0 0 0 4000px rgba(0,0,0,.35)',
          }} />
        )}

        {cameraState === 'starting' && (
          <div style={{ color: COLOR.textDim, fontSize: 14, textAlign: 'center', padding: 20 }}>
            Starting camera…
          </div>
        )}

        {cameraState === 'unavailable' && (
          <div style={{ color: COLOR.textDim, fontSize: 14, textAlign: 'center', padding: 20, lineHeight: 1.6 }}>
            Camera unavailable.<br />
            Allow camera access in your browser, or enter the unit number below.
          </div>
        )}

        {cameraState === 'active' && busy && (
          <div style={{
            position: 'absolute', bottom: 12, left: 0, right: 0,
            textAlign: 'center', color: COLOR.text, fontSize: 13,
            textShadow: '0 1px 4px rgba(0,0,0,.8)',
          }}>
            Looking up…
          </div>
        )}
      </div>

      <button
        style={{ background: 'none', border: 'none', color: COLOR.accent, fontSize: 14, marginBottom: 16, cursor: 'pointer' }}
        onClick={() => setManualMode(!manualMode)}
      >
        {manualMode ? 'Hide manual entry' : 'Enter number manually'}
      </button>

      {manualMode && (
        <div style={{ marginBottom: 16 }}>
          <input
            value={manualNumber}
            onChange={e => setManualNumber(e.target.value)}
            placeholder={unitType === 'vehicle' ? 'e.g. V-104' : 'e.g. T-201'}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 10,
              background: 'rgba(10,14,26,.6)', color: COLOR.text,
              border: `1px solid ${COLOR.border}`, fontSize: 16, marginBottom: 10,
            }}
          />
          <button
            style={button('primary', busy || !manualNumber.trim())}
            onClick={() => lookupUnit(manualNumber)}
            disabled={busy || !manualNumber.trim()}
          >
            {busy ? 'Looking up…' : 'Look up'}
          </button>
        </div>
      )}

      {error && (
        <div style={{ color: COLOR.red, fontSize: 14, textAlign: 'center', marginTop: 8 }}>
          {error}
        </div>
      )}
    </div>
  );
}
