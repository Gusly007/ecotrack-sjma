import { useState } from 'react';
import './QRCodePage.css';

export default function QRCodePage() {
  const [uid, setUid] = useState('');
  const [submittedUid, setSubmittedUid] = useState('');

  const handleGenerate = (e) => {
    e.preventDefault();
    const trimmed = uid.trim();
    if (trimmed) setSubmittedUid(trimmed);
  };

  const handleDownload = () => {
    if (!submittedUid) return;
    const url = `/api/containers/qrcode/${encodeURIComponent(submittedUid)}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = `qr-${submittedUid}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="qr-page">
      <div className="qr-card">
        <h1>Generateur QR Code Conteneur</h1>
        <p className="qr-help">Saisissez l'UID du conteneur (ex: CNT-00001) pour generer son QR code.</p>

        <form onSubmit={handleGenerate} className="qr-form">
          <input
            type="text"
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            placeholder="CNT-XXXXX"
            className="qr-input"
          />
          <button type="submit" className="qr-btn-primary" disabled={!uid.trim()}>
            Generer
          </button>
        </form>

        {submittedUid && (
          <div className="qr-result">
            <img
              src={`/api/containers/qrcode/${encodeURIComponent(submittedUid)}`}
              alt={`QR Code ${submittedUid}`}
              className="qr-image"
            />
            <p className="qr-result-uid">{submittedUid}</p>
            <button onClick={handleDownload} className="qr-btn-secondary">
              Telecharger PNG
            </button>
          </div>
        )}

        <p className="qr-footer">
          Version statique sans backend : <a href="/qr-generator.html">qr-generator.html</a>
        </p>
      </div>
    </div>
  );
}
