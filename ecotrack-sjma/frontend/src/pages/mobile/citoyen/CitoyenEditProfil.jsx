import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCitoyenAuth as useAuth } from './auth/CitoyenAuthContext';
import MobileScreenHeader from '../../../components/mobile/MobileScreenHeader';
import AvatarCropModal from '../../../components/mobile/citoyen/AvatarCropModal';
import { citoyenService } from '../../../services/citoyenService';
import { buildAvatarUrl } from '../../../utils/avatar';
import { isValidEmail, normalizeText, safeErrorMessage } from '../../../utils/security';
import './CitoyenEditProfil.css';

function PasswordField({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="edit-form-group">
      <label>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          className="edit-input"
          type={show ? 'text' : 'password'}
          placeholder={placeholder || '••••••••'}
          value={value}
          onChange={onChange}
          style={{ paddingRight: 42 }}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', color: '#888', cursor: 'pointer',
            fontSize: '0.95rem', padding: 6,
          }}
        >
          <i className={`fas ${show ? 'fa-eye-slash' : 'fa-eye'}`}></i>
        </button>
      </div>
    </div>
  );
}

// Non-bloquant : un échec n'empêche pas l'enregistrement du profil.
const safeRefreshUser = async (refreshUser) => {
  try {
    await refreshUser();
  } catch {
    // Ignoré — le profil sera resynchronisé au prochain login.
  }
};

