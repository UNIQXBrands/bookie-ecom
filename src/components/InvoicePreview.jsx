import { useState, useEffect } from 'react';
import { X, Download, FileText, ZoomIn, ZoomOut } from 'lucide-react';
import { getFileUrl } from '../lib/db';
import { useApp } from '../context/AppContext';

export function InvoicePreview({ invoice, onClose }) {
  const { t } = useApp();
  const [fileData, setFileData] = useState(null);
  const [zoom, setZoom]         = useState(1);

  useEffect(() => {
    async function load() {
      if (invoice.filePath) {
        const url = await getFileUrl(invoice.filePath);
        setFileData(url);
      } else {
        // fallback: legacy localStorage (pre-migration)
        const stored = localStorage.getItem(`bookie_file_${invoice.id}`);
        setFileData(stored || null);
      }
    }
    load();
  }, [invoice.id, invoice.filePath]);

  const detectedType = fileData ? fileData.split(';')[0].split(':')[1] : null;
  const mimeType = invoice.fileType || detectedType || '';
  const isPdf   = mimeType === 'application/pdf';
  const isImg   = mimeType.startsWith('image/');
  const hasFile = !!fileData;

  function handleDownload() {
    const a = document.createElement('a');
    a.href = fileData;
    a.download = invoice.fileName || `factuur-${invoice.nr}`;
    a.click();
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(2,3,9,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#FAF3E3',
        border: '2px solid #020309',
        borderRadius: '16px',
        boxShadow: '6px 6px 0 #020309',
        width: '100%',
        maxWidth: isPdf ? '780px' : '640px',
        maxHeight: 'calc(100vh - 48px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px',
          background: '#020309',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', flexShrink: 0,
              background: '#FDEEC4', border: '2px solid #FDEEC4', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FileText size={16} color="#020309" />
            </div>
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '14px', color: '#FAF3E3' }}>
                {invoice.supplier}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#888' }}>
                {invoice.nr} · {invoice.date} · {invoice.excl}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* zoom controls — only for images */}
            {isImg && hasFile && (
              <>
                <IconBtn onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} title={t('preview.zoomOut')}>
                  <ZoomOut size={16} />
                </IconBtn>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#888', minWidth: '36px', textAlign: 'center' }}>
                  {Math.round(zoom * 100)}%
                </span>
                <IconBtn onClick={() => setZoom((z) => Math.min(3, z + 0.25))} title={t('preview.zoomIn')}>
                  <ZoomIn size={16} />
                </IconBtn>
              </>
            )}

            {hasFile && (
              <IconBtn onClick={handleDownload} title={t('preview.download')}>
                <Download size={16} />
              </IconBtn>
            )}

            <IconBtn onClick={onClose} title={t('preview.close')}>
              <X size={18} />
            </IconBtn>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', background: '#E8E0D0', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
          {!hasFile ? (
            <NoFileState invoice={invoice} />
          ) : isPdf ? (
            <iframe
              src={fileData}
              title={invoice.fileName || t('preview.invoiceFallback')}
              style={{ width: '100%', height: '100%', minHeight: '520px', border: 'none', display: 'block' }}
            />
          ) : isImg ? (
            <div style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
              <img
                src={fileData}
                alt={invoice.fileName || t('preview.invoiceFallback')}
                style={{
                  maxWidth: '100%',
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top center',
                  transition: 'transform .15s ease',
                  border: '2px solid #020309',
                  borderRadius: '8px',
                  boxShadow: '4px 4px 0 #020309',
                }}
              />
            </div>
          ) : (
            <NoFileState invoice={invoice} />
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px',
          borderTop: '2px solid #020309',
          background: '#FAF3E3',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <FooterStat label={t('preview.exclVat')} value={invoice.excl} />
            <FooterStat label={t('preview.vat')} value={invoice.rate != null ? `${invoice.rate}%` : '—'} />
            <FooterStat label={t('preview.total')} value={invoice.amount} bold />
          </div>
          {hasFile && (
            <button
              onClick={handleDownload}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: '#020309', color: '#FAF3E3',
                border: '2px solid #020309', borderRadius: '9px',
                boxShadow: '2px 2px 0 #020309',
                padding: '7px 12px', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '12px',
              }}
            >
              <Download size={13} />
              {t('preview.download')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function IconBtn({ onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: 'rgba(255,255,255,0.08)',
        border: '1.5px solid rgba(255,255,255,0.15)',
        borderRadius: '7px',
        color: '#FAF3E3',
        padding: '5px',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background .1s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
    >
      {children}
    </button>
  );
}

function FooterStat({ label, value, bold }) {
  return (
    <div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#888' }}>{label}</div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: bold ? 700 : 600, fontSize: '13px', color: '#020309' }}>{value}</div>
    </div>
  );
}

function NoFileState({ invoice }) {
  const { t } = useApp();
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center', width: '100%' }}>
      <div style={{
        width: '52px', height: '52px', margin: '0 auto 16px',
        background: '#FFFFFF', border: '2px solid #020309', borderRadius: '12px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <FileText size={24} color="#888" />
      </div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '15px', marginBottom: '6px', color: '#020309' }}>
        {t('preview.noFileTitle')}
      </div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#888', lineHeight: 1.55 }}>
        {invoice.fileName
          ? t('preview.noFileLoadFailed', { name: invoice.fileName })
          : t('preview.noFileManual')}
      </div>
    </div>
  );
}
