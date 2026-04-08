import { useState, useEffect } from 'react';
import { Modal, FormGroup, FormRow, Input, Select } from '../../common';
import { zoneService } from '../../../services/zoneService';
import { containerService } from '../../../services/containerService';

export default function ConteneurEditModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  conteneur,
  types = []
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [zones, setZones] = useState([]);
  const [loadingZones, setLoadingZones] = useState(true);

  const [formData, setFormData] = useState({
    id_type: '',
    capacite_l: '',
    id_zone: '',
    statut: 'ACTIF'
  });

  useEffect(() => {
    if (isOpen && conteneur) {
      loadZones();
      setFormData({
        id_type: conteneur.id_type?.toString() || '',
        capacite_l: conteneur.capacite_l?.toString() || '',
        id_zone: conteneur.id_zone?.toString() || '',
        statut: conteneur.statut || 'ACTIF'
      });
      setError('');
    }
  }, [isOpen, conteneur]);

  const loadZones = async () => {
    try {
      setLoadingZones(true);
      const response = await zoneService.getAll(1, 100);
      let data = [];
      if (response.data) {
        data = response.data.data || response.data || [];
      } else if (Array.isArray(response)) {
        data = response;
      }
      setZones(data);
    } catch (err) {
      console.error('Erreur chargement zones:', err);
    } finally {
      setLoadingZones(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.id_type || !formData.capacite_l || !formData.id_zone) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const id = conteneur.id_conteneur || conteneur.id;
      
      // Only update fields that have changed values
      const data = {};
      
      if (formData.id_type && formData.id_type !== (conteneur.id_type?.toString() || conteneur.id_type)) {
        data.id_type = parseInt(formData.id_type);
      }
      if (formData.capacite_l && formData.capacite_l !== (conteneur.capacite_l?.toString() || conteneur.capacite_l)) {
        data.capacite_l = parseInt(formData.capacite_l);
      }
      if (formData.id_zone && formData.id_zone !== (conteneur.id_zone?.toString() || conteneur.id_zone)) {
        data.id_zone = parseInt(formData.id_zone);
      }
      
      // Update general data if there are changes
      if (Object.keys(data).length > 0) {
        await containerService.update(id, data);
      }
      
      // Update status using dedicated method
      if (formData.statut && formData.statut !== conteneur.statut) {
        await containerService.updateStatus(id, formData.statut);
      }
      
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const capacities = [
    { value: '240', label: '240L' },
    { value: '360', label: '360L' },
    { value: '500', label: '500L' },
    { value: '660', label: '660L' },
    { value: '770', label: '770L' },
    { value: '1100', label: '1100L' },
    { value: '1200', label: '1200L' }
  ];

  const statuts = [
    { value: 'ACTIF', label: 'Actif' },
    { value: 'EN_MAINTENANCE', label: 'Maintenance' },
    { value: 'INACTIF', label: 'Hors service' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Modifier le conteneur"
      headerIcon="fa-edit"
      headerColor="#FF9800"
      size="md"
    >
      <div className="conteneur-form">
        {error && (
          <div className="form-error" style={{ color: '#f44336', marginBottom: '16px', padding: '8px', background: '#ffebee', borderRadius: '4px' }}>
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
          <span style={{ fontSize: '0.8rem', color: '#666' }}>UID:</span>
          <span style={{ fontWeight: '600', marginLeft: '8px' }}>{conteneur?.uid || conteneur?.id}</span>
        </div>

        <FormGroup label="Type de déchet" required>
          <Select 
            value={formData.id_type}
            onChange={(v) => setFormData({ ...formData, id_type: v })}
            options={types.map(t => ({ 
              value: t.id_type?.toString() || t.id?.toString(), 
              label: t.nom || t 
            }))}
          />
        </FormGroup>

        <FormRow>
          <FormGroup label="Capacité" required>
            <Select 
              value={formData.capacite_l}
              onChange={(v) => setFormData({ ...formData, capacite_l: v })}
              options={capacities}
            />
          </FormGroup>
          <FormGroup label="Statut" required>
            <Select 
              value={formData.statut}
              onChange={(v) => setFormData({ ...formData, statut: v })}
              options={statuts}
            />
          </FormGroup>
        </FormRow>

        <FormGroup label="Zone" required>
          {loadingZones ? (
            <p style={{ color: '#666', fontSize: '0.85rem' }}>
              <i className="fas fa-spinner fa-spin"></i> Chargement...
            </p>
          ) : (
            <Select 
              value={formData.id_zone}
              onChange={(v) => setFormData({ ...formData, id_zone: v })}
              options={zones.map(z => ({ 
                value: z.id_zone?.toString() || z.id?.toString(), 
                label: z.nom 
              }))}
            />
          )}
        </FormGroup>

        <div className="modal-actions">
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <><i className="fas fa-spinner fa-spin"></i> Enregistrement...</>
            ) : (
              <><i className="fas fa-save"></i> Enregistrer</>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
