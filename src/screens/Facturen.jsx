import { useState, useMemo } from 'react';
import { useApp, fmtEur }  from '../context/AppContext';
import { uploadFile }          from '../lib/db';
import { InvoiceTable }        from '../components/InvoiceTable';
import { Badge, BtwPill }      from '../components/Badge';
import { UploadZone }          from '../components/UploadZone';
import { Button }              from '../components/Button';
import { InvoicePreview }      from '../components/InvoicePreview';
import { ChevronRight, Upload, FolderOpen, Eye, Paperclip, Trash2, Lock, LockOpen, PenLine } from 'lucide-react';

// ─── shared ──────────────────────────────────────────────────────────────────

const STATUS_CYCLE = { pending: 'paid', paid: 'review', review: 'pending' };
const STATUS_LABEL = { paid: 'Betaald', pending: 'Openstaand', review: 'Te controleren' };

function StatusToggle({ status, invId }) {
  const { updateInvoice } = useApp();
  function cycle(e) {
    e.stopPropagation();
    updateInvoice(invId, { status: STATUS_CYCLE[status] || 'pending' });
  }
  return (
    <button onClick={cycle} title="Klik om status te wijzigen"
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
      <Badge variant={status} dot>{STATUS_LABEL[status] ?? status}</Badge>
    </button>
  );
}

function Checkbox({ checked, indeterminate, onChange }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      style={{
        width: '18px', height: '18px', flexShrink: 0,
        background: checked ? '#020309' : '#FFFFFF',
        border: '2px solid #020309', borderRadius: '4px',
        cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {indeterminate && !checked
        ? <span style={{ color: '#020309', fontSize: '12px', lineHeight: 1, background: '#020309', width: '8px', height: '2px', borderRadius: '1px' }} />
        : checked && <span style={{ color: '#FAF3E3', fontSize: '11px', lineHeight: 1 }}>✓</span>
      }
    </button>
  );
}

function Breadcrumb({ items }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
      {items.map((item, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {i > 0 && <ChevronRight size={14} color="#888" />}
          {item.onClick ? (
            <button
              onClick={item.onClick}
              style={{
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '13px',
                color: '#888', textDecoration: 'underline', textDecorationColor: '#ccc',
              }}
            >{item.label}</button>
          ) : (
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '13px', color: '#020309' }}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    filed:       { bg: '#D2ECD0', label: 'Ingediend' },
    in_progress: { bg: '#FDEEC4', label: 'Lopend' },
    empty:       { bg: '#FAF3E3', label: 'Leeg' },
  };
  const { bg, label } = map[status] || map.empty;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 9px',
      background: bg, border: '1.5px solid #020309', borderRadius: '9999px',
      fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '10.5px', color: '#020309',
    }}>{label}</span>
  );
}

// ─── level 1: kwartalen ───────────────────────────────────────────────────────

