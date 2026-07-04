import { useState, useMemo } from 'react';
import { useApp, fmtEur } from '../context/AppContext';
import { Input, Textarea } from '../components/Input';
import {
  Plus, Trash2, Download, Send, ChevronLeft, FileText, Mail, Edit2,
} from 'lucide-react';

// ─── helpers ─────────────────────────────────────────────────────────────────

function uid() {
  return `sale_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function fmtNum(n) {
  return Number(n || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function todayStr() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
}

function addDays(dateStr, n) {
  if (!dateStr) return '';
  const [day, month, year] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + n);
  return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
}

function nextInvoiceNr(salesInvoices) {
  const year   = new Date().getFullYear();
  const prefix = `VRK-${year}-`;
  const nums   = salesInvoices
    .map((i) => i.invoiceNr)
    .filter((nr) => nr?.startsWith(prefix))
    .map((nr) => parseInt(nr.slice(prefix.length)) || 0);
  return `${prefix}${String(Math.max(0, ...nums) + 1).padStart(4, '0')}`;
}

function getCompanyInfo() {
  try { return JSON.parse(localStorage.getItem('bookie_company_info') || '{}'); }
  catch { return {}; }
}

const EMPTY_LINE = () => ({ id: uid(), description: '', qty: '1', unitPrice: '', rate: 21 });

function initForm(salesInvoices, edit = null) {
  if (edit) {
    return { ...edit, lineItems: edit.lineItems.map((l) => ({ ...l, qty: String(l.qty), unitPrice: String(l.unitPrice) })) };
  }
  const today = todayStr();
  return {
    id: uid(), customerName: '', customerEmail: '', customerAddress: '',
    invoiceNr: nextInvoiceNr(salesInvoices), date: today, dueDate: addDays(today, 14),
    lineItems: [EMPTY_LINE()], notes: '', status: 'draft',
  };
}

function computeTotals(lineItems) {
  let totExcl = 0;
  const byRate = {};
  lineItems.forEach((l) => {
    const excl = (parseFloat(l.qty) || 0) * (parseFloat(l.unitPrice) || 0);
    const rate = Number(l.rate) || 0;
    const btw  = excl * (rate / 100);
    totExcl += excl;
    if (!byRate[rate]) byRate[rate] = 0;
    byRate[rate] += btw;
  });
  const totBtw = Object.values(byRate).reduce((s, v) => s + v, 0);
  return { totExcl, totBtw, totIncl: totExcl + totBtw, byRate };
}

function buildFinalInvoice(form, totals, overrideStatus) {
  return {
    ...form,
    status:     overrideStatus ?? form.status,
    amountExcl: totals.totExcl,
    btwAmount:  totals.totBtw,
    amountIncl: totals.totIncl,
    lineItems:  form.lineItems.map((l) => ({ ...l, qty: parseFloat(l.qty) || 0, unitPrice: parseFloat(l.unitPrice) || 0 })),
  };
}

// ─── PDF (styled like the app) ────────────────────────────────────────────────

function generatePdfHtml(inv) {
  const company = getCompanyInfo();
  const totals  = computeTotals(inv.lineItems);

  const lineRows = inv.lineItems.map((l, i) => {
    const excl = (l.qty || 0) * (l.unitPrice || 0);
    return `<div class="line-row ${i % 2 === 1 ? 'alt' : ''}">
      <span class="line-desc">${l.description || '–'}</span>
      <span class="mono r">${fmtNum(l.qty)}</span>
      <span class="mono r">€ ${fmtNum(l.unitPrice)}</span>
      <span class="mono r">${l.rate}%</span>
      <span class="mono r"><strong>€ ${fmtNum(excl)}</strong></span>
    </div>`;
  }).join('');

  const btwRows = Object.entries(totals.byRate)
    .filter(([, v]) => v > 0)
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([rate, btw]) => `<div class="tot-row"><span class="lbl">BTW ${rate}%</span><span class="val mono">€ ${fmtNum(btw)}</span></div>`)
    .join('');

  const payDays = company.paymentDays || 14;

  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<title>Factuur ${inv.invoiceNr}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{height:100%}
  body{font-family:'DM Sans',Arial,sans-serif;background:#FAF3E3;color:#020309;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{max-width:820px;margin:0 auto;padding:40px;min-height:100%;display:flex;flex-direction:column}
  .card{background:#fff;border:2px solid #020309;border-radius:16px;overflow:hidden;box-shadow:5px 5px 0 #020309;flex:1;display:flex;flex-direction:column}
  .card-body{flex:1;display:flex;flex-direction:column}

  /* header */
  .inv-header{background:#FAF3E3;border-bottom:2px solid #020309;padding:28px 32px;display:flex;justify-content:space-between;align-items:flex-start;gap:24px}
  .co-name{font-size:22px;font-weight:800;letter-spacing:-0.5px}
  .co-sub{font-size:10px;color:#888;margin-top:6px;line-height:1.8}
  .inv-meta-block{text-align:right;flex-shrink:0}
  .inv-label-badge{display:inline-block;background:#020309;color:#FAF3E3;font-size:8px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;padding:4px 10px;border-radius:9999px;margin-bottom:10px}
  .inv-nr{font-family:'DM Mono',monospace;font-weight:700;font-size:18px}
  .inv-dates{font-family:'DM Mono',monospace;font-size:10px;color:#888;margin-top:5px;line-height:2}

  /* customer */
  .to-section{padding:20px 32px;border-bottom:1.5px solid #e8e0d0}
  .sec-lbl{font-size:8px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#bbb;margin-bottom:6px}
  .to-name{font-weight:700;font-size:15px}
  .to-sub{font-size:11px;color:#888;margin-top:3px;line-height:1.6}

  /* lines */
  .lines-header{display:grid;grid-template-columns:1fr 72px 96px 56px 96px;gap:8px;padding:10px 32px;background:#F5EFE0;border-bottom:1.5px solid #e8e0d0;font-size:8px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:#666}
  .line-row{display:grid;grid-template-columns:1fr 72px 96px 56px 96px;gap:8px;padding:10px 32px;border-bottom:1px solid #ece5d5;align-items:center;font-size:12px}
  .line-row.alt{background:#FAF8F2}
  .line-desc{font-weight:600}
  .mono{font-family:'DM Mono',monospace}
  .r{text-align:right}

  /* totals */
  .totals-section{background:#FDEEC4;border-top:2px solid #020309;padding:20px 32px}
  .tot-row{display:flex;justify-content:space-between;align-items:center;padding:3px 0;font-size:12px}
  .tot-row .lbl{color:#555}
  .tot-row .val{font-family:'DM Mono',monospace;font-weight:600}
  .tot-divider{height:1.5px;background:rgba(2,3,9,.25);margin:8px 0}
  .tot-final{padding-top:6px}
  .tot-final .lbl{font-weight:700;font-size:15px}
  .tot-final .val{font-family:'DM Mono',monospace;font-weight:700;font-size:20px}

  /* notes */
  .notes-section{padding:18px 32px;border-top:1.5px solid #e8e0d0}
  .notes-text{font-size:11px;color:#555;line-height:1.65;margin-top:6px}

  /* spacer pushes footer to bottom */
  .spacer{flex:1}

  /* footer */
  .footer-section{background:#020309;padding:18px 32px;margin-top:auto}
  .footer-text{font-size:10px;color:#888;line-height:1.8}
  .footer-text strong{color:#FAF3E3}

  @media print{
    html,body{height:100%;margin:0}
    .page{max-width:none;padding:0;min-height:100vh}
    .card{box-shadow:none;border-radius:0;border-left:none;border-right:none;min-height:100vh}
  }
</style>
</head>
<body>
<div class="page">
<div class="card">
<div class="card-body">

  <div class="inv-header">
    <div>
      <div class="co-name">${company.bedrijfsnaam || 'Jouw bedrijf'}</div>
      <div class="co-sub">
        ${company.address  ? `${company.address}<br>` : ''}
        ${company.email    ? `${company.email}<br>`   : ''}
        ${company.kvk      ? `KvK: ${company.kvk}${company.btwnummer ? ' &nbsp;·&nbsp; ' : ''}` : ''}
        ${company.btwnummer? `BTW: ${company.btwnummer}` : ''}
      </div>
    </div>
    <div class="inv-meta-block">
      <div class="inv-label-badge">FACTUUR</div>
      <div class="inv-nr">${inv.invoiceNr}</div>
      <div class="inv-dates">
        ${inv.date ? `Datum &nbsp; ${inv.date}` : ''}<br>
        ${inv.dueDate ? `Vervalt &nbsp; ${inv.dueDate}` : ''}
      </div>
    </div>
  </div>

  <div class="to-section">
    <div class="sec-lbl">Factuur aan</div>
    <div class="to-name">${inv.customerName || '–'}</div>
    ${inv.customerAddress ? `<div class="to-sub">${inv.customerAddress.replace(/\n/g,'<br>')}</div>` : ''}
    ${inv.customerEmail   ? `<div class="to-sub">${inv.customerEmail}</div>` : ''}
  </div>

  <div class="lines-header">
    <span>Omschrijving</span><span class="r">Aantal</span><span class="r">Prijs</span><span class="r">BTW</span><span class="r">Subtotaal</span>
  </div>
  ${lineRows}

  <div class="totals-section">
    <div class="tot-row"><span class="lbl">Subtotaal excl. BTW</span><span class="val mono">€ ${fmtNum(totals.totExcl)}</span></div>
    ${btwRows}
    <div class="tot-divider"></div>
    <div class="tot-row tot-final"><span class="lbl">Totaal incl. BTW</span><span class="val mono">€ ${fmtNum(totals.totIncl)}</span></div>
  </div>

  ${inv.notes ? `<div class="notes-section"><div class="sec-lbl">Notities</div><div class="notes-text">${inv.notes}</div></div>` : ''}

  <div class="spacer"></div>

</div><!-- /card-body -->
  <div class="footer-section">
    <div class="footer-text">
      ${company.iban
        ? `Graag <strong>€ ${fmtNum(totals.totIncl)}</strong> voldoen binnen <strong>${payDays} dagen</strong> op <strong>${company.iban}</strong> t.n.v. <strong>${company.bedrijfsnaam || ''}</strong>.`
        : `Graag het factuurbedrag voldoen binnen <strong>${payDays} dagen</strong>.`}
      ${company.email ? `<br>Vragen? <strong>${company.email}</strong>` : ''}
    </div>
  </div>

</div>
</div>
</body>
</html>`;
}

