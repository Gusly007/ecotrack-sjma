import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileScreenHeader from '../../../components/mobile/MobileScreenHeader';
import QRScanner from '../../../components/mobile/QRScanner';
import { normalizeText } from '../../../utils/security';
import './CitoyenScanner.css';

// Trois modes : 'native' (BarcodeDetector natif), 'js' (html5-qrcode en
// fallback), 'manual' (saisie UID). Le mode est choisi au montage selon
// le support navigateur ; la saisie manuelle reste toujours disponible.

// Validation permissive côté front : la regex stricte ^CNT-… est appliquée
// par service-containers à la création du signalement.
const UID_REGEX = /^[A-Za-z0-9_-]{1,64}$/;

// Accepte UID brut ("CNT-00012") ou URL applicative dont le dernier segment
// est l'UID ("https://ecotrack.app/c/CNT-00012").
function parseUidFromQr(decoded) {
  if (typeof decoded !== 'string') return null;
  const trimmed = decoded.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    const segments = url.pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    if (last && UID_REGEX.test(last)) return last.toUpperCase();
  } catch {
    // Non-URL : on retombe sur la validation brute ci-dessous.
  }
  if (UID_REGEX.test(trimmed)) return trimmed.toUpperCase();
  return null;
}

// Init paresseuse via useState callback pour éviter un setState synchrone
// dans un useEffect (règle React 19 set-state-in-effect).
function detectMode() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'manual';
  const hasGetUserMedia = !!navigator.mediaDevices?.getUserMedia;
  if (!hasGetUserMedia) return 'manual';
  const hasDetector = 'BarcodeDetector' in window;
  return hasDetector ? 'native' : 'js';
}

export default function CitoyenScanner() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const detectorRef = useRef(null);
  // Une fois redirigé, l'effet peut encore tourner une frame de plus avant
  // d'être démonté — ce flag évite un double navigate.
  const navigatedRef = useRef(false);

  const [mode, setMode] = useState(detectMode);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [manualUid, setManualUid] = useState('');
  const [manualError, setManualError] = useState('');

  // Mode 'native' uniquement — le mode 'js' utilise <QRScanner />.
  useEffect(() => {
    if (mode !== 'native') return undefined;
    let cancelled = false;

    const cleanup = () => {
      cancelled = true;
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => {
          try { t.stop(); } catch { /* noop */ }
        });
        streamRef.current = null;
      }
    };

    const start = async () => {
      try {
        const Detector = window.BarcodeDetector;
        let formats = ['qr_code'];
        try {
          const supported = await Detector.getSupportedFormats?.();
          if (Array.isArray(supported) && supported.length > 0) {
            formats = supported.includes('qr_code') ? ['qr_code'] : supported;
          }
        } catch {
          // fallback formats déjà défini
        }
        detectorRef.current = new Detector({ formats });

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        if (!cancelled) setCameraReady(true);

        const tick = async () => {
          if (cancelled || navigatedRef.current) return;
          if (!detectorRef.current || !videoRef.current || videoRef.current.readyState < 2) {
            rafRef.current = requestAnimationFrame(tick);
            return;
          }
          try {
            const codes = await detectorRef.current.detect(videoRef.current);
            for (const code of codes) {
              const uid = parseUidFromQr(code.rawValue || code.value);
              if (uid) {
                navigatedRef.current = true;
                cleanup();
                navigate('/citoyen/signaler', { state: { conteneurUid: uid } });
                return;
              }
            }
          } catch {
            // decode transient errors → continue
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch (e) {
        if (!cancelled) {
          setCameraError(messageForCameraError(e));
          setMode('manual');
        }
      }
    };

    start();
    return cleanup;
  }, [mode, navigate]);

  // Callbacks utilisés par <QRScanner /> (mode 'js' / html5-qrcode).
  const handleJsScan = (decoded) => {
    if (navigatedRef.current) return;
    const uid = parseUidFromQr(decoded);
    if (uid) {
      navigatedRef.current = true;
      navigate('/citoyen/signaler', { state: { conteneurUid: uid } });
    }
  };
  const handleJsError = (err) => {
    setCameraError(messageForCameraError(err));
    setMode('manual');
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    setManualError('');
    const uid = normalizeText(manualUid, { maxLength: 64 }).toUpperCase();
    if (!uid) {
      setManualError("Veuillez saisir un identifiant");
      return;
    }
    if (!UID_REGEX.test(uid)) {
      setManualError("Identifiant invalide (ex : CNT-00012)");
      return;
    }
    navigate('/citoyen/signaler', { state: { conteneurUid: uid } });
  };

  return (
    <div className="citoyen-scanner-page">
      <MobileScreenHeader title="Scanner QR Code" backTo="/citoyen/signaler" />

      <div className="scanner-body">
        {mode === 'native' && !cameraError && (
          <div className="scanner-camera-wrapper">
            <video
              ref={videoRef}
              className="scanner-video"
              playsInline
              muted
              autoPlay
              aria-label="Aperçu caméra pour scanner un QR code"
            />
            <div className="scanner-viewfinder" aria-hidden="true">
              <span className="vf-corner vf-tl" />
              <span className="vf-corner vf-tr" />
              <span className="vf-corner vf-bl" />
              <span className="vf-corner vf-br" />
            </div>
            <p className="scanner-hint">
              {cameraReady
                ? "Pointez la caméra vers le QR code du conteneur"
                : "Activation de la caméra…"}
            </p>
          </div>
        )}

        {mode === 'js' && (
          // Décodeur JavaScript (html5-qrcode) — utilisé sur les navigateurs
          // qui n'exposent pas BarcodeDetector (Chrome/Edge/Firefox desktop,
          // Firefox Android, vieux iOS). Le composant gère lui-même la
          // caméra et déclenche onScan à chaque QR détecté.
          <div className="scanner-camera-wrapper">
            <QRScanner onScan={handleJsScan} onError={handleJsError} />
            <p className="scanner-hint">
              Pointez la caméra vers le QR code du conteneur
            </p>
          </div>
        )}

        {mode === 'manual' && (
          <div className="scanner-fallback">
            <i className="fas fa-info-circle" />
            <div>
              <strong>Scan automatique indisponible</strong>
              <p>{cameraError || "Votre navigateur ne supporte pas le scan automatique."}</p>
            </div>
          </div>
        )}

        <div className="scanner-manual">
          <h4>Saisie manuelle de l'identifiant</h4>
          <p className="scanner-manual-hint">
            L'identifiant se trouve sur l'autocollant du conteneur (ex. CNT-00012).
          </p>
          <form onSubmit={handleManualSubmit}>
            <input
              type="text"
              className="scanner-manual-input"
              placeholder="CNT-00012"
              value={manualUid}
              onChange={(e) => { setManualUid(e.target.value); setManualError(''); }}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              maxLength={64}
            />
            <button type="submit" className="scanner-manual-btn">
              <i className="fas fa-arrow-right" /> Valider
            </button>
          </form>
          {manualError && (
            <div className="scanner-manual-error" role="alert">
              <i className="fas fa-exclamation-circle" /> {manualError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Traduit une erreur getUserMedia / html5-qrcode en message utilisateur clair.
function messageForCameraError(err) {
  const name = err?.name || '';
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return "Permission caméra refusée. Saisissez l'identifiant manuellement ci-dessous.";
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return "Aucune caméra disponible. Saisissez l'identifiant manuellement ci-dessous.";
  }
  return "La caméra n'est pas disponible. Saisissez l'identifiant manuellement ci-dessous.";
}
