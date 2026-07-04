// ─── nav ─────────────────────────────────────────────────────────────────────
export const nav = [
  { key: 'dashboard',    label: 'Dashboard',   icon: 'LayoutDashboard' },
  { key: 'facturen',     label: 'Facturen',     icon: 'FileText', children: [
    { key: 'inkoop',  label: 'Inkoop' },
    { key: 'verkoop', label: 'Verkoop' },
  ]},
  { key: 'btw',          label: 'BTW-aangifte', icon: 'Percent' },
  { key: 'balans',       label: 'Balans',        icon: 'Scale' },
  { key: 'leveranciers', label: 'Leveranciers', icon: 'Truck' },
  { key: 'instellingen', label: 'Instellingen', icon: 'Settings' },
];

// ─── helpers ─────────────────────────────────────────────────────────────────
const inv = (id, supplier, nr, date, rate, excl, amount, status) =>
  ({ id, supplier, nr, date, rate, excl, amount, status });

// ─── quarters — gestart december 2025 ────────────────────────────────────────
export const quarters = [

  // Q4 2025 — alleen december (startmaand)
  {
    id: 'Q4-2025', year: 2025, q: 4, label: 'Q4 2025', period: 'dec 2025',
    status: 'filed', invoiceCount: 5, totalExcl: '€1.240,00', btwTotal: '€228,00',
    months: [
      {
        id: 'okt-2025', label: 'Oktober', month: 10, year: 2025,
        invoiceCount: 0, totalExcl: '€0,00', btwTotal: '€0,00',
        invoices: [],
      },
      {
        id: 'nov-2025', label: 'November', month: 11, year: 2025,
        invoiceCount: 0, totalExcl: '€0,00', btwTotal: '€0,00',
        invoices: [],
      },
      {
        id: 'dec-2025', label: 'December', month: 12, year: 2025,
        invoiceCount: 5, totalExcl: '€1.240,00', btwTotal: '€228,00',
        invoices: [
          inv(1,  'Shopify Netherlands', 'FCT-2025-0001', '01-12-2025', 21, '€20,66',  '€25,00',  'paid'),
          inv(2,  'AliExpress',          'AE-8810001',    '08-12-2025',  9, '€504,59', '€550,00', 'paid'),
          inv(3,  'Meta Ads',            'INV-META-0001', '14-12-2025', 21, '€330,58', '€400,00', 'paid'),
          inv(4,  'PostNL',              'FCT-2025-0002', '19-12-2025', 21, '€33,06',  '€40,00',  'paid'),
          inv(5,  'Google Ads',          'INV-GADS-0001', '27-12-2025', 21, '€330,58', '€400,00', 'paid'),
        ],
      },
    ],
  },

  // Q1 2026 — jan t/m mrt (ingediend)
  {
    id: 'Q1-2026', year: 2026, q: 1, label: 'Q1 2026', period: 'jan – mrt 2026',
    status: 'filed', invoiceCount: 21, totalExcl: '€5.820,00', btwTotal: '€1.074,00',
    months: [
      {
        id: 'jan-2026', label: 'Januari', month: 1, year: 2026,
        invoiceCount: 6, totalExcl: '€1.780,00', btwTotal: '€328,00',
        invoices: [
          inv(10, 'Shopify Netherlands', 'FCT-2026-0001', '02-01-2026', 21, '€20,66',  '€25,00',  'paid'),
          inv(11, 'AliExpress',          'AE-8901234',    '07-01-2026',  9, '€550,46', '€600,00', 'paid'),
          inv(12, 'Meta Ads',            'INV-META-0012', '11-01-2026', 21, '€330,58', '€400,00', 'paid'),
          inv(13, 'Google Ads',          'INV-GADS-0015', '15-01-2026', 21, '€330,58', '€400,00', 'paid'),
          inv(14, 'Bol.com Retail',      'FCT-BOL-0003',  '21-01-2026',  9, '€321,10', '€350,00', 'paid'),
          inv(15, 'PostNL',              'FCT-2026-0003', '28-01-2026', 21, '€41,32',  '€50,00',  'paid'),
        ],
      },
      {
        id: 'feb-2026', label: 'Februari', month: 2, year: 2026,
        invoiceCount: 7, totalExcl: '€2.040,00', btwTotal: '€376,00',
        invoices: [
          inv(20, 'Shopify Netherlands', 'FCT-2026-0009', '03-02-2026', 21, '€20,66',  '€25,00',  'paid'),
          inv(21, 'AliExpress',          'AE-8945001',    '06-02-2026',  9, '€642,20', '€700,00', 'paid'),
          inv(22, 'Meta Ads',            'INV-META-0024', '10-02-2026', 21, '€330,58', '€400,00', 'paid'),
          inv(23, 'Google Ads',          'INV-GADS-0029', '14-02-2026', 21, '€330,58', '€400,00', 'paid'),
          inv(24, 'Bol.com Retail',      'FCT-BOL-0011',  '18-02-2026',  9, '€366,06', '€399,00', 'paid'),
          inv(25, 'DHL',                 'DHL-2026-0005', '24-02-2026', 21, '€66,12',  '€80,00',  'paid'),
          inv(26, 'PostNL',              'FCT-2026-0014', '27-02-2026', 21, '€41,32',  '€50,00',  'paid'),
        ],
      },
      {
        id: 'mrt-2026', label: 'Maart', month: 3, year: 2026,
        invoiceCount: 8, totalExcl: '€2.000,00', btwTotal: '€370,00',
        invoices: [
          inv(30, 'Shopify Netherlands', 'FCT-2026-0018', '02-03-2026', 21, '€20,66',  '€25,00',  'paid'),
          inv(31, 'AliExpress',          'AE-8978002',    '05-03-2026',  9, '€550,46', '€600,00', 'paid'),
          inv(32, 'Meta Ads',            'INV-META-0038', '09-03-2026', 21, '€330,58', '€400,00', 'paid'),
          inv(33, 'Google Ads',          'INV-GADS-0044', '13-03-2026', 21, '€330,58', '€400,00', 'paid'),
          inv(34, 'Bol.com Retail',      'FCT-BOL-0019',  '17-03-2026',  9, '€275,23', '€300,00', 'paid'),
          inv(35, 'AliExpress',          'AE-8991100',    '21-03-2026',  9, '€183,49', '€200,00', 'paid'),
          inv(36, 'DHL',                 'DHL-2026-0014', '25-03-2026', 21, '€66,12',  '€80,00',  'paid'),
          inv(37, 'PostNL',              'FCT-2026-0025', '29-03-2026', 21, '€41,32',  '€50,00',  'paid'),
        ],
      },
    ],
  },

  // Q2 2026 — apr t/m jun (lopend, huidig kwartaal)
  {
    id: 'Q2-2026', year: 2026, q: 2, label: 'Q2 2026', period: 'apr – jun 2026',
    status: 'in_progress', invoiceCount: 18, totalExcl: '€4.960,00', btwTotal: '€916,00',
    months: [
      {
        id: 'apr-2026', label: 'April', month: 4, year: 2026,
        invoiceCount: 8, totalExcl: '€2.120,00', btwTotal: '€392,00',
        invoices: [
          inv(40, 'Shopify Netherlands', 'FCT-2026-0031', '01-04-2026', 21, '€20,66',  '€25,00',  'paid'),
          inv(41, 'AliExpress',          'AE-9010100',    '04-04-2026',  9, '€642,20', '€700,00', 'paid'),
          inv(42, 'Meta Ads',            'INV-META-0051', '08-04-2026', 21, '€330,58', '€400,00', 'paid'),
          inv(43, 'Google Ads',          'INV-GADS-0059', '11-04-2026', 21, '€330,58', '€400,00', 'paid'),
          inv(44, 'Bol.com Retail',      'FCT-BOL-0027',  '15-04-2026',  9, '€366,06', '€399,00', 'paid'),
          inv(45, 'AliExpress',          'AE-9025500',    '19-04-2026',  9, '€275,23', '€300,00', 'paid'),
          inv(46, 'DHL',                 'DHL-2026-0022', '23-04-2026', 21, '€66,12',  '€80,00',  'paid'),
          inv(47, 'PostNL',              'FCT-2026-0038', '28-04-2026', 21, '€41,32',  '€50,00',  'paid'),
        ],
      },
      {
        id: 'mei-2026', label: 'Mei', month: 5, year: 2026,
        invoiceCount: 8, totalExcl: '€2.100,00', btwTotal: '€388,00',
        invoices: [
          inv(50, 'Shopify Netherlands', 'FCT-2026-0045', '02-05-2026', 21, '€20,66',  '€25,00',  'paid'),
          inv(51, 'AliExpress',          'AE-9055200',    '06-05-2026',  9, '€550,46', '€600,00', 'paid'),
          inv(52, 'Meta Ads',            'INV-META-0064', '09-05-2026', 21, '€330,58', '€400,00', 'paid'),
          inv(53, 'Google Ads',          'INV-GADS-0073', '13-05-2026', 21, '€330,58', '€400,00', 'paid'),
          inv(54, 'Bol.com Retail',      'FCT-BOL-0034',  '17-05-2026',  9, '€366,06', '€399,00', 'paid'),
          inv(55, 'AliExpress',          'AE-9071100',    '22-05-2026',  9, '€229,36', '€250,00', 'paid'),
          inv(56, 'DHL',                 'DHL-2026-0031', '26-05-2026', 21, '€66,12',  '€80,00',  'paid'),
          inv(57, 'PostNL',              'FCT-2026-0052', '30-05-2026', 21, '€41,32',  '€50,00',  'paid'),
        ],
      },
      {
        id: 'jun-2026', label: 'Juni', month: 6, year: 2026,
        invoiceCount: 2, totalExcl: '€740,00', btwTotal: '€136,00',
        invoices: [
          inv(60, 'Meta Ads',   'INV-META-0077', '02-06-2026', 21, '€330,58', '€400,00', 'pending'),
          inv(61, 'Google Ads', 'INV-GADS-0088', '04-06-2026', 21, '€330,58', '€400,00', 'review'),
        ],
      },
    ],
  },
];

