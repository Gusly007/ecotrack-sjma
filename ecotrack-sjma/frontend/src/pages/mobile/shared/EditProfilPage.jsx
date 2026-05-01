import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import MobileLayout from '../../../components/mobile/MobileLayout';
import { useAlert } from '../../../hooks';
import api from '../../../services/api';
import './EditProfilPage.css';

export default function EditProfilPage({ basePath = '/agent' }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useAlert();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({ prenom: '', nom: '', email: '' });
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/users/profile');
        const data = res.data?.data || res.data;
        setForm({ prenom: data.prenom || '', nom: data.nom || '', email: data.email || '' });
        setAvatarUrl(data.avatar_thumbnail || data.avatar_url || null);
      } catch {
        if (user) {
          setForm({ prenom: user.prenom || '', nom: user.nom || '', email: user.email || '' });
        }
      }
    };
    fetchProfile();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/users/profile', { prenom: form.prenom, email: form.email });
      showSuccess('Profil mis a jour');
      navigate(`${basePath}/profil`);
    } catch (err) {
      showError(err.response?.data?.message || 'Erreur lors de la mise a jour');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showError('Image trop volumineuse (max 5 Mo)');
      return;
    }
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/users/avatar/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newUrl = res.data?.data?.avatar_thumbnail || res.data?.data?.avatar_url;
      setAvatarUrl(newUrl ? `${newUrl}?t=${Date.now()}` : null);
      showSuccess('Avatar mis a jour');
    } catch (err) {
      showError(err.response?.data?.message || "Echec de l'upload");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <MobileLayout title="Modifier le profil" showBack>
      <div className="avatar-edit-section">
        <div className="avatar-preview" onClick={() => fileInputRef.current?.click()}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" />
          ) : (
            <i className="fas fa-user-circle"></i>
          )}
          <div className="avatar-overlay">
            {uploadingAvatar
              ? <i className="fas fa-spinner fa-spin"></i>
              : <i className="fas fa-camera"></i>}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={handleAvatarChange}
        />
        <p className="avatar-hint">Touchez pour changer la photo</p>
      </div>

      <form className="edit-profil-form" onSubmit={handleSubmit}>
        <div className="form-group-mobile">
          <label>Prenom</label>
          <input
            type="text"
            value={form.prenom}
            onChange={(e) => setForm({ ...form, prenom: e.target.value })}
            className="form-input-mobile"
          />
        </div>
        <div className="form-group-mobile">
          <label>Nom</label>
          <input
            type="text"
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            className="form-input-mobile"
            disabled
          />
        </div>
        <div className="form-group-mobile">
          <label>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="form-input-mobile"
          />
        </div>
        <button type="submit" className="btn-primary-mobile" disabled={loading}>
          {loading ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-save"></i> Enregistrer</>}
        </button>
      </form>
    </MobileLayout>
  );
}
