import { useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  Check, X, ChevronDown, Zap, FileText, BarChart2,
  Mail, Link2, Download, ArrowRight, ScanLine, ShieldCheck,
} from 'lucide-react';

const C = {
  cream: '#FAF3E3', dark: '#020309', yellow: '#FDEEC4',
  green: '#D2ECD0', blue: '#E5F5F9', table: '#F5EFE0',
  sidebar: '#1a1610', muted: '#888', border: '2px solid #020309',
};
const sans = "'DM Sans', sans-serif";
const mono = "'DM Mono', monospace";
const shadow = (n = 3, c = C.dark) => `${n}px ${n}px 0 ${c}`;

// ─── css animations ───────────────────────────────────────────────────────────

const STYLES = `
  @keyframes fadeUp   { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
  @keyframes beamSpin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
  @keyframes pulse    { 0%,100% { box-shadow:4px 4px 0 #020309,0 0 0 0 rgba(253,238,196,0); } 50% { box-shadow:4px 4px 0 #020309,0 0 28px 8px rgba(253,238,196,0.55); } }
  @keyframes floatUp  { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-6px); } }
  .land-hero-anim { animation: fadeUp .7s ease both; }
  .land-hero-anim-2 { animation: fadeUp .7s .15s ease both; }
  .land-hero-anim-3 { animation: fadeUp .7s .3s ease both; }
  .land-feat-card:hover { transform:translateY(-4px) !important; box-shadow:6px 6px 0 #020309 !important; }
  .land-feat-card { transition: transform .18s, box-shadow .18s; }
  .land-step-card:hover { transform:scale(1.02); }
  .land-step-card { transition: transform .15s; }
  .land-mockup-float { animation: floatUp 4s ease-in-out infinite; }
`;

// ─── data ─────────────────────────────────────────────────────────────────────

const TIERS = [
  {
    id: 'free', name: 'Gratis', price: '0', period: 'altijd gratis',
    desc: 'Ontdek Bookie zonder risico.',
    cta: 'Begin gratis', highlight: false, bg: C.yellow, accent: '#c9960a',
    features: [
      '10 facturen per maand',
      'BTW-aangifte overzicht',
      '3 verkoopfacturen per maand',
      '1 kwartaal geschiedenis',
      { text: 'AI-scanning', no: true },
      { text: 'Bulk upload', no: true },
    ],
  },
  {
    id: 'starter', name: 'Starter', price: '9', period: '/maand',
    desc: 'Voor ondernemers die serieus starten.',
    cta: 'Probeer Starter', highlight: true, badge: 'Meest gekozen', bg: C.dark, accent: C.yellow,
    features: [
      '75 facturen per maand',
      'AI-scanning (automatisch uitgelezen)',
      'Bulk upload',
      'Onbeperkte verkoopfacturen + PDF',
      'Volledige kwartaal- & jaargeschiedenis',
      'E-mailondersteuning',
    ],
  },
  {
    id: 'pro', name: 'Pro', price: '19', period: '/maand',
    desc: 'Volledig automatisch. Niks meer met de hand.',
    cta: 'Ga Pro', highlight: false, bg: C.green, accent: '#1a6b3a',
    features: [
      'Onbeperkte facturen + AI-scanning',
      { text: 'E-mail scanning', soon: true },
      { text: 'Shopify-koppeling', soon: true },
      { text: 'Bol.com koppeling', soon: true },
      'Export naar accountant (CSV/PDF)',
      'Prioriteitsondersteuning',
    ],
  },
];

const FEATURES = [
  { Icon: ScanLine,   bg: C.yellow, title: 'AI scant je facturen',          desc: 'Sleep een PDF of foto in Bookie. Claude AI leest leverancier, datum en BTW-bedrag automatisch uit.' },
  { Icon: BarChart2,  bg: C.green,  title: 'BTW in één oogopslag',          desc: 'Je kwartaaloverzicht is altijd actueel. Geen verrassingen bij de BTW-aangifte.' },
  { Icon: FileText,   bg: C.blue,   title: 'Professionele verkoopfacturen', desc: 'Maak facturen met je eigen huisstijl en stuur ze direct naar je klant als PDF.' },
  { Icon: Mail,       bg: C.table,  title: 'E-mail scanning',  soon: true,  desc: 'Facturen in je inbox worden straks automatisch herkend en ingeboekt.' },
  { Icon: Link2,      bg: C.yellow, title: 'Shopify & bol.com', soon: true, desc: 'Verkoopfacturen uit je webshop automatisch doorsturen. BTW-afdracht altijd correct.' },
  { Icon: Download,   bg: C.green,  title: 'Export naar accountant',        desc: 'Download je administratie als CSV of PDF. Lever het in zonder extra werk.' },
];

const STEPS = [
  { nr: '01', title: 'Upload je factuur',   desc: 'Sleep een PDF of foto in Bookie, of gebruik bulk upload voor een stapel.' },
  { nr: '02', title: 'AI leest hem uit',    desc: 'Leverancier, factuurnummer, datum en BTW worden automatisch herkend.' },
  { nr: '03', title: 'Klaar voor aangifte', desc: 'Je BTW-dashboard updatet meteen. Kwartaalaangifte in seconden klaar.' },
];

const TESTIMONIALS = [
  { initials: 'SB', bg: C.yellow, name: 'Sophie van den Berg', role: 'Shopify dropshipper', quote: 'Mijn BTW-aangifte kostte me vroeger een halve dag. Nu upload ik mijn facturen en zie ik alles in één oogopslag.' },
  { initials: 'DH', bg: C.green,  name: 'Daan Hoekstra',       role: 'Eigenaar GadgetHub.nl', quote: 'Eindelijk een boekhoudtool die ik begrijp. Geen accountantsjargon, gewoon een duidelijk overzicht.' },
  { initials: 'LS', bg: C.blue,   name: 'Lisa Smeets',         role: 'Bol.com verkoper', quote: 'Als startende ondernemer had ik geen idee wat ik moest aangeven. Bookie laat het me precies zien.' },
];

