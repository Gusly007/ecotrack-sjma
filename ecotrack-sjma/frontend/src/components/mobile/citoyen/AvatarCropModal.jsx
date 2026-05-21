import { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import './AvatarCropModal.css';

// Modale de cadrage d'avatar (crop circulaire + zoom) avant upload.
// Props :
//   imageSrc  (string)  data URL source
//   onConfirm (File)    appelé avec le File JPEG cadré
//   onCancel  ()        appelé sur annulation

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Extrait la région cadrée et renvoie un File JPEG. croppedAreaPixels
// vient de react-easy-crop (coordonnées en pixels source).
async function cropToFile(imageSrc, croppedAreaPixels, fileName = 'avatar.jpg') {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  // 1000px max — Sharp côté backend redimensionne à 1000×1000 ; au-delà
  // c'est de la bande passante perdue.
  const outSize = Math.min(1000, Math.round(croppedAreaPixels.width));
  canvas.width = outSize;
  canvas.height = outSize;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    outSize,
    outSize
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Canvas toBlob a renvoyé null'));
        resolve(new File([blob], fileName, { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.9
    );
  });
}

export default function AvatarCropModal({ imageSrc, onConfirm, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const onCropComplete = useCallback((_area, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setBusy(true);
    setError('');
    try {
      const file = await cropToFile(imageSrc, croppedAreaPixels);
      onConfirm(file);
    } catch (e) {
      console.error('Crop failed:', e);
      setError(e?.message || 'Échec du cadrage');
      setBusy(false);
    }
  };

  return (
    <div className="avatar-crop-overlay" role="dialog" aria-modal="true" aria-label="Cadrer la photo de profil">
      <div className="avatar-crop-modal">
        <div className="avatar-crop-header">
          <span><i className="fas fa-crop-simple" /> Cadrer la photo</span>
          <button
            type="button"
            className="avatar-crop-close"
            onClick={onCancel}
            disabled={busy}
            aria-label="Annuler"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="avatar-crop-stage">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            minZoom={1}
            maxZoom={3}
            zoomSpeed={0.4}
            restrictPosition={true}
          />
        </div>

        <div className="avatar-crop-zoom-row">
          <i className="fas fa-magnifying-glass-minus" aria-hidden="true" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            aria-label="Zoom"
            disabled={busy}
          />
          <i className="fas fa-magnifying-glass-plus" aria-hidden="true" />
        </div>

        <p className="avatar-crop-hint">
          Faites glisser pour repositionner, utilisez la barre pour zoomer.
        </p>

        {error && (
          <div className="avatar-crop-error">
            <i className="fas fa-exclamation-circle" /> {error}
          </div>
        )}

        <div className="avatar-crop-actions">
          <button
            type="button"
            className="avatar-crop-btn avatar-crop-btn-secondary"
            onClick={onCancel}
            disabled={busy}
          >
            Annuler
          </button>
          <button
            type="button"
            className="avatar-crop-btn avatar-crop-btn-primary"
            onClick={handleConfirm}
            disabled={busy || !croppedAreaPixels}
          >
            {busy ? (
              <><i className="fas fa-spinner fa-spin" /> Préparation…</>
            ) : (
              <><i className="fas fa-check" /> Utiliser cette photo</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
