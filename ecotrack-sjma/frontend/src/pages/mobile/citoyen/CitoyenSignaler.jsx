import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MobileScreenHeader from '../../../components/mobile/MobileScreenHeader';
import { citoyenService } from '../../../services/citoyenService';
import { normalizeText, safeErrorMessage } from '../../../utils/security';
import './CitoyenSignaler.css';

// Icônes par code de type backend
const TYPE_ICONS = {
  CONTENEUR_PLEIN: 'fa-fill-drip',
  CONTENEUR_ENDOMMAGE: 'fa-screwdriver-wrench',
  DEPOT_SAUVAGE: 'fa-trash',
  MAUVAISE_ODEUR: 'fa-wind',
  CONTENEUR_INACCESSIBLE: 'fa-ban',
  CONTENEUR_SALE: 'fa-broom',
  CAPTEUR_DEFAILLANT: 'fa-microchip',
};

// Libellés courts affichés dans la grille de types
const TYPE_LABELS = {
  CONTENEUR_PLEIN: 'Débordement',
  CONTENEUR_ENDOMMAGE: 'Dégradation',
  DEPOT_SAUVAGE: 'Dépôt sauvage',
  MAUVAISE_ODEUR: 'Mauvaise odeur',
  CONTENEUR_INACCESSIBLE: 'Inaccessible',
  CONTENEUR_SALE: 'Conteneur sale',
  CAPTEUR_DEFAILLANT: 'Capteur défaillant',
};

// Map conteneur.id_type → libellé d'affichage
const CONTAINER_TYPE_LABEL = {
  1: 'Ordures ménagères',
  2: 'Recyclage',
  3: 'Verre',
  4: 'Compost',
};

const URGENCES = [
  { key: 'Basse',   color: '#4CAF50', bg: '#e8f5e9' },
  { key: 'Moyenne', color: '#FF9800', bg: '#fff3e0' },
  { key: 'Haute',   color: '#f44336', bg: '#ffebee' },
];

