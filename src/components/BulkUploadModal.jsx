import { useState, useEffect, useRef, useMemo } from 'react';
import { X, FileText, CheckCircle, XCircle, Upload } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SkipForward } from 'lucide-react';
import { scanInvoice } from '../services/scanInvoice';

function fmtNum(n) {
  return Number(n || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function uid() {
  return `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function normalizeDate(raw) {
  if (!raw) return new Date().toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const parts = raw.split('-');
  if (parts.length < 3) return raw;
  if (parts[0].length === 4) {
    return `${parts[2].padStart(2,'0')}-${parts[1].padStart(2,'0')}-${parts[0]}`;
  }
  return `${parts[0].padStart(2,'0')}-${parts[1].padStart(2,'0')}-${parts[2]}`;
}

function buildInvoice(scanned, file, t) {
  const exclNum = parseFloat(scanned.amount_excl) || 0;
  const btwNum  = parseFloat(scanned.btw_amount)  || 0;
  const inclNum = parseFloat(scanned.amount_incl) || (exclNum + btwNum);
  return {
    id:         uid(),
    supplier:   scanned.supplier   || t('lev.unknownSupplier'),
    nr:         scanned.invoice_nr || '-',
    date:       normalizeDate(scanned.date),
    rate:       Number(scanned.btw_rate) || 0,
    excl:       '€' + fmtNum(exclNum),
    amount:     '€' + fmtNum(inclNum),
    status:     'pending',
    amountExcl: exclNum,
    btwAmount:  btwNum,
    amountIncl: inclNum,
    hasFile:    true,
    fileName:   file.name,
    fileType:   file.type,
  };
}

// ─── row ──────────────────────────────────────────────────────────────────────

function QueueRow({ item }) {
  const { t } = useApp();
  const { file, status, invoice, error } = item;

  const cfg = {
    waiting:  { color: '#888',    bg: '#F0EAD8', label: t('bulk.status.waiting') },
    scanning: { color: '#92600A', bg: '#FDEEC4', label: t('bulk.status.scanning') },
    done:     { color: '#2d7d32', bg: '#D2ECD0', label: t('bulk.status.done') },
    skipped:  { color: '#555',    bg: '#E8E0D0', label: t('bulk.status.skipped') },
    error:    { color: '#c0392b', bg: '#fdecea', label: t('bulk.status.error') },
  }[status] ?? { color: '#888', bg: '#F0EAD8', label: status };

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '12px',
      padding: '11px 20px', borderBottom: '1px solid #E8E0D0',
    }}>
      <span style={{
        width: '32px', height: '32px', flexShrink: 0, marginTop: '1px',
        background: cfg.bg, border: '1.5px solid #020309', borderRadius: '8px',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {status === 'done'     && <CheckCircle  size={15} color="#2d7d32" />}
        {status === 'error'    && <XCircle      size={15} color="#c0392b" />}
        {status === 'skipped'  && <SkipForward  size={14} color="#888" />}
        {status === 'scanning' && <span className="spin" style={{ display: 'inline-flex' }}><Upload size={14} color="#92600A" /></span>}
        {status === 'waiting'  && <FileText     size={14} color="#aaa" />}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
          <span style={{
            fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '13px', color: '#020309',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {invoice?.supplier || file.name}
          </span>
          <span style={{
            flexShrink: 0, padding: '2px 8px',
            background: cfg.bg, border: '1px solid #020309', borderRadius: '9999px',
            fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '10px', color: cfg.color,
          }}>
            {cfg.label}
          </span>
        </div>
        {invoice && (
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#888', marginTop: '2px' }}>
            {invoice.date} · {t('dashboard.exclAmount', { amount: invoice.excl })} · {t('shell.vatRate', { rate: invoice.rate })}
          </div>
        )}
        {(status === 'waiting' || status === 'scanning') && !invoice && (
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#aaa', marginTop: '2px' }}>
            {file.name}
          </div>
        )}
        {error && status === 'scanning' && (
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#92600A', marginTop: '2px' }}>
            {error}
          </div>
        )}
        {error && status === 'error' && (
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#c0392b', marginTop: '2px' }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── modal ────────────────────────────────────────────────────────────────────

export function BulkUploadModal({ files, onClose }) {
  const { apiKey, addInvoice, userInvoices, t } = useApp();
  const existingFileNames = useMemo(
    () => new Set(userInvoices.map((inv) => inv.fileName).filter(Boolean)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []  // snapshot at open time — intentionally not reactive
  );
  const fileList = Array.isArray(files) ? files : Array.from(files);
  const [queue, setQueue] = useState(() =>
    fileList.map((f) => ({ file: f, status: 'waiting', invoice: null, error: null }))
  );
  const [running,  setRunning]  = useState(false);
  const [allDone,  setAllDone]  = useState(false);
  const abortRef = useRef(false);

  useEffect(() => {
    abortRef.current = false;
    run();
    return () => { abortRef.current = true; };
  }, []);

  async function run(indicesToProcess = fileList.map((_, i) => i)) {
    if (!apiKey) return;
    setRunning(true);
    setAllDone(false);
    for (let idx = 0; idx < indicesToProcess.length; idx++) {
      const i = indicesToProcess[idx];
      if (abortRef.current) break;
      const file = fileList[i];

      // Skip als bestandsnaam al bekend is
      if (existingFileNames.has(file.name)) {
        setQueue((q) => q.map((item, idx) => idx === i ? { ...item, status: 'skipped' } : item));
        continue;
      }

      setQueue((q) => q.map((item, idx) => idx === i ? { ...item, status: 'scanning' } : item));

      let attempts = 0;
      while (attempts < 3) {
        try {
          const dataUrl = await readAsDataUrl(file);
          const scanned = await scanInvoice(file, apiKey);
          const invoice = buildInvoice(scanned, file, t);
          await addInvoice(invoice, dataUrl);
          setQueue((q) => q.map((item, idx) => idx === i ? { ...item, status: 'done', invoice } : item));
          break;
        } catch (err) {
          const msg = String(err?.message || err);
          const isRateLimit = msg.toLowerCase().includes('rate limit') || msg.includes('529') || msg.includes('429');
          attempts++;
          if (isRateLimit && attempts < 3) {
            // Wait 20s and retry
            setQueue((q) => q.map((item, idx) => idx === i
              ? { ...item, status: 'scanning', error: t('bulk.rateLimitWait', { attempt: attempts }) }
              : item
            ));
            await new Promise((r) => setTimeout(r, 20000));
          } else {
            setQueue((q) => q.map((item, idx) => idx === i ? { ...item, status: 'error', error: msg } : item));
            break;
          }
        }
      }

      // Pauze tussen bestanden om rate limit te voorkomen
      if (idx < indicesToProcess.length - 1 && !abortRef.current) {
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
    setRunning(false);
    setAllDone(true);
  }

  const doneCount    = queue.filter((q) => q.status === 'done').length;
  const errorCount   = queue.filter((q) => q.status === 'error').length;
  const skippedCount = queue.filter((q) => q.status === 'skipped').length;
  const progress     = queue.filter((q) => ['done', 'error', 'skipped'].includes(q.status)).length;
  const progressPct  = fileList.length ? (progress / fileList.length) * 100 : 0;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(2,3,9,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        background: '#FAF3E3', border: '2px solid #020309',
        borderRadius: '16px', boxShadow: '6px 6px 0 #020309',
        width: '100%', maxWidth: '560px',
        maxHeight: 'calc(100vh - 48px)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>

        {/* header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', background: '#020309', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              width: '32px', height: '32px',
              background: '#FDEEC4', border: '2px solid #FDEEC4', borderRadius: '8px',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Upload size={15} color="#020309" />
            </span>
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '14px', color: '#FAF3E3' }}>
                {t('bulk.title')}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#888' }}>
                {running
                  ? t('bulk.progressProcessed', { done: progress, total: fileList.length })
                  : allDone
                  ? t('bulk.savedWithErrors', { done: doneCount, errors: errorCount > 0 ? t('bulk.andFailed', { n: errorCount }) : '' })
                  : t('bulk.filesSelected', { n: fileList.length })}
              </div>
            </div>
          </div>
          {!running && (
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)',
              borderRadius: '7px', color: '#FAF3E3', padding: '5px',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
            }}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* progress bar */}
        <div style={{ height: '4px', background: '#E8E0D0', flexShrink: 0 }}>
          <div style={{
            height: '100%', width: `${progressPct}%`,
            background: allDone && errorCount > 0 && doneCount === 0 ? '#c0392b' : '#4CAF50',
            transition: 'width .35s ease',
          }} />
        </div>

        {/* queue */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {!apiKey ? (
            <div style={{ padding: '32px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#888' }}>
              {t('bulk.setApiKeyFirst')}
            </div>
          ) : (
            queue.map((item, idx) => <QueueRow key={idx} item={item} />)
          )}
        </div>

        {/* footer */}
        <div style={{
          padding: '14px 20px', borderTop: '2px solid #020309', background: '#FAF3E3',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, gap: '10px',
        }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#888', flex: 1 }}>
            {running ? t('bulk.processing') : allDone ? [
              doneCount    > 0 && t('bulk.doneSaved', { n: doneCount }),
              skippedCount > 0 && t('bulk.alreadyPresent', { n: skippedCount }),
              errorCount   > 0 && t('bulk.failed', { n: errorCount }),
            ].filter(Boolean).join(' · ') : ''}
          </span>
          {allDone && errorCount > 0 && (
            <button
              onClick={() => {
                const failedIndices = queue
                  .map((item, i) => ({ item, i }))
                  .filter(({ item }) => item.status === 'error')
                  .map(({ i }) => i);
                setQueue((q) => q.map((item) => item.status === 'error' ? { ...item, status: 'waiting', error: null } : item));
                run(failedIndices);
              }}
              style={{
                background: '#FDEEC4', border: '2px solid #020309', borderRadius: '10px',
                boxShadow: '2px 2px 0 #020309', padding: '9px 16px',
                fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '13px', color: '#020309',
                cursor: 'pointer',
              }}
            >
              {t('bulk.retryFailed')}
            </button>
          )}
          <button
            onClick={onClose}
            disabled={running}
            style={{
              background: allDone ? '#020309' : '#E8E0D0',
              color: allDone ? '#FAF3E3' : '#888',
              border: '2px solid #020309', borderRadius: '10px',
              boxShadow: allDone ? '3px 3px 0 #020309' : 'none',
              padding: '9px 20px',
              fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '13px',
              cursor: running ? 'not-allowed' : 'pointer',
            }}
          >
            {running ? t('bulk.busy') : t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
