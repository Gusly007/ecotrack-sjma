import { useState, useEffect } from 'react';
import { Modal, FormGroup, Select, DetailView } from '../../common';
import { signalementService } from '../../../services/signalementService';

export default function SignalementDetailModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  signalement,
  role,
  canUpdate
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statut, setStatut] = useState('');

  useEffect(() => {
    if (signalement) {
      setStatut(signalement.statut || '');
    }
  }, [signalement]);

  const getUrgenceClass = (urgence) => {
    switch (urgence?.toUpperCase()) {
      case 'HAUTE': return 'urgence-haute';
      case 'MOYENNE': return 'urgence-moyenne';
      case 'BASSE': return 'urgence-basse';
      default: return '';
    }
  };

  const getUrgenceLabel = (urgence) => {
    switch (urgence?.toUpperCase()) {
      case 'HAUTE': return 'Haute';
      case 'MOYENNE': return 'Moyenne';
      case 'BASSE': return 'Basse';
      default: return urgence || '-';
    }
  };

  const getStatutClass = (s) => {
    switch (s?.toUpperCase()) {
      case 'NOUVEAU': return 'statut-nouveau';
      case 'EN_COURS': return 'statut-cours';
      case 'RESOLU': return 'statut-resolu';
      case 'REJETE': return 'statut-rejete';
      default: return '';
    }
  };

  const getStatutLabel = (s) => {
    switch (s?.toUpperCase()) {
      case 'NOUVEAU': return 'Nouveau';
      case 'EN_COURS': return 'En cours';
      case 'RESOLU': return 'Résolu';
      case 'REJETE': return 'Rejeté';
      default: return s || '-';
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleUpdateStatut = async () => {
    if (!statut || statut === signalement.statut) {
      onClose();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const id = signalement.id_signalement || signalement.id;
      await signalementService.updateStatus(id, statut);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  if (!signalement) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Détails du signalement"
      headerIcon="fa-flag"
      headerColor="#2196F3"
      size="lg"
    >
      <div className="signalement-detail">
        {error && (
          <div className="form-error" style={{ color: '#f44336', marginBottom: '16px', padding: '8px', background: '#ffebee', borderRadius: '4px' }}>
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        <DetailView items={[
          { label: 'ID', value: <code style={{ fontFamily: 'monospace' }}>{signalement.id_signalement || signalement.id}</code> },
          { label: 'Type', value: signalement.type_nom || signalement.type_signalement || signalement.type || '-' },
          { 
            label: 'Urgence', 
            value: (
              <span className={`urgence-badge ${getUrgenceClass(signalement.urgence)}`}>
                {getUrgenceLabel(signalement.urgence)}
              </span>
            )
          },
          { 
            label: 'Statut', 
            value: (
              <span className={`statut-badge ${getStatutClass(signalement.statut)}`}>
                <span className={`statut-dot ${getStatutClass(signalement.statut)}`}></span>
                {getStatutLabel(signalement.statut)}
              </span>
            )
          },
          { label: 'Conteneur', value: signalement.uid_conteneur || signalement.conteneur_uid || '-' },
          { label: 'Zone', value: signalement.zone_nom || signalement.zone || '-' },
          { label: 'Adresse', value: signalement.adresse || signalement.conteneur_adresse || '-' },
          { 
            label: 'Date de création', 
            value: formatDate(signalement.date_creation || signalement.date_signalement) 
          },
          { 
            label: 'Signalé par', 
            value: signalement.utilisateur || signalement.citoyen_nom || signalement.nom_citoyen || '-' 
          },
          { label: 'Description', value: signalement.description || '-' }
        ]} />

        {canUpdate && (
          <div className="statut-update-section" style={{ marginTop: '20px', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
            <FormGroup label="Mettre à jour le statut">
              <Select 
                value={statut}
                onChange={setStatut}
                options={[
                  { value: 'NOUVEAU', label: 'Nouveau' },
                  { value: 'EN_COURS', label: 'En cours' },
                  { value: 'RESOLU', label: 'Résolu' },
                  { value: 'REJETE', label: 'Rejeté' }
                ]}
              />
            </FormGroup>
            <div className="modal-actions">
              <button 
                className="btn-primary" 
                onClick={handleUpdateStatut}
                disabled={loading || statut === signalement.statut}
              >
                {loading ? (
                  <><i className="fas fa-spinner fa-spin"></i> Mise à jour...</>
                ) : (
                  <><i className="fas fa-save"></i> Enregistrer</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
