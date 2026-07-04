const labelStyle = {
  display: 'block',
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 700,
  fontSize: '11px',
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
  color: '#020309',
  marginBottom: '6px',
};

const fieldBase = {
  width: '100%',
  padding: '10px 14px',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '13px',
  color: '#020309',
  background: '#FFFFFF',
  border: '2px solid #020309',
  borderRadius: '10px',
  outline: 'none',
  boxShadow: 'none',
  transition: 'box-shadow .1s ease',
};

const focusHandlers = () => ({
  onFocus: (e) => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(2,3,9,0.15)'; },
  onBlur:  (e) => { e.currentTarget.style.boxShadow = 'none'; },
});

export function Input({ label, mono = false, id, style, ...rest }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {label ? <label htmlFor={id} style={labelStyle}>{label}</label> : null}
      <input
        id={id}
        style={{ ...fieldBase, fontFamily: mono ? "'DM Mono', monospace" : fieldBase.fontFamily, ...style }}
        {...focusHandlers()}
        {...rest}
      />
    </div>
  );
}

export function Textarea({ label, id, rows = 3, style, ...rest }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {label ? <label htmlFor={id} style={labelStyle}>{label}</label> : null}
      <textarea
        id={id}
        rows={rows}
        style={{ ...fieldBase, resize: 'vertical', lineHeight: 1.55, ...style }}
        {...focusHandlers()}
        {...rest}
      />
    </div>
  );
}
