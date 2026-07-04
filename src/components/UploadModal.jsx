import { useState, useEffect, useRef } from 'react';
import { X, Loader2, Check, AlertTriangle, Upload, Key, RefreshCw } from 'lucide-react';
import { scanInvoice } from '../services/scanInvoice';
import { useApp } from '../context/AppContext';

// ─── helpers ────────────────────────────────────────────────────────────────

function fmtNum(n) {
  return Number(n || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function uid() {
  return `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeDate(raw) {
  if (!raw) return new Date().toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const parts = raw.split('-');
  if (parts.length < 3) return raw;
  if (parts[0].length === 4) {
    // YYYY-MM-DD → DD-MM-YYYY
    return `${parts[2].padStart(2,'0')}-${parts[1].padStart(2,'0')}-${parts[0]}`;
  }
  // Already DD-MM-YYYY, zero-pad just in case
  return `${parts[0].padStart(2,'0')}-${parts[1].padStart(2,'0')}-${parts[2]}`;
}

const inkBorder = { border: '2px solid #020309' };

function FieldLabel({ children }) {
  return (
    <span style={{
      display: 'block', fontFamily: "'DM Sans', sans-serif",
      fontWeight: 700, fontSize: '10.5px', letterSpacing: '0.5px',
      textTransform: 'uppercase', color: '#555', marginBottom: '5px',
    }}>{children}</span>
  );
}

const inputCss = {
  width: '100%', boxSizing: 'border-box',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '14px', fontWeight: 500,
  background: '#FFFFFF', ...inkBorder,
  borderRadius: '8px', padding: '9px 12px',
  color: '#020309', outline: 'none',
};

function TextInput({ value, onChange, placeholder, mono }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || ''}
      style={{ ...inputCss, fontFamily: mono ? "'DM Mono', monospace" : "'DM Sans', sans-serif" }}
    />
  );
}

function NumInput({ value, onChange }) {
  return (
    <input
      type="number" step="0.01" min="0"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...inputCss, fontFamily: "'DM Mono', monospace" }}
    />
  );
}

function RateBtn({ rate, active, onClick }) {
  return (
    <button onClick={onClick} type="button" style={{
      flex: 1, padding: '8px 0', cursor: 'pointer',
      background: active ? '#020309' : '#FFFFFF',
      color: active ? '#FDEEC4' : '#020309',
      ...inkBorder, borderRadius: '8px', boxShadow: '2px 2px 0 #020309',
      fontFamily: "'DM Mono', monospace",
      fontWeight: 700, fontSize: '14px',
    }}>{rate}%</button>
  );
}

function StatusBtn({ label, active, bg, onClick }) {
  return (
    <button onClick={onClick} type="button" style={{
      flex: 1, padding: '8px 4px', cursor: 'pointer',
      background: active ? bg : '#FFFFFF',
      ...inkBorder, borderRadius: '8px', boxShadow: '2px 2px 0 #020309',
      fontFamily: "'DM Sans', sans-serif",
      fontWeight: 700, fontSize: '11px', color: '#020309',
    }}>{label}</button>
  );
}

function ActionBtn({ onClick, children, primary }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} type="button"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        flex: 1, padding: '10px 0', cursor: 'pointer',
        background: primary ? '#020309' : '#FFFFFF',
        color: primary ? '#FAF3E3' : '#020309',
        ...inkBorder, borderRadius: '10px',
        boxShadow: hov ? '4px 4px 0 #020309' : '3px 3px 0 #020309',
        transform: hov ? 'translate(-1px,-1px)' : 'none',
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 700, fontSize: '14px',
        transition: 'transform .1s ease, box-shadow .1s ease',
      }}>{children}</button>
  );
}

function FileBadge({ file }) {
  if (!file) return null;
  const name = file.name.length > 32 ? file.name.slice(0, 28) + '…' + file.name.slice(-4) : file.name;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '4px 10px', background: '#E5F5F9',
      ...inkBorder, borderRadius: '9999px',
      fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#020309',
    }}>
      <Upload size={11} />
      {name}
    </div>
  );
}

// ─── phase: no API key ───────────────────────────────────────────────────────

function NoKeyPhase({ onClose, onManual }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', textAlign: 'center', padding: '8px 0' }}>
      <div style={{
        width: '54px', height: '54px',
        background: '#FDEEC4', ...inkBorder, borderRadius: '14px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Key size={26} />
      </div>
      <div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '15px', marginBottom: '8px' }}>
          Geen API-sleutel ingesteld
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#555', lineHeight: 1.6 }}>
          Voer een Anthropic API-sleutel in via <strong>Instellingen → Bookie AI</strong> om facturen automatisch te scannen.
        </div>
      </div>
      <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
        <ActionBtn onClick={onClose}>Sluiten</ActionBtn>
        <ActionBtn onClick={onManual} primary>Handmatig invoeren</ActionBtn>
      </div>
    </div>
  );
}

// ─── phase: idle (pick file) ────────────────────────────────────────────────

function IdlePhase({ onPickFile }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onPickFile(f);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <input
        ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickFile(f); e.target.value = ''; }}
      />
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: '12px', padding: '40px 24px',
          background: drag ? '#F0EDDB' : '#FFFFFF',
          border: `2px dashed ${drag ? '#020309' : '#AAA'}`,
          borderRadius: '12px', cursor: 'pointer',
          transition: 'background .12s ease',
        }}
      >
        <div style={{
          width: '48px', height: '48px', background: '#E5F5F9',
          ...inkBorder, borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Upload size={22} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '14px', color: '#020309' }}>
            Sleep je factuur hierheen
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#888', marginTop: '3px' }}>
            of klik om te bladeren · PDF, JPG, PNG
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── phase: scanning ────────────────────────────────────────────────────────

function ScanningPhase({ file }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', padding: '24px 0', textAlign: 'center' }}>
      <div style={{ position: 'relative', width: '56px', height: '56px' }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: '#FDEEC4', ...inkBorder, borderRadius: '14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Loader2 size={26} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      </div>
      <div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>
          Bezig met scannen…
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#666' }}>
          Claude leest je factuur en extraheert de BTW-gegevens
        </div>
      </div>
      {file && <FileBadge file={file} />}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── phase: error ────────────────────────────────────────────────────────────

function ErrorPhase({ error, onRetry, onManual }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', padding: '8px 0', textAlign: 'center' }}>
      <div style={{
        width: '54px', height: '54px',
        background: '#F3C1C0', ...inkBorder, borderRadius: '14px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <AlertTriangle size={26} />
      </div>
      <div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '15px', marginBottom: '8px' }}>
          Scannen mislukt
        </div>
        <div style={{
          fontFamily: "'DM Mono', monospace", fontSize: '12px', color: '#555',
          background: '#F3C1C0', ...inkBorder, borderRadius: '8px',
          padding: '10px 14px', wordBreak: 'break-word', textAlign: 'left',
        }}>
          {error}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
        <ActionBtn onClick={onRetry}><span style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}><RefreshCw size={14} />Opnieuw</span></ActionBtn>
        <ActionBtn onClick={onManual} primary>Handmatig invoeren</ActionBtn>
      </div>
    </div>
  );
}

// ─── phase: review ────────────────────────────────────────────────────────────

function ReviewPhase({ fields, setF, setFieldCalc, file, onSave, onClose }) {
  const scanned = !!file;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Found banner */}
      {scanned && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 14px', background: '#D2ECD0', ...inkBorder,
          borderRadius: '10px', boxShadow: '2px 2px 0 #020309',
        }}>
          <span style={{
            width: '24px', height: '24px', background: '#020309',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Check size={14} color="#D2ECD0" />
          </span>
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '13px' }}>Factuur gescand</div>
            {file && <FileBadge file={file} />}
          </div>
        </div>
      )}

      {/* Supplier */}
      <div>
        <FieldLabel>Leverancier</FieldLabel>
        <TextInput value={fields.supplier} onChange={(v) => setF('supplier', v)} placeholder="Naam leverancier" />
      </div>

      {/* Nr + Date */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <FieldLabel>Factuurnummer</FieldLabel>
          <TextInput value={fields.invoice_nr} onChange={(v) => setF('invoice_nr', v)} placeholder="FCT-2026-0001" mono />
        </div>
        <div>
          <FieldLabel>Datum</FieldLabel>
          <TextInput value={fields.date} onChange={(v) => setF('date', v)} placeholder="DD-MM-YYYY" mono />
        </div>
      </div>

      {/* BTW rate */}
      <div>
        <FieldLabel>BTW-tarief</FieldLabel>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[21, 9, 0].map((r) => (
            <RateBtn key={r} rate={r} active={fields.btw_rate === r} onClick={() => setFieldCalc('btw_rate', r)} />
          ))}
        </div>
      </div>

      {/* Amounts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
        <div>
          <FieldLabel>Excl. BTW (€)</FieldLabel>
          <NumInput value={fields.amount_excl} onChange={(v) => setFieldCalc('amount_excl', v)} />
        </div>
        <div>
          <FieldLabel>BTW-bedrag (€)</FieldLabel>
          <NumInput value={fields.btw_amount} onChange={(v) => setF('btw_amount', v)} />
        </div>
        <div>
          <FieldLabel>Incl. BTW (€)</FieldLabel>
          <NumInput value={fields.amount_incl} onChange={(v) => setF('amount_incl', v)} />
        </div>
      </div>

      {/* Status */}
      <div>
        <FieldLabel>Status</FieldLabel>
        <div style={{ display: 'flex', gap: '8px' }}>
          <StatusBtn label="Betaald"     active={fields.status === 'paid'}    bg="#D2ECD0" onClick={() => setF('status', 'paid')} />
          <StatusBtn label="Openstaand"  active={fields.status === 'pending'} bg="#FDEEC4" onClick={() => setF('status', 'pending')} />
          <StatusBtn label="Controleren" active={fields.status === 'review'}  bg="#E5F5F9" onClick={() => setF('status', 'review')} />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
        <ActionBtn onClick={onClose}>Annuleren</ActionBtn>
        <ActionBtn onClick={onSave} primary>Factuur opslaan</ActionBtn>
      </div>
    </div>
  );
}

// ─── main modal ──────────────────────────────────────────────────────────────

export function UploadModal({ file: initialFile, onSaved, onClose, manualMode = false }) {
  const { apiKey, addInvoice } = useApp();
  const scanRef = useRef(false);

  const [phase, setPhase] = useState(() => {
    if (manualMode) return 'review';
    if (!apiKey) return 'nokey';
    if (initialFile) return 'scanning';
    return 'idle';
  });

  const [file,        setFile]        = useState(initialFile || null);
  const [fileDataUrl, setFileDataUrl] = useState(null);
  const [errorMsg,    setErrorMsg]    = useState('');
  const [fields, setFields] = useState({
    supplier: '', invoice_nr: '', date: '',
    btw_rate: 21, amount_excl: '', btw_amount: '', amount_incl: '',
    status: 'pending',
  });

  const setF = (key, val) => setFields((f) => ({ ...f, [key]: val }));

  const setFieldCalc = (key, val) => {
    setFields((f) => {
      const next = { ...f, [key]: val };
      const excl = parseFloat(next.amount_excl) || 0;
      const rate = Number(next.btw_rate) || 0;
      if (key === 'amount_excl' || key === 'btw_rate') {
        const btw = Math.round(excl * rate) / 100;
        next.btw_amount  = excl ? String(btw.toFixed(2)) : '';
        next.amount_incl = excl ? String((excl + btw).toFixed(2)) : '';
      }
      return next;
    });
  };

  useEffect(() => {
    if (file && phase === 'scanning' && !scanRef.current) {
      scanRef.current = true;
      doScan(file);
    }
  }, [file, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  async function doScan(f) {
    try {
      const result = await scanInvoice(f, apiKey);
      setFields({
        supplier:    result.supplier   || '',
        invoice_nr:  result.invoice_nr || '',
        date:        result.date       || '',
        btw_rate:    result.btw_rate   ?? 21,
        amount_excl: result.amount_excl ? String(result.amount_excl) : '',
        btw_amount:  result.btw_amount  ? String(result.btw_amount)  : '',
        amount_incl: result.amount_incl ? String(result.amount_incl) : '',
        status: 'pending',
      });
      setPhase('review');
    } catch (err) {
      setErrorMsg(err.message || 'Onbekende fout');
      setPhase('error');
    }
  }

  function pickFile(f) {
    if (!f) return;
    setFile(f);
    scanRef.current = false;
    setPhase('scanning');
    // Read as data URL for preview storage
    const reader = new FileReader();
    reader.onload = (e) => setFileDataUrl(e.target.result);
    reader.readAsDataURL(f);
  }

  async function handleSave() {
    const exclNum = parseFloat(fields.amount_excl) || 0;
    const btwNum  = parseFloat(fields.btw_amount)  || 0;
    const inclNum = parseFloat(fields.amount_incl) || (exclNum + btwNum);

    const invoice = {
      id:         uid(),
      supplier:   fields.supplier   || 'Onbekend',
      nr:         fields.invoice_nr || '-',
      date:       normalizeDate(fields.date),
      rate:       Number(fields.btw_rate),
      excl:       '€' + fmtNum(exclNum),
      amount:     '€' + fmtNum(inclNum),
      status:     fields.status,
      amountExcl: exclNum,
      btwAmount:  btwNum,
      amountIncl: inclNum,
      hasFile:    !!fileDataUrl,
      fileName:   file?.name ?? null,
      fileType:   file?.type ?? null,
    };

    setPhase('scanning'); // reuse loading state while saving
    try {
      await addInvoice(invoice, fileDataUrl);
      onSaved(invoice);
    } catch {
      setPhase('error');
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(2,3,9,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: '24px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#FAF3E3',
        border: '2px solid #020309',
        borderRadius: '16px',
        boxShadow: '6px 6px 0 #020309',
        width: '100%', maxWidth: '480px',
        maxHeight: 'calc(100vh - 48px)',
        overflowY: 'auto',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '2px solid #020309', flexShrink: 0,
        }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '16px', color: '#020309' }}>
            Factuur uploaden
          </span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', color: '#020309', padding: '4px', borderRadius: '6px',
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px' }}>
          {phase === 'nokey'    && <NoKeyPhase   onClose={onClose}                                     onManual={() => setPhase('review')} />}
          {phase === 'idle'     && <IdlePhase    onPickFile={pickFile} />}
          {phase === 'scanning' && <ScanningPhase file={file} />}
          {phase === 'error'    && <ErrorPhase   error={errorMsg} onRetry={() => { scanRef.current = false; setPhase('scanning'); }} onManual={() => setPhase('review')} />}
          {phase === 'review'   && <ReviewPhase  fields={fields} setF={setF} setFieldCalc={setFieldCalc} file={file} onSave={handleSave} onClose={onClose} />}
        </div>
      </div>
    </div>
  );
}
