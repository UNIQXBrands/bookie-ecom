import { useRef, useState } from 'react';

export function UploadZone({
  title = 'Sleep je factuur hierheen',
  hint = 'of klik om te bladeren · PDF, JPG, PNG',
  icon = '↑',
  onFile,
  onClick,
  style,
  ...rest
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  function handleClick() {
    if (onFile) {
      inputRef.current?.click();
    } else if (onClick) {
      onClick();
    }
  }

  function handleChange(e) {
    const f = e.target.files?.[0];
    if (f && onFile) onFile(f);
    e.target.value = '';
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) {
      if (onFile) onFile(f);
      else if (onClick) onClick();
    }
  }

  return (
    <>
      {onFile && (
        <input
          ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleChange} style={{ display: 'none' }}
        />
      )}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: '16px',
          padding: '18px 20px',
          background: dragOver ? '#F0EDDB' : '#FFFFFF',
          border: `2px dashed ${dragOver ? '#020309' : '#888'}`,
          borderRadius: '12px', cursor: 'pointer',
          transition: 'background .12s ease, border-color .12s ease',
          ...style,
        }}
        {...rest}
      >
        <span style={{
          width: '44px', height: '44px', flexShrink: 0,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: dragOver ? '#FDEEC4' : '#E5F5F9',
          border: '2px solid #020309', borderRadius: '10px',
          fontSize: '20px', fontWeight: 700,
          transition: 'background .12s ease',
        }}>{icon}</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '15px', color: '#020309' }}>{title}</span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#888888' }}>{hint}</span>
        </div>
      </div>
    </>
  );
}