const FAQS = [
  { q: 'Heb ik een accountant nodig naast Bookie?',           a: 'Bookie vervangt geen accountant, maar maakt je administratie zo overzichtelijk dat je de accountant veel minder tijd kwijt bent.' },
  { q: 'Is mijn data veilig?',                                a: 'Ja. Alle data wordt versleuteld opgeslagen in een EU-datacenter via Supabase. Je bestanden zijn alleen voor jou toegankelijk.' },
  { q: 'Kan ik upgraden of downgraden wanneer ik wil?',       a: 'Ja, op elk moment. Bij downgrade geldt het lagere plan vanaf de volgende factuurdatum.' },
  { q: 'Wat als ik meer facturen heb dan mijn tier toelaat?', a: 'Je krijgt een melding als je de limiet nadert. Je kunt dan upgraden of die maand handmatig facturen toevoegen.' },
];

// ─── auth modal ───────────────────────────────────────────────────────────────

function AuthModal({ onClose, initialTab = 'login' }) {
  const [tab, setTab] = useState(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [signupDone, setSignupDone] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const switchTab = (t) => { setTab(t); setError(''); setSignupDone(false); setResetSent(false); };

  async function handleLogin(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      onClose();
    } catch (err) { setError(err.message || 'Inloggen mislukt'); }
    finally { setLoading(false); }
  }

  async function handleForgotPassword() {
    if (!email) { setError('Vul eerst je e-mailadres in'); return; }
    setError(''); setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err) { setError(err.message || 'Versturen mislukt'); }
    finally { setLoading(false); }
  }

  async function handleSignup(e) {
    e.preventDefault(); setError('');
    if (password !== confirm) { setError('Wachtwoorden komen niet overeen'); return; }
    if (password.length < 6) { setError('Minimaal 6 tekens vereist'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      setSignupDone(true);
    } catch (err) { setError(err.message || 'Registratie mislukt'); }
    finally { setLoading(false); }
  }

  const inp = { width: '100%', boxSizing: 'border-box', padding: '10px 13px', fontSize: '14px', fontFamily: sans, background: '#FFFFFF', border: C.border, borderRadius: '10px', outline: 'none', color: C.dark };
  const lbl = { display: 'block', fontFamily: sans, fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase', color: '#555', marginBottom: '5px' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(2,3,9,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: C.cream, border: C.border, borderRadius: '20px', boxShadow: shadow(8, C.yellow), width: '100%', maxWidth: '400px', animation: 'fadeUp .25s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: C.border }}>
          <div style={{ display: 'flex', gap: '4px', background: '#e8e0d0', borderRadius: '10px', padding: '3px' }}>
            {[['login', 'Inloggen'], ['signup', 'Registreren']].map(([t, label]) => (
              <button key={t} onClick={() => switchTab(t)} style={{ padding: '6px 16px', background: tab === t ? C.dark : 'transparent', color: tab === t ? C.cream : C.muted, border: 'none', borderRadius: '8px', fontFamily: sans, fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all .15s' }}>{label}</button>
            ))}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex', padding: '4px' }}><X size={18} /></button>
        </div>

        <div style={{ padding: '26px 22px' }}>
          {signupDone ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ width: '56px', height: '56px', background: C.green, border: C.border, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', boxShadow: shadow(3) }}>
                <Check size={26} />
              </div>
              <div style={{ fontFamily: sans, fontWeight: 800, fontSize: '18px', marginBottom: '10px' }}>Controleer je e-mail</div>
              <div style={{ fontFamily: sans, fontSize: '13px', color: '#555', lineHeight: 1.7 }}>
                We stuurden een bevestigingslink naar <strong>{email}</strong>.
              </div>
            </div>
          ) : resetSent ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ width: '56px', height: '56px', background: C.blue, border: C.border, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', boxShadow: shadow(3) }}>
                <Mail size={26} />
              </div>
              <div style={{ fontFamily: sans, fontWeight: 800, fontSize: '18px', marginBottom: '10px' }}>Controleer je e-mail</div>
              <div style={{ fontFamily: sans, fontSize: '13px', color: '#555', lineHeight: 1.7 }}>
                We stuurden een link om je wachtwoord opnieuw in te stellen naar <strong>{email}</strong>.
              </div>
            </div>
          ) : tab === 'login' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div><label style={lbl}>E-mailadres</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jou@bedrijf.nl" style={inp} /></div>
              <div>
                <label style={lbl}>Wachtwoord</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={inp} />
              </div>
              <button type="button" onClick={handleForgotPassword} style={{ alignSelf: 'flex-end', marginTop: '-8px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: C.muted, textDecoration: 'underline', fontSize: '12px', fontFamily: sans }}>
                Wachtwoord vergeten?
              </button>
              {error && <div style={{ background: '#F3C1C0', border: '1.5px solid #020309', borderRadius: '8px', padding: '9px 12px', fontFamily: sans, fontSize: '13px' }}>{error}</div>}
              <button type="submit" disabled={loading} style={{ padding: '12px', background: C.dark, color: C.cream, border: C.border, borderRadius: '11px', boxShadow: `3px 3px 0 ${C.yellow}`, fontFamily: sans, fontWeight: 700, fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Bezig…' : 'Inloggen →'}
              </button>
              <div style={{ textAlign: 'center', fontFamily: sans, fontSize: '12px', color: C.muted }}>
                Geen account?{' '}
                <button type="button" onClick={() => switchTab('signup')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: C.dark, textDecoration: 'underline', fontSize: '12px', fontFamily: sans }}>Registreer gratis</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div><label style={lbl}>E-mailadres</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jou@bedrijf.nl" style={inp} /></div>
              <div><label style={lbl}>Wachtwoord</label><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimaal 6 tekens" style={inp} /></div>
              <div><label style={lbl}>Bevestig wachtwoord</label><input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" style={inp} /></div>
              {error && <div style={{ background: '#F3C1C0', border: '1.5px solid #020309', borderRadius: '8px', padding: '9px 12px', fontFamily: sans, fontSize: '13px' }}>{error}</div>}
              <button type="submit" disabled={loading} style={{ padding: '12px', background: C.dark, color: C.cream, border: C.border, borderRadius: '11px', boxShadow: `3px 3px 0 ${C.yellow}`, fontFamily: sans, fontWeight: 700, fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Bezig…' : 'Account aanmaken →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── reset password screen ────────────────────────────────────────────────────

export function ResetPasswordScreen({ onDone }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const inp = { width: '100%', boxSizing: 'border-box', padding: '10px 13px', fontSize: '14px', fontFamily: sans, background: '#FFFFFF', border: C.border, borderRadius: '10px', outline: 'none', color: C.dark };
  const lbl = { display: 'block', fontFamily: sans, fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase', color: '#555', marginBottom: '5px' };

  async function handleSubmit(e) {
    e.preventDefault(); setError('');
    if (password !== confirm) { setError('Wachtwoorden komen niet overeen'); return; }
    if (password.length < 6) { setError('Minimaal 6 tekens vereist'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
    } catch (err) { setError(err.message || 'Wachtwoord instellen mislukt'); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: C.cream, border: C.border, borderRadius: '20px', boxShadow: shadow(8, C.yellow), width: '100%', maxWidth: '400px' }}>
        <div style={{ padding: '18px 22px', borderBottom: C.border }}>
          <div style={{ fontFamily: sans, fontWeight: 800, fontSize: '16px' }}>Nieuw wachtwoord instellen</div>
        </div>
        <div style={{ padding: '26px 22px' }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ width: '56px', height: '56px', background: C.green, border: C.border, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', boxShadow: shadow(3) }}>
                <Check size={26} />
              </div>
              <div style={{ fontFamily: sans, fontWeight: 800, fontSize: '18px', marginBottom: '14px' }}>Wachtwoord ingesteld</div>
              <button onClick={onDone} style={{ padding: '12px 20px', background: C.dark, color: C.cream, border: C.border, borderRadius: '11px', boxShadow: `3px 3px 0 ${C.yellow}`, fontFamily: sans, fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                Naar Bookie →
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div><label style={lbl}>Nieuw wachtwoord</label><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimaal 6 tekens" style={inp} /></div>
              <div><label style={lbl}>Bevestig wachtwoord</label><input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" style={inp} /></div>
              {error && <div style={{ background: '#F3C1C0', border: '1.5px solid #020309', borderRadius: '8px', padding: '9px 12px', fontFamily: sans, fontSize: '13px' }}>{error}</div>}
              <button type="submit" disabled={loading} style={{ padding: '12px', background: C.dark, color: C.cream, border: C.border, borderRadius: '11px', boxShadow: `3px 3px 0 ${C.yellow}`, fontFamily: sans, fontWeight: 700, fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Bezig…' : 'Wachtwoord opslaan'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── app mockup ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: 'Dashboard',       active: true  },
  { label: 'Inkoopfacturen',  active: false },
  { label: 'Verkoopfacturen', active: false },
  { label: 'BTW-aangifte',    active: false },
  { label: 'Balans',          active: false },
  { label: 'Leveranciers',    active: false },
];

const MOCK_INVOICES = [
  { s: 'Shopify NL',       nr: 'INV-2024-001', date: '03-06-2026', btw: '21%', a: '€60,50',   status: 'paid',    bg: C.blue  },
  { s: 'Meta Ads BV',      nr: 'META-Q2-441',  date: '01-06-2026', btw: '21%', a: '€400,00',  status: 'paid',    bg: 'white' },
  { s: 'AliExpress',       nr: 'AE-887234',    date: '31-05-2026', btw: '9%',  a: '€550,00',  status: 'pending', bg: C.table },
  { s: 'Google Ads',       nr: 'G-2026-0612',  date: '22-05-2026', btw: '21%', a: '€400,00',  status: 'paid',    bg: 'white' },
  { s: 'PostNL',           nr: 'PNL-40392',    date: '18-05-2026', btw: '21%', a: '€50,00',   status: 'paid',    bg: C.blue  },
  { s: 'Shopify Thema',    nr: 'THM-2026-019', date: '14-05-2026', btw: '0%',  a: '€178,00',  status: 'review',  bg: 'white' },
];

const STATUS_DOT = { paid: '#4ade80', pending: '#fbbf24', review: '#f87171' };
const STATUS_LBL = { paid: 'Betaald', pending: 'Openstaand', review: 'Te controleren' };
const STATUS_BG  = { paid: C.green,   pending: C.yellow,     review: '#F3C1C0' };

function AppMockup() {
  return (
    <div className="land-mockup-float" style={{ width: '100%', maxWidth: '1020px', border: C.border, borderRadius: '18px', overflow: 'hidden', fontFamily: sans, boxShadow: shadow(8), background: '#fff' }}>

      {/* ── browser chrome ── */}
      <div style={{ background: '#18110a', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['#ef4444','#f59e0b','#22c55e'].map(c => <div key={c} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c }} />)}
        </div>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.07)', borderRadius: '6px', padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '340px', margin: '0 auto' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }} />
          <span style={{ fontFamily: mono, fontSize: '11px', color: '#666' }}>bookie.app/dashboard</span>
        </div>
      </div>

      {/* ── app shell ── */}
      <div style={{ display: 'flex', height: '520px' }}>

        {/* sidebar */}
        <div style={{ width: '200px', background: C.sidebar, borderRight: '2px solid #020309', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          {/* brand */}
          <div style={{ padding: '16px 14px', borderBottom: '1.5px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '9px' }}>
            <div style={{ width: '30px', height: '30px', background: C.yellow, border: '2px solid rgba(253,238,196,0.25)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px', flexShrink: 0 }}>B</div>
            <span style={{ fontFamily: sans, fontWeight: 800, fontSize: '15px', color: '#FAF3E3', letterSpacing: '-0.3px' }}>Bookie</span>
          </div>
          {/* nav */}
          <div style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {NAV_ITEMS.map(item => (
              <div key={item.label} style={{ padding: '8px 10px', borderRadius: '8px', background: item.active ? 'rgba(253,238,196,0.12)' : 'transparent', border: item.active ? '1px solid rgba(253,238,196,0.2)' : '1px solid transparent', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.active ? C.yellow : 'transparent', flexShrink: 0 }} />
                <span style={{ fontFamily: sans, fontSize: '12px', fontWeight: item.active ? 700 : 500, color: item.active ? C.yellow : '#6b5d45' }}>{item.label}</span>
              </div>
            ))}
          </div>
          {/* settings at bottom */}
          <div style={{ padding: '10px 8px', borderTop: '1.5px solid rgba(255,255,255,0.06)' }}>
            <div style={{ padding: '8px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'transparent', flexShrink: 0 }} />
              <span style={{ fontFamily: sans, fontSize: '12px', color: '#4a3d2a' }}>Instellingen</span>
            </div>
          </div>
        </div>

        {/* main */}
        <div style={{ flex: 1, background: C.cream, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* topbar */}
          <div style={{ height: '52px', borderBottom: '2px solid #020309', background: C.cream, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0 }}>
            <div>
              <div style={{ fontFamily: sans, fontWeight: 800, fontSize: '16px', letterSpacing: '-0.3px' }}>Dashboard</div>
              <div style={{ fontFamily: sans, fontSize: '10px', color: '#999' }}>Q2 2026 · jouw overzicht in één oogopslag</div>
            </div>
            <div style={{ display: 'flex', gap: '7px', alignItems: 'center' }}>
              <div style={{ padding: '5px 12px', background: '#FFFFFF', border: '1.5px solid #020309', borderRadius: '8px', fontSize: '10px', fontWeight: 600, boxShadow: '2px 2px 0 #020309' }}>Bulk upload</div>
              <div style={{ padding: '5px 12px', background: C.dark, color: C.cream, border: '1.5px solid #020309', borderRadius: '8px', fontSize: '10px', fontWeight: 700, boxShadow: `2px 2px 0 ${C.yellow}` }}>+ Factuur</div>
            </div>
          </div>

          {/* content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {[
                { l: 'Totaal excl. BTW', v: '€3.630', sub: '46 facturen', bg: C.yellow },
                { l: 'BTW terug',        v: '€630',   sub: 'Q2 2026',     bg: C.blue   },
                { l: 'Betaald',          v: '€2.900', sub: '38 facturen', bg: C.green  },
                { l: 'Te controleren',   v: '€178',   sub: '1 factuur',   bg: '#F3C1C0'},
              ].map(s => (
                <div key={s.l} style={{ background: s.bg, border: '1.5px solid #020309', borderRadius: '10px', padding: '10px 12px', boxShadow: '2px 2px 0 #020309' }}>
                  <div style={{ fontSize: '7.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#555', marginBottom: '4px' }}>{s.l}</div>
                  <div style={{ fontFamily: mono, fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px' }}>{s.v}</div>
                  <div style={{ fontSize: '9px', color: '#777', marginTop: '2px' }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* BTW card */}
            <div style={{ background: C.yellow, border: '1.5px solid #020309', borderRadius: '10px', padding: '12px 14px', boxShadow: '2px 2px 0 #020309', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#666', marginBottom: '4px' }}>BTW Q2 2026 · apr–jun</div>
                <div style={{ fontSize: '11px', color: '#555' }}>Voorbelasting (inkoop) · nog geen verkoopfacturen</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', color: '#1a6b3a', marginBottom: '2px' }}>BTW terug te vragen</div>
                <div style={{ fontFamily: mono, fontWeight: 800, fontSize: '20px', color: '#1a6b3a', letterSpacing: '-0.5px' }}>€630,00</div>
              </div>
            </div>

            {/* invoice table */}
            <div style={{ background: '#FFFFFF', border: '1.5px solid #020309', borderRadius: '10px', overflow: 'hidden', boxShadow: '2px 2px 0 #020309' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 72px 70px 80px 90px', padding: '7px 14px', background: C.table, borderBottom: '1.5px solid #020309', fontSize: '7.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#777', gap: '8px' }}>
                <span>Leverancier</span><span>Factuurnr</span><span>Datum</span><span>BTW</span><span style={{ textAlign: 'right' }}>Bedrag</span><span>Status</span>
              </div>
              {MOCK_INVOICES.map((r, i) => (
                <div key={r.s} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 72px 70px 80px 90px', padding: '8px 14px', background: r.bg, borderBottom: i < MOCK_INVOICES.length - 1 ? '1px solid #ede6d8' : 'none', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700 }}>{r.s}</span>
                  <span style={{ fontFamily: mono, fontSize: '9px', color: '#888' }}>{r.nr}</span>
                  <span style={{ fontFamily: mono, fontSize: '9px', color: '#999' }}>{r.date}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: C.blue, border: '1px solid #020309', borderRadius: '4px', padding: '1px 6px', fontSize: '9px', fontWeight: 700, width: 'fit-content' }}>{r.btw}</span>
                  <span style={{ fontFamily: mono, fontSize: '11px', fontWeight: 700, textAlign: 'right' }}>{r.a}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: STATUS_BG[r.status], border: '1px solid #020309', borderRadius: '9999px', padding: '2px 7px', fontSize: '8.5px', fontWeight: 700, width: 'fit-content' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: STATUS_DOT[r.status], flexShrink: 0 }} />
                    {STATUS_LBL[r.status]}
                  </span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// ─── nav ──────────────────────────────────────────────────────────────────────

function Nav({ onLogin, onSignup }) {
  function scrollTo(id) { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); }
  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(250,243,227,0.92)', backdropFilter: 'blur(12px)', borderBottom: C.border, padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ width: '34px', height: '34px', background: C.dark, border: C.border, borderRadius: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: sans, fontWeight: 800, fontSize: '15px', color: C.yellow }}>B</span>
        <span style={{ fontFamily: sans, fontWeight: 800, fontSize: '20px', letterSpacing: '-0.4px', color: C.dark }}>Bookie</span>
      </div>

      <div style={{ display: 'flex', gap: '2px' }}>
        {[['functies', 'Functies'], ['prijzen', 'Prijzen'], ['faq', 'FAQ']].map(([id, label]) => (
          <button key={id} onClick={() => scrollTo(id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: sans, fontWeight: 600, fontSize: '14px', color: C.muted, padding: '7px 14px', borderRadius: '9px' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = C.dark; e.currentTarget.style.background = 'rgba(2,3,9,0.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = C.muted; e.currentTarget.style.background = 'none'; }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button onClick={onLogin} style={{ padding: '8px 18px', background: 'transparent', border: C.border, borderRadius: '10px', fontFamily: sans, fontWeight: 600, fontSize: '13px', cursor: 'pointer', color: C.dark }}
          onMouseEnter={(e) => e.currentTarget.style.background = C.table}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
          Inloggen
        </button>
        <button onClick={onSignup} style={{ padding: '8px 18px', background: C.dark, border: C.border, borderRadius: '10px', boxShadow: shadow(3, C.yellow), fontFamily: sans, fontWeight: 700, fontSize: '13px', cursor: 'pointer', color: C.cream }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = shadow(5, C.yellow); e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = shadow(3, C.yellow); e.currentTarget.style.transform = 'none'; }}>
          Gratis beginnen →
        </button>
      </div>
    </nav>
  );
}

// ─── hero ─────────────────────────────────────────────────────────────────────

function Hero({ onSignup }) {
  return (
    <section style={{ background: C.cream, padding: '100px 32px 80px', borderBottom: C.border, overflow: 'hidden' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* centered top badge */}
        <div className="land-hero-anim" style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: C.dark, border: C.border, borderRadius: '9999px', padding: '5px 16px', boxShadow: shadow(3, C.yellow) }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80' }} />
            <span style={{ fontFamily: sans, fontWeight: 700, fontSize: '12px', color: C.cream, letterSpacing: '0.3px' }}>Speciaal voor ecom-ondernemers</span>
          </div>
        </div>

        {/* headline */}
        <div className="land-hero-anim-2" style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontFamily: sans, fontWeight: 800, fontSize: '64px', lineHeight: 1.05, letterSpacing: '-2px', color: C.dark, margin: 0 }}>
            Boekhouding{' '}
            <span style={{ position: 'relative', display: 'inline-block' }}>
              <span style={{ background: C.yellow, padding: '2px 10px', border: C.border, borderRadius: '8px' }}>zonder gedoe.</span>
            </span>
          </h1>
        </div>

        {/* subtext */}
        <div className="land-hero-anim-2" style={{ textAlign: 'center', marginBottom: '40px' }}>
          <p style={{ fontFamily: sans, fontSize: '18px', color: '#555', lineHeight: 1.7, maxWidth: '560px', margin: '0 auto' }}>
            Upload je facturen, laat AI ze uitlezen en zie in één oogopslag wat je BTW-aangifte moet zijn. Voor ecom-ondernemers die geen boekhoudtijd willen verspillen.
          </p>
        </div>

        {/* CTA */}
        <div className="land-hero-anim-3" style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button onClick={onSignup} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '14px 28px', background: C.dark, color: C.cream, border: C.border, borderRadius: '13px', boxShadow: `5px 5px 0 ${C.yellow}`, fontFamily: sans, fontWeight: 700, fontSize: '16px', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = `7px 7px 0 ${C.yellow}`; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `5px 5px 0 ${C.yellow}`; }}>
            Gratis beginnen <ArrowRight size={18} />
          </button>
          <button onClick={() => document.getElementById('prijzen')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ padding: '14px 28px', background: '#FFFFFF', border: C.border, borderRadius: '13px', boxShadow: shadow(4), fontFamily: sans, fontWeight: 600, fontSize: '16px', cursor: 'pointer', color: C.dark }}
            onMouseEnter={(e) => e.currentTarget.style.background = C.table}
            onMouseLeave={(e) => e.currentTarget.style.background = '#FFFFFF'}>
            Bekijk prijzen
          </button>
        </div>

        {/* trust pills */}
        <div className="land-hero-anim-3" style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '64px', flexWrap: 'wrap' }}>
          {['Geen creditcard nodig', 'Gratis tier beschikbaar', 'EU-datacenter'].map((t) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '18px', height: '18px', background: C.green, border: '1.5px solid #020309', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Check size={9} strokeWidth={3} />
              </div>
              <span style={{ fontFamily: sans, fontSize: '13px', color: '#555', fontWeight: 500 }}>{t}</span>
            </div>
          ))}
        </div>

        {/* mockup */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'relative', borderRadius: '22px', padding: '3px', overflow: 'hidden', width: '100%', maxWidth: '1020px' }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '22px',
              background: 'conic-gradient(from 0deg, transparent 0%, #FDEEC4 25%, #020309 50%, #FDEEC4 75%, transparent 100%)',
              animation: 'beamSpin 4s linear infinite',
              transformOrigin: 'center',
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <AppMockup />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── trust bar ────────────────────────────────────────────────────────────────

function TrustBar() {
  const stats = [
    { v: '2.400+', l: 'facturen gescand' },
    { v: '< 5 sec', l: 'per factuur' },
    { v: '3 min', l: 'BTW-aangifte klaar' },
    { v: '€0', l: 'om te beginnen' },
  ];
  return (
    <div style={{ background: C.dark, borderBottom: C.border, padding: '24px 32px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px' }}>
        {stats.map((s) => (
          <div key={s.l} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: mono, fontWeight: 700, fontSize: '26px', color: C.yellow, letterSpacing: '-0.5px' }}>{s.v}</div>
            <div style={{ fontFamily: sans, fontSize: '11px', color: '#666', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── features ─────────────────────────────────────────────────────────────────

function FeaturesSection() {
  return (
    <section id="functies" style={{ background: '#FFFFFF', borderBottom: C.border, padding: '96px 32px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{ display: 'inline-block', fontFamily: sans, fontWeight: 700, fontSize: '10px', letterSpacing: '2.5px', textTransform: 'uppercase', color: C.muted, marginBottom: '14px' }}>FUNCTIES</div>
          <h2 style={{ fontFamily: sans, fontWeight: 800, fontSize: '40px', letterSpacing: '-1px', color: C.dark, margin: 0 }}>Alles wat je nodig hebt.</h2>
          <p style={{ fontFamily: sans, fontSize: '16px', color: '#666', marginTop: '14px', maxWidth: '500px', margin: '14px auto 0' }}>Geen overbodige functies. Gewoon de dingen die jou als ecom-ondernemer verder helpen.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {FEATURES.map(({ Icon, bg, title, desc, soon }) => (
            <div key={title} className="land-feat-card" style={{ background: C.cream, border: C.border, borderRadius: '16px', boxShadow: shadow(4), padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <span style={{ width: '44px', height: '44px', background: bg, border: C.border, borderRadius: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: shadow(2) }}>
                  <Icon size={20} />
                </span>
                {soon && <span style={{ background: C.yellow, border: '1.5px solid #020309', borderRadius: '9999px', padding: '3px 10px', fontFamily: sans, fontWeight: 700, fontSize: '9px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Binnenkort</span>}
              </div>
              <div style={{ fontFamily: sans, fontWeight: 800, fontSize: '16px', color: C.dark }}>{title}</div>
              <div style={{ fontFamily: sans, fontSize: '14px', color: '#666', lineHeight: 1.7 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── how it works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  return (
    <section style={{ background: C.table, borderBottom: C.border, padding: '96px 32px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{ display: 'inline-block', fontFamily: sans, fontWeight: 700, fontSize: '10px', letterSpacing: '2.5px', textTransform: 'uppercase', color: C.muted, marginBottom: '14px' }}>HOE HET WERKT</div>
          <h2 style={{ fontFamily: sans, fontWeight: 800, fontSize: '40px', letterSpacing: '-1px', color: C.dark, margin: 0 }}>Drie stappen. Dat is alles.</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', position: 'relative' }}>
          {/* connecting line */}
          <div style={{ position: 'absolute', top: '36px', left: '33%', right: '33%', height: '2px', background: 'repeating-linear-gradient(90deg, #d4cbbe 0, #d4cbbe 6px, transparent 6px, transparent 12px)', zIndex: 0 }} />

          {STEPS.map((step) => (
            <div key={step.nr} className="land-step-card" style={{ background: '#FFFFFF', border: C.border, borderRadius: '16px', boxShadow: shadow(4), padding: '32px 28px', position: 'relative', zIndex: 1 }}>
              <div style={{ fontFamily: mono, fontWeight: 900, fontSize: '42px', color: C.yellow, WebkitTextStroke: '2px #020309', lineHeight: 1, marginBottom: '18px' }}>{step.nr}</div>
              <div style={{ fontFamily: sans, fontWeight: 800, fontSize: '18px', color: C.dark, marginBottom: '10px' }}>{step.title}</div>
              <div style={{ fontFamily: sans, fontSize: '14px', color: '#666', lineHeight: 1.7 }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── pricing ──────────────────────────────────────────────────────────────────

const TIER_ROTATIONS = ['rotate(-1.5deg)', 'rotate(1deg)', 'rotate(-1deg)'];

function PricingCard({ tier, rotation, onSignup }) {
  const [hov, setHov] = useState(false);

  const dark        = tier.highlight;
  const textPrimary = dark ? '#FFFFFF'          : C.dark;
  const textSub     = dark ? 'rgba(255,255,255,0.5)' : '#666';
  const textDim     = dark ? 'rgba(255,255,255,0.28)' : '#bbb';
  const divider     = dark ? 'rgba(255,255,255,0.12)' : 'rgba(2,3,9,0.12)';
  const ctaBg       = dark ? C.yellow : C.dark;
  const ctaColor    = dark ? C.dark   : C.cream;
  const ctaShadow   = dark ? shadow(3, 'rgba(253,238,196,0.35)') : shadow(3);
  const checkFill   = dark ? C.yellow             : C.dark;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: tier.bg,
        border: C.border,
        borderRadius: '20px',
        boxShadow: hov
          ? `9px 9px 0 ${dark ? C.yellow : C.dark}`
          : `5px 5px 0 ${dark ? C.yellow : C.dark}`,
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
        position: 'relative',
        transform: hov ? `translate(-4px,-4px) ${rotation}` : rotation,
        transition: 'transform .2s ease, box-shadow .2s ease',
      }}
    >
      {tier.badge && (
        <div style={{
          position: 'absolute', top: '-14px', right: '20px',
          background: C.yellow, border: C.border,
          borderRadius: '9999px', padding: '4px 14px',
          fontFamily: sans, fontWeight: 700, fontSize: '11px',
          whiteSpace: 'nowrap', boxShadow: shadow(2),
          transform: 'rotate(3deg)', zIndex: 2,
          color: C.dark,
        }}>
          {tier.badge}
        </div>
      )}

      {/* header: name + desc */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontFamily: sans, fontWeight: 800, fontSize: '26px', color: textPrimary, letterSpacing: '-0.5px', marginBottom: '5px' }}>{tier.name}</div>
        <div style={{ fontFamily: sans, fontSize: '13px', color: textSub, lineHeight: 1.5 }}>{tier.desc}</div>
      </div>

      {/* price */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
        <span style={{ fontFamily: mono, fontWeight: 900, fontSize: '58px', letterSpacing: '-3px', color: textPrimary, lineHeight: 1 }}>€{tier.price}</span>
        <span style={{ fontFamily: sans, fontSize: '14px', color: textSub }}>{tier.period}</span>
      </div>

      {/* cta */}
      <button
        onClick={onSignup}
        style={{
          width: '100%', padding: '13px', cursor: 'pointer',
          background: ctaBg,
          color: ctaColor,
          border: C.border, borderRadius: '12px',
          boxShadow: ctaShadow,
          fontFamily: sans, fontWeight: 700, fontSize: '14px',
          marginBottom: '24px',
          transition: 'transform .15s, box-shadow .15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = shadow(5); }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = ctaShadow; }}
      >
        {tier.cta} →
      </button>

      {/* divider */}
      <div style={{ height: '1px', background: divider, marginBottom: '20px' }} />

      {/* features */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {tier.features.map((f) => {
          const item = typeof f === 'string' ? { text: f } : f;
          return (
            <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '20px', height: '20px', flexShrink: 0,
                background: item.no ? 'transparent' : checkFill,
                border: `1.5px solid ${item.no ? divider : (dark ? C.yellow : C.dark)}`,
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {item.no
                  ? <span style={{ color: textDim, fontSize: '12px', lineHeight: 1 }}>−</span>
                  : <Check size={10} strokeWidth={3} color={dark ? C.dark : '#FFFFFF'} />}
              </div>
              <span style={{ fontFamily: sans, fontSize: '13px', color: item.no ? textDim : textPrimary, display: 'flex', alignItems: 'center', gap: '7px' }}>
                {item.text}
                {item.soon && (
                  <span style={{
                    background: dark ? 'rgba(253,238,196,0.18)' : 'rgba(2,3,9,0.08)',
                    border: `1px solid ${dark ? 'rgba(253,238,196,0.35)' : 'rgba(2,3,9,0.2)'}`,
                    borderRadius: '5px', padding: '1px 6px',
                    fontSize: '9px', fontWeight: 700,
                    color: dark ? C.yellow : C.dark,
                  }}>
                    binnenkort
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PricingSection({ onSignup }) {
  return (
    <section id="prijzen" style={{ background: C.cream, borderBottom: C.border, padding: '96px 32px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '72px' }}>
          <div style={{ display: 'inline-block', fontFamily: sans, fontWeight: 700, fontSize: '10px', letterSpacing: '2.5px', textTransform: 'uppercase', color: C.muted, marginBottom: '14px' }}>PRIJZEN</div>
          <h2 style={{ fontFamily: sans, fontWeight: 800, fontSize: '40px', letterSpacing: '-1px', color: C.dark, margin: 0 }}>Eerlijk geprijsd. Geen verrassingen.</h2>
          <p style={{ fontFamily: sans, fontSize: '16px', color: '#666', marginTop: '14px' }}>Begin gratis. Upgrade wanneer je er klaar voor bent.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px', alignItems: 'center', padding: '20px 0 40px' }}>
          {TIERS.map((tier, i) => (
            <PricingCard key={tier.id} tier={tier} rotation={TIER_ROTATIONS[i]} onSignup={onSignup} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── testimonials ─────────────────────────────────────────────────────────────

function TestimonialsSection() {
  return (
    <section style={{ background: C.dark, borderBottom: C.border, padding: '96px 32px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{ display: 'inline-block', fontFamily: sans, fontWeight: 700, fontSize: '10px', letterSpacing: '2.5px', textTransform: 'uppercase', color: '#555', marginBottom: '14px' }}>ERVARINGEN</div>
          <h2 style={{ fontFamily: sans, fontWeight: 800, fontSize: '40px', letterSpacing: '-1px', color: '#FFFFFF', margin: 0 }}>Wat ondernemers zeggen</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {TESTIMONIALS.map((t) => (
            <div key={t.name} style={{ background: '#FFFFFF', border: C.border, borderRadius: '18px', boxShadow: `5px 5px 0 ${C.yellow}`, padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ fontFamily: sans, fontSize: '15px', color: C.dark, lineHeight: 1.7, fontStyle: 'italic' }}>"{t.quote}"</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 'auto', paddingTop: '16px', borderTop: '2px solid #e8e0d0' }}>
                <div style={{ width: '44px', height: '44px', background: t.bg, border: C.border, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: sans, fontWeight: 800, fontSize: '14px', flexShrink: 0, boxShadow: shadow(2) }}>{t.initials}</div>
                <div>
                  <div style={{ fontFamily: sans, fontWeight: 700, fontSize: '14px', color: C.dark }}>{t.name}</div>
                  <div style={{ fontFamily: sans, fontSize: '12px', color: C.muted }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── faq ──────────────────────────────────────────────────────────────────────

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: C.border, borderRadius: '14px', background: '#FFFFFF', overflow: 'hidden', boxShadow: shadow(3) }}>
      <button onClick={() => setOpen((p) => !p)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', background: open ? C.table : 'none', border: 'none', cursor: 'pointer', gap: '16px', transition: 'background .15s' }}>
        <span style={{ fontFamily: sans, fontWeight: 700, fontSize: '15px', color: C.dark, textAlign: 'left' }}>{q}</span>
        <ChevronDown size={18} style={{ flexShrink: 0, color: C.muted, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
      </button>
      {open && <div style={{ padding: '18px 22px', fontFamily: sans, fontSize: '14px', color: '#555', lineHeight: 1.75, borderTop: '2px solid #e8e0d0' }}>{a}</div>}
    </div>
  );
}

function FAQSection() {
  return (
    <section id="faq" style={{ background: C.table, borderBottom: C.border, padding: '96px 32px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <div style={{ display: 'inline-block', fontFamily: sans, fontWeight: 700, fontSize: '10px', letterSpacing: '2.5px', textTransform: 'uppercase', color: C.muted, marginBottom: '14px' }}>FAQ</div>
          <h2 style={{ fontFamily: sans, fontWeight: 800, fontSize: '40px', letterSpacing: '-1px', color: C.dark, margin: 0 }}>Veelgestelde vragen</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {FAQS.map((f) => <FaqItem key={f.q} {...f} />)}
        </div>
      </div>
    </section>
  );
}

// ─── cta ──────────────────────────────────────────────────────────────────────

function CTASection({ onSignup }) {
  return (
    <section style={{ background: C.yellow, borderBottom: C.border, padding: '96px 32px' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: C.dark, border: C.border, borderRadius: '9999px', padding: '5px 16px', marginBottom: '28px' }}>
          <ShieldCheck size={13} color={C.green} />
          <span style={{ fontFamily: sans, fontWeight: 700, fontSize: '12px', color: C.cream }}>Geen creditcard · Altijd opzegbaar</span>
        </div>
        <h2 style={{ fontFamily: sans, fontWeight: 800, fontSize: '48px', letterSpacing: '-1.5px', color: C.dark, margin: '0 0 18px', lineHeight: 1.1 }}>
          Begin vandaag nog gratis.
        </h2>
        <p style={{ fontFamily: sans, fontSize: '17px', color: '#555', marginBottom: '36px', lineHeight: 1.7 }}>
          Geen installatie. Gewoon je facturen uploaden en je BTW in orde hebben.
        </p>
        <button onClick={onSignup} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '16px 32px', background: C.dark, color: C.cream, border: C.border, borderRadius: '14px', boxShadow: shadow(5), fontFamily: sans, fontWeight: 800, fontSize: '17px', cursor: 'pointer' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = shadow(7); }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = shadow(5); }}>
          Maak een gratis account <ArrowRight size={20} />
        </button>
      </div>
    </section>
  );
}

// ─── footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{ background: C.dark, padding: '48px 32px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '32px', paddingBottom: '32px', borderBottom: '1.5px solid #222' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ width: '38px', height: '38px', background: C.yellow, border: '2px solid rgba(253,238,196,0.3)', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: sans, fontWeight: 800, fontSize: '17px', color: C.dark }}>B</span>
            <span style={{ fontFamily: sans, fontWeight: 800, fontSize: '20px', color: '#FFFFFF', letterSpacing: '-0.4px' }}>Bookie</span>
          </div>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {['Functies', 'Prijzen', 'FAQ'].map((l) => (
              <span key={l} style={{ fontFamily: sans, fontSize: '13px', color: '#555', cursor: 'pointer' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#555'}
                onClick={() => document.getElementById(l.toLowerCase())?.scrollIntoView({ behavior: 'smooth' })}>{l}</span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontFamily: sans, fontSize: '12px', color: '#444' }}>© {new Date().getFullYear()} Bookie · Gebouwd voor ecom-ondernemers in Nederland</div>
          <div style={{ fontFamily: sans, fontSize: '12px', color: '#444' }}>info@vsecom.nl</div>
        </div>
      </div>
    </footer>
  );
}

// ─── root ─────────────────────────────────────────────────────────────────────

export function Landing() {
  const [modal, setModal] = useState(null);

  return (
    <div style={{ fontFamily: sans, background: C.cream, minHeight: '100vh' }}>
      <style>{STYLES}</style>
      <Nav onLogin={() => setModal('login')} onSignup={() => setModal('signup')} />
      <Hero onSignup={() => setModal('signup')} />
      <TrustBar />
      <FeaturesSection />
      <HowItWorks />
      <PricingSection onSignup={() => setModal('signup')} />
      <TestimonialsSection />
      <FAQSection />
      <CTASection onSignup={() => setModal('signup')} />
      <Footer />
      {modal && <AuthModal initialTab={modal} onClose={() => setModal(null)} />}
    </div>
  );
}
