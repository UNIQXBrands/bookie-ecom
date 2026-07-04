export function Checkbox({ label, checked = false, onChange, id, style, ...rest }) {
  return (
    <label
      htmlFor={id}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 14px',
        background: '#FFFFFF',
        border: '2px solid #020309',
        borderRadius: '10px',
        boxShadow: '3px 3px 0 #020309',
        cursor: 'pointer',
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 500,
        fontSize: '13px',
        color: '#020309',
        userSelect: 'none',
        ...style,
      }}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
        {...rest}
      />
      <span
        aria-hidden="true"
        style={{
          width: '16px', height: '16px', flexShrink: 0,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid #020309', borderRadius: '4px',
          background: checked ? '#D2ECD0' : '#FFFFFF',
          fontFamily: "'DM Mono', monospace",
          fontSize: '12px', fontWeight: 700, lineHeight: 1,
        }}
      >
        {checked ? '✓' : ''}
      </span>
      {label}
    </label>
  );
}
