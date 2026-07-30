// =============================================================================
// MLS SAFETY — Phase 1
// Daily Vehicle + Trailer inspections via QR, categorized checks, signature,
// problem photos, and automated audit trail.
// =============================================================================

import { useState } from 'react';
import { COLOR, button } from './theme';
import { supabase } from './lib/supabase';

// Screens
import HomeScreen from './screens/HomeScreen';
import QrScanScreen from './screens/QrScanScreen';
import InspectionScreen from './screens/InspectionScreen';
import SignatureScreen from './screens/SignatureScreen';
import ConfirmationScreen from './screens/ConfirmationScreen';

// Try to capture GPS. Never blocks submission: resolves with {} if the user
// denies permission, the device has no GPS, or it takes longer than 6 seconds.
function getGps() {
  return new Promise(resolve => {
    if (!('geolocation' in navigator)) return resolve({});
    navigator.geolocation.getCurrentPosition(
      pos => resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy_m: pos.coords.accuracy,
      }),
      () => resolve({}),
      { timeout: 6000, maximumAge: 60000 }
    );
  });
}

export default function App() {
  // Simple state machine for Phase 1 (no router needed)
  const [screen, setScreen] = useState('home'); // home | scan | inspect | sign | done
  const [unitType, setUnitType] = useState(null); // 'vehicle' | 'trailer'
  const [unit, setUnit] = useState(null);         // { id, number, ... }
  const [inspectionResult, setInspectionResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [gpsRecorded, setGpsRecorded] = useState(false);

  function startInspection(type) {
    setUnitType(type);
    setUnit(null);
    setInspectionResult(null);
    setSaveError(null);
    setScreen('scan');
  }

  function onQrSuccess(scannedUnit) {
    setUnit(scannedUnit);
    setScreen('inspect');
  }

  function onInspectionComplete(result) {
    setInspectionResult(result);
    setScreen('sign');
  }

  async function onSigned(finalPayload) {
    setSaving(true);
    setSaveError(null);
    try {
      const gps = await getGps();

      // Generate the inspection id on the device so we can link the category
      // rows to it without needing read access to the inspections table.
      const inspectionId = crypto.randomUUID();

      const { error: inspErr } = await supabase.from('inspections').insert({
        id: inspectionId,
        type: unitType,
        vehicle_id: unitType === 'vehicle' ? unit.id : null,
        trailer_id: unitType === 'trailer' ? unit.id : null,
        is_monday_full: finalPayload.is_monday_full,
        submitted_by_name: finalPayload.submitted_by_name,
        employee_number: finalPayload.employee_number,
        signature_path: finalPayload.signature_data, // base64 PNG for Phase 1
        latitude: gps.latitude ?? null,
        longitude: gps.longitude ?? null,
        accuracy_m: gps.accuracy_m ?? null,
        device_info: navigator.userAgent,
        overall_status: finalPayload.overall_status,
      });
      if (inspErr) throw inspErr;

      const categoryRows = finalPayload.categories.map((c, i) => ({
        inspection_id: inspectionId,
        category_key: c.key,
        category_label: c.label,
        status: c.status,
        problem_description: c.problem_description,
        sort_order: i,
      }));
      const { error: catErr } = await supabase
        .from('inspection_categories')
        .insert(categoryRows);
      if (catErr) throw catErr;

      setGpsRecorded(gps.latitude != null);
      setScreen('done');
    } catch (err) {
      setSaveError(
        'Could not save the inspection. Check your connection and tap Submit again. ' +
        `(${err.message || 'Unknown error'})`
      );
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setScreen('home');
    setUnitType(null);
    setUnit(null);
    setInspectionResult(null);
    setSaveError(null);
    setGpsRecorded(false);
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: COLOR.bg,
      color: COLOR.text,
      maxWidth: 480,
      margin: '0 auto',
      position: 'relative',
    }}>
      {screen === 'home' && (
        <HomeScreen onStart={startInspection} />
      )}
      {screen === 'scan' && (
        <QrScanScreen
          unitType={unitType}
          onSuccess={onQrSuccess}
          onCancel={reset}
        />
      )}
      {screen === 'inspect' && unit && (
        <InspectionScreen
          unitType={unitType}
          unit={unit}
          onComplete={onInspectionComplete}
          onCancel={reset}
        />
      )}
      {screen === 'sign' && (
        <SignatureScreen
          unit={unit}
          unitType={unitType}
          inspectionResult={inspectionResult}
          onSubmit={onSigned}
          onBack={() => setScreen('inspect')}
          saving={saving}
          submitError={saveError}
        />
      )}
      {screen === 'done' && (
        <ConfirmationScreen
          unit={unit}
          unitType={unitType}
          gpsRecorded={gpsRecorded}
          onHome={reset}
        />
      )}
    </div>
  );
}
