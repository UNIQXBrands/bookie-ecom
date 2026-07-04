import { useRef } from 'react';

export function Button({
  variant = 'primary',
  size = 'md',
  icon = null,
  disabled = false,
  type = 'button',
  onClick,
  children,
  style,
  ...rest
}) {
  const shineRef = useRef(null);

  const palette = {
    primary: { bg: '#020309', fg: '#FAF3E3' },
    default: { bg: '#FFFFFF', fg: '#020309' },
    accent:  { bg: '#D2ECD0', fg: '#020309' },
    warn:    { bg: '#F3C1C0', fg: '#020309' },
    ghost:   { bg: 'transparent', fg: '#020309' },
  }[variant] || { bg: '#020309', fg: '#FAF3E3' };

  const pad = size === 'sm' ? '6px 10px' : '8px 14px';
  const fs  = size === 'sm' ? '12px' : '13px';

  // Shine opacity: subtle on dark bg, more visible on light
  const shineAlpha = variant === 'primary' ? '0.12' : '0.45';

  const base = {
    position: 'relative',
    overflow: 'hidden',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: pad,
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    fontSize: fs,
    lineHeight: 1.2,
    color: palette.fg,
    background: palette.bg,
    border: variant === 'ghost' ? '2px solid transparent' : '2px solid #020309',
    borderRadius: '10px',
    boxShadow: variant === 'ghost' ? 'none' : '3px 3px 0 #020309',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: 'transform .1s ease, box-shadow .1s ease',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    ...style,
  };

  const onEnter = (e) => {
    if (disabled || variant === 'ghost') return;
    e.currentTarget.style.transform = 'translate(-1px,-1px)';
    e.currentTarget.style.boxShadow = '4px 4px 0 #020309';
    if (shineRef.current) shineRef.current.style.left = '200%';
  };
  const onLeave = (e) => {
    if (disabled || variant === 'ghost') return;
    e.currentTarget.style.transform = 'translate(0,0)';
    e.currentTarget.style.boxShadow = '3px 3px 0 #020309';
    if (shineRef.current) {
      shineRef.current.style.transition = 'none';
      shineRef.current.style.left = '-60%';
      requestAnimationFrame(() => {
        if (shineRef.current) shineRef.current.style.transition = 'left 0.5s ease';
      });
    }
  };
  const onDown = (e) => {
    if (disabled || variant === 'ghost') return;
    e.currentTarget.style.transform = 'translate(1px,1px)';
    e.currentTarget.style.boxShadow = '2px 2px 0 #020309';
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onMouseDown={onDown}
      onMouseUp={onEnter}
      style={base}
      {...rest}
    >
      {/* shine sweep */}
      {variant !== 'ghost' && !disabled && (
        <span
          ref={shineRef}
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-15%', left: '-60%',
            width: '40px', height: '130%',
            background: `rgba(255,255,255,${shineAlpha})`,
            transform: 'rotate(18deg)',
            transition: 'left 0.5s ease',
            pointerEvents: 'none',
          }}
        />
      )}
      {icon ? <span style={{ display: 'inline-flex' }}>{icon}</span> : null}
      {children}
    </button>
  );
}
