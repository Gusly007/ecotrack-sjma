import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '../../../components/mobile/MobileLayout';
import QRScanner from '../../../components/mobile/QRScanner';
import './ScanPage.css';

export default function ScanPage() {
  const navigate = useNavigate();
  const [manualUid, setManualUid] = useState('');
  const [scanError, setScanError] = useState(null);

  const handleScan = (decodedText) => {
    const uid = decodedText.trim();
    if (uid) {
      navigate(`/agent/scan/result/${encodeURIComponent(uid)}`);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualUid.trim()) {
      navigate(`/agent/scan/result/${encodeURIComponent(manualUid.trim())}`);
    }
  };

  return (
    <MobileLayout title="Scanner QR Code" showBack>
      <p className="scan-instruction">Pointez la camera vers le QR code du conteneur</p>

      <QRScanner
        onScan={handleScan}
        onError={(err) => setScanError(String(err))}
      />

      {scanError && (
        <div className="scan-error">
          <i className="fas fa-exclamation-circle"></i>
          <span>Camera non disponible. Utilisez la saisie manuelle.</span>
        </div>
      )}

      <div className="manual-entry">
        <p className="manual-label">Ou saisissez l'UID manuellement</p>
        <form onSubmit={handleManualSubmit} className="manual-form">
          <input
            type="text"
            value={manualUid}
            onChange={(e) => setManualUid(e.target.value)}
            placeholder="CNT-XXXXX"
            className="form-input-mobile"
          />
          <button type="submit" className="btn-primary-mobile" disabled={!manualUid.trim()}>
            <i className="fas fa-search"></i> Rechercher
          </button>
        </form>
      </div>
    </MobileLayout>
  );
}