export default function CitoyenEditProfil() {
  const navigate = useNavigate();
  const { user, refreshUser, avatarVersion, bumpAvatarVersion } = useAuth();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    prenom: user?.prenom || '',
    nom: user?.nom || '',
    email: user?.email || '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [avatarPath, setAvatarPath] = useState(user?.avatar_thumbnail || user?.avatar_url || null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  // Cache-bust pour forcer le rechargement de l'image après upload.
  const [avatarBust, setAvatarBust] = useState(0);
  // Repli sur le glyphe utilisateur si l'image échoue à charger.
  const [avatarBroken, setAvatarBroken] = useState(false);
  // Data URL en cours de cadrage. Non-null = modale AvatarCropModal ouverte.
  const [cropImageSrc, setCropImageSrc] = useState(null);

  // Pré-remplit les champs absents du payload de login (notamment `nom`).
  useEffect(() => {
    let alive = true;
    citoyenService.getProfileWithStats()
      .then(p => {
        if (!alive || !p) return;
        setForm(f => ({
          ...f,
          prenom: f.prenom || p.prenom || '',
          nom: f.nom || p.nom || '',
          email: f.email || p.email || '',
        }));
        if (p.avatar_thumbnail || p.avatar_url) {
          setAvatarPath(p.avatar_thumbnail || p.avatar_url);
        }
      })
      .catch(() => {
        // Échec non bloquant : les valeurs initiales du contexte suffisent.
      });
    return () => { alive = false; };
  }, []);

  const handlePickPhoto = () => {
    setUploadError('');
    fileInputRef.current?.click();
  };

  // Validation côté client puis ouverture de la modale de cadrage.
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    // Reset de l'input pour que re-sélectionner le même fichier déclenche onChange.
    if (e.target) e.target.value = '';
    if (!file) return;
    if (!/^image\/(jpe?g|png|webp)$/i.test(file.type)) {
      setUploadError('Format accepté : JPG, PNG ou WebP');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image trop volumineuse (max 5 Mo)');
      return;
    }
    setUploadError('');
    const reader = new FileReader();
    reader.onload = () => setCropImageSrc(reader.result);
    reader.onerror = () => setUploadError('Impossible de lire l\'image');
    reader.readAsDataURL(file);
  };

  // Upload du File JPEG cadré. Sharp redimensionne côté backend (1000/200/64).
  const handleCropConfirm = async (croppedFile) => {
    setCropImageSrc(null);
    setUploading(true);
    setUploadError('');
    try {
      const res = await citoyenService.uploadAvatar(croppedFile);
      const newPath = res?.avatar_thumbnail || res?.avatar_url || null;
      if (newPath) {
        setAvatarPath(newPath);
        setAvatarBust(Date.now());
        setAvatarBroken(false);
      }
      // Bump le cache-bust global → Home + Profil refetchent l'image en
      // bypassant le cache HTTP du navigateur immédiatement (sans attendre
      // que refreshUser termine).
      bumpAvatarVersion();
      // Sync AuthContext pour que le header profil / accueil voient l'avatar.
      await safeRefreshUser(refreshUser);
    } catch (err) {
      setUploadError(safeErrorMessage(err, "Échec de l'upload"));
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    setUploadError('');
    setUploading(true);
    try {
      await citoyenService.deleteAvatar();
      setAvatarPath(null);
      setAvatarBust(Date.now());
      bumpAvatarVersion();
      await safeRefreshUser(refreshUser);
    } catch (err) {
      setUploadError(safeErrorMessage(err, 'Échec de la suppression'));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSaved(false);

    try {
      // Limites alignées sur le backend : prenom/nom 80, email 254.
      const cleanPrenom = normalizeText(form.prenom, { maxLength: 80 });
      const cleanNom = normalizeText(form.nom, { maxLength: 80 });
      const cleanEmail = normalizeText(form.email, { maxLength: 254 });

      if (cleanEmail && !isValidEmail(cleanEmail)) {
        throw new Error("Adresse email invalide");
      }

      // Update partiel : on n'envoie que les champs modifiés.
      const profileData = {};
      if (cleanPrenom && cleanPrenom !== user?.prenom) profileData.prenom = cleanPrenom;
      if (cleanNom && cleanNom !== user?.nom) profileData.nom = cleanNom;
      if (cleanEmail && cleanEmail !== user?.email) profileData.email = cleanEmail;

      const didTouchProfile = Object.keys(profileData).length > 0;
      if (didTouchProfile) {
        await citoyenService.updateProfile(profileData);
      }

      // Change le mot de passe si demandé.
      if (form.newPassword) {
        if (form.newPassword !== form.confirmPassword) {
          throw new Error('Les mots de passe ne correspondent pas');
        }
        if (!form.oldPassword) {
          throw new Error('Mot de passe actuel requis');
        }
        if (form.newPassword.length < 6) {
          throw new Error('Nouveau mot de passe trop court (min 6 caractères)');
        }
        await citoyenService.changePassword({
          oldPassword: form.oldPassword,
          newPassword: form.newPassword,
        });
      }

      if (didTouchProfile) {
        await safeRefreshUser(refreshUser);
      }

      setSaved(true);
      setForm(f => ({ ...f, oldPassword: '', newPassword: '', confirmPassword: '' }));

      // Laisse 1.2s au bandeau succès avant de naviguer.
      setTimeout(() => {
        setSaved(false);
        navigate('/citoyen/profil');
      }, 1200);
    } catch (err) {
      setError(safeErrorMessage(err, "Erreur lors de l'enregistrement"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-profil-page">
      <MobileScreenHeader title="Modifier mon profil" backTo="/citoyen/profil" />

      {cropImageSrc && (
        <AvatarCropModal
          imageSrc={cropImageSrc}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropImageSrc(null)}
        />
      )}
      <div className="edit-profil-body">
        <div className="edit-avatar-section">
          <div
            className="edit-avatar"
            style={avatarPath && !avatarBroken ? { background: '#e8f5e9', overflow: 'hidden' } : undefined}
          >
            {avatarPath && !avatarBroken ? (
              <img
                src={buildAvatarUrl(avatarPath, { bust: avatarBust || avatarVersion })}
                alt="Avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={() => setAvatarBroken(true)}
              />
            ) : (
              <i className="fas fa-user"></i>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoChange}
            style={{ display: 'none' }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="change-photo-btn"
              onClick={handlePickPhoto}
              disabled={uploading}
            >
              <i className={`fas ${uploading ? 'fa-spinner fa-spin' : 'fa-camera'}`}></i>
              {uploading ? ' Envoi…' : ' Changer la photo'}
            </button>
            {avatarPath && !uploading && (
              <button
                type="button"
                className="change-photo-btn"
                onClick={handleRemovePhoto}
                style={{ background: '#ffebee', color: '#c62828' }}
              >
                <i className="fas fa-trash"></i> Retirer
              </button>
            )}
          </div>
          {uploadError && (
            <div style={{ color: '#c62828', fontSize: '0.8rem', marginTop: 4 }}>
              <i className="fas fa-exclamation-circle" /> {uploadError}
            </div>
          )}
        </div>

        <form onSubmit={handleSave} className="edit-profil-form">
          <div className="edit-section-title">Informations personnelles</div>
          <div className="edit-form-group">
            <label>Prénom</label>
            <input className="edit-input" value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} />
          </div>
          <div className="edit-form-group">
            <label>Nom</label>
            <input className="edit-input" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
          </div>
          <div className="edit-form-group">
            <label>Email</label>
            <input className="edit-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>

          <div className="edit-section-title" style={{ marginTop: 8 }}>Changer le mot de passe</div>
          <PasswordField
            label="Mot de passe actuel"
            value={form.oldPassword}
            onChange={e => setForm({ ...form, oldPassword: e.target.value })}
          />
          <PasswordField
            label="Nouveau mot de passe"
            value={form.newPassword}
            onChange={e => setForm({ ...form, newPassword: e.target.value })}
          />
          <PasswordField
            label="Confirmer le mot de passe"
            value={form.confirmPassword}
            onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
          />

          {error && <div style={{ color: '#f44336', fontSize: '0.85rem', marginBottom: 12 }}>{error}</div>}
          {saved && <div className="edit-success-banner"><i className="fas fa-check-circle"></i> Profil mis à jour !</div>}

          <button type="submit" className="edit-save-btn" disabled={loading}>
            {loading ? <span className="spinner"></span> : 'Enregistrer les modifications'}
          </button>
        </form>
      </div>
    </div>
  );
}
