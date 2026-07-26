import { useState } from 'react';
import { COLOR, button } from '../theme';
import { supabase } from '../lib/supabase';

export default function QrScanScreen({ unitType, onSuccess, onCancel }) {
  const [manualMode, setManualMode] = useState(false);
  const [manualNumber, setManualNumber] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function lookupUnit(number) {
    setBusy(true);
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
        setError(`No active ${unitType} found with number "${number}"`);
        return;
      }
      onSuccess(data);
    } catch (e) {
      setError(e.message || 'Lookup failed');
    } finally {
      setBusy(false);
    }
  }

  // Temporary: simulate a successful QR scan for testing
  function simulateScan() {
    // In real build this will be replaced by html5-qrcode
    const demoNumber = unitType === 'vehicle' ? 'V-104' : 'T-201';
    lookupUnit(demoNumber);
  }

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

      {/* Camera placeholder — will be replaced with real scanner */}
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
      }}>
        <div style={{
          width: 200, height: 200,
          border: `3px solid ${COLOR.accent}`,
          borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: COLOR.textDim, fontSize: 14,
        }}>
          Camera view
        </div>
        <div style={{ marginTop: 16, color: COLOR.textFaint, fontSize: 13 }}>
          QR scanner will appear here
        </div>
      </div>

      {/* Temporary demo button */}
      <button style={{ ...button('primary'), marginBottom: 12 }} onClick={simulateScan} disabled={busy}>
        {busy ? 'Looking up…' : 'Simulate successful scan (demo)'}
      </button>

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
            Look up
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
