import { COLOR, button } from '../theme';

export default function ConfirmationScreen({ unit, unitType, onHome }) {
  const unitNumber = unitType === 'vehicle' ? unit?.vehicle_number : unit?.trailer_number;
  const now = new Date();

  return (
    <div style={{
      padding: '40px 24px', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center',
    }}>
      <div style={{
        width: 88, height: 88, borderRadius: 999,
        background: 'rgba(61,220,151,.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 28,
        boxShadow: '0 0 30px rgba(61,220,151,.25)',
      }}>
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="#3DDC97" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 10 }}>
        Inspection Submitted
      </h1>
      <p style={{ color: COLOR.textDim, fontSize: 15, lineHeight: 1.5, marginBottom: 36 }}>
        {unitType === 'vehicle' ? 'Vehicle' : 'Trailer'} {unitNumber}<br />
        {now.toLocaleDateString()} • {now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        <br />GPS recorded
      </p>

      <button style={{ ...button('primary'), maxWidth: 280 }} onClick={onHome}>
        Return to Home
      </button>
    </div>
  );
}
