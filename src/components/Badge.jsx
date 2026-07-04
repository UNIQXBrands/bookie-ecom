export function Badge({ variant = 'pending', dot = false, children, style, ...rest }) {
  const bg = {
    paid:    '#D2ECD0',
    pending: '#FDEEC4',
    review:  '#F3C1C0',
    info:    '#E5F5F9',
    neutral: '#FAF3E3',
  }[variant] || '#FDEEC4';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 9px',
        background: bg,
        border: '1.5px solid #020309',
        borderRadius: '9999px',
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 700,
        fontSize: '10.5px',
        lineHeight: 1.4,
        color: '#020309',
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...rest}
    >
      {dot ? (
        <span style={{
          width: '6px', height: '6px', borderRadius: '50%',
          border: '1.5px solid #020309',
          background: variant === 'paid' ? '#020309' : 'transparent',
        }} />
      ) : null}
      {children}
    </span>
  );
}

export function BtwPill({ rate = 21, style, ...rest }) {
  const map = { 21: '#E5F5F9', 9: '#D2ECD0', 0: '#FAF3E3' };
  const bg    = map[rate] ?? '#F3C1C0';
  const label = (rate === 0 || rate === 9 || rate === 21) ? `${rate}%` : '?';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '40px',
        padding: '3px 9px',
        background: bg,
        border: '1.5px solid #020309',
        borderRadius: '9999px',
        fontFamily: "'DM Mono', monospace",
        fontWeight: 500,
        fontSize: '11px',
        color: '#020309',
        ...style,
      }}
      {...rest}
    >
      {label}
    </span>
  );
}
