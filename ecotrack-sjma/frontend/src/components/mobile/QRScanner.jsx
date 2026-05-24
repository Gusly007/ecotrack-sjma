import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import './QRScanner.css';

export default function QRScanner({ onScan, onError }) {
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);

  // Stocker les callbacks dans un ref évite que useEffect se relance à chaque
  // render quand le parent passe une nouvelle référence de fonction.
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);
  onScanRef.current = onScan;
  onErrorRef.current = onError;

  useEffect(() => {
    const scannerId = 'qr-scanner-region';

    const startScanner = async () => {
      try {
        if (html5QrRef.current && html5QrRef.current.isScanning) {
          await html5QrRef.current.stop();
        }

        const html5QrCode = new Html5Qrcode(scannerId);
        html5QrRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (onScanRef.current) onScanRef.current(decodedText);
          },
          () => { /* per-frame errors ignored */ }
        );
        setIsScanning(true);
      } catch (err) {
        console.error('QR Scanner error:', err);
        if (onErrorRef.current) onErrorRef.current(err);
      }
    };

    startScanner();

    return () => {
      if (html5QrRef.current && html5QrRef.current.isScanning) {
        html5QrRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="qr-scanner-wrapper">
      <div id="qr-scanner-region" ref={scannerRef} className="qr-scanner-region" />
      {!isScanning && (
        <div className="qr-scanner-loading">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Activation de la camera...</p>
        </div>
      )}
    </div>
  );
}
