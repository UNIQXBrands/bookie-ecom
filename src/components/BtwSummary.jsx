export function BtwSummary({
  title = 'BTW deze periode',
  sub = 'Q2 2025 · apr–jun',
  items = [],
  total,
  totalLabel = 'Te betalen',
  style,
  ...rest
}) {
  return (
    <div
      style={{
        background: '#FDEEC4',
        border: '2px solid #020309',
        borderRadius: '12px',
        boxShadow: '3px 3px 0 #020309',
        padding: '18px 22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
        flexWrap: 'wrap',
        ...style,
      }}
      {...rest}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '15px', color: '#020309' }}>{title}</span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#444444' }}>{sub}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
        {items.map((it) => (
          <div key={it.rate} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', color: '#444444' }}>{it.rate}</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: '22px', letterSpacing: '-0.5px', color: '#020309' }}>{it.amount}</span>
          </div>
        ))}
        {total != null ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', paddingLeft: '32px', borderLeft: '2px solid #020309' }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', color: '#444444' }}>{totalLabel}</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: '24px', letterSpacing: '-0.5px', color: '#020309' }}>{total}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
