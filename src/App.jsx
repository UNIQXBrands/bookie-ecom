import { useState, useCallback, useRef, useEffect } from 'react';
import { Sidebar }       from './components/Sidebar';
import { Button }        from './components/Button';
import { UploadModal }     from './components/UploadModal';
import { BulkUploadModal } from './components/BulkUploadModal';
import { Dashboard }     from './screens/Dashboard';
import { Facturen }      from './screens/Facturen';
import { BtwAangifte }   from './screens/BtwAangifte';
import { Onboarding }    from './screens/Onboarding';
import { Instellingen }  from './screens/Instellingen';
import { Balans }        from './screens/Balans';
import { Leveranciers }  from './screens/Leveranciers';
import { Verkoop }       from './screens/Verkoop';
import { Landing, ResetPasswordScreen } from './screens/Landing';
import { data, nav }     from './data/data';
import { supabase }      from './lib/supabase';
import { AppProvider, useApp } from './context/AppContext';
import * as Icons        from 'lucide-react';

function getTitles(t) {
  return {
    dashboard:    { title: t('title.dashboard'),   sub: t('title.dashboardSub', { q: 'Q2 2026' }) },
    inkoop:       { title: t('title.purchases'),   sub: t('title.purchasesSub') },
    verkoop:      { title: t('title.sales'),       sub: t('title.salesSub') },
    btw:          { title: t('title.vatReturn'),   sub: 'Q2 2026 · apr–jun' },
    onboarding:   { title: t('title.onboarding'),  sub: null },
    balans:       { title: t('title.balance'),     sub: t('title.balanceSub') },
    leveranciers: { title: t('title.suppliers'),   sub: null },
    instellingen: { title: t('title.settings'),    sub: t('title.settingsSub') },
  };
}

