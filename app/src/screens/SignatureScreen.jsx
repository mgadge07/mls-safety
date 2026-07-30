import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { COLOR, button } from '../theme';

export default function SignatureScreen({ unit, unitType, inspectionResult, onSubmit, onBack, saving, submitError }) {
  const sigRef = useRef(null);
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [error, setError] = useState(null);

  const unitNumber = unitType === 'vehicle' ? unit.vehicle_number : unit.trailer_number;

  function handleSubmit() {
    if (saving) return;
    if (!sigRef.current || sigRef.current.isEmpty()) {
      setError('Signature is required');
      return;
    }
    setError(null);
    const signatureDataUrl = sigRef.current.toDataURL('image/png');
    onSubmit({
      ...inspectionResult,
      unit,
      unitType,
      submitted_by_name: 'Signed', // we can improve this later
      employee_number: employeeNumber.trim() || null,
      signature_data: signatureDataUrl,
    });
  }

  return (
    <div style={{ padding: '24px 20px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <button
        onClick={onBack}
        style={{ background: 'none', border: 'none', color: COLOR.textDim, fontSize: 14, marginBottom: 16, textAlign: 'left', cursor: 'pointer' }}
      >
        ← Back
      </button>

      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
        Almost done
      </h2>
      <p style={{ color: COLOR.textDim, fontSize: 14, marginBottom: 24 }}>
        {unitType === 'vehicle' ? 'Vehicle' : 'Trailer'} {unitNumber}
      </p>

      <div style={{
        background: 'rgba(10,14,26,.5)',
        border: `2px dashed ${COLOR.border}`,
        borderRadius: 12,
        height: 200,
        marginBottom: 16,
        overflow: 'hidden',
      }}>
        <SignatureCanvas
          ref={sigRef}
          penColor="#E8ECF6"
          backgroundColor="rgba(0,0,0,0)"
          canvasProps={{
            width: 400,
            height: 200,
            style: { width: '100%', height: '100%' },
          }}
        />
      </div>
      <div style={{ textAlign: 'center', color: COLOR.textFaint, fontSize: 13, marginBottom: 20 }}>
        Sign above
      </div>

      <label style={{ fontSize: 13, color: COLOR.textDim, marginBottom: 6 }}>
        Employee # (optional)
      </label>
      <input
        value={employeeNumber}
        onChange={e => setEmployeeNumber(e.target.value)}
        placeholder="e.g. 4521"
        style={{
          width: '100%', padding: '12px 14px', borderRadius: 8,
          background: 'rgba(10,14,26,.6)', color: COLOR.text,
          border: `1px solid ${COLOR.border}`, fontSize: 15, marginBottom: 20,
        }}
      />

      {error && (
        <div style={{ color: COLOR.red, fontSize: 14, marginBottom: 12 }}>{error}</div>
      )}
      {submitError && (
        <div style={{ color: COLOR.red, fontSize: 14, marginBottom: 12 }}>{submitError}</div>
      )}

      <button style={button('primary', saving)} onClick={handleSubmit} disabled={saving}>
        {saving ? 'Submitting…' : 'Submit Inspection'}
      </button>

      <button
        onClick={() => sigRef.current?.clear()}
        disabled={saving}
        style={{
          background: 'none', border: 'none', color: COLOR.textDim,
          fontSize: 14, marginTop: 14, cursor: 'pointer',
        }}
      >
        Clear signature
      </button>
    </div>
  );
}
