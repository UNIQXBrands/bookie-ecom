export function InvoiceTable({ columns = [], rows = [], onRowClick, style, ...rest }) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '2px solid #020309',
        borderRadius: '12px',
        boxShadow: '3px 3px 0 #020309',
        overflow: 'hidden',
        ...style,
      }}
      {...rest}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'DM Sans', sans-serif" }}>
        <thead>
          <tr style={{ background: '#020309' }}>
            {columns.map((c) => (
              <th key={c.key} style={{
                padding: '10px 16px',
                textAlign: c.align || 'left',
                color: '#FAF3E3',
                fontWeight: 600,
                fontSize: '11px',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                width: c.width,
                whiteSpace: 'nowrap',
              }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id ?? i}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#FAF3E3'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              style={{
                borderBottom: i === rows.length - 1 ? 'none' : '1.5px solid #e8e0d0',
                cursor: onRowClick ? 'pointer' : 'default',
                transition: 'background .1s ease',
              }}
            >
              {columns.map((c) => (
                <td key={c.key} style={{
                  padding: '11px 16px',
                  textAlign: c.align || 'left',
                  fontFamily: c.mono ? "'DM Mono', monospace" : "'DM Sans', sans-serif",
                  fontWeight: c.mono ? 500 : 400,
                  fontSize: '12.5px',
                  color: '#020309',
                  verticalAlign: 'middle',
                }}>{row[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
