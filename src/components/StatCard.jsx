export function StatCard({ label, value, sub, icon = null, variant = 'yellow', style, ...rest }) {
  const bg = {
    yellow: '#FDEEC4',
    green:  '#D2ECD0',
    red:    '#F3C1C0',
    blue:   '#E5F5F9',
  }[variant] || '#FDEEC4';

  return (
    <div
      style={{
        background: bg,
        border: '2px solid #020309',
        borderRadius: '12px',
        boxShadow: '3px 3px 0 #020309',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        ...style,
      }}
      {...rest}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {icon ? <span style={{ display: 'inline-flex', fontSize: '13px' }}>{icon}</span> : null}
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 700,
          fontSize: '10px',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          color: '#444444',
        }}>{label}</span>
      </div>
      <span style={{
        fontFamily: "'DM Mono', monospace",
        fontWeight: 700,
        fontSize: '22px',
        letterSpacing: '-0.5px',
        color: '#020309',
        lineHeight: 1.2,
      }}>{value}</span>
      {sub ? (
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, fontSize: '11px', color: '#444444' }}>{sub}</span>
      ) : null}
    </div>
  );
}
