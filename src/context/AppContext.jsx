import { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  fetchInvoices, upsertInvoice, patchInvoice, deleteInvoice, uploadFile,
  fetchSalesInvoices, upsertSalesInvoice, deleteSalesInvoice,
  fetchSettings, upsertSettings,
} from '../lib/db';

const AppContext = createContext(null);

const MONTH_NAMES = ['', 'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
  'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
const MONTH_SHORT = ['', 'jan', 'feb', 'mrt', 'apr', 'mei', 'jun',
  'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

export function fmtEur(n) {
  return '€' + Number(n || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseInvDate(dateStr) {
  const parts = (dateStr || '').split('-');
  if (parts.length < 3) return null;
  let day, month, year;
  if (parts[0].length === 4) {
    // YYYY-MM-DD (ISO)
    [year, month, day] = parts.map(Number);
  } else {
    // DD-MM-YYYY (NL)
    [day, month, year] = parts.map(Number);
  }
  if (!month || !year || year < 2000 || year > 2100 || month < 1 || month > 12) return null;
  return { day, month, year };
}

function buildUserQuarters(invoices, closedQuarters = new Set()) {
  if (!invoices.length) return [];

  const monthMap = {};
  for (const inv of invoices) {
    const parsed = parseInvDate(inv.date);
    if (!parsed) continue;
    const { month, year } = parsed;
    const key = `${year}-${month}`;
    if (!monthMap[key]) monthMap[key] = { month, year, invoices: [] };
    monthMap[key].invoices.push(inv);
  }

  const quarterMap = {};
  for (const { month, year, invoices: invs } of Object.values(monthMap)) {
    const q    = Math.ceil(month / 3);
    const qKey = `Q${q}-${year}`;
    if (!quarterMap[qKey]) {
      quarterMap[qKey] = { id: qKey, year, q, startMonth: (q - 1) * 3 + 1, monthData: {} };
    }
    quarterMap[qKey].monthData[month] = invs;
  }

  return Object.values(quarterMap)
    .sort((a, b) => b.year - a.year || b.q - a.q)
    .map(({ id, year, q, startMonth, monthData }) => {
      const months = [startMonth, startMonth + 1, startMonth + 2].map((m) => {
        const invs  = monthData[m] || [];
        const exclN = invs.reduce((s, i) => s + (i.amountExcl || 0), 0);
        const btwN  = invs.reduce((s, i) => s + (i.btwAmount  || 0), 0);
        return {
          id: `${MONTH_SHORT[m]}-${year}`, label: MONTH_NAMES[m], month: m, year,
          invoices: invs, invoiceCount: invs.length,
          totalExcl: fmtEur(exclN), btwTotal: fmtEur(btwN),
        };
      });

      const totExcl = months.reduce((s, m) => s + m.invoices.reduce((ss, i) => ss + (i.amountExcl || 0), 0), 0);
      const totBtw  = months.reduce((s, m) => s + m.invoices.reduce((ss, i) => ss + (i.btwAmount  || 0), 0), 0);
      const totInv  = months.reduce((s, m) => s + m.invoiceCount, 0);

      return {
        id, year, q, label: `Q${q} ${year}`,
        period: `${MONTH_SHORT[startMonth]} – ${MONTH_SHORT[startMonth + 2]} ${year}`,
        status: closedQuarters.has(id) ? 'filed' : 'in_progress',
        invoiceCount: totInv,
        totalExcl: fmtEur(totExcl),
        btwTotal:  fmtEur(totBtw),
        months,
      };
    });
}

// ─── migrate legacy localStorage data to Supabase ────────────────────────────

async function migrateFromLocalStorage() {
  const raw = localStorage.getItem('bookie_invoices');
  if (!raw) return;
  let localInvs;
  try { localInvs = JSON.parse(raw); } catch { return; }
  if (!localInvs?.length) { localStorage.removeItem('bookie_invoices'); return; }

  try {
    await Promise.all(localInvs.map(async (inv) => {
      let filePath = null;
      const fileData = localStorage.getItem(`bookie_file_${inv.id}`);
      if (fileData && inv.fileName) {
        try { filePath = await uploadFile(inv.id, fileData, inv.fileName); } catch { /* storage */ }
      }
      await upsertInvoice({ ...inv, filePath, hasFile: filePath ? true : inv.hasFile });
    }));
    // Only clear localStorage when ALL inserts succeeded
    localInvs.forEach((inv) => localStorage.removeItem(`bookie_file_${inv.id}`));
    localStorage.removeItem('bookie_invoices');
  } catch (err) {
    console.warn('Migration to Supabase failed, keeping localStorage intact:', err);
  }
}

// ─── provider ────────────────────────────────────────────────────────────────

const DEFAULT_COMPANY_PROFILE = { bedrijfsnaam: '', email: '', kvk: '', btwnummer: '', address: '', iban: '', paymentDays: '14' };

function readLocalCompanyProfile() {
  try {
    const s = JSON.parse(localStorage.getItem('bookie_company_info') || '{}');
    return { ...DEFAULT_COMPANY_PROFILE, ...s };
  } catch { return { ...DEFAULT_COMPANY_PROFILE }; }
}

export function AppProvider({ children }) {
  const [apiKey, setApiKeyState] = useState(() => localStorage.getItem('bookie_api_key') || '');
  const [companyProfile, setCompanyProfileState] = useState(readLocalCompanyProfile);

  const [closedQuarters, setClosedQuarters] = useState(() => {
    try {
      const raw = localStorage.getItem('bookie_closed_quarters');
      return new Set(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
  });

  const closeQuarter = useCallback((id) => {
    setClosedQuarters((prev) => {
      const next = new Set(prev); next.add(id);
      localStorage.setItem('bookie_closed_quarters', JSON.stringify([...next]));
      return next;
    });
  }, []);

  const reopenQuarter = useCallback((id) => {
    setClosedQuarters((prev) => {
      const next = new Set(prev); next.delete(id);
      localStorage.setItem('bookie_closed_quarters', JSON.stringify([...next]));
      return next;
    });
  }, []);
  const [userInvoices,  setUserInvoices]  = useState([]);
  const [salesInvoices, setSalesInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        await migrateFromLocalStorage();
        const [rawInvs, sales, settings] = await Promise.all([
          fetchInvoices(), fetchSalesInvoices().catch(() => []), fetchSettings().catch(() => null),
        ]);
        setUserInvoices(rawInvs);
        setSalesInvoices(sales);
        if (settings) {
          setApiKeyState(settings.apiKey);
          localStorage.setItem('bookie_api_key', settings.apiKey);
          setCompanyProfileState(settings.companyProfile);
          localStorage.setItem('bookie_company_info', JSON.stringify(settings.companyProfile));
        } else {
          const localKey = localStorage.getItem('bookie_api_key') || '';
          const localProfile = readLocalCompanyProfile();
          if (localKey || Object.values(localProfile).some(Boolean)) {
            await upsertSettings({ apiKey: localKey, companyProfile: localProfile }).catch(() => {});
          }
        }
      } catch (err) {
        console.error('Supabase load failed:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const setApiKey = useCallback((key) => {
    setApiKeyState(key);
    localStorage.setItem('bookie_api_key', key);
    upsertSettings({ apiKey: key }).catch((err) => console.error('Failed to save API key:', err));
  }, []);

  const setCompanyProfile = useCallback((profile) => {
    setCompanyProfileState(profile);
    localStorage.setItem('bookie_company_info', JSON.stringify(profile));
    upsertSettings({ companyProfile: profile }).catch((err) => console.error('Failed to save company profile:', err));
  }, []);

  const addInvoice = useCallback(async (invoice, fileDataUrl) => {
    let filePath = null;
    if (fileDataUrl && invoice.fileName) {
      try { filePath = await uploadFile(invoice.id, fileDataUrl, invoice.fileName); } catch { /* quota */ }
    }
    const inv = { ...invoice, filePath, hasFile: filePath ? true : !!fileDataUrl };
    await upsertInvoice(inv);
    setUserInvoices((prev) => [inv, ...prev]);
  }, []);

  const updateInvoice = useCallback(async (id, patch) => {
    await patchInvoice(id, patch);
    setUserInvoices((prev) => prev.map((inv) => inv.id === id ? { ...inv, ...patch } : inv));
  }, []);

  const removeInvoice = useCallback(async (id) => {
    await deleteInvoice(id);
    setUserInvoices((prev) => prev.filter((inv) => inv.id !== id));
  }, []);

  const saveSalesInvoice = useCallback(async (invoice) => {
    await upsertSalesInvoice(invoice);
    setSalesInvoices((prev) => {
      const exists = prev.some((i) => i.id === invoice.id);
      return exists ? prev.map((i) => i.id === invoice.id ? invoice : i) : [invoice, ...prev];
    });
  }, []);

  const removeSalesInvoice = useCallback(async (id) => {
    await deleteSalesInvoice(id);
    setSalesInvoices((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const userQuarters = useMemo(() => buildUserQuarters(userInvoices, closedQuarters), [userInvoices, closedQuarters]);

  return (
    <AppContext.Provider value={{
      apiKey, setApiKey,
      companyProfile, setCompanyProfile,
      userInvoices, addInvoice, updateInvoice, removeInvoice,
      salesInvoices, saveSalesInvoice, removeSalesInvoice,
      userQuarters, loading, closeQuarter, reopenQuarter,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
