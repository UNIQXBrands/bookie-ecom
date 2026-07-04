import { useState, useMemo } from 'react';
import { Card }       from '../components/Card';
import { BtwSummary } from '../components/BtwSummary';
import { Button }     from '../components/Button';
import { BtwPill }    from '../components/Badge';
import { Info, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp, fmtEur } from '../context/AppContext';

function SectionHeader({ children }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', color: '#888' }}>{children}</span>
    </div>
  );
}

function computeBtw(invoices, t) {
  const RATE_LABELS = { 21: t('btw.rate.standard'), 9: t('btw.rate.reduced'), 0: t('btw.rate.exempt') };
  const byRate = {};
  invoices.forEach((inv) => {
    const r = inv.rate ?? 0;
    if (!byRate[r]) byRate[r] = { excl: 0, btw: 0, invoices: [] };
    byRate[r].excl += inv.amountExcl || 0;
    byRate[r].btw  += inv.btwAmount  || 0;
    byRate[r].invoices.push(inv);
  });

  const rateRows = Object.entries(byRate)
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([rate, { excl, btw, invoices }]) => ({
      rate:    Number(rate),
      label:   RATE_LABELS[Number(rate)] || t('btw.rate.other', { rate }),
      exclNum: excl,
      btwNum:  btw,
      excl:    fmtEur(excl),
      btw:     fmtEur(btw),
      invoices,
    }));

  const totalBtw = Object.values(byRate).reduce((s, r) => s + r.btw, 0);
  const items    = rateRows.map((r) => ({ rate: `BTW ${r.rate}%`, amount: r.btw }));

  return { rateRows, items, total: fmtEur(totalBtw), totalNum: totalBtw };
}

// ─── quarter selector ────────────────────────────────────────────────────────

