import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle, AlertTriangle, Info, MessageSquare, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { BalansChat } from '../components/BalansChat';

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) =>
  '€' + Math.abs(n).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const parse = (str) => {
  const clean = String(str).replace(/[€\s.]/g, '').replace(',', '.');
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
};

// ─── sub-components ──────────────────────────────────────────────────────────

function PeriodTab({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '7px 14px',
      fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '12px',
      background: active ? '#020309' : '#FFFFFF',
      color: active ? '#FAF3E3' : '#020309',
      border: '2px solid #020309', borderRadius: '10px',
      boxShadow: '2px 2px 0 #020309',
      cursor: 'pointer', whiteSpace: 'nowrap',
    }}>{label}</button>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
      fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase',
      color: '#888', marginBottom: '8px', marginTop: '4px',
    }}>{children}</div>
  );
}

function BalansRow({ label, value, auto = false, editable = false, onChange }) {
  const { t } = useApp();
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '9px 0', borderBottom: '1.5px solid #e8e0d0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#020309' }}>{label}</span>
        {auto && (
          <span title={t('balans.autoCalcTooltip')} style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '16px', height: '16px', borderRadius: '50%',
            background: '#E5F5F9', border: '1.5px solid #020309', cursor: 'help',
            fontSize: '9px', fontWeight: 700, color: '#020309',
          }}>A</span>
        )}
      </div>
      {editable ? (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} style={{
          width: '120px', textAlign: 'right',
          fontFamily: "'DM Mono', monospace", fontWeight: 600, fontSize: '13px',
          color: '#020309', background: '#FAF3E3',
          border: '1.5px solid #020309', borderRadius: '6px',
          padding: '4px 8px', outline: 'none',
        }}
          onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(2,3,9,0.15)'; }}
          onBlur={(e)  => { e.currentTarget.style.boxShadow = 'none'; }}
        />
      ) : (
        <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, fontSize: '13px', color: '#020309' }}>
          {value}
        </span>
      )}
    </div>
  );
}

function TotaalRow({ label, value }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '11px 14px', marginTop: '8px',
      background: '#020309', borderRadius: '8px', border: '2px solid #020309',
    }}>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '13px', color: '#FAF3E3' }}>{label}</span>
      <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: '16px', color: '#FAF3E3' }}>{value}</span>
    </div>
  );
}

function BalansKaart({ title, children, totaal, totaalLabel }) {
  return (
    <div style={{
      flex: 1, background: '#FFFFFF',
      border: '2px solid #020309', borderRadius: '12px',
      boxShadow: '3px 3px 0 #020309', padding: '20px 22px',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '18px', letterSpacing: '-0.3px', marginBottom: '16px', color: '#020309' }}>
        {title}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
      <TotaalRow label={totaalLabel} value={totaal} />
    </div>
  );
}

// ─── main screen ─────────────────────────────────────────────────────────────