function openPdf(inv) {
  const win = window.open('', '_blank');
  if (!win) { alert('Sta pop-ups toe om de PDF te genereren.'); return; }
  win.document.write(generatePdfHtml(inv));
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
}

function openMailTo(inv) {
  const company = getCompanyInfo();
  const subject = encodeURIComponent(`Factuur ${inv.invoiceNr}`);
  const body    = encodeURIComponent(
    `Beste ${inv.customerName || 'klant'},\n\n` +
    `Bijgevoegd ontvangt u factuur ${inv.invoiceNr}.\n\n` +
    `Factuurbedrag:  € ${fmtNum(inv.amountIncl)} (incl. BTW)\n` +
    `Factuurnummer:  ${inv.invoiceNr}\n` +
    `Factuurdatum:   ${inv.date}\n` +
    `Vervaldatum:    ${inv.dueDate || '–'}\n\n` +
    `Graag ontvang ik de betaling binnen ${company.paymentDays || 14} dagen.\n\n` +
    `Met vriendelijke groet,\n${company.bedrijfsnaam || ''}`,
  );
  window.location.href = `mailto:${inv.customerEmail || ''}?subject=${subject}&body=${body}`;
}

// ─── status config ────────────────────────────────────────────────────────────

const STATUS_CFG = {
  draft: { label: 'Concept',   bg: '#F0EAD8', color: '#666',    next: 'sent'  },
  sent:  { label: 'Verstuurd', bg: '#E5F5F9', color: '#0369a1', next: 'paid'  },
  paid:  { label: 'Betaald',   bg: '#D2ECD0', color: '#2d7d32', next: 'draft' },
};

