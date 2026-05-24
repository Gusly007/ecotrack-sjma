import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import MobileLayout from '../../../components/mobile/MobileLayout';
import MobileCard from '../../../components/mobile/MobileCard';
import { containerService } from '../../../services/containerService';
import './ScanResult.css';

function extractUid(rawUid) {
  if (!rawUid) return '';
  const decoded = decodeURIComponent(rawUid);
  if (decoded.includes('/')) {
    const parts = decoded.split('/');
    return parts[parts.length - 1];
  }
  return decoded;
}

export default function ScanResult() {
  const { uid: rawUid } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [container, setContainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const uid = extractUid(rawUid);
  const role = user?.role || user?.role_par_defaut;

  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await containerService.getByUid(uid);
        const data = res?.data ?? res;
        if (!cancelled) setContainer(data);
      } catch {
        if (!cancelled) setContainer(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [uid]);

  if (loading) {
    return (
      <MobileLayout title="Scanner QR Code" showBack>
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: '#4CAF50' }}></i>
        </div>
      </MobileLayout>
    );
  }

  if (!container) {
    return (
      <MobileLayout title="Scanner QR Code" showBack>
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <i className="fas fa-times-circle" style={{ fontSize: '2rem', color: '#f44336', marginBottom: 12 }}></i>
          <h3>Conteneur non trouve</h3>
          <p style={{ color: '#888', fontSize: '0.85rem' }}>UID: {uid}</p>
          <button className="btn-outline-mobile" onClick={() => navigate('/scan')} style={{ marginTop: 16 }}>
            <i className="fas fa-redo"></i> Scanner a nouveau
          </button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Scanner QR Code" showBack>
      <MobileCard className="scan-result-card">
        <div className="scan-result-header">
          <i className="fas fa-check-circle" style={{ color: '#4CAF50' }}></i>
          <h4>Conteneur identifie</h4>
        </div>
        <p className="scan-result-uid">{container.uid}</p>
        <p style={{ fontSize: '0.85rem', color: '#555' }}>{container.type_conteneur || ''}</p>

        <div className="scan-result-stats">
          <div className="scan-stat">
            <strong style={{ color: (container.fill_level || 0) >= 80 ? '#f44336' : '#333' }}>
              {container.fill_level != null ? `${container.fill_level}%` : '—'}
            </strong>
            <span>Remplissage</span>
          </div>
          <div className="scan-stat">
            <strong>{container.capacite_l || '—'}L</strong>
            <span>Capacite</span>
          </div>
          <div className="scan-stat">
            <strong>{container.zone_nom || '—'}</strong>
            <span>Zone</span>
          </div>
        </div>
      </MobileCard>

      {role === 'AGENT' && (
        <button
          className="btn-primary-mobile"
          onClick={() => navigate(`/agent/scan/result/${encodeURIComponent(uid)}`)}
          style={{ marginTop: 16 }}
        >
          <i className="fas fa-check"></i> Enregistrer une collecte
        </button>
      )}
      {role === 'CITOYEN' && (
        <button
          className="btn-outline-mobile"
          onClick={() => navigate(`/citoyen/signaler?container=${encodeURIComponent(uid)}`)}
          style={{ marginTop: 16 }}
        >
          <i className="fas fa-exclamation-triangle"></i> Signaler un probleme
        </button>
      )}
    </MobileLayout>
  );
}
