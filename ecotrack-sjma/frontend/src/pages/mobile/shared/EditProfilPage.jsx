import { useState, useEffect } from 'react';
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
  const [form, setForm] = useState({ prenom: '', nom: '', email: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/users/profile');
        const data = res.data?.data || res.data;
        setForm({ prenom: data.prenom || '', nom: data.nom || '', email: data.email || '' });
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

  return (
    <MobileLayout title="Modifier le profil" showBack>
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
