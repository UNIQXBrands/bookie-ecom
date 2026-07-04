import { useState } from 'react';
import { Input }   from '../components/Input';
import { Button }  from '../components/Button';
import { Badge }   from '../components/Badge';
import { useApp }  from '../context/AppContext';
import {
  Mail, HardDrive, ShoppingBag, BarChart2, Monitor,
  CreditCard, BookOpen, Truck, Download, Trash2,
  Eye, EyeOff, Bot,
} from 'lucide-react';

// ─── helpers ────────────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h2 style={{
        fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
        fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase',
        color: '#888', marginBottom: '0',
      }}>{title}</h2>
      {children}
    </div>
  );
}

function SettingCard({ children, variant = 'default' }) {
  const bg = { default: '#FFFFFF', yellow: '#FDEEC4', red: '#F3C1C0' }[variant] || '#FFFFFF';
  return (
    <div style={{
      background: bg, border: '2px solid #020309',
      borderRadius: '12px', boxShadow: '3px 3px 0 #020309',
      padding: '18px 20px',
    }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: '1.5px', background: '#e8e0d0', margin: '4px 0' }} />;
}

// ─── integrations data ───────────────────────────────────────────────────────

const INTEGRATIONS = [
  {
    category: 'E-mail',
    items: [
      { key: 'gmail',   name: 'Gmail',   desc: 'Facturen automatisch uit inbox halen', icon: <Mail size={18} />,     color: '#F3C1C0', connected: false },
      { key: 'outlook', name: 'Outlook', desc: 'Microsoft 365 mailbox koppelen',        icon: <Mail size={18} />,     color: '#E5F5F9', connected: false },
    ],
  },
  {
    category: 'Opslag',
    items: [
      { key: 'gdrive',  name: 'Google Drive', desc: 'Facturen automatisch opslaan',    icon: <HardDrive size={18} />, color: '#E5F5F9', connected: false },
      { key: 'dropbox', name: 'Dropbox',      desc: 'Back-up van al je facturen',       icon: <HardDrive size={18} />, color: '#E5F5F9', connected: false },
    ],
  },
  {
    category: 'Webshop',
    items: [
      { key: 'shopify',    name: 'Shopify',    desc: 'Orders en facturen synchroniseren', icon: <ShoppingBag size={18} />, color: '#D2ECD0', connected: true },
      { key: 'woocommerce',name: 'WooCommerce',desc: 'WordPress webshop koppelen',        icon: <ShoppingBag size={18} />, color: '#D2ECD0', connected: false },
      { key: 'bol',        name: 'Bol.com',    desc: 'Verkopen importeren uit Bol',       icon: <ShoppingBag size={18} />, color: '#FDEEC4', connected: true },
    ],
  },
  {
    category: 'Advertenties',
    items: [
      { key: 'googleads', name: 'Google Ads', desc: 'Ad-uitgaven automatisch importeren', icon: <BarChart2 size={18} />, color: '#E5F5F9', connected: false },
      { key: 'metaads',   name: 'Meta Ads',   desc: 'Facebook & Instagram advertenties',  icon: <Monitor size={18} />,   color: '#E5F5F9', connected: false },
      { key: 'tiktokads', name: 'TikTok Ads', desc: 'TikTok campagne-uitgaven',           icon: <BarChart2 size={18} />, color: '#F3C1C0', connected: false },
    ],
  },
  {
    category: 'Betalen',
    items: [
      { key: 'mollie', name: 'Mollie', desc: 'Betalingsoverzichten importeren',    icon: <CreditCard size={18} />, color: '#D2ECD0', connected: false },
      { key: 'stripe', name: 'Stripe', desc: 'Stripe payouts en facturen linken',  icon: <CreditCard size={18} />, color: '#E5F5F9', connected: false },
    ],
  },
  {
    category: 'Boekhouding',
    items: [
      { key: 'moneybird', name: 'Moneybird',   desc: 'Facturen tweezijdig synchroniseren', icon: <BookOpen size={18} />, color: '#FDEEC4', connected: false },
      { key: 'exact',     name: 'Exact Online',desc: 'Exporteer naar Exact Online',         icon: <BookOpen size={18} />, color: '#E5F5F9', connected: false },
    ],
  },
  {
    category: 'Logistiek',
    items: [
      { key: 'postnl', name: 'PostNL', desc: 'Verzendkosten automatisch importeren', icon: <Truck size={18} />, color: '#FDEEC4', connected: false },
      { key: 'dhl',    name: 'DHL',    desc: 'DHL verzendoverzicht koppelen',        icon: <Truck size={18} />, color: '#F3C1C0', connected: false },
    ],
  },
];

// ─── sub-components ──────────────────────────────────────────────────────────