function Topbar({ title, sub, actions, onSignOut, logoutLabel }) {
  return (
    <div style={{
      height: '64px', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px',
      borderBottom: '2px solid #020309', background: '#FAF3E3',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '22px', letterSpacing: '-0.3px', color: '#020309' }}>{title}</span>
        {sub ? <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#888' }}>{sub}</span> : null}
      </div>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {actions}
        <button
          onClick={onSignOut}
          title={logoutLabel}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', background: 'transparent', border: '1.5px solid #d4cbbe', borderRadius: '9px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '12px', color: '#888' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#020309'; e.currentTarget.style.color = '#020309'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d4cbbe'; e.currentTarget.style.color = '#888'; }}
        >
          <Icons.LogOut size={14} /> {logoutLabel}
        </button>
      </div>
    </div>
  );
}

function Toast({ message }) {
  if (!message) return null;
  return (
    <div style={{
      position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
      background: '#020309', color: '#FAF3E3', padding: '12px 18px',
      border: '2px solid #020309', borderRadius: '10px', boxShadow: '3px 3px 0 #FDEEC4',
      fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px',
      zIndex: 50, fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap',
    }}>
      <Icons.Check size={15} color="#D2ECD0" />
      {message}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF3E3', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', background: '#FDEEC4', border: '2px solid #020309', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '22px' }}>B</div>
        <Icons.Loader2 size={20} color="#888" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

export function App() {
  const [session,   setSession]   = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [recovery,  setRecovery]  = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  if (!authReady) return <LoadingScreen />;
  if (recovery)   return <ResetPasswordScreen onDone={() => setRecovery(false)} />;
  if (!session)   return <Landing />;

  return <AppProvider><AppShell onSignOut={handleSignOut} /></AppProvider>;
}

function AppShell({ onSignOut }) {
  const { t } = useApp();
  const [view,  setView]  = useState('dashboard');
  function navigate(v) { setView(v === 'facturen' ? 'inkoop' : v); }
  const [toast, setToast] = useState(null);

  const [uploadFile,  setUploadFile]  = useState(null);
  const [showModal,   setShowModal]   = useState(false);
  const [manualMode,  setManualMode]  = useState(false);
  const [bulkFiles,     setBulkFiles]     = useState(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const bulkInputRef = useRef(null);

  const fireToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(window.__bt);
    window.__bt = setTimeout(() => setToast(null), 2500);
  }, []);

  const onUpload = useCallback((fileOrEvent) => {
    const file = fileOrEvent instanceof File ? fileOrEvent : null;
    setUploadFile(file);
    setShowModal(true);
  }, []);

  const onManualAdd = useCallback(() => {
    setManualMode(true);
    setUploadFile(null);
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setUploadFile(null);
    setManualMode(false);
  }, []);

  const onSaved = useCallback((invoice) => {
    closeModal();
    const rate = invoice.rate != null ? t('shell.vatRate', { rate: invoice.rate }) : t('shell.vatUnknown');
    fireToast(t('shell.invoiceSaved', { supplier: invoice.supplier, rate, excl: invoice.excl }));
  }, [closeModal, fireToast, t]);

  const NAV_LABELS = {
    dashboard: t('nav.dashboard'), facturen: t('nav.invoices'), inkoop: t('nav.purchases'),
    verkoop: t('nav.sales'), btw: t('nav.vatReturn'), balans: t('nav.balance'),
    leveranciers: t('nav.suppliers'), instellingen: t('nav.settings'),
  };
  function mapNavItem(n) {
    const Icon = Icons[n.icon];
    return { ...n, label: NAV_LABELS[n.key] || n.label, icon: Icon ? <Icon size={16} /> : null, children: n.children?.map(mapNavItem) };
  }
  const allNavItems = (data.nav || nav).map(mapNavItem);
  const navItems    = allNavItems.filter((n) => n.key !== 'instellingen');
  const bottomItems = allNavItems.filter((n) => n.key === 'instellingen');

  const titles = getTitles(t);
  const titleInfo = titles[view] || { title: view };

  let screen;
  if      (view === 'dashboard')                      screen = <Dashboard   onUpload={onUpload} onOpenAll={() => setView('inkoop')} />;
  else if (view === 'inkoop' || view === 'facturen')  screen = <Facturen    onUpload={onUpload} onManualAdd={onManualAdd} />;
  else if (view === 'verkoop')                         screen = <Verkoop />;
  else if (view === 'btw')                             screen = <BtwAangifte />;
  else if (view === 'onboarding')                      screen = <Onboarding  onUpload={(f) => { onUpload(f); setView('dashboard'); }} />;
  else if (view === 'balans')                          screen = <Balans />;
  else if (view === 'leveranciers')                    screen = <Leveranciers />;
  else if (view === 'instellingen')                    screen = <Instellingen />;
  else screen = (
    <div style={{ padding: '48px 24px', color: '#888', fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}>
      {t('shell.emptySection')}
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <Sidebar brand="Bookie" active={view} onSelect={navigate} items={navItems} bottomItems={bottomItems} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar
          title={titleInfo.title}
          sub={titleInfo.sub}
          onSignOut={onSignOut}
          logoutLabel={t('shell.logout')}
          actions={
            view !== 'onboarding' ? (
              <>
                <input
                  ref={bulkInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const fileArray = Array.from(e.target.files || []);
                    if (!fileArray.length) return;
                    e.target.value = '';
                    setBulkFiles(fileArray);
                    setShowBulkModal(true);
                  }}
                />
                {(view === 'inkoop' || view === 'facturen') && (
                  <Button variant="default" icon={<Icons.PenLine size={16} />} onClick={onManualAdd}>
                    {t('shell.manualBook')}
                  </Button>
                )}
                <Button variant="default" icon={<Icons.Files size={16} />} onClick={() => bulkInputRef.current?.click()}>
                  {t('shell.bulkUpload')}
                </Button>
                <Button variant="primary" icon={<Icons.Upload size={16} />} onClick={() => onUpload()}>
                  {t('shell.uploadInvoice')}
                </Button>
              </>
            ) : null
          }
        />
        <div style={{ flex: 1, overflowY: 'auto' }}>{screen}</div>
      </div>

      {showModal && <UploadModal file={uploadFile} onSaved={onSaved} onClose={closeModal} manualMode={manualMode} />}
      {showBulkModal && bulkFiles && <BulkUploadModal files={bulkFiles} onClose={() => { setShowBulkModal(false); setBulkFiles(null); }} />}
      <Toast message={toast} />
    </div>
  );
}