export function Balans() {
  const { userQuarters, t } = useApp();
  const activeQuarters = userQuarters;

  const periods = [...activeQuarters].sort((a, b) => b.year - a.year || b.q - a.q);
  const [periodId, setPeriodId] = useState(periods[0]?.id ?? null);
  const [chatOpen, setChatOpen] = useState(true);

  const period = periods.find((p) => p.id === periodId) ?? periods[0];

  const autoValues = useMemo(() => {
    if (!period) return { debiteuren: 0, btwTeBetalen: 0, omzetPeriode: 0 };
    const allInvoices = period.months.flatMap((m) => m.invoices);
    const debiteuren   = allInvoices.filter((i) => i.status === 'pending').reduce((s, i) => s + parse(i.amount), 0);
    const btwTeBetalen = parse(period.btwTotal  ?? '€0,00');
    const omzetPeriode = parse(period.totalExcl ?? '€0,00');
    return { debiteuren, btwTeBetalen, omzetPeriode };
  }, [period]);

  const [manual, setManual] = useState({
    bank:          '€12.450,00',
    voorraad:      '€3.200,00',
    apparatuur:    '€1.800,00',
    software:      '€240,00',
    startkapitaal: '€5.000,00',
    crediteuren:   '€680,00',
    overigeSchuld: '€320,00',
  });
  const set = (key) => (val) => setManual((p) => ({ ...p, [key]: val }));

  // ── activa ──
  const bank       = parse(manual.bank);
  const voorraad   = parse(manual.voorraad);
  const apparatuur = parse(manual.apparatuur);
  const software   = parse(manual.software);
  const vlottend   = bank + autoValues.debiteuren + voorraad;
  const vast       = apparatuur + software;
  const totaalActiva = vlottend + vast;

  // ── passiva ──
  const startkapitaal = parse(manual.startkapitaal);
  const winst         = autoValues.omzetPeriode * 0.7;
  const eigenVermogen = startkapitaal + winst;
  const crediteuren   = parse(manual.crediteuren);
  const overigeSchuld = parse(manual.overigeSchuld);
  const kortlopend    = crediteuren + autoValues.btwTeBetalen + overigeSchuld;
  const totaalPassiva = eigenVermogen + kortlopend;

  const verschil = totaalActiva - totaalPassiva;
  const inBalans = Math.abs(verschil) < 0.01;

  const balansData = {
    period:              period?.label ?? t('balans.unknown'),
    bank:                manual.bank,
    debiteuren:          fmt(autoValues.debiteuren),
    voorraad:            manual.voorraad,
    apparatuur:          manual.apparatuur,
    software:            manual.software,
    totaalVlottend:      fmt(vlottend),
    totaalVast:          fmt(vast),
    totaalActiva:        fmt(totaalActiva),
    startkapitaal:       manual.startkapitaal,
    winst:               fmt(winst),
    totaalEigenVermogen: fmt(eigenVermogen),
    crediteuren:         manual.crediteuren,
    btwTeBetalen:        fmt(autoValues.btwTeBetalen),
    overigeSchuld:       manual.overigeSchuld,
    totaalKortlopend:    fmt(kortlopend),
    totaalPassiva:       fmt(totaalPassiva),
    inBalans,
    verschil:            fmt(Math.abs(verschil)),
  };

  return (
    // outer: two columns — balance sheet left, chat right
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── LEFT: balance sheet (scrollable) ── */}
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* period selector + chat toggle */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', color: '#888' }}>
              {t('balans.reportingDate')}
            </div>
            <button
              onClick={() => setChatOpen((v) => !v)}
              title={chatOpen ? t('balans.hideChat') : t('balans.showChat')}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: chatOpen ? '#020309' : '#FFFFFF',
                color: chatOpen ? '#FAF3E3' : '#020309',
                border: '2px solid #020309', borderRadius: '9px',
                boxShadow: '2px 2px 0 #020309',
                padding: '5px 10px', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '12px',
                transition: 'background .12s ease, color .12s ease',
              }}
            >
              {chatOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
              {chatOpen ? t('balans.hideChat') : t('balans.showChat')}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {periods.slice(0, 8).map((p) => (
              <PeriodTab key={p.id} label={p.label} active={p.id === periodId} onClick={() => setPeriodId(p.id)} />
            ))}
          </div>
        </div>

        {/* info banner */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: '#E5F5F9', border: '2px solid #020309',
          borderRadius: '10px', padding: '12px 16px',
          fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#020309',
        }}>
          <Info size={15} />
          <span>
            {t('balans.autoCalcInfo1')} <strong>A</strong> {t('balans.autoCalcInfo2')} <strong>{period?.label}</strong>{t('balans.autoCalcInfo3')}
          </span>
        </div>

        {/* two-column balance sheet */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch' }}>

          {/* ACTIVA */}
          <BalansKaart title={t('balans.assets')} totaalLabel={t('balans.totalAssets')} totaal={fmt(totaalActiva)}>
            <SectionLabel>{t('balans.currentAssets')}</SectionLabel>
            <BalansRow label={t('balans.bankCash')} value={manual.bank}     editable onChange={set('bank')} />
            <BalansRow label={t('balans.receivables')} value={fmt(autoValues.debiteuren)} auto />
            <BalansRow label={t('balans.inventory')}   value={manual.voorraad} editable onChange={set('voorraad')} />
            <div style={{ marginTop: '4px', marginBottom: '4px', display: 'flex', justifyContent: 'flex-end' }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#888' }}>{t('balans.subtotal', { amount: fmt(vlottend) })}</span>
            </div>
            <SectionLabel>{t('balans.fixedAssets')}</SectionLabel>
            <BalansRow label={t('balans.equipment')} value={manual.apparatuur} editable onChange={set('apparatuur')} />
            <BalansRow label={t('balans.software')}   value={manual.software}   editable onChange={set('software')} />
            <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'flex-end' }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#888' }}>{t('balans.subtotal', { amount: fmt(vast) })}</span>
            </div>
          </BalansKaart>

          {/* PASSIVA */}
          <BalansKaart title={t('balans.liabilities')} totaalLabel={t('balans.totalLiabilities')} totaal={fmt(totaalPassiva)}>
            <SectionLabel>{t('balans.equity')}</SectionLabel>
            <BalansRow label={t('balans.startingCapital')}   value={manual.startkapitaal} editable onChange={set('startkapitaal')} />
            <BalansRow label={t('balans.profitLoss')} value={fmt(winst)} auto />
            <div style={{ marginTop: '4px', marginBottom: '4px', display: 'flex', justifyContent: 'flex-end' }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#888' }}>{t('balans.subtotal', { amount: fmt(eigenVermogen) })}</span>
            </div>
            <SectionLabel>{t('balans.currentLiabilities')}</SectionLabel>
            <BalansRow label={t('balans.payables')}      value={manual.crediteuren}  editable onChange={set('crediteuren')} />
            <BalansRow label={t('balans.vatToPay')}   value={fmt(autoValues.btwTeBetalen)} auto />
            <BalansRow label={t('balans.otherLiabilities')} value={manual.overigeSchuld} editable onChange={set('overigeSchuld')} />
            <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'flex-end' }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#888' }}>{t('balans.subtotal', { amount: fmt(kortlopend) })}</span>
            </div>
          </BalansKaart>
        </div>

        {/* balance check footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          background: inBalans ? '#D2ECD0' : '#F3C1C0',
          border: '2px solid #020309', borderRadius: '12px',
          boxShadow: '3px 3px 0 #020309',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {inBalans ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '14px' }}>
                {inBalans ? t('balans.balanceOk') : t('balans.balanceNotOk')}
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#444', marginTop: '1px' }}>
                {inBalans
                  ? t('balans.balanceOkDesc', { period: period?.label })
                  : t('balans.balanceDiffDesc', { amount: fmt(Math.abs(verschil)) })
                }
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#444' }}>{t('balans.difference')}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: '20px' }}>
              {inBalans ? '€0,00' : fmt(verschil)}
            </div>
          </div>
        </div>

      </div>

      {/* ── RIGHT: chat panel (toggle) ── */}
      {chatOpen && (
        <div style={{
          width: '360px',
          flexShrink: 0,
          borderLeft: '2px solid #020309',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <BalansChat balansData={balansData} />
        </div>
      )}

    </div>
  );
}
