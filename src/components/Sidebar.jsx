import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

export function Sidebar({ items = [], bottomItems = [], active, onSelect, brand = 'Bookie', style, ...rest }) {
  const allItems = [...items, ...bottomItems];

  const [expanded, setExpanded] = useState(() => {
    const s = new Set();
    allItems.forEach((item) => {
      if (item.children?.some((c) => c.key === active)) s.add(item.key);
    });
    return s;
  });

  useEffect(() => {
    allItems.forEach((item) => {
      if (item.children?.some((c) => c.key === active)) {
        setExpanded((prev) => { const s = new Set(prev); s.add(item.key); return s; });
      }
    });
  }, [active]);

  function handleClick(item) {
    if (item.children?.length) {
      const isOpen = expanded.has(item.key);
      setExpanded((prev) => {
        const s = new Set(prev);
        isOpen ? s.delete(item.key) : s.add(item.key);
        return s;
      });
      if (!isOpen) onSelect?.(item.children[0].key);
    } else {
      onSelect?.(item.key);
    }
  }

  function isParentActive(item) {
    return item.children?.some((c) => c.key === active);
  }

  return (
    <nav style={{
      width: '220px', flexShrink: 0,
      background: 'var(--sidebar-bg, #393222)',
      borderRight: '2px solid #020309',
      display: 'flex', flexDirection: 'column',
      paddingTop: '20px',
      ...style,
    }} {...rest}>

      <div style={{
        display: 'flex', alignItems: 'center', gap: '9px',
        padding: '0 20px 20px',
        fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
        fontSize: '20px', letterSpacing: '-0.5px', color: '#FAF3E3',
      }}>
        <span style={{
          width: '24px', height: '24px',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: '#FDEEC4', border: '2px solid #020309', borderRadius: '6px',
          color: '#020309', fontSize: '13px', fontWeight: 700,
        }}>B</span>
        {brand}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {items.map((item) => {
          const hasChildren = item.children?.length > 0;
          const parentActive = isParentActive(item);
          const selfActive   = active === item.key;
          const anyActive    = selfActive || parentActive;
          const isOpen       = expanded.has(item.key);

          return (
            <div key={item.key}>
              <button
                onClick={() => handleClick(item)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  width: '100%', textAlign: 'left',
                  padding: '10px 20px',
                  background: anyActive ? 'var(--sidebar-bg-active, #4C4533)' : 'transparent',
                  borderLeft: anyActive ? '3px solid var(--sidebar-accent, #FDEEC4)' : '3px solid transparent',
                  borderTop: 'none', borderRight: 'none', borderBottom: 'none',
                  color: anyActive ? 'var(--sidebar-text-active, #FAF3E3)' : 'var(--sidebar-text, #A89F88)',
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: '13.5px',
                  cursor: 'pointer', transition: 'color .1s ease, background .1s ease',
                }}
                onMouseEnter={(e) => { if (!anyActive) { e.currentTarget.style.color = '#FAF3E3'; e.currentTarget.style.background = '#443D2D'; } }}
                onMouseLeave={(e) => { if (!anyActive) { e.currentTarget.style.color = '#A89F88'; e.currentTarget.style.background = 'transparent'; } }}
              >
                {item.icon
                  ? <span style={{ display: 'inline-flex', width: '16px', justifyContent: 'center' }}>{item.icon}</span>
                  : null}
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge ? (
                  <span style={{
                    background: item.badgeVariant === 'alert' ? '#F3C1C0' : '#FDEEC4',
                    color: '#020309', fontWeight: 700, fontSize: '10px',
                    padding: '2px 7px', borderRadius: '20px',
                  }}>{item.badge}</span>
                ) : null}
                {hasChildren && (
                  <span style={{ display: 'inline-flex', opacity: 0.6 }}>
                    {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </span>
                )}
              </button>

              {hasChildren && isOpen && (
                <div style={{ paddingBottom: '4px' }}>
                  {item.children.map((child) => {
                    const childActive = active === child.key;
                    return (
                      <button
                        key={child.key}
                        onClick={() => onSelect?.(child.key)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          width: '100%', textAlign: 'left',
                          padding: '7px 20px 7px 48px',
                          background: childActive ? 'rgba(255,255,255,0.07)' : 'transparent',
                          borderLeft: childActive ? '3px solid var(--sidebar-accent, #FDEEC4)' : '3px solid transparent',
                          borderTop: 'none', borderRight: 'none', borderBottom: 'none',
                          color: childActive ? '#FAF3E3' : '#8A8270',
                          fontFamily: "'DM Sans', sans-serif", fontWeight: childActive ? 600 : 400,
                          fontSize: '12.5px', cursor: 'pointer',
                          transition: 'color .1s ease, background .1s ease',
                        }}
                        onMouseEnter={(e) => { if (!childActive) { e.currentTarget.style.color = '#FAF3E3'; e.currentTarget.style.background = '#443D2D'; } }}
                        onMouseLeave={(e) => { if (!childActive) { e.currentTarget.style.color = '#8A8270'; e.currentTarget.style.background = 'transparent'; } }}
                      >
                        {child.icon
                          ? <span style={{ display: 'inline-flex', width: '14px', justifyContent: 'center' }}>{child.icon}</span>
                          : null}
                        {child.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {bottomItems.length > 0 && (
          <>
            <div style={{ marginTop: 'auto', height: '1px', background: 'var(--sidebar-divider, #4A4232)', margin: 'auto 20px 0' }} />
            {bottomItems.map((item) => {
              const isActive = active === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => onSelect?.(item.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    width: '100%', textAlign: 'left',
                    padding: '10px 20px',
                    background: isActive ? 'var(--sidebar-bg-active, #4C4533)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--sidebar-accent, #FDEEC4)' : '3px solid transparent',
                    borderTop: 'none', borderRight: 'none', borderBottom: 'none',
                    color: isActive ? 'var(--sidebar-text-active, #FAF3E3)' : 'var(--sidebar-text, #A89F88)',
                    fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: '13.5px',
                    cursor: 'pointer', transition: 'color .1s ease, background .1s ease',
                  }}
                  onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.color = '#FAF3E3'; e.currentTarget.style.background = '#443D2D'; } }}
                  onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.color = '#A89F88'; e.currentTarget.style.background = 'transparent'; } }}
                >
                  {item.icon && <span style={{ display: 'inline-flex', width: '16px', justifyContent: 'center' }}>{item.icon}</span>}
                  <span style={{ flex: 1 }}>{item.label}</span>
                </button>
              );
            })}
          </>
        )}
      </div>
    </nav>
  );
}