export default function CitoyenSignaler() {
  const navigate = useNavigate();
  const { state } = useLocation();

  // Sélection du conteneur
  const [conteneurUid, setConteneurUid] = useState(state?.conteneurUid || '');
  const [idConteneur, setIdConteneur] = useState(state?.id_conteneur || null);
  const [conteneurInfo, setConteneurInfo] = useState(
    state?.id_conteneur || state?.conteneurUid
      ? { uid: state.conteneurUid, typeLabel: state?.type || null, zone: state?.zone || null }
      : null
  );

  // Champs du formulaire
  const [types, setTypes] = useState([]);
  const [idType, setIdType] = useState(null);
  const [urgence, setUrgence] = useState('Moyenne');
  const [description, setDescription] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState(null);

  // État UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Charge les types de signalement une fois.
  useEffect(() => {
    citoyenService.getSignalementTypes()
      .then(t => {
        const list = Array.isArray(t) ? t : (t?.data || []);
        setTypes(list);
      })
      .catch(() => { /* types restent vides, l'UI affiche un placeholder */ });
  }, []);

  // Lookup conteneur débouncé pour pré-remplir zone + type.
  useEffect(() => {
    if (!conteneurUid || idConteneur) return;
    const uid = conteneurUid.trim().toUpperCase();
    if (!uid) return;
    let alive = true;
    const t = setTimeout(async () => {
      try {
        const found = await citoyenService.getContainerByUid(uid);
        if (!alive || !found) return;
        setIdConteneur(found.id_conteneur);
        setConteneurInfo({
          uid: found.uid,
          typeLabel: CONTAINER_TYPE_LABEL[found.id_type] || 'Conteneur',
          zone: found.id_zone ? `Zone ${found.id_zone}` : null,
        });
      } catch {
        // UID inconnu — on affiche quand même ce que le citoyen a tapé.
        if (!alive) return;
        setConteneurInfo({ uid, typeLabel: null, zone: null });
      }
    }, 400);
    return () => { alive = false; clearTimeout(t); };
  }, [conteneurUid, idConteneur]);

  const canSubmit = useMemo(() => {
    return (conteneurUid.trim().length > 0 || idConteneur) && idType != null && !loading;
  }, [conteneurUid, idConteneur, idType, loading]);

  // Redimensionne à 800px max + JPEG 75% → data URL ~50-150 ko stocké dans
  // signalement.url_photo (TEXT).
  const handlePhoto = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/^image\//.test(f.type)) {
      setError('Format non supporté (JPG, PNG, WebP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX_EDGE = 800;
        let { width, height } = img;
        if (width > MAX_EDGE || height > MAX_EDGE) {
          const ratio = Math.min(MAX_EDGE / width, MAX_EDGE / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.75);
        setPhotoDataUrl(compressed);
      };
      img.onerror = () => setError('Image illisible');
      img.src = reader.result;
    };
    reader.onerror = () => setError('Lecture du fichier échouée');
    reader.readAsDataURL(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      const selectedType = types.find(t => t.id_type === idType);
      const typeLabel = selectedType?.libelle || 'Problème';
      const urgenceUpper = String(urgence || '').toUpperCase();
      const cleanDescription = normalizeText(description, { maxLength: 500 });
      const cleanUid = normalizeText(conteneurUid, { maxLength: 64 });
      const payload = {
        description: cleanDescription || `Signalement citoyen — ${typeLabel.replace(/_/g, ' ').toLowerCase()} (${urgence})`,
        id_type: idType,
        urgence: urgenceUpper,
      };
      if (photoDataUrl) payload.url_photo = photoDataUrl;
      if (idConteneur) payload.id_conteneur = idConteneur;
      else payload.conteneur_uid = cleanUid;

      const res = await citoyenService.createSignalement(payload);
      const id = res?.id_signalement || res?.data?.id_signalement;
      // typeCode + urgence passés au success screen pour l'impact ADEME.
      navigate('/citoyen/signaler/success', {
        state: {
          id,
          payload,
          typeCode: selectedType?.libelle || null,
          urgence: urgenceUpper,
        },
      });
    } catch (err) {
      setError(safeErrorMessage(err, 'Erreur lors de la création du signalement'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="citoyen-signaler">
      <MobileScreenHeader title="Nouveau Signalement" backTo="/citoyen" />

      <form className="signaler-body" onSubmit={handleSubmit}>
        {/* ---------- Identifier le conteneur ---------- */}
        <div className="sig-section">
          <label className="sig-section-label">Identifier le conteneur</label>
          <div className="sig-action-row">
            <button
              type="button"
              className="sig-action-card"
              onClick={() => navigate('/citoyen/scanner')}
            >
              <i className="fas fa-qrcode"></i>
              <span>Scanner QR Code</span>
            </button>
            <button type="button" className="sig-action-card" onClick={() => navigate('/citoyen/carte')}>
              <i className="fas fa-map-marker-alt"></i>
              <span>Choisir sur la carte</span>
            </button>
          </div>

          <input
            type="text"
            className="sig-input sig-uid-input"
            placeholder="Ou saisir l'identifiant (ex: CNT-00012)"
            value={conteneurUid}
            onChange={e => { setConteneurUid(e.target.value); setIdConteneur(null); setConteneurInfo(null); }}
            maxLength={64}
          />

          {conteneurInfo && (
            <div className="sig-container-card">
              <i className="fas fa-check-circle"></i>
              <div>
                <strong>{conteneurInfo.uid}</strong>
                <span>
                  {[conteneurInfo.zone, conteneurInfo.typeLabel].filter(Boolean).join(' — ') || 'Conteneur sélectionné'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ---------- Type de problème ---------- */}
        <div className="sig-section">
          <label className="sig-section-label">Type de problème</label>
          <div className="sig-type-grid">
            {types.length === 0 && <p className="sig-placeholder">Chargement des types…</p>}
            {types.map(t => (
              <button
                key={t.id_type}
                type="button"
                className={`sig-type-card ${idType === t.id_type ? 'active' : ''}`}
                onClick={() => setIdType(t.id_type)}
              >
                <i className={`fas ${TYPE_ICONS[t.libelle] || 'fa-exclamation-triangle'}`}></i>
                <span>{TYPE_LABELS[t.libelle] || t.libelle.replace(/_/g, ' ').toLowerCase()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ---------- Photo ---------- */}
        <div className="sig-section">
          <label className="sig-section-label">Photo (optionnel)</label>
          <label className="sig-photo-drop">
            {photoDataUrl ? (
              <img src={photoDataUrl} alt="aperçu" />
            ) : (
              <>
                <i className="fas fa-camera"></i>
                <span>Prendre une photo</span>
              </>
            )}
            <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} hidden />
          </label>
        </div>

        {/* ---------- Urgence ---------- */}
        <div className="sig-section">
          <label className="sig-section-label">Urgence</label>
          <div className="sig-urgence-row">
            {URGENCES.map(u => (
              <button
                key={u.key}
                type="button"
                className={`sig-urgence-pill ${urgence === u.key ? 'active' : ''}`}
                style={urgence === u.key ? { borderColor: u.color, background: u.bg, color: u.color } : null}
                onClick={() => setUrgence(u.key)}
              >
                {u.key}
              </button>
            ))}
          </div>
        </div>

        {/* ---------- Description ---------- */}
        <div className="sig-section">
          <label className="sig-section-label">Description</label>
          <textarea
            className="sig-textarea"
            rows={3}
            placeholder="Décrivez le problème…"
            value={description}
            onChange={e => setDescription(e.target.value)}
            maxLength={500}
          />
        </div>

        {error && <div className="sig-error"><i className="fas fa-exclamation-circle"></i> {error}</div>}

        {/* ---------- Submit ---------- */}
        <button type="submit" className="sig-submit-btn" disabled={!canSubmit}>
          {loading
            ? <><span className="spinner" /> Envoi…</>
            : <><i className="fas fa-paper-plane"></i> Envoyer le signalement (+10 pts)</>}
        </button>
      </form>
    </div>
  );
}
