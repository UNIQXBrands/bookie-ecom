export function Card({ variant = 'default', hoverable = false, onClick, children, style, ...rest }) {
  const bg = {
    default: '#FFFFFF',
    yellow:  '#FDEEC4',
    green:   '#D2ECD0',
    red:     '#F3C1C0',
    blue:    '#E5F5F9',
  }[variant] || '#FFFFFF';

  const base = {
    background: bg,
    border: '2px solid #020309',
    borderRadius: '12px',
    boxShadow: '3px 3px 0 #020309',
    padding: '16px 20px',
    transition: 'transform .1s ease, box-shadow .1s ease',
    cursor: hoverable || onClick ? 'pointer' : 'default',
    ...style,
  };

  const hover = (lift) => (e) => {
    if (!(hoverable || onClick)) return;
    e.currentTarget.style.transform = lift ? 'translate(-1px,-1px)' : 'translate(0,0)';
    e.currentTarget.style.boxShadow = lift ? '5px 5px 0 #020309' : '3px 3px 0 #020309';
  };

  return (
    <div onClick={onClick} onMouseEnter={hover(true)} onMouseLeave={hover(false)} style={base} {...rest}>
      {children}
    </div>
  );
}