function StatusBadge({ inv, onCycle }) {
  const cfg = STATUS_CFG[inv.status] || STATUS_CFG.draft;
  return (
    <button onClick={(e) => { e.stopPropagation(); onCycle(inv); }} title="Klik om status te wijzigen"
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 9px',
        background: cfg.bg, border: '1.5px solid #020309', borderRadius: '9999px',
        fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '10.5px', color: cfg.color,
        whiteSpace: 'nowrap',
      }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.color }} />
        {cfg.label}
      </span>
    </button>
  );
}

// ─── live preview ─────────────────────────────────────────────────────────────

function PreviewTotRow({ label, value, grand = false }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: grand ? '6px 0 0' : '2px 0' }}>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: grand ? '12px' : '11px', fontWeight: grand ? 700 : 400, color: grand ? '#020309' : '#666' }}>
        {label}
      </span>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: grand ? '15px' : '11px', fontWeight: grand ? 700 : 600, color: '#020309' }}>
        {value}
      </span>
    </div>
  );
}

function LivePreview({ form, totals }) {
  const company = getCompanyInfo();

  return (
    <div style={{
      position: 'sticky', top: '24px',
      background: '#FFFFFF', border: '2px solid #020309',
      borderRadius: '16px', boxShadow: '5px 5px 0 #020309',
      overflow: 'hidden', fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* dark top bar */}
      <div style={{
        background: '#020309', padding: '8px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#888' }}>Preview</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: '#666' }}>{form.invoiceNr}</span>
      </div>

      {/* header: cream */}
      <div style={{ background: '#FAF3E3', borderBottom: '2px solid #020309', padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '14px', letterSpacing: '-0.3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {company.bedrijfsnaam || <span style={{ color: '#bbb', fontStyle: 'italic', fontWeight: 400 }}>Bedrijfsnaam</span>}
            </div>
            {company.btwnummer && (
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', color: '#aaa', marginTop: '2px' }}>BTW {company.btwnummer}</div>
            )}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <span style={{
              display: 'inline-block', background: '#020309', color: '#FAF3E3',
              fontSize: '7px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase',
              padding: '2px 7px', borderRadius: '9999px', marginBottom: '6px',
            }}>FACTUUR</span>
            <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: '13px' }}>
              {form.invoiceNr || <span style={{ color: '#bbb' }}>–</span>}
            </div>
            {form.date && <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>{form.date}</div>}
            {form.dueDate && <div style={{ fontSize: '9px', color: '#aaa' }}>Vervalt {form.dueDate}</div>}
          </div>
        </div>
      </div>

      {/* customer */}
      <div style={{ padding: '12px 20px', borderBottom: '1.5px solid #e8e0d0', minHeight: '52px' }}>
        <div style={{ fontSize: '7px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#bbb', marginBottom: '4px' }}>Aan</div>
        {form.customerName
          ? <>
              <div style={{ fontWeight: 700, fontSize: '12px' }}>{form.customerName}</div>
              {form.customerAddress && <div style={{ fontSize: '10px', color: '#888', marginTop: '1px' }}>{form.customerAddress}</div>}
              {form.customerEmail   && <div style={{ fontSize: '10px', color: '#888' }}>{form.customerEmail}</div>}
            </>
          : <div style={{ fontSize: '11px', color: '#ccc', fontStyle: 'italic' }}>Klantnaam invullen…</div>
        }
      </div>

      {/* line items header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 52px 72px',
        padding: '7px 20px', gap: '6px',
        background: '#F5EFE0', borderBottom: '1.5px solid #e8e0d0',
        fontSize: '7px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#888',
      }}>
        <span>Omschrijving</span><span style={{ textAlign: 'right' }}>BTW</span><span style={{ textAlign: 'right' }}>Subtotaal</span>
      </div>

      {/* line items rows */}
      <div>
        {form.lineItems.map((l, i) => {
          const sub     = (parseFloat(l.qty) || 0) * (parseFloat(l.unitPrice) || 0);
          const isEmpty = !l.description && !parseFloat(l.unitPrice);
          return (
            <div key={l.id} style={{
              display: 'grid', gridTemplateColumns: '1fr 52px 72px',
              padding: '7px 20px', gap: '6px',
              borderBottom: i < form.lineItems.length - 1 ? '1px solid #f0ece3' : 'none',
              background: i % 2 === 1 ? '#FAF8F2' : 'transparent',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: '11px', fontWeight: isEmpty ? 400 : 600, color: isEmpty ? '#ccc' : '#020309', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: isEmpty ? 'italic' : 'normal' }}>
                {isEmpty ? `Regel ${i + 1}` : (l.description || `Regel ${i + 1}`)}
              </span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: '#888', textAlign: 'right' }}>{l.rate}%</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', fontWeight: 600, textAlign: 'right', color: sub > 0 ? '#020309' : '#ccc' }}>
                {fmtEur(sub)}
              </span>
            </div>
          );
        })}
      </div>

      {/* totals */}
      <div style={{ background: '#FDEEC4', borderTop: '2px solid #020309', padding: '14px 20px' }}>
        <PreviewTotRow label="Subtotaal excl. BTW" value={fmtEur(totals.totExcl)} />
        {Object.entries(totals.byRate)
          .filter(([, v]) => v > 0)
          .sort(([a], [b]) => Number(b) - Number(a))
          .map(([rate, btw]) => (
            <PreviewTotRow key={rate} label={`BTW ${rate}%`} value={fmtEur(btw)} />
          ))}
        <div style={{ height: '1.5px', background: 'rgba(2,3,9,.25)', margin: '7px 0' }} />
        <PreviewTotRow label="Totaal incl. BTW" value={fmtEur(totals.totIncl)} grand />
      </div>

      {/* notes */}
      {form.notes && (
        <div style={{ padding: '12px 20px', borderTop: '1.5px solid #e8e0d0' }}>
          <div style={{ fontSize: '7px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#bbb', marginBottom: '4px' }}>Notities</div>
          <div style={{ fontSize: '10px', color: '#666', lineHeight: 1.55 }}>{form.notes}</div>
        </div>
      )}

      {/* pdf footer hint */}
      <div style={{ background: '#020309', padding: '10px 20px' }}>
        <div style={{ fontSize: '9px', color: '#555', lineHeight: 1.7 }}>
          {company.iban
            ? <><span style={{ color: '#888' }}>Betalen op SPAN </span><span style={{ fontFamily: "'DM Mono', monospace", color: '#888' }}>{company.iban}</span></>
            : <span style={{ color: '#555' }}>IBAN instellen via Instellingen → Profiel</span>}
        </div>
      </div>
    </div>
  );
}

