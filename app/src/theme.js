// Meridian design tokens — kept in sync with GSI Pulse
export const COLOR = {
  bg: '#0A0E1A',
  surface: 'rgba(16,22,42,.8)',
  surfaceHi: 'rgba(120,140,200,.08)',
  border: 'rgba(120,140,200,.14)',
  text: '#E8ECF6',
  textDim: '#8A93B0',
  textFaint: '#5a648a',
  emph: '#C6CEE6',
  accent: '#5B8DEF',
  accentLight: '#7FB0FF',
  green: '#3DDC97',
  yellow: '#F5B84C',
  red: '#F26D6D',
};

export const card = {
  background: COLOR.surface,
  border: `1px solid ${COLOR.border}`,
  borderRadius: 14,
  padding: '22px 24px',
  marginBottom: 16,
};

export const button = (variant = 'primary', disabled = false) => ({
  background: disabled ? 'rgba(120,140,200,.15)' : (variant === 'primary' ? COLOR.accent : 'transparent'),
  color: variant === 'primary' ? '#FFFFFF' : COLOR.emph,
  border: variant === 'primary' ? 'none' : `1px solid rgba(120,140,200,.25)`,
  borderRadius: 10,
  padding: '14px 20px',
  fontSize: 16,
  fontWeight: 600,
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontFamily: 'inherit',
  opacity: disabled ? 0.55 : 1,
  width: '100%',
  boxShadow: variant === 'primary' && !disabled ? '0 0 14px rgba(91,141,239,.4)' : 'none',
});
