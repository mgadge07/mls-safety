// =============================================================================
// MLS SAFETY — Phase 1
// Daily Vehicle + Trailer inspections via QR, categorized checks, signature,
// problem photos, and automated audit trail.
// =============================================================================

import { useState } from 'react';
import { COLOR, button } from './theme';

// Screens
import HomeScreen from './screens/HomeScreen';
import QrScanScreen from './screens/QrScanScreen';
import InspectionScreen from './screens/InspectionScreen';
import SignatureScreen from './screens/SignatureScreen';
import ConfirmationScreen from './screens/ConfirmationScreen';

export default function App() {
  // Simple state machine for Phase 1 (no router needed)
  const [screen, setScreen] = useState('home'); // home | scan | inspect | sign | done
  const [unitType, setUnitType] = useState(null); // 'vehicle' | 'trailer'
  const [unit, setUnit] = useState(null);         // { id, number, ... }
  const [inspectionResult, setInspectionResult] = useState(null);

  function startInspection(type) {
    setUnitType(type);
    setUnit(null);
    setInspectionResult(null);
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

  function onSigned(finalPayload) {
    // TODO: save to Supabase
    console.log('Submitting inspection', finalPayload);
    setScreen('done');
  }

  function reset() {
    setScreen('home');
    setUnitType(null);
    setUnit(null);
    setInspectionResult(null);
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
        />
      )}
      {screen === 'done' && (
        <ConfirmationScreen
          unit={unit}
          unitType={unitType}
          onHome={reset}
        />
      )}
    </div>
  );
}