// ─── list ─────────────────────────────────────────────────────────────────────

function VerkoopList({ onNew, onEdit }) {
  const { salesInvoices, saveSalesInvoice, removeSalesInvoice } = useApp();
  const [confirmDelete, setConfirmDelete] = useState(null);

  function cycleStatus(inv) {
    saveSalesInvoice({ ...inv, status: STATUS_CFG[inv.status]?.next || 'draft' });
  }

  const sorted = [...salesInvoices].sort((a, b) => (b.invoiceNr || '').localeCompare(a.invoiceNr || ''));

  if (sorted.length === 0) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <NieuweBtn onClick={onNew} />
        </div>
        <div style={{
          padding: '64px 24px', textAlign: 'center',
          background: '#FFFFFF', border: '2px solid #020309', borderRadius: '16px', boxShadow: '3px 3px 0 #020309',
          fontFamily: "'DM Sans', sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
        }}>
          <span style={{ width: '56px', height: '56px', background: '#FDEEC4', border: '2px solid #020309', borderRadius: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={24} />
          </span>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Nog geen verkoopfacturen</div>
            <div style={{ fontSize: '13px', color: '#888', maxWidth: '360px' }}>Maak je eerste verkoopfactuur aan en stuur hem direct naar je klant.</div>
          </div>
          <NieuweBtn onClick={onNew} />
        </div>
      </div>
    );
  }

  const colW = ['28px', '1fr', '120px', '100px', '100px', '100px', '115px', '84px'];

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <NieuweBtn onClick={onNew} />
      </div>

      <div style={{ background: '#FFFFFF', border: '2px solid #020309', borderRadius: '12px', boxShadow: '3px 3px 0 #020309', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: colW.join(' '), padding: '10px 16px', background: '#F5EFE0', borderBottom: '2px solid #020309', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '10px', letterSpacing: '0.5px', textTransform: 'uppercase', color: '#666', gap: '8px' }}>
          <span /><span>Klant</span><span>Factuurnr</span><span>Datum</span><span>Vervaldatum</span><span style={{ textAlign: 'right' }}>Bedrag</span><span>Status</span><span />
        </div>

        {sorted.map((inv, idx) => (
          <div key={inv.id} style={{ display: 'grid', gridTemplateColumns: colW.join(' '), padding: '11px 16px', gap: '8px', alignItems: 'center', borderTop: idx === 0 ? 'none' : '1px solid #e8e0d0', background: idx % 2 === 1 ? '#FAF8F2' : 'transparent' }}>
            <span style={{ width: '28px', height: '28px', background: '#FDEEC4', border: '1.5px solid #020309', borderRadius: '7px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileText size={12} />
            </span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.customerName || '–'}</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', color: '#666' }}>{inv.invoiceNr}</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', color: '#666' }}>{inv.date}</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', color: inv.dueDate ? '#666' : '#ccc' }}>{inv.dueDate || '–'}</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: '13px', textAlign: 'right' }}>{fmtEur(inv.amountIncl)}</span>
            <StatusBadge inv={inv} onCycle={cycleStatus} />
            <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
              <IconBtn title="Bewerken"  onClick={() => onEdit(inv)}><Edit2 size={13} /></IconBtn>
              <IconBtn title="PDF"       onClick={() => openPdf(inv)}><Download size={13} /></IconBtn>
              {inv.customerEmail && <IconBtn title="E-mail" onClick={() => openMailTo(inv)}><Mail size={13} /></IconBtn>}
              <IconBtn title="Verwijderen" danger onClick={() => setConfirmDelete(inv)}><Trash2 size={13} /></IconBtn>
            </div>
          </div>
        ))}
      </div>

      <TotalsBar invoices={sorted} />

      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(2,3,9,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setConfirmDelete(null)}>
          <div style={{ background: '#FAF3E3', border: '2px solid #020309', borderRadius: '14px', boxShadow: '5px 5px 0 #020309', padding: '28px', maxWidth: '360px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>Factuur verwijderen?</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#555', marginBottom: '22px', lineHeight: 1.55 }}>
              <strong>{confirmDelete.invoiceNr}</strong> · {confirmDelete.customerName}<br />Dit kan niet ongedaan worden gemaakt.
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ background: '#FFFFFF', border: '2px solid #020309', borderRadius: '9px', boxShadow: '2px 2px 0 #020309', padding: '8px 16px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '13px' }}>Annuleren</button>
              <button onClick={async () => { await removeSalesInvoice(confirmDelete.id); setConfirmDelete(null); }} style={{ background: '#c0392b', border: '2px solid #020309', borderRadius: '9px', boxShadow: '2px 2px 0 #020309', padding: '8px 16px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '13px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Trash2 size={14} /> Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TotalsBar({ invoices }) {
  const open    = invoices.filter((i) => i.status !== 'paid');
  const paid    = invoices.filter((i) => i.status === 'paid');
  const totAll  = invoices.reduce((s, i) => s + (i.amountIncl || 0), 0);
  const totOpen = open.reduce((s, i) => s + (i.amountIncl || 0), 0);
  const totPaid = paid.reduce((s, i) => s + (i.amountIncl || 0), 0);
  return (
    <div style={{ background: '#FAF3E3', border: '2px solid #020309', borderRadius: '12px', boxShadow: '3px 3px 0 #020309', padding: '14px 20px', display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
      <TotItem label="Gefactureerd" value={fmtEur(totAll)} count={invoices.length} />
      <div style={{ width: '1.5px', height: '28px', background: '#d4cbbe' }} />
      <TotItem label="Openstaand" value={fmtEur(totOpen)} count={open.length} color="#92600A" />
      <div style={{ width: '1.5px', height: '28px', background: '#d4cbbe' }} />
      <TotItem label="Betaald" value={fmtEur(totPaid)} count={paid.length} color="#2d7d32" />
    </div>
  );
}

function TotItem({ label, value, count, color = '#020309' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '9px', letterSpacing: '0.8px', textTransform: 'uppercase', color: '#888' }}>{label}{count != null ? ` · ${count}` : ''}</span>
      <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: '15px', color }}>{value}</span>
    </div>
  );
}

// ─── customer picker ──────────────────────────────────────────────────────────

function CustomerPicker({ salesInvoices, onSelect }) {
  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState('');

  const customers = useMemo(() => {
    const seen = new Map();
    for (const inv of salesInvoices) {
      if (!inv.customerName) continue;
      const key = inv.customerName.trim().toLowerCase();
      if (!seen.has(key)) seen.set(key, { name: inv.customerName, email: inv.customerEmail || '', address: inv.customerAddress || '' });
    }
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [salesInvoices]);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  if (customers.length === 0) return null;

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 12px', background: open ? '#020309' : '#F5EFE0', color: open ? '#FAF3E3' : '#020309', border: '2px solid #020309', borderRadius: '9px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '12px' }}
      >
        <ChevronLeft size={13} style={{ transform: open ? 'rotate(90deg)' : 'rotate(-90deg)', transition: 'transform .15s' }} />
        Bestaande klant kiezen
        <span style={{ background: open ? '#FDEEC4' : '#020309', color: open ? '#020309' : '#FAF3E3', borderRadius: '9999px', padding: '1px 7px', fontSize: '10px', fontWeight: 700 }}>{customers.length}</span>
      </button>

      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 200, background: '#FAF3E3', border: '2px solid #020309', borderRadius: '12px', boxShadow: '4px 4px 0 #020309', minWidth: '320px', overflow: 'hidden' }}>
          <div style={{ padding: '10px' }}>
            <input
              autoFocus
              placeholder="Zoek op naam of e-mail…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '2px solid #020309', borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', background: '#FFFFFF', outline: 'none' }}
            />
          </div>
          <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
            {filtered.length === 0 && (
              <div style={{ padding: '12px 14px', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#888' }}>Geen resultaten</div>
            )}
            {filtered.map(c => (
              <button
                key={c.name}
                type="button"
                onClick={() => { onSelect(c); setOpen(false); setSearch(''); }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', background: 'transparent', border: 'none', borderTop: '1px solid #e8e0d0', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif' " }}
                onMouseEnter={e => e.currentTarget.style.background = '#FDEEC4'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#020309' }}>{c.name}</div>
                {c.email && <div style={{ fontSize: '11px', color: '#888', marginTop: '1px' }}>{c.email}</div>}
                {c.address && <div style={{ fontSize: '11px', color: '#aaa' }}>{c.address}</div>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── form ─────────────────────────────────────────────────────────────────────

function VerkoopForm({ invoice, onBack }) {
  const { salesInvoices, saveSalesInvoice } = useApp();
  const [form,   setForm]   = useState(() => initForm(salesInvoices, invoice));
  const [saving, setSaving] = useState(false);

  const totals = useMemo(() => computeTotals(form.lineItems), [form.lineItems]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  function updateLine(id, key, val) {
    setForm((f) => ({ ...f, lineItems: f.lineItems.map((l) => l.id === id ? { ...l, [key]: val } : l) }));
  }

  async function save(overrideStatus) {
    setSaving(true);
    try { await saveSalesInvoice(buildFinalInvoice(form, totals, overrideStatus)); onBack(); }
    finally { setSaving(false); }
  }

  async function handleSend() {
    const inv = buildFinalInvoice(form, totals, 'sent');
    await saveSalesInvoice(inv);
    openMailTo(inv);
    onBack();
  }

  const inp = {
    width: '100%', boxSizing: 'border-box', padding: '9px 12px',
    fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#020309',
    background: '#FFFFFF', border: '2px solid #020309', borderRadius: '10px', outline: 'none',
  };

  return (
    <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '24px', alignItems: 'start' }}>

      {/* ── left: form ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* back */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600, color: '#888' }}>
            <ChevronLeft size={16} /> Terug
          </button>
          <span style={{ color: '#ccc' }}>·</span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '14px' }}>
            {invoice ? `Factuur bewerken · ${invoice.invoiceNr}` : 'Nieuwe verkoopfactuur'}
          </span>
        </div>

        {/* meta */}
        <div style={{ background: '#FFFFFF', border: '2px solid #020309', borderRadius: '12px', boxShadow: '3px 3px 0 #020309', padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <Input label="Factuurnummer" mono value={form.invoiceNr} onChange={(e) => set('invoiceNr', e.target.value)} />
          <Input label="Factuurdatum"  mono placeholder="DD-MM-JJJJ" value={form.date}    onChange={(e) => set('date', e.target.value)} />
          <Input label="Vervaldatum"   mono placeholder="DD-MM-JJJJ" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
        </div>

        {/* customer */}
        <div style={{ background: '#FFFFFF', border: '2px solid #020309', borderRadius: '12px', boxShadow: '3px 3px 0 #020309', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', color: '#888' }}>Klantgegevens</span>
            <CustomerPicker
              salesInvoices={salesInvoices}
              onSelect={c => { set('customerName', c.name); set('customerEmail', c.email); set('customerAddress', c.address); }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Input label="Naam / bedrijf" value={form.customerName} onChange={(e) => set('customerName', e.target.value)} />
            <Input label="E-mailadres" type="email" value={form.customerEmail} onChange={(e) => set('customerEmail', e.target.value)} />
          </div>
          <Input label="Adres (optioneel)" value={form.customerAddress} placeholder="Straat 1, 1234 AB Stad" onChange={(e) => set('customerAddress', e.target.value)} />
        </div>

        {/* line items */}
        <div style={{ background: '#FFFFFF', border: '2px solid #020309', borderRadius: '12px', boxShadow: '3px 3px 0 #020309', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 106px 76px 96px 32px', padding: '10px 16px', gap: '8px', background: '#F5EFE0', borderBottom: '2px solid #020309', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '10px', letterSpacing: '0.5px', textTransform: 'uppercase', color: '#666' }}>
            <span>Omschrijving</span><span>Aantal</span><span>Prijs</span><span>BTW</span><span style={{ textAlign: 'right' }}>Subtotaal</span><span />
          </div>

          {form.lineItems.map((l) => {
            const sub = (parseFloat(l.qty) || 0) * (parseFloat(l.unitPrice) || 0);
            return (
              <div key={l.id} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 106px 76px 96px 32px', padding: '10px 16px', gap: '8px', alignItems: 'center', borderBottom: '1px solid #e8e0d0' }}>
                <input value={l.description} placeholder="Omschrijving" onChange={(e) => updateLine(l.id, 'description', e.target.value)} style={{ ...inp }} />
                <input type="number" min="0" step="1"    value={l.qty}       onChange={(e) => updateLine(l.id, 'qty',       e.target.value)} style={{ ...inp, textAlign: 'right' }} />
                <input type="number" min="0" step="0.01" value={l.unitPrice} placeholder="0,00" onChange={(e) => updateLine(l.id, 'unitPrice', e.target.value)} style={{ ...inp, textAlign: 'right' }} />
                <select value={l.rate} onChange={(e) => updateLine(l.id, 'rate', Number(e.target.value))} style={{ ...inp, cursor: 'pointer' }}>
                  <option value={21}>21%</option><option value={9}>9%</option><option value={0}>0%</option>
                </select>
                <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, fontSize: '13px', textAlign: 'right', color: sub > 0 ? '#020309' : '#bbb' }}>{fmtEur(sub)}</span>
                <button
                  onClick={() => form.lineItems.length > 1 && setForm((f) => ({ ...f, lineItems: f.lineItems.filter((x) => x.id !== l.id) }))}
                  disabled={form.lineItems.length === 1}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', background: 'transparent', border: '1.5px solid transparent', borderRadius: '6px', cursor: form.lineItems.length === 1 ? 'not-allowed' : 'pointer', color: form.lineItems.length === 1 ? '#ddd' : '#bbb' }}
                  onMouseEnter={(e) => { if (form.lineItems.length > 1) { e.currentTarget.style.color = '#c0392b'; e.currentTarget.style.borderColor = '#c0392b'; e.currentTarget.style.background = '#fdecea'; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = form.lineItems.length === 1 ? '#ddd' : '#bbb'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent'; }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}

          <div style={{ padding: '12px 16px' }}>
            <button
              onClick={() => setForm((f) => ({ ...f, lineItems: [...f.lineItems, EMPTY_LINE()] }))}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'transparent', border: '1.5px dashed #aaa', borderRadius: '9px', padding: '7px 14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '12px', color: '#888' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#020309'; e.currentTarget.style.color = '#020309'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#aaa'; e.currentTarget.style.color = '#888'; }}
            >
              <Plus size={14} /> Regel toevoegen
            </button>
          </div>
        </div>

        {/* notes */}
        <div style={{ background: '#FFFFFF', border: '2px solid #020309', borderRadius: '12px', boxShadow: '3px 3px 0 #020309', padding: '20px' }}>
          <Textarea label="Notities (optioneel)" rows={3} value={form.notes} placeholder="Betalingsinformatie, opmerkingen…" onChange={(e) => set('notes', e.target.value)} />
        </div>

        {/* actions */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end', padding: '16px 20px', background: '#FAF3E3', border: '2px solid #020309', borderRadius: '12px', boxShadow: '3px 3px 0 #020309' }}>
          <button onClick={onBack} style={{ padding: '9px 18px', background: '#FFFFFF', border: '2px solid #020309', borderRadius: '10px', boxShadow: '2px 2px 0 #020309', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '13px' }}>
            Annuleren
          </button>
          <button onClick={() => openPdf(buildFinalInvoice(form, totals))} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 18px', background: '#FFFFFF', border: '2px solid #020309', borderRadius: '10px', boxShadow: '2px 2px 0 #020309', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '13px' }}>
            <Download size={15} /> PDF bekijken
          </button>
          <button onClick={() => save('draft')} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 18px', background: '#FDEEC4', border: '2px solid #020309', borderRadius: '10px', boxShadow: '2px 2px 0 #020309', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '13px' }}>
            {saving ? 'Opslaan…' : 'Opslaan als concept'}
          </button>
          <button onClick={handleSend} disabled={saving || !form.customerEmail} title={!form.customerEmail ? 'Voeg een e-mailadres toe' : undefined} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 18px', background: !form.customerEmail ? '#E8E0D0' : '#020309', color: !form.customerEmail ? '#aaa' : '#FAF3E3', border: '2px solid #020309', borderRadius: '10px', boxShadow: !form.customerEmail ? 'none' : '2px 2px 0 #020309', cursor: (!saving && form.customerEmail) ? 'pointer' : 'not-allowed', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '13px' }}>
            <Send size={15} /> Opslaan & versturen
          </button>
        </div>
      </div>

      {/* ── right: live preview ── */}
      <LivePreview form={form} totals={totals} />
    </div>
  );
}

// ─── shared ───────────────────────────────────────────────────────────────────

function NieuweBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: '#020309', color: '#FAF3E3', border: '2px solid #020309', borderRadius: '10px', boxShadow: '3px 3px 0 #FDEEC4', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
      <Plus size={15} /> Nieuwe verkoopfactuur
    </button>
  );
}

function IconBtn({ children, onClick, title, danger = false }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }} title={title} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', background: 'transparent', border: '1.5px solid transparent', borderRadius: '7px', cursor: 'pointer', color: '#bbb', transition: 'all .1s' }}
      onMouseEnter={(e) => { e.currentTarget.style.color = danger ? '#c0392b' : '#020309'; e.currentTarget.style.borderColor = danger ? '#c0392b' : '#020309'; e.currentTarget.style.background = danger ? '#fdecea' : '#F5EFE0'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = '#bbb'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent'; }}
    >{children}</button>
  );
}

// ─── root ─────────────────────────────────────────────────────────────────────

export function Verkoop() {
  const [view,    setView]    = useState('list');
  const [editing, setEditing] = useState(null);

  if (view === 'form') {
    return <VerkoopForm invoice={editing} onBack={() => { setView('list'); setEditing(null); }} />;
  }
  return <VerkoopList onNew={() => { setEditing(null); setView('form'); }} onEdit={(inv) => { setEditing(inv); setView('form'); }} />;
}
