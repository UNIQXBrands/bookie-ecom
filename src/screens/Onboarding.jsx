import { Card }       from '../components/Card';
import { Button }     from '../components/Button';
import { UploadZone } from '../components/UploadZone';
import { Upload, Mail } from 'lucide-react';
import bookieMark from '../assets/bookie-mark.svg';

export function Onboarding({ onUpload }) {
  return (
    <div style={{ padding: '48px 24px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <img src={bookieMark} alt="Bookie" height="48" />
          <h1 style={{ fontWeight: 700, fontSize: '28px', letterSpacing: '-0.5px', margin: '8px 0 0', fontFamily: "'DM Sans', sans-serif" }}>
            Welkom. Laten we beginnen.
          </h1>
          <p style={{ fontSize: '14px', color: '#444', maxWidth: '420px', lineHeight: 1.55, fontFamily: "'DM Sans', sans-serif" }}>
            Upload je eerste factuur of koppel je Gmail. Bookie leest het BTW-tarief en houdt je periode bij.
          </p>
        </div>

        <UploadZone
          title="Sleep je eerste factuur hierheen"
          hint="of klik om te bladeren · PDF, JPG, PNG"
          onFile={onUpload}
          icon={<Upload size={20} />}
          style={{ textAlign: 'left' }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#888', fontSize: '12px' }}>
          <div style={{ flex: 1, height: '1.5px', background: '#e8e0d0' }} />
          of
          <div style={{ flex: 1, height: '1.5px', background: '#e8e0d0' }} />
        </div>

        <Card style={{ textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ width: '40px', height: '40px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#F3C1C0', border: '2px solid #020309', borderRadius: '10px' }}>
                <Mail size={18} />
              </span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}>Koppel je Gmail</div>
                <div style={{ fontSize: '12px', color: '#888', fontFamily: "'DM Sans', sans-serif" }}>Bookie haalt facturen automatisch uit je inbox.</div>
              </div>
            </div>
            <Button variant="default">Koppelen</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