function KwartaalOverzicht({ onSelectQuarter, activeQuarters }) {
  const years = [...new Set(activeQuarters.map((q) => q.year))].sort((a, b) => b - a);

  if (activeQuarters.length === 0) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{
          padding: '48px', textAlign: 'center',
          background: '#FFFFFF', border: '2px solid #020309',
          borderRadius: '12px', boxShadow: '3px 3px 0 #020309',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>Nog geen facturen</div>
          <div style={{ fontSize: '13px', color: '#888' }}>Upload je eerste factuur om te beginnen. Kwartalen verschijnen hier automatisch.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {years.map((year) => {
        const qs = activeQuarters.filter((q) => q.year === year).sort((a, b) => b.q - a.q);
        const yearTotal = qs.reduce((sum, q) => sum + q.invoiceCount, 0);

        return (
          <div key={year}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '12px' }}>
              <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '22px', letterSpacing: '-0.3px', color: '#020309' }}>{year}</h2>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#888' }}>{yearTotal} facturen</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {qs.map((q) => (
                <QuarterCard key={q.id} quarter={q} onClick={() => onSelectQuarter(q)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function QuarterCard({ quarter: q, onClick }) {
  const { closeQuarter, reopenQuarter } = useApp();
  const [hovered, setHovered] = useState(false);
  const isFiled = q.status === 'filed';

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isFiled ? '#F5F5F5' : '#FFFFFF',
        border: '2px solid #020309',
        borderRadius: '12px',
        boxShadow: hovered ? '5px 5px 0 #020309' : '3px 3px 0 #020309',
        transform: hovered ? 'translate(-1px,-1px)' : 'translate(0,0)',
        padding: '16px 18px',
        cursor: 'pointer',
        transition: 'transform .1s ease, box-shadow .1s ease',
        display: 'flex', flexDirection: 'column', gap: '10px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '20px', letterSpacing: '-0.3px', color: isFiled ? '#888' : '#020309' }}>{q.label}</span>
        <StatusPill status={q.status} />
      </div>

      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#888' }}>{q.period}</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: '18px', color: isFiled ? '#888' : '#020309' }}>{q.totalExcl}</span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#888' }}>excl. BTW</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1.5px solid #e8e0d0' }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#444' }}>{q.invoiceCount} facturen</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', fontWeight: 600, color: '#444' }}>BTW {q.btwTotal}</span>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); isFiled ? reopenQuarter(q.id) : closeQuarter(q.id); }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
          width: '100%', padding: '6px 0', marginTop: '2px',
          background: isFiled ? '#E8E0D0' : '#020309',
          color: isFiled ? '#444' : '#FAF3E3',
          border: '1.5px solid #020309', borderRadius: '8px',
          fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '11px',
          cursor: 'pointer', transition: 'opacity .1s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
      >
        {isFiled ? <><LockOpen size={11} /> Heropenen</> : <><Lock size={11} /> Afsluiten</>}
      </button>
    </div>
  );
}

// ─── level 2: maanden ────────────────────────────────────────────────────────

function MaandOverzicht({ quarter, onBack, onSelectMonth }) {
  const { closeQuarter, reopenQuarter } = useApp();
  const isFiled = quarter.status === 'filed';

  return (
    <div style={{ padding: '24px' }}>
      <Breadcrumb items={[
        { label: 'Facturen', onClick: onBack },
        { label: quarter.label },
      ]} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {quarter.months.map((m) => (
          <MonthCard key={m.id} month={m} onClick={() => onSelectMonth(m)} />
        ))}
      </div>

      {/* quarter summary */}
      <div style={{ marginTop: '28px', background: isFiled ? '#E8E0D0' : '#FDEEC4', border: '2px solid #020309', borderRadius: '12px', boxShadow: '3px 3px 0 #020309', padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '15px' }}>Totaal {quarter.label}</div>
            <StatusPill status={quarter.status} />
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#444' }}>{quarter.period}</div>
        </div>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', color: '#444' }}>Excl. BTW</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: '22px' }}>{quarter.totalExcl}</div>
          </div>
          <div style={{ paddingLeft: '24px', borderLeft: '2px solid #020309' }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', color: '#444' }}>BTW</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: '22px' }}>{quarter.btwTotal}</div>
          </div>
          <button
            onClick={() => isFiled ? reopenQuarter(quarter.id) : closeQuarter(quarter.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '9px 16px',
              background: isFiled ? '#FFFFFF' : '#020309',
              color: isFiled ? '#444' : '#FAF3E3',
              border: '2px solid #020309', borderRadius: '10px',
              boxShadow: '2px 2px 0 #020309',
              fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {isFiled ? <><LockOpen size={14} /> Heropenen</> : <><Lock size={14} /> Kwartaal afsluiten</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function MonthCard({ month: m, onClick }) {
  const [hovered, setHovered] = useState(false);
  const isEmpty = m.invoiceCount === 0;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isEmpty ? '#FAF3E3' : '#FFFFFF',
        border: '2px solid #020309',
        borderRadius: '12px',
        boxShadow: hovered ? '5px 5px 0 #020309' : '3px 3px 0 #020309',
        transform: hovered ? 'translate(-1px,-1px)' : 'translate(0,0)',
        padding: '20px',
        cursor: 'pointer',
        transition: 'transform .1s ease, box-shadow .1s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '17px', color: '#020309' }}>{m.label}</span>
        {isEmpty
          ? <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#888' }}>Leeg</span>
          : <FolderOpen size={16} color="#888" />
        }
      </div>

      {isEmpty ? (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#888' }}>
          Nog geen facturen. Klik om te uploaden.
        </div>
      ) : (
        <>
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: '20px', color: '#020309' }}>{m.totalExcl}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#888', marginTop: '2px' }}>excl. BTW</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1.5px solid #e8e0d0' }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#444' }}>{m.invoiceCount} facturen</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', fontWeight: 600, color: '#444' }}>BTW {m.btwTotal}</span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── level 3: facturen van een maand ─────────────────────────────────────────

const COLUMNS = [
  { key: 'supplier', label: 'Leverancier' },
  { key: 'nr',       label: 'Factuurnr',  mono: true },
  { key: 'date',     label: 'Datum',      mono: true },
  { key: 'btw',      label: 'BTW' },
  { key: 'excl',     label: 'Excl. BTW',  mono: true, align: 'right' },
  { key: 'amount',   label: 'Totaal',     mono: true, align: 'right' },
  { key: 'status',   label: 'Status' },
  { key: 'preview',  label: '',           width: '40px', align: 'center' },
  { key: 'delete',   label: '',           width: '40px', align: 'center' },
];

const TABS = [
  { key: 'all',     label: 'Alle' },
  { key: 'pending', label: 'Openstaand' },
  { key: 'review',  label: 'Te controleren' },
  { key: 'paid',    label: 'Betaald' },
];

const tabStyle = (active) => ({
  padding: '7px 14px',
  background: active ? '#020309' : '#FFFFFF',
  color: active ? '#FAF3E3' : '#020309',
  border: '2px solid #020309',
  borderRadius: '10px',
  boxShadow: '2px 2px 0 #020309',
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 600,
  fontSize: '12px',
  cursor: 'pointer',
});

function AttachBtn({ invId, onAttached }) {
  const { updateInvoice } = useApp();
  const inputRef = useState(() => { const r = { current: null }; return r; })[0];
  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      let filePath = null;
      try { filePath = await uploadFile(invId, ev.target.result, f.name); } catch { /* network */ }
      await updateInvoice(invId, { hasFile: true, fileType: f.type, fileName: f.name, filePath });
      onAttached();
    };
    reader.readAsDataURL(f);
    e.target.value = '';
  }
  return (
    <>
      <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={handleFile} />
      <button
        onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
        title="Bestand koppelen"
        style={{
          background: '#FFFFFF', border: '1.5px solid #aaa', borderRadius: '7px',
          cursor: 'pointer', padding: '4px 5px',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          color: '#888', transition: 'border-color .1s, color .1s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#020309'; e.currentTarget.style.color = '#020309'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#aaa'; e.currentTarget.style.color = '#888'; }}
      >
        <Paperclip size={13} />
      </button>
    </>
  );
}

function MonthTotalsBar({ invoices, count }) {
  const totExcl = invoices.reduce((s, i) => s + (i.amountExcl || 0), 0);
  const totBtw  = invoices.reduce((s, i) => s + (i.btwAmount  || 0), 0);
  const totIncl = invoices.reduce((s, i) => s + (i.amountIncl || 0), 0);

  // per-rate breakdown
  const byRate = {};
  invoices.forEach((inv) => {
    const r = inv.rate ?? 0;
    if (!byRate[r]) byRate[r] = 0;
    byRate[r] += inv.btwAmount || 0;
  });
  const rateBreakdown = Object.entries(byRate)
    .filter(([, v]) => v > 0)
    .sort(([a], [b]) => Number(b) - Number(a));

  return (
    <div style={{
      background: '#FAF3E3', border: '2px solid #020309',
      borderRadius: '12px', boxShadow: '3px 3px 0 #020309',
      padding: '14px 20px',
      display: 'flex', alignItems: 'center', gap: '0', flexWrap: 'wrap',
    }}>
      {/* count */}
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#888', marginRight: '20px' }}>
        {count} facturen
      </span>

      {/* excl */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', marginRight: '20px' }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '9px', letterSpacing: '0.8px', textTransform: 'uppercase', color: '#888' }}>Excl. BTW</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, fontSize: '14px', color: '#020309' }}>{fmtEur(totExcl)}</span>
      </div>

      {/* divider */}
      <div style={{ width: '1.5px', height: '30px', background: '#d4cbbe', marginRight: '20px', flexShrink: 0 }} />

      {/* btw per rate */}
      {rateBreakdown.map(([rate, btw]) => (
        <div key={rate} style={{ display: 'flex', flexDirection: 'column', gap: '1px', marginRight: '16px' }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '9px', letterSpacing: '0.8px', textTransform: 'uppercase', color: '#888' }}>BTW {rate}%</span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, fontSize: '14px', color: '#020309' }}>{fmtEur(btw)}</span>
        </div>
      ))}

      {/* divider */}
      <div style={{ width: '1.5px', height: '30px', background: '#d4cbbe', marginRight: '20px', flexShrink: 0 }} />

      {/* total btw */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', marginRight: '20px' }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '9px', letterSpacing: '0.8px', textTransform: 'uppercase', color: '#888' }}>BTW totaal</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: '14px', color: '#020309' }}>{fmtEur(totBtw)}</span>
      </div>

      {/* spacer */}
      <div style={{ flex: 1 }} />

      {/* incl. btw — highlight */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '1px', alignItems: 'flex-end',
        background: '#020309', borderRadius: '8px', padding: '6px 14px',
      }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '9px', letterSpacing: '0.8px', textTransform: 'uppercase', color: '#888' }}>Incl. BTW</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: '17px', color: '#FAF3E3' }}>{fmtEur(totIncl)}</span>
      </div>
    </div>
  );
}

function FactuurLijst({ quarter, month, onBack, onBackToQuarter, onUpload, onManualAdd }) {
  const { removeInvoice, updateInvoice } = useApp();
  const [filter,         setFilter]         = useState('all');
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [attached,       setAttached]       = useState({});
  const [confirmDelete,  setConfirmDelete]  = useState(null);
  const [selected,       setSelected]       = useState(new Set());

  const list = filter === 'all'
    ? month.invoices
    : month.invoices.filter((i) => i.status === filter);

  const allSelected     = list.length > 0 && list.every((inv) => selected.has(inv.id));
  const someSelected    = list.some((inv) => selected.has(inv.id));

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelected((prev) => { const next = new Set(prev); list.forEach((inv) => next.delete(inv.id)); return next; });
    } else {
      setSelected((prev) => { const next = new Set(prev); list.forEach((inv) => next.add(inv.id)); return next; });
    }
  }

  async function bulkSetStatus(newStatus) {
    const ids = list.filter((inv) => selected.has(inv.id)).map((inv) => inv.id);
    await Promise.all(ids.map((id) => updateInvoice(id, { status: newStatus })));
    setSelected(new Set());
  }

  const rows = list.map((inv) => {
    const hasFile = inv.hasFile || !!attached[inv.id];
    return {
      id: inv.id,
      cb: <Checkbox checked={selected.has(inv.id)} onChange={() => toggleSelect(inv.id)} />,
      supplier: inv.supplier,
      nr: inv.nr,
      date: inv.date,
      btw: <BtwPill rate={inv.rate} />,
      excl: inv.excl,
      amount: inv.amount,
      status: <StatusToggle status={inv.status} invId={inv.id} />,
      preview: hasFile ? (
        <button
          onClick={(e) => { e.stopPropagation(); setPreviewInvoice(inv); }}
          title="Factuur bekijken"
          style={{
            background: '#FDEEC4', border: '1.5px solid #020309', borderRadius: '7px',
            cursor: 'pointer', padding: '4px 5px',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '1.5px 1.5px 0 #020309', transition: 'transform .1s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(-1px,-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
        >
          <Eye size={13} />
        </button>
      ) : (
        <AttachBtn
          invId={inv.id}
          onAttached={() => setAttached((p) => ({ ...p, [inv.id]: true }))}
        />
      ),
      delete: (
        <button
          onClick={(e) => { e.stopPropagation(); setConfirmDelete(inv); }}
          title="Factuur verwijderen"
          style={{
            background: 'transparent', border: '1.5px solid transparent', borderRadius: '7px',
            cursor: 'pointer', padding: '4px 5px',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: '#bbb', transition: 'color .1s, border-color .1s, background .1s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#c0392b';
            e.currentTarget.style.borderColor = '#c0392b';
            e.currentTarget.style.background = '#fdecea';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#bbb';
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <Trash2 size={13} />
        </button>
      ),
    };
  });

  const columns = [
    { key: 'cb', label: <Checkbox checked={allSelected} indeterminate={someSelected && !allSelected} onChange={toggleAll} />, width: '36px', align: 'center' },
    ...COLUMNS,
  ];

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Breadcrumb items={[
        { label: 'Facturen',     onClick: onBack },
        { label: quarter.label,  onClick: onBackToQuarter },
        { label: month.label },
      ]} />

      <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
        <div style={{ flex: 1 }}>
          <UploadZone
            title="Sleep een factuur hierheen"
            hint="of klik om te bladeren · PDF, JPG, PNG"
            onFile={onUpload}
            icon={<Upload size={20} />}
          />
        </div>
        {onManualAdd && (
          <button
            onClick={onManualAdd}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '8px', padding: '20px 28px', flexShrink: 0,
              background: '#FFFFFF', border: '2px solid #020309', borderRadius: '12px',
              boxShadow: '3px 3px 0 #020309', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'transform .1s ease, box-shadow .1s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '4px 4px 0 #020309'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '3px 3px 0 #020309'; }}
          >
            <span style={{ width: '36px', height: '36px', background: '#FDEEC4', border: '2px solid #020309', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PenLine size={16} />
            </span>
            <span style={{ fontWeight: 700, fontSize: '12px', color: '#020309', whiteSpace: 'nowrap' }}>Handmatig boeken</span>
            <span style={{ fontSize: '11px', color: '#888' }}>Geen bestand nodig</span>
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        {TABS.map((t) => (
          <button key={t.key} style={tabStyle(filter === t.key)} onClick={() => setFilter(t.key)}>{t.label}</button>
        ))}
      </div>

      {rows.length ? (
        <InvoiceTable columns={columns} rows={rows} onRowClick={() => {}} />
      ) : (
        <div style={{
          padding: '40px', textAlign: 'center',
          background: '#FFFFFF', border: '2px solid #020309',
          borderRadius: '12px', boxShadow: '3px 3px 0 #020309',
          color: '#888', fontSize: '13px', fontFamily: "'DM Sans', sans-serif",
        }}>
          {month.invoices.length === 0
            ? 'Nog geen facturen voor deze maand. Upload er een hierboven.'
            : 'Geen facturen in deze weergave.'}
        </div>
      )}

      {month.invoices.length > 0 && (
        <MonthTotalsBar invoices={month.invoices} count={month.invoiceCount} />
      )}

      {/* bulk action bar */}
      {selected.size > 0 && (
        <div style={{
          position: 'sticky', bottom: '16px', zIndex: 50,
          background: '#020309', border: '2px solid #020309',
          borderRadius: '12px', boxShadow: '4px 4px 0 #FDEEC4',
          padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
        }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '13px', color: '#FAF3E3', marginRight: '4px' }}>
            {selected.size} geselecteerd
          </span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#888', flex: 1 }}>
            Zet status op:
          </span>
          {[
            { key: 'pending', label: 'Openstaand', bg: '#E8E0D0', color: '#020309' },
            { key: 'paid',    label: 'Betaald',    bg: '#D2ECD0', color: '#2d7d32' },
            { key: 'review',  label: 'Te controleren', bg: '#FDEEC4', color: '#92600A' },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => bulkSetStatus(s.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                background: s.bg, border: '1.5px solid #020309', borderRadius: '8px',
                padding: '5px 12px', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '12px', color: s.color,
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.color, flexShrink: 0 }} />
              {s.label}
            </button>
          ))}
          <button
            onClick={() => setSelected(new Set())}
            style={{
              background: 'transparent', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: '8px',
              padding: '5px 12px', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '12px', color: '#aaa',
            }}
          >
            Deselecteren
          </button>
        </div>
      )}

      {previewInvoice && (
        <InvoicePreview invoice={previewInvoice} onClose={() => setPreviewInvoice(null)} />
      )}

      {confirmDelete && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 400,
            background: 'rgba(2,3,9,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setConfirmDelete(null)}
        >
          <div
            style={{
              background: '#FAF3E3', border: '2px solid #020309',
              borderRadius: '14px', boxShadow: '5px 5px 0 #020309',
              padding: '28px 28px 24px', maxWidth: '360px', width: '100%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>
              Factuur verwijderen?
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#555', marginBottom: '22px', lineHeight: 1.55 }}>
              <strong>{confirmDelete.supplier}</strong> · {confirmDelete.nr} · {confirmDelete.date}
              <br />Dit kan niet ongedaan gemaakt worden.
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  background: '#FFFFFF', border: '2px solid #020309', borderRadius: '9px',
                  boxShadow: '2px 2px 0 #020309', padding: '8px 16px', cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '13px',
                }}
              >
                Annuleren
              </button>
              <button
                onClick={async () => {
                  await removeInvoice(confirmDelete.id);
                  setConfirmDelete(null);
                }}
                style={{
                  background: '#c0392b', border: '2px solid #020309', borderRadius: '9px',
                  boxShadow: '2px 2px 0 #020309', padding: '8px 16px', cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '13px', color: '#fff',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                <Trash2 size={14} />
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── root: drill-down router ──────────────────────────────────────────────────

export function Facturen({ onUpload, onManualAdd }) {
  const { userQuarters } = useApp();
  const activeQuarters = userQuarters;

  const [level,           setLevel]     = useState('quarters');
  const [selectedQId,     setQId]       = useState(null);
  const [selectedMonthNum, setMonthNum] = useState(null);

  // Derive live objects from activeQuarters so new uploads appear instantly
  const selectedQuarter = activeQuarters.find((q) => q.id === selectedQId) ?? null;
  const selectedMonth   = selectedQuarter?.months.find((m) => m.month === selectedMonthNum) ?? null;

  const goQuarters = () => { setLevel('quarters'); setQId(null); setMonthNum(null); };
  const goMonths   = () => { setLevel('months'); setMonthNum(null); };

  if (level === 'invoices' && selectedQuarter && selectedMonth) {
    return (
      <FactuurLijst
        quarter={selectedQuarter}
        month={selectedMonth}
        onBack={goQuarters}
        onBackToQuarter={goMonths}
        onUpload={onUpload}
        onManualAdd={onManualAdd}
      />
    );
  }

  if (level === 'months' && selectedQuarter) {
    return (
      <MaandOverzicht
        quarter={selectedQuarter}
        onBack={goQuarters}
        onSelectMonth={(m) => { setMonthNum(m.month); setLevel('invoices'); }}
      />
    );
  }

  return (
    <KwartaalOverzicht
      activeQuarters={activeQuarters}
      onSelectQuarter={(q) => { setQId(q.id); setLevel('months'); }}
    />
  );
}
