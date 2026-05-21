import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import './QRScanner.css';

// Fallback JS pour CitoyenScanner quand BarcodeDetector natif n'est pas
// disponible (desktop, vieux iOS, Firefox). Utilise html5-qrcode.
//
// Props :
//   onScan(decodedText) appelé à chaque décodage réussi (peut se répéter
//                       pour le même QR — au consommateur de debouncer)
//   onError(err)        appelé une seule fois si le démarrage caméra échoue
export default function QRScanner({ onScan, onError }) {
  const html5QrRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const scannerId = 'qr-scanner-region';
    let cancelled = false;

    const start = async () => {
      try {
        // Si une instance précédente tourne encore (StrictMode peut monter
        // deux fois en dev), on l'arrête avant d'en créer une nouvelle.
        if (html5QrRef.current && html5QrRef.current.isScanning) {
          await html5QrRef.current.stop();
        }
        const instance = new Html5Qrcode(scannerId);
        html5QrRef.current = instance;

        await instance.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (onScan) onScan(decodedText);
          },
          () => {
            // Erreurs de décodage par frame — silencieuses, normales.
          }
        );
        if (!cancelled) setIsScanning(true);
      } catch (err) {
        console.error('QR Scanner error:', err);
        if (onError) onError(err);
      }
    };

    start();

    return () => {
      cancelled = true;
      if (html5QrRef.current && html5QrRef.current.isScanning) {
        html5QrRef.current.stop().catch(() => {});
      }
    };
    // onScan/onError sont volontairement hors deps : les passer en deps
    // ferait redémarrer la caméra à chaque rendu du parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="qr-scanner-wrapper">
      <div id="qr-scanner-region" className="qr-scanner-region" />
      {!isScanning && (
        <div className="qr-scanner-loading">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Activation de la caméra…</p>
        </div>
      )}
    </div>
  );
}