// ─── dashboard stats (Q2 2026 huidig) ────────────────────────────────────────
export const stats = [
  { label: 'Totaal excl. BTW', value: '€4.960,00', sub: 'Q2 2026 · lopend', variant: 'yellow', icon: 'Wallet' },
  { label: 'BTW te betalen',   value: '€916,00',   sub: '21% · 9%',          variant: 'blue',   icon: 'Percent' },
  { label: 'Betaald',          value: '€4.499,00', sub: '16 facturen',        variant: 'green',  icon: 'Check' },
  { label: 'Te controleren',   value: '€400,00',   sub: '1 factuur',          variant: 'red',    icon: 'AlertTriangle' },
];

export const btw = {
  items: [
    { rate: '21%', amount: '€780,00' },
    { rate: '9%',  amount: '€136,00' },
  ],
  total: '€916,00',
};

// ─── legacy flat list ────────────────────────────────────────────────────────
export const invoices = quarters.flatMap((q) => q.months.flatMap((m) => m.invoices));

export const data = { stats, btw, invoices, nav, quarters };

// ─── empty data (demo uit) ───────────────────────────────────────────────────
export const emptyStats = [
  { label: 'Totaal excl. BTW', value: '€0,00', sub: 'Nog geen facturen', variant: 'yellow', icon: 'Wallet' },
  { label: 'BTW te betalen',   value: '€0,00', sub: 'Nog geen data',     variant: 'blue',   icon: 'Percent' },
  { label: 'Betaald',          value: '€0,00', sub: '0 facturen',         variant: 'green',  icon: 'Check' },
  { label: 'Te controleren',   value: '€0,00', sub: '0 facturen',         variant: 'red',    icon: 'AlertTriangle' },
];

export const emptyBtw      = { items: [], total: '€0,00' };
export const emptyQuarters = [];

export default data;