function QuarterSelector({ quarters, selectedId, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {quarters.map((q) => {
        const active = q.id === selectedId;
        return (
          <button
            key={q.id}
            onClick={() => onChange(q.id)}
            style={{
              padding: '7px 14px',
              background: active ? '#020309' : '#FFFFFF',
              color: active ? '#FAF3E3' : '#020309',
              border: '2px solid #020309',
              borderRadius: '10px',
              boxShadow: active ? '2px 2px 0 #020309' : 'none',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700, fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {q.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── invoice detail table ────────────────────────────────────────────────────

function InvoiceDetailTable({ invoices }) {
  const { t } = useApp();
  const headers = [t('btw.colSupplier'), t('btw.colInvoiceNr'), t('btw.colDate'), t('btw.colExclVat'), t('btw.colVatAmount')];
  return (
    <div style={{ borderTop: '1.5px solid #e8e0d0', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'DM Sans', sans-serif", fontSize: '12px' }}>
        <thead>
          <tr style={{ background: '#F5EFE0' }}>
            {headers.map((h, i) => (
              <th key={h} style={{
                padding: '7px 12px',
                textAlign: i >= 3 ? 'right' : 'left',
                fontWeight: 700, fontSize: '10px', letterSpacing: '0.5px',
                textTransform: 'uppercase', color: '#666',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv, i) => (
            <tr key={inv.id} style={{ borderTop: '1px solid #ece5d5', background: i % 2 === 0 ? 'transparent' : '#FAF8F2' }}>
              <td style={{ padding: '8px 12px', fontWeight: 600 }}>{inv.supplier}</td>
              <td style={{ padding: '8px 12px', fontFamily: "'DM Mono', monospace", color: '#666' }}>{inv.nr}</td>
              <td style={{ padding: '8px 12px', fontFamily: "'DM Mono', monospace", color: '#666' }}>{inv.date}</td>
              <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: "'DM Mono', monospace" }}>{inv.excl}</td>
              <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>{fmtEur(inv.btwAmount || 0)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: '2px solid #020309', background: '#F5EFE0' }}>
            <td colSpan={3} style={{ padding: '8px 12px', fontWeight: 700, fontSize: '11px', color: '#444' }}>
              {t('btw.totalInvoices', { n: invoices.length })}
            </td>
            <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>
              {fmtEur(invoices.reduce((s, i) => s + (i.amountExcl || 0), 0))}
            </td>
            <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>
              {fmtEur(invoices.reduce((s, i) => s + (i.btwAmount || 0), 0))}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ─── rate card ────────────────────────────────────────────────────────────────

function RateCard({ row }) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      background: '#FFFFFF', border: '2px solid #020309',
      borderRadius: '12px', boxShadow: '3px 3px 0 #020309',
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%', background: 'none', border: 'none', padding: '16px 20px',
          cursor: 'pointer', textAlign: 'left',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#FAF3E3'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <BtwPill rate={row.rate} />
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span style={{ fontWeight: 700, fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}>{row.label}</span>
            <span style={{ fontSize: '12px', color: '#888', fontFamily: "'DM Mono', monospace" }}>
              {t('btw.purchaseExclVat', { amount: row.excl, n: row.invoices.length })}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: '18px' }}>{row.btw}</span>
          {open ? <ChevronUp size={16} color="#888" /> : <ChevronDown size={16} color="#888" />}
        </div>
      </button>

      {open && <InvoiceDetailTable invoices={row.invoices} />}
    </div>
  );
}

// ─── main screen ─────────────────────────────────────────────────────────────

export function BtwAangifte() {
  const { userQuarters, t } = useApp();

  const sortedQuarters = useMemo(
    () => [...userQuarters].sort((a, b) => b.year - a.year || b.q - a.q),
    [userQuarters],
  );

  const [selectedQId, setSelectedQId] = useState(null);

  // Always default to the latest quarter; update when quarters load
  const activeQId = selectedQId ?? sortedQuarters[0]?.id ?? null;
  const activeQuarter = sortedQuarters.find((q) => q.id === activeQId) ?? null;

  const quarterInvoices = useMemo(() => {
    if (!activeQuarter) return [];
    return activeQuarter.months.flatMap((m) => m.invoices);
  }, [activeQuarter]);

  const { rateRows, items, total } = computeBtw(quarterInvoices, t);

  if (sortedQuarters.length === 0) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{
          padding: '48px', textAlign: 'center',
          background: '#FFFFFF', border: '2px solid #020309',
          borderRadius: '12px', boxShadow: '3px 3px 0 #020309',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>{t('btw.emptyTitle')}</div>
          <div style={{ fontSize: '13px', color: '#888' }}>{t('btw.emptyDesc')}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '820px' }}>

      {/* quarter selector */}
      <QuarterSelector
        quarters={sortedQuarters}
        selectedId={activeQId}
        onChange={setSelectedQId}
      />

      {/* uitleg banner */}
      <div style={{
        background: '#E5F5F9', border: '2px solid #020309', borderRadius: '12px',
        boxShadow: '3px 3px 0 #020309', padding: '14px 18px',
        display: 'flex', gap: '12px', alignItems: 'flex-start',
      }}>
        <Info size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', lineHeight: 1.55, color: '#020309' }}>
          <strong>{t('btw.explainerBold')}</strong> {t('btw.explainerBody1')} <strong>Rubriek 5b</strong> {t('btw.explainerBody2')}
        </div>
      </div>

      <BtwSummary
        title={t('btw.inputVatTitle', { q: activeQuarter?.label ?? '' })}
        sub={t('btw.inputVatSub', { period: activeQuarter?.period ?? '' })}
        items={items}
        total={total}
        totalLabel={t('btw.totalInputVat')}
      />

      <div>
        <SectionHeader>{t('btw.breakdownByRate')}</SectionHeader>
        {rateRows.length === 0 ? (
          <div style={{
            padding: '32px', textAlign: 'center',
            background: '#FFFFFF', border: '2px solid #020309',
            borderRadius: '12px', boxShadow: '3px 3px 0 #020309',
            fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#888',
          }}>
            {t('btw.noInvoicesThisQuarter')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {rateRows.map((r) => <RateCard key={r.rate} row={r} />)}
          </div>
        )}
      </div>

      <Card variant="blue">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Info size={18} />
            <div style={{ fontSize: '13px', maxWidth: '440px' }}>
              <strong style={{ fontWeight: 700 }}>{t('btw.readyTitle')}</strong> {t('btw.readyDesc')}
            </div>
          </div>
          <Button variant="primary" icon={<Download size={16} />}>{t('common.export')}</Button>
        </div>
      </Card>
    </div>
  );
}
