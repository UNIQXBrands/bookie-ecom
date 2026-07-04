import { Card }       from '../components/Card';
import { Button }     from '../components/Button';
import { UploadZone } from '../components/UploadZone';
import { Upload, Mail } from 'lucide-react';
import bookieMark from '../assets/bookie-mark.svg';
import { useApp } from '../context/AppContext';

export function Onboarding({ onUpload }) {
  const { t } = useApp();
  return (
    <div style={{ padding: '48px 24px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <img src={bookieMark} alt="Bookie" height="48" />
          <h1 style={{ fontWeight: 700, fontSize: '28px', letterSpacing: '-0.5px', margin: '8px 0 0', fontFamily: "'DM Sans', sans-serif" }}>
            {t('onb.title')}
          </h1>
          <p style={{ fontSize: '14px', color: '#444', maxWidth: '420px', lineHeight: 1.55, fontFamily: "'DM Sans', sans-serif" }}>
            {t('onb.desc')}
          </p>
        </div>

        <UploadZone
          title={t('onb.dragFirstInvoice')}
          hint={t('facturen.dragInvoiceHint')}
          onFile={onUpload}
          icon={<Upload size={20} />}
          style={{ textAlign: 'left' }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#888', fontSize: '12px' }}>
          <div style={{ flex: 1, height: '1.5px', background: '#e8e0d0' }} />
          {t('onb.or')}
          <div style={{ flex: 1, height: '1.5px', background: '#e8e0d0' }} />
        </div>

        <Card style={{ textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ width: '40px', height: '40px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#F3C1C0', border: '2px solid #020309', borderRadius: '10px' }}>
                <Mail size={18} />
              </span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}>{t('onb.connectGmail')}</div>
                <div style={{ fontSize: '12px', color: '#888', fontFamily: "'DM Sans', sans-serif" }}>{t('onb.connectGmailDesc')}</div>
              </div>
            </div>
            <Button variant="default">{t('settings.connect')}</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
