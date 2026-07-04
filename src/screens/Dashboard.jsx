import { StatCard }        from '../components/StatCard';
import { InvoiceTable }    from '../components/InvoiceTable';
import { Badge, BtwPill }  from '../components/Badge';
import { Button }          from '../components/Button';
import { useApp, fmtEur }  from '../context/AppContext';
import * as Icons          from 'lucide-react';

function SectionHeader({ children, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', color: '#888' }}>{children}</span>
      {right}
    </div>
  );
}

const statusBadge = (s) => ({
  paid:    <Badge variant="paid"    dot>Betaald</Badge>,
  pending: <Badge variant="pending" dot>Openstaand</Badge>,
  review:  <Badge variant="review"  dot>Te controleren</Badge>,
}[s]);

const columns = [
  { key: 'supplier', label: 'Leverancier' },
  { key: 'date',     label: 'Datum',  mono: true },
  { key: 'btw',      label: 'BTW' },
  { key: 'amount',   label: 'Bedrag', mono: true, align: 'right' },
  { key: 'status',   label: 'Status' },
];

function parseDate(dateStr) {
  const parts = (dateStr || '').split('-');
  if (parts.length < 3) return null;
  if (parts[0].length === 4) return { year: Number(parts[0]), month: Number(parts[1]) };
  return { year: Number(parts[2]), month: Number(parts[1]) };
}

function inQuarter(dateStr, q, year) {
  const d = parseDate(dateStr);
  if (!d) return false;
  return d.year === year && Math.ceil(d.month / 3) === q;
}

function computeBtwSummary(purchaseInvs, salesInvs) {
  const btwInkoop  = purchaseInvs.reduce((s, i) => s + (i.btwAmount || 0), 0);
  const btwVerkoop = salesInvs.reduce((s, i)    => s + (i.btwAmount || 0), 0);
  const net        = btwVerkoop - btwInkoop;

  const items = [];
  if (btwVerkoop > 0) items.push({ label: 'BTW op verkoop',   value: fmtEur(btwVerkoop), positive: true });
  if (btwInkoop  > 0) items.push({ label: 'Voorbelasting (inkoop)', value: fmtEur(btwInkoop), positive: false });

  return { btwInkoop, btwVerkoop, net, items };
}