function IntegrationCard({ item, onToggle }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '16px', padding: '14px 0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <span style={{
          width: '40px', height: '40px', flexShrink: 0,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: item.color, border: '2px solid #020309', borderRadius: '10px',
        }}>{item.icon}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}>{item.name}</div>
          <div style={{ fontSize: '12px', color: '#888', fontFamily: "'DM Sans', sans-serif" }}>{item.desc}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        {item.connected && <Badge variant="paid" dot>Verbonden</Badge>}
        <Button
          variant={item.connected ? 'warn' : 'default'}
          size="sm"
          onClick={() => onToggle(item.key)}
        >
          {item.connected ? 'Verbreken' : 'Koppelen'}
        </Button>
      </div>
    </div>
  );
}

function LangButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 20px',
        fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '13px',
        background: active ? '#020309' : '#FFFFFF',
        color: active ? '#FAF3E3' : '#020309',
        border: '2px solid #020309', borderRadius: '10px',
        boxShadow: active ? '3px 3px 0 #020309' : '2px 2px 0 #020309',
        cursor: 'pointer', transition: 'all .1s ease',
      }}
    >{label}</button>
  );
}

// ─── main screen ─────────────────────────────────────────────────────────────

export function Instellingen() {
  const { apiKey, setApiKey } = useApp();
  const [lang, setLang]           = useState('nl');
  const [connections, setConnections] = useState(() => {
    const map = {};
    INTEGRATIONS.forEach((g) => g.items.forEach((i) => { map[i.key] = i.connected; }));
    return map;
  });

  const [notifs, setNotifs] = useState({
    btw_deadline: true,
    nieuwe_factuur: true,
    maandrapport: false,
  });

  const [profile, setProfile] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem('bookie_company_info') || '{}');
      return {
        bedrijfsnaam: s.bedrijfsnaam || '',
        email:        s.email        || '',
        kvk:          s.kvk          || '',
        btwnummer:    s.btwnummer    || '',
        address:      s.address      || '',
        iban:         s.iban         || '',
        paymentDays:  s.paymentDays  || '14',
      };
    } catch { return { bedrijfsnaam: '', email: '', kvk: '', btwnummer: '', address: '', iban: '', paymentDays: '14' }; }
  });
  const [profileSaved, setProfileSaved] = useState(false);

  function saveProfile() {
    localStorage.setItem('bookie_company_info', JSON.stringify(profile));
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  }

  const toggleConn = (key) =>
    setConnections((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleNotif = (key) =>
    setNotifs((prev) => ({ ...prev, [key]: !prev[key] }));

  const connectedCount = Object.values(connections).filter(Boolean).length;

  const [keyInput,  setKeyInput]  = useState(apiKey || '');
  const [showKey,   setShowKey]   = useState(false);
  const [keySaved,  setKeySaved]  = useState(false);

  function handleSaveKey() {
    setApiKey(keyInput.trim());
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  }

  return (
    <div style={{ padding: '24px', maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* ── Bookie AI ── */}
      <Section title="Bookie AI">
        <SettingCard>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <span style={{
                width: '42px', height: '42px', flexShrink: 0,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: '#FDEEC4', border: '2px solid #020309', borderRadius: '10px',
              }}>
                <Bot size={20} />
              </span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}>
                  Anthropic API-sleutel
                </div>
                <div style={{ fontSize: '12px', color: '#888', fontFamily: "'DM Sans', sans-serif", marginTop: '2px', lineHeight: 1.5 }}>
                  Gebruikt voor het automatisch scannen en uitlezen van facturen. Haal je sleutel op via console.anthropic.com.
                </div>
              </div>
              {apiKey && (
                <Badge variant="paid" dot style={{ flexShrink: 0 }}>Actief</Badge>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="sk-ant-api03-..."
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    fontFamily: "'DM Mono', monospace", fontSize: '13px',
                    background: '#FFFFFF', border: '2px solid #020309',
                    borderRadius: '10px', padding: '9px 44px 9px 12px',
                    color: '#020309', outline: 'none',
                  }}
                />
                <button
                  onClick={() => setShowKey((v) => !v)}
                  style={{
                    position: 'absolute', right: '10px', top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#888', display: 'flex', alignItems: 'center',
                  }}
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <Button
                variant={keySaved ? 'accent' : 'primary'}
                onClick={handleSaveKey}
              >
                {keySaved ? '✓ Opgeslagen' : 'Opslaan'}
              </Button>
            </div>
          </div>
        </SettingCard>
      </Section>

      {/* ── Profiel ── */}
      <Section title="Profiel & bedrijf">
        <SettingCard>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input label="Bedrijfsnaam" value={profile.bedrijfsnaam}
                onChange={(e) => setProfile((p) => ({ ...p, bedrijfsnaam: e.target.value }))} />
              <Input label="E-mailadres" type="email" value={profile.email}
                onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input label="KVK-nummer" mono value={profile.kvk}
                onChange={(e) => setProfile((p) => ({ ...p, kvk: e.target.value }))} />
              <Input label="BTW-nummer" mono value={profile.btwnummer}
                onChange={(e) => setProfile((p) => ({ ...p, btwnummer: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input label="Adres (straat + stad)" value={profile.address} placeholder="Hoofdstraat 1, 1234 AB Amsterdam"
                onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))} />
              <Input label="IBAN" mono value={profile.iban} placeholder="NL00 BANK 0000 0000 00"
                onChange={(e) => setProfile((p) => ({ ...p, iban: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '16px', alignItems: 'end' }}>
              <Input label="Betaaltermijn (dagen)" mono value={profile.paymentDays} placeholder="14"
                onChange={(e) => setProfile((p) => ({ ...p, paymentDays: e.target.value }))} />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant={profileSaved ? 'accent' : 'primary'} onClick={saveProfile}>
                  {profileSaved ? '✓ Opgeslagen' : 'Opslaan'}
                </Button>
              </div>
            </div>
          </div>
        </SettingCard>
      </Section>

      {/* ── Taal ── */}
      <Section title="Taal">
        <SettingCard>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}>Taal van de interface</div>
              <div style={{ fontSize: '12px', color: '#888', fontFamily: "'DM Sans', sans-serif", marginTop: '2px' }}>Van toepassing op alle schermen en notificaties.</div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <LangButton label="🇳🇱 Nederlands" active={lang === 'nl'} onClick={() => setLang('nl')} />
              <LangButton label="🇬🇧 English"    active={lang === 'en'} onClick={() => setLang('en')} />
            </div>
          </div>
        </SettingCard>
      </Section>

      {/* ── Koppelingen ── */}
      <Section title={`Koppelingen · ${connectedCount} actief`}>
        {INTEGRATIONS.map((group) => {
          const groupItems = group.items.map((i) => ({ ...i, connected: connections[i.key] }));
          return (
            <SettingCard key={group.category}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase', color: '#444', marginBottom: '4px' }}>
                {group.category}
              </div>
              {groupItems.map((item, idx) => (
                <div key={item.key}>
                  {idx > 0 && <Divider />}
                  <IntegrationCard item={item} onToggle={toggleConn} />
                </div>
              ))}
            </SettingCard>
          );
        })}
      </Section>

      {/* ── Notificaties ── */}
      <Section title="Notificaties">
        <SettingCard>
          {[
            { key: 'btw_deadline',   label: 'BTW-deadline herinnering', desc: '7 dagen vóór het einde van het kwartaal.' },
            { key: 'nieuwe_factuur', label: 'Nieuwe factuur gevonden',  desc: 'Zodra Bookie een factuur detecteert in je inbox.' },
            { key: 'maandrapport',   label: 'Maandelijks rapport',      desc: 'Overzicht van je BTW en facturen per maand.' },
          ].map((n, idx, arr) => (
            <div key={n.key}>
              {idx > 0 && <Divider />}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}>{n.label}</div>
                  <div style={{ fontSize: '12px', color: '#888', fontFamily: "'DM Sans', sans-serif", marginTop: '2px' }}>{n.desc}</div>
                </div>
                <button
                  onClick={() => toggleNotif(n.key)}
                  style={{
                    width: '44px', height: '24px', flexShrink: 0,
                    background: notifs[n.key] ? '#D2ECD0' : '#e8e0d0',
                    border: '2px solid #020309', borderRadius: '9999px',
                    cursor: 'pointer', position: 'relative', transition: 'background .15s ease',
                  }}
                >
                  <span style={{
                    position: 'absolute', top: '2px',
                    left: notifs[n.key] ? '20px' : '2px',
                    width: '16px', height: '16px',
                    background: '#020309', borderRadius: '50%',
                    transition: 'left .15s ease',
                  }} />
                </button>
              </div>
            </div>
          ))}
        </SettingCard>
      </Section>

      {/* ── Gevaar-zone ── */}
      <Section title="Account">
        <SettingCard variant="red">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}>Alle data exporteren</div>
                <div style={{ fontSize: '12px', color: '#444', fontFamily: "'DM Sans', sans-serif", marginTop: '2px' }}>Download al je facturen en BTW-data als CSV.</div>
              </div>
              <Button variant="default" icon={<Download size={15} />} size="sm">Exporteren</Button>
            </div>
            <Divider />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}>Account verwijderen</div>
                <div style={{ fontSize: '12px', color: '#444', fontFamily: "'DM Sans', sans-serif", marginTop: '2px' }}>Verwijdert al je data permanent. Dit is niet terug te draaien.</div>
              </div>
              <Button variant="warn" icon={<Trash2 size={15} />} size="sm">Verwijderen</Button>
            </div>
          </div>
        </SettingCard>
      </Section>

    </div>
  );
}
