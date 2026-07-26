import { COLOR, button } from '../theme';

export default function HomeScreen({ onStart }) {
  return (
    <div style={{ padding: '32px 24px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 48,
      }}>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>
          MLS Safety
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: 999,
          background: 'rgba(120,140,200,.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, color: COLOR.textDim,
        }}>
          •
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20 }}>
        <h1 style={{
          fontSize: 28, fontWeight: 700, textAlign: 'center',
          marginBottom: 12, letterSpacing: '-0.03em',
        }}>
          Daily Inspections
        </h1>
        <p style={{
          textAlign: 'center', color: COLOR.textDim, fontSize: 15,
          marginBottom: 32, lineHeight: 1.5,
        }}>
          Scan the QR code inside the vehicle or trailer to begin.
        </p>

        <button
          style={button('primary')}
          onClick={() => onStart('vehicle')}
        >
          Inspect Vehicle
        </button>

        <button
          style={{ ...button('primary'), background: 'transparent', border: `2px solid ${COLOR.accent}`, color: COLOR.accent, boxShadow: 'none' }}
          onClick={() => onStart('trailer')}
        >
          Inspect Trailer
        </button>
      </div>

      <div style={{ textAlign: 'center', color: COLOR.textFaint, fontSize: 12, marginTop: 40 }}>
        Merchants Landscaping Services
      </div>
    </div>
  );
}