export function Dashboard({ onUpload, onOpenAll }) {
  const { userInvoices, salesInvoices } = useApp();

  const now       = new Date();
  const currentQ  = Math.ceil((now.getMonth() + 1) / 3);
  const currentY  = now.getFullYear();
  const qLabel    = `Q${currentQ} ${currentY}`;
  const monthNames = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
  const qStart    = monthNames[(currentQ - 1) * 3];
  const qEnd      = monthNames[(currentQ - 1) * 3 + 2];
  const qPeriod   = `${qStart}–${qEnd} ${currentY}`;

  const qPurchase = userInvoices.filter(i  => inQuarter(i.date, currentQ, currentY));
  const qSales    = salesInvoices.filter(i => inQuarter(i.date, currentQ, currentY));

  const { btwInkoop, btwVerkoop, net } = computeBtwSummary(qPurchase, qSales);

  const totalExcl  = qPurchase.reduce((s, i) => s + (i.amountExcl || 0), 0);
  const paid       = qPurchase.filter(i => i.status === 'paid');
  const review     = qPurchase.filter(i => i.status === 'review');
  const paidExcl   = paid.reduce((s, i)   => s + (i.amountExcl || 0), 0);
  const reviewExcl = review.reduce((s, i) => s + (i.amountExcl || 0), 0);
  const btwLabel   = net >= 0 ? 'BTW te betalen' : 'BTW terug';

  const stats = [
    { label: 'Totaal excl. BTW', value: fmtEur(totalExcl),       sub: `${qPurchase.length} facturen · ${qLabel}`, variant: 'yellow', icon: 'Wallet' },
    { label: btwLabel,           value: fmtEur(Math.abs(net)),    sub: qPeriod,                                    variant: 'blue',   icon: 'Percent' },
    { label: 'Betaald',          value: fmtEur(paidExcl),         sub: `${paid.length} facturen · ${qLabel}`,      variant: 'green',  icon: 'Check' },
    { label: 'Te controleren',   value: fmtEur(reviewExcl),       sub: `${review.length} facturen · ${qLabel}`,    variant: 'red',    icon: 'AlertTriangle' },
  ];

  // BTW breakdown voor BtwSummary component
  const byRate = {};
  qPurchase.forEach((inv) => {
    const r = inv.rate ?? 0;
    if (!byRate[r]) byRate[r] = { excl: 0, btw: 0 };
    byRate[r].excl += inv.amountExcl || 0;
    byRate[r].btw  += inv.btwAmount  || 0;
  });
  const btwItems = Object.entries(byRate)
    .filter(([, v]) => v.excl > 0 || v.btw > 0)
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([rate, { excl, btw }]) => ({ rate: Number(rate), excl: fmtEur(excl), btw: fmtEur(btw) }));

  const recentRows = qPurchase.slice(0, 5).map(inv => ({
    id: inv.id,
    supplier: inv.supplier,
    date: inv.date,
    btw: <BtwPill rate={inv.rate} />,
    amount: inv.amount,
    status: statusBadge(inv.status),
  }));

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {stats.map((s) => {
          const Icon = Icons[s.icon];
          return (
            <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} variant={s.variant}
              icon={Icon ? <Icon size={13} /> : null} />
          );
        })}
      </div>

      {/* BTW kwartaaloverzicht */}
      <div>
        <SectionHeader>BTW {qLabel} · {qPeriod}</SectionHeader>
        {btwItems.length > 0 ? (
          <BtwCard
            btwInkoop={btwInkoop}
            btwVerkoop={btwVerkoop}
            net={net}
            items={btwItems}
            qPeriod={qPeriod}
          />
        ) : (
          <EmptyState message={`Nog geen facturen in ${qLabel}. Upload je eerste factuur om te beginnen.`} />
        )}
      </div>

      {/* Recente facturen */}
      <div>
        <SectionHeader right={recentRows.length > 0 ? <Button variant="ghost" size="sm" onClick={onOpenAll}>Alles bekijken →</Button> : null}>
          Recente facturen · {qLabel}
        </SectionHeader>
        {recentRows.length > 0
          ? <InvoiceTable columns={columns} rows={recentRows} onRowClick={() => {}} />
          : <EmptyState message={`Nog geen facturen in ${qLabel}.`} />
        }
      </div>
    </div>
  );
}

function BtwCard({ btwInkoop, btwVerkoop, net, items, qPeriod }) {
  const isTerug   = net < 0;
  const netColor  = isTerug ? '#1a6b3a' : '#b94c00';
  const netBg     = isTerug ? '#D2ECD0'  : '#FDEEC4';
  const netLabel  = isTerug ? 'BTW terug te vragen' : 'BTW te betalen';

  return (
    <div style={{ background: '#FDEEC4', border: '2px solid #020309', borderRadius: '12px', boxShadow: '3px 3px 0 #020309', overflow: 'hidden' }}>
      {/* Breakdown per tarief */}
      <div style={{ padding: '16px 20px', display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {items.map(it => (
          <div key={it.rate} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', color: '#666' }}>BTW {it.rate}%</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: '20px', color: '#020309' }}>{it.btw}</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#888' }}>excl. {it.excl}</span>
          </div>
        ))}
        {btwVerkoop > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', color: '#666' }}>BTW verkoop</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: '20px', color: '#020309' }}>{fmtEur(btwVerkoop)}</span>
          </div>
        )}
      </div>

      {/* Netto resultaat */}
      <div style={{ background: netBg, borderTop: '2px solid #020309', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '13px', color: netColor }}>{netLabel}</span>
          {!btwVerkoop && (
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#888', marginLeft: '8px' }}>— nog geen verkoopfacturen</span>
          )}
        </div>
        <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 800, fontSize: '22px', color: netColor }}>{fmtEur(Math.abs(net))}</span>
      </div>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div style={{
      padding: '32px', textAlign: 'center',
      background: '#FFFFFF', border: '2px solid #020309',
      borderRadius: '12px', boxShadow: '3px 3px 0 #020309',
      color: '#888', fontSize: '13px', fontFamily: "'DM Sans', sans-serif",
    }}>{message}</div>
  );
}
