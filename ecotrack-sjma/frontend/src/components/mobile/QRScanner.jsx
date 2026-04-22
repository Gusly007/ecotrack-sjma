import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import './QRScanner.css';

export default function QRScanner({ onScan, onError }) {
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const scannerId = 'qr-scanner-region';

    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode(scannerId);
        html5QrRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (onScan) onScan(decodedText);
          },
          () => {}
        );
        setIsScanning(true);
      } catch (err) {
        console.error('QR Scanner error:', err);
        if (onError) onError(err);
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
