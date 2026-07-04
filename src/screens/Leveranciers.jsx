import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { BtwPill } from '../components/Badge';
import { Package, TrendingUp, Calendar, FileText } from 'lucide-react';

// ─── helpers ─────────────────────────────────────────────────────────────────

const parseAmt = (str) => {
  const clean = String(str || '0').replace(/[€\s.]/g, '').replace(',', '.');
  return parseFloat(clean) || 0;
};

const fmtEur = (n) =>
  '€' + Number(n || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function parseDate(str) {
  if (!str) return new Date(0);
  const parts = str.split('-');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  }
  return new Date(0);
}

function mode(arr) {
  if (!arr.length) return null;
  const freq = {};
  let best = arr[0];
  for (const v of arr) {
    freq[v] = (freq[v] || 0) + 1;
    if (freq[v] > (freq[best] || 0)) best = v;
  }
  return best;
}

function computeSuppliers(activeQuarters, t) {
  const map = {};
  for (const q of activeQuarters) {
    for (const m of q.months) {
      for (const inv of m.invoices) {
        const name = inv.supplier || t('lev.unknownSupplier');
        if (!map[name]) {
          map[name] = { name, invoices: [], totalExcl: 0, totalBtw: 0, rates: [], lastTs: 0, lastDate: '-' };
        }
        const s = map[name];
        s.invoices.push(inv);

        const exclN = inv.amountExcl ?? parseAmt(inv.excl);
        const inclN = inv.amountIncl ?? parseAmt(inv.amount);
        const btwN  = inv.btwAmount  ?? (inclN - exclN);
        s.totalExcl += exclN;
        s.totalBtw  += btwN;

        if (inv.rate != null) s.rates.push(inv.rate);

        const ts = parseDate(inv.date).getTime();
        if (ts > s.lastTs) { s.lastTs = ts; s.lastDate = inv.date; }
      }
    }
  }

  return Object.values(map)
    .map((s) => ({ ...s, topRate: mode(s.rates) }))
    .sort((a, b) => b.totalExcl - a.totalExcl);
}

// ─── supplier card ────────────────────────────────────────────────────────────

function SupplierCard({ supplier: s }) {
  const { t } = useApp();
  const initials = s.name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');

  return (
    <div style={{
      background: '#FFFFFF',
      border: '2px solid #020309',
      borderRadius: '12px',
      boxShadow: '3px 3px 0 #020309',
      padding: '18px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
    }}>
      {/* top row: avatar + name + btw pill */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{
          width: '40px', height: '40px', flexShrink: 0,
          background: '#FDEEC4', border: '2px solid #020309', borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '13px', color: '#020309',
        }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '15px',
            color: '#020309', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {s.name}
          </div>
          <div style={{ marginTop: '3px' }}>
            {s.topRate != null ? <BtwPill rate={s.topRate} /> : null}
          </div>
        </div>
      </div>

      {/* stats row */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <StatRow icon={<TrendingUp size={13} />} label={t('lev.totalExclVat')} value={fmtEur(s.totalExcl)} mono />
        <StatRow icon={<FileText size={13} />}    label={t('lev.invoices')}         value={String(s.invoices.length)} />
        <StatRow icon={<Calendar size={13} />}    label={t('lev.lastInvoice')}  value={s.lastDate} mono />
      </div>

      {/* btw subtotal */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: '10px', borderTop: '1.5px solid #e8e0d0',
      }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#888' }}>{t('lev.vatTotal')}</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: '13px', color: '#020309' }}>
          {fmtEur(s.totalBtw)}
        </span>
      </div>
    </div>
  );
}

function StatRow({ icon, label, value, mono }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#888', minWidth: 0 }}>
        {icon}
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#666', whiteSpace: 'nowrap' }}>{label}</span>
      </div>
      <span style={{
        fontFamily: mono ? "'DM Mono', monospace" : "'DM Sans', sans-serif",
        fontWeight: 600, fontSize: '12px', color: '#020309', flexShrink: 0,
      }}>{value}</span>
    </div>
  );
}

// ─── empty state ─────────────────────────────────────────────────────────────

function EmptyState() {
  const { t } = useApp();
  return (
    <div style={{
      padding: '56px 32px', textAlign: 'center',
      background: '#FFFFFF', border: '2px solid #020309',
      borderRadius: '12px', boxShadow: '3px 3px 0 #020309',
    }}>
      <div style={{
        width: '52px', height: '52px', margin: '0 auto 16px',
        background: '#FAF3E3', border: '2px solid #020309', borderRadius: '14px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Package size={24} />
      </div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>
        {t('lev.emptyTitle')}
      </div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#888', lineHeight: 1.55 }}>
        {t('lev.emptyDesc')}
      </div>
    </div>
  );
}

// ─── summary bar ─────────────────────────────────────────────────────────────

function SummaryBar({ suppliers }) {
  const { t } = useApp();
  const totaalExcl = suppliers.reduce((s, sup) => s + sup.totalExcl, 0);
  const totaalBtw  = suppliers.reduce((s, sup) => s + sup.totalBtw,  0);
  const totaalInv  = suppliers.reduce((s, sup) => s + sup.invoices.length, 0);

  return (
    <div style={{
      display: 'flex', gap: '12px', flexWrap: 'wrap',
    }}>
      {[
        { label: t('lev.suppliers'),      value: String(suppliers.length), mono: false },
        { label: t('lev.totalInvoices'),  value: String(totaalInv),        mono: false },
        { label: t('lev.exclExpenses'),   value: fmtEur(totaalExcl),       mono: true  },
        { label: t('lev.vatTotal'),       value: fmtEur(totaalBtw),        mono: true  },
      ].map(({ label, value, mono }) => (
        <div key={label} style={{
          flex: 1, minWidth: '140px',
          background: '#FFFFFF', border: '2px solid #020309',
          borderRadius: '10px', boxShadow: '2px 2px 0 #020309',
          padding: '12px 16px',
        }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#888', marginBottom: '4px' }}>
            {label}
          </div>
          <div style={{ fontFamily: mono ? "'DM Mono', monospace" : "'DM Sans', sans-serif", fontWeight: 700, fontSize: '18px', color: '#020309' }}>
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── main screen ─────────────────────────────────────────────────────────────

export function Leveranciers() {
  const { userQuarters, t } = useApp();
  const activeQuarters = userQuarters;

  const suppliers = useMemo(() => computeSuppliers(activeQuarters, t), [activeQuarters, t]);

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '960px' }}>

      {suppliers.length > 0 && <SummaryBar suppliers={suppliers} />}

      {suppliers.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
          {suppliers.map((s) => (
            <SupplierCard key={s.name} supplier={s} />
          ))}
        </div>
      )}
    </div>
  );
}
