import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormGroup, Select, Textarea, Alert, Modal, useAlert } from '../../../components/common';
import { signalementService } from '../../../services/signalementService';
import { userService } from '../../../services/userService';
import { useAuth } from '../../../context/AuthContext';
import './SignalementDetail.css';

const statutsList = [
  { value: 'NOUVEAU', label: 'Nouveau' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'RESOLU', label: 'Résolu' },
  { value: 'REJETE', label: 'Rejeté' }
];

const typesIntervention = [
  { value: 'COLLECTE_URGENTE', label: 'Collecte urgente' },
  { value: 'REPARATION', label: 'Réparation' },
  { value: 'NETTOYAGE', label: 'Nettoyage' },
  { value: 'REMPLACEMENT_CAPTEUR', label: 'Remplacement capteur' },
  { value: 'INSPECTION', label: 'Inspection' },
  { value: 'AUTRE', label: 'Autre' }
];

const priorites = [
  { value: 'BASSE', label: 'Basse' },
  { value: 'MOYENNE', label: 'Moyenne' },
  { value: 'HAUTE', label: 'Haute' },
  { value: 'CRITIQUE', label: 'Critique' }
];

export default function SignalementDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { alert, showSuccess, showError } = useAlert();
  
  const [signalement, setSignalement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  
  const [nouveauStatut, setNouveauStatut] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [historique, setHistorique] = useState([]);
  
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    type: '',
    typeCustom: '',
    date: '',
    priorite: 'MOYENNE',
    agent: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setHistorique([]);
    loadSignalement();
    loadAgents();
  }, [id]);

  const buildFallbackHistory = (data) => {
    const fallback = [
      {
        date: formatDate(data.date_creation),
        action: `Signalement créé par ${data.citoyen_nom || 'Citoyen'}`,
        type: 'creation'
      }
    ];

    if (data.date_resolution) {
      fallback.push({
        date: formatDate(data.date_resolution),
        action: 'Signalement résolu',
        type: 'resolution'
      });
    }

    return fallback;
  };

  const loadSignalement = async () => {
    try {
      setLoading(true);
      const response = await signalementService.getById(id);
      const data = response?.data || response;
      setSignalement(data);
      setNouveauStatut(data.statut || '');

      await loadHistory(data);
    } catch (err) {
      console.error('Erreur chargement:', err);
      showError('Erreur lors du chargement du signalement');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (fallbackSignalement = signalement) => {
    try {
      const historyResponse = await signalementService.getHistory(id);
      const historyData = historyResponse?.data || historyResponse || [];

      if (Array.isArray(historyData) && historyData.length > 0) {
        setHistorique(
          historyData.map((item) => ({
            date: formatDate(item.date),
            action: item.action,
            type: item.type || 'default'
          }))
        );
        return;
      }
    } catch (historyError) {
      console.error('Erreur chargement historique:', historyError);
    }

    if (fallbackSignalement) {
      setHistorique(buildFallbackHistory(fallbackSignalement));
    } else {
      setHistorique([]);
    }
  };

  const loadAgents = async () => {
    try {
      setAgentsLoading(true);
      const response = await userService.getAll({ role: 'AGENT', limit: 100 });
      const users = response?.data?.data || response?.data || response || [];
      setAgents(users);
    } catch (err) {
      console.error('Erreur chargement agents:', err);
      setAgents([]);
    } finally {
      setAgentsLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '—';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatutBadgeClass = (statut) => {
    switch (statut?.toUpperCase()) {
      case 'NOUVEAU': return 'nouveau';
      case 'EN_COURS': return 'encours';
      case 'RESOLU': return 'resolu';
      case 'REJETE': return 'rejete';
      default: return '';
    }
  };

  const getStatutColor = (statut) => {
    switch (statut?.toUpperCase()) {
      case 'NOUVEAU': return '#1976D2';
      case 'EN_COURS': return '#F57C00';
      case 'RESOLU': return '#388E3C';
      case 'REJETE': return '#9e9e9e';
      default: return '#4CAF50';
    }
  };

  const getUrgenceClass = (urgence) => {
    switch (urgence?.toUpperCase()) {
      case 'HAUTE': return 'haute';
      case 'MOYENNE': return 'moyenne';
      case 'BASSE': return 'basse';
      default: return '';
    }
  };

  const getStepStatus = (step) => {
    const currentStatut = nouveauStatut?.toUpperCase();
    if (currentStatut === 'RESOLU') return 'done';
    if (currentStatut === 'EN_COURS') {
      return step === 'soumis' || step === 'encours' ? 'done' : 'pending';
    }
    if (currentStatut === 'REJETE') {
      return step === 'soumis' ? 'done' : 'pending';
    }
    if (currentStatut === 'NOUVEAU') {
      return step === 'soumis' ? 'done' : 'pending';
    }
    return 'pending';
  };

  const getStepColor = (step) => {
    return getStepStatus(step) === 'done' ? '#4CAF50' : '#e0e0e0';
  };

  const handleUpdate = async () => {
    if (!nouveauStatut && !selectedAgent && !commentaire) {
      showError('Aucune modification à enregistrer');
      return;
    }

    setSaving(true);
    try {
      const currentUserId = user?.id_utilisateur || user?.id || user?.sub;

      if ((commentaire || selectedAgent) && !selectedAgent && !currentUserId) {
        showError('Impossible d\'identifier l\'agent connecté pour enregistrer la note');
        setSaving(false);
        return;
      }
      
      if (nouveauStatut?.toUpperCase() !== signalement.statut?.toUpperCase()) {
        await signalementService.updateStatus(id, nouveauStatut);
      }

      if (commentaire || selectedAgent) {
        await signalementService.saveTreatment(id, {
          id_agent: selectedAgent || currentUserId,
          type_action: 'NOTE',
          commentaire: commentaire || null
        });
      }
      
      await loadSignalement();
      setSelectedAgent('');
      setCommentaire('');
      showSuccess('Signalement mis à jour avec succès');
    } catch (err) {
      console.error('Erreur mise à jour:', err);
      showError(err.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handlePlanifierMaintenance = async () => {
    if (!maintenanceForm.date || !maintenanceForm.type) {
      showError('Veuillez remplir les champs obligatoires');
      return;
    }

    if (maintenanceForm.type === 'AUTRE' && !maintenanceForm.typeCustom.trim()) {
      showError("Veuillez préciser le type d'intervention");
      return;
    }

    setSaving(true);
    try {
      const interventionType = typesIntervention.find(t => t.value === maintenanceForm.type);
      const typeLabel = maintenanceForm.type === 'AUTRE' ? maintenanceForm.typeCustom.trim() : (interventionType?.label || maintenanceForm.type);
      const currentUserId = user?.id_utilisateur || user?.id || user?.sub;

      if (!maintenanceForm.agent && !currentUserId) {
        showError('Impossible d\'identifier l\'agent connecté pour planifier l\'intervention');
        setSaving(false);
        return;
      }

      await signalementService.saveTreatment(id, {
        id_agent: maintenanceForm.agent || currentUserId,
        type_action: 'INTERVENTION',
        type_intervention: typeLabel,
        date_intervention: maintenanceForm.date,
        priorite_intervention: maintenanceForm.priorite,
        notes_intervention: maintenanceForm.notes || null
      });
      
      setShowMaintenanceModal(false);
      setMaintenanceForm({ type: '', typeCustom: '', date: '', priorite: 'MOYENNE', agent: '', notes: '' });
      await loadSignalement();
      showSuccess('Intervention planifiée avec succès');
    } catch (err) {
      console.error('Erreur intervention:', err);
      showError('Erreur lors de la planification');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="signalement-detail-page">
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (!signalement) {
    return (
      <div className="signalement-detail-page">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate('/admin/signalements')}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h2>Signalement introuvable</h2>
        </div>
      </div>
    );
  }

  const agentOptions = agentsLoading ? 
    [{ value: '', label: 'Chargement...' }] :
    [
      { value: '', label: '— Sélectionner un agent —' },
      ...agents.map(a => ({ 
        value: a.id_utilisateur?.toString() || a.id?.toString(), 
        label: `${a.prenom} ${a.nom} (${a.role || 'Agent'})` 
      }))
    ];

  return (
    <div className="signalement-detail-page">
      {alert && <Alert type={alert.type} message={alert.message} />}
      
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/admin/signalements')}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h2>
          Signalement 
          <code style={{ 
            fontFamily: 'monospace', 
            marginLeft: '8px',
            background: '#f5f5f5',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '0.9em'
          }}>
            #{signalement.id_signalement || signalement.id}
          </code>
        </h2>
        <span className={`statut-badge-large ${getStatutBadgeClass(nouveauStatut)}`}>
          {statutsList.find(s => s.value === nouveauStatut?.toUpperCase())?.label || nouveauStatut}
        </span>
      </div>

      <div className="panel-grid">
        <div className="panel">
          <h3><i className="fas fa-info-circle" style={{ color: '#2196F3' }}></i> Informations du signalement</h3>
          <div className="info-list">
            <div className="info-row">
              <span>ID</span>
              <strong><code>{signalement.id_signalement || signalement.id}</code></strong>
            </div>
            <div className="info-row">
              <span>Type</span>
              <strong>{signalement.type_signalement || signalement.type || '-'}</strong>
            </div>
            <div className="info-row">
              <span>Conteneur</span>
              <strong>
                <code style={{ fontFamily: 'monospace' }}>
                  {signalement.conteneur_uid || signalement.uid_conteneur || '-'}
                </code>
              </strong>
            </div>
            <div className="info-row">
              <span>Zone</span>
              <strong>{signalement.zone_nom || signalement.zone || '-'}</strong>
            </div>
            <div className="info-row">
              <span>Position</span>
              <strong>
                {signalement.latitude && signalement.longitude ? 
                  `${parseFloat(signalement.latitude).toFixed(4)}, ${parseFloat(signalement.longitude).toFixed(4)}` : 
                  '-'}
              </strong>
            </div>
            <div className="info-row">
              <span>Urgence</span>
              <strong>
                <span className={`urgence-badge ${getUrgenceClass(signalement.urgence)}`}>
                  {signalement.urgence || '-'}
                </span>
              </strong>
            </div>
            <div className="info-row">
              <span>Signalé par</span>
              <strong>{signalement.citoyen_nom || signalement.nom_citoyen || '-'}</strong>
            </div>
            <div className="info-row">
              <span>Date création</span>
              <strong>{formatDate(signalement.date_creation)}</strong>
            </div>
            {signalement.date_resolution && (
              <div className="info-row">
                <span>Date résolution</span>
                <strong>{formatDate(signalement.date_resolution)}</strong>
              </div>
            )}
          </div>

          <div className="description-box">
            <h4><i className="fas fa-align-left" style={{ marginRight: '6px' }}></i>Description</h4>
            <p>{signalement.description || 'Aucune description'}</p>
          </div>

          {signalement.capacite_l && (
            <div className="info-row" style={{ marginTop: '12px' }}>
              <span>Capacité conteneur</span>
              <strong>{signalement.capacite_l}L</strong>
            </div>
          )}
        </div>

        <div className="panel">
          <h3><i className="fas fa-tasks" style={{ color: '#4CAF50' }}></i> Gestion du signalement</h3>
          
          <div className="timeline">
            <div className={`timeline-step ${getStepStatus('soumis')}`}>
              <div className="timeline-dot" style={{ background: getStepColor('soumis') }}></div>
              <span>Nouveau</span>
              <small>{formatDate(signalement.date_creation).split(' ')[0]}</small>
            </div>
            <div className="timeline-line" style={{ background: getStepColor('encours') }}></div>
            <div className={`timeline-step ${getStepStatus('encours')}`}>
              <div className="timeline-dot" style={{ background: getStepColor('encours') }}></div>
              <span>En cours</span>
              <small>{getStepStatus('encours') === 'done' ? 'Assigné' : '—'}</small>
            </div>
            <div className="timeline-line" style={{ background: getStepColor('resolu') }}></div>
            <div className={`timeline-step ${getStepStatus('resolu')}`}>
              <div className="timeline-dot" style={{ background: getStepColor('resolu') }}></div>
              <span>Résolu</span>
              <small>{getStepStatus('resolu') === 'done' ? 'Terminé' : '—'}</small>
            </div>
          </div>

          <FormGroup label="Changer le statut">
            <Select 
              value={nouveauStatut} 
              onChange={setNouveauStatut}
              options={statutsList}
            />
          </FormGroup>

          <FormGroup label="Assigner un agent">
            <Select 
              value={selectedAgent}
              onChange={setSelectedAgent}
              options={agentOptions}
              disabled={agentsLoading}
            />
          </FormGroup>

          <FormGroup label="Commentaire / Note interne">
            <Textarea 
              value={commentaire}
              onChange={setCommentaire}
              placeholder="Ajoutez une note ou commentaire interne..."
              rows={3}
            />
          </FormGroup>

          <button 
            className="btn-primary btn-full update-btn" 
            onClick={handleUpdate}
            disabled={saving}
            style={{ backgroundColor: getStatutColor(nouveauStatut) }}
          >
            {saving ? (
              <><i className="fas fa-spinner fa-spin"></i> Enregistrement...</>
            ) : (
              <><i className="fas fa-save"></i> Mettre à jour le signalement</>
            )}
          </button>
          
          <button className="btn-outline btn-full" onClick={() => setShowMaintenanceModal(true)}>
            <i className="fas fa-calendar-plus"></i> Planifier une intervention
          </button>

          <h3 style={{ marginTop: '24px' }}><i className="fas fa-history" style={{ color: '#FF9800' }}></i> Historique des actions</h3>
          <div className="historique-list">
            {historique.map((item, index) => (
              <div key={index} className={`historique-item historique-${item.type || 'default'}`}>
                <span className="historique-date">{item.date}</span> — {item.action}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal 
        isOpen={showMaintenanceModal} 
        onClose={() => setShowMaintenanceModal(false)} 
        title="Planifier une intervention"
        headerIcon="fa-wrench"
        headerColor="#FF9800"
        size="lg"
        footer={(
          <div className="maintenance-modal-actions">
            <button className="btn-secondary" onClick={() => setShowMaintenanceModal(false)}>
              Annuler
            </button>
            <button 
              className="btn-primary" 
              onClick={handlePlanifierMaintenance}
              disabled={saving || !maintenanceForm.date || !maintenanceForm.type}
            >
              {saving ? (
                <><i className="fas fa-spinner fa-spin"></i> Enregistrement...</>
              ) : (
                <><i className="fas fa-calendar-plus"></i> Planifier</>
              )}
            </button>
          </div>
        )}
      >
        <div className="maintenance-form">
          <div className="maintenance-modal-body">
            <div className="maintenance-summary-card">
              <div className="maintenance-summary-title">Intervention sur conteneur</div>
              <div className="maintenance-summary-meta">
                <span className="maintenance-chip">{signalement.conteneur_uid || signalement.uid_conteneur}</span>
                {signalement.zone_nom && <span className="maintenance-chip maintenance-chip-zone">{signalement.zone_nom}</span>}
              </div>
            </div>

            <div className="maintenance-grid">
              <FormGroup label="Type d'intervention *">
                <Select 
                  value={maintenanceForm.type}
                  onChange={(v) => setMaintenanceForm({...maintenanceForm, type: v})}
                  options={[
                    { value: '', label: '— Sélectionner —' },
                    ...typesIntervention
                  ]}
                />
              </FormGroup>

              <FormGroup label="Date planifiée *">
                <input 
                  type="date" 
                  className="form-input"
                  value={maintenanceForm.date}
                  onChange={(e) => setMaintenanceForm({...maintenanceForm, date: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                />
              </FormGroup>

              <FormGroup label="Priorité">
                <Select 
                  value={maintenanceForm.priorite}
                  onChange={(v) => setMaintenanceForm({...maintenanceForm, priorite: v})}
                  options={priorites}
                />
              </FormGroup>

              <FormGroup label="Agent assigné">
                <Select 
                  value={maintenanceForm.agent}
                  onChange={(v) => setMaintenanceForm({...maintenanceForm, agent: v})}
                  options={agentOptions}
                  disabled={agentsLoading}
                />
              </FormGroup>
            </div>

            {maintenanceForm.type === 'AUTRE' && (
              <FormGroup label="Préciser le type d'intervention *">
                <Textarea 
                  value={maintenanceForm.typeCustom}
                  onChange={(value) => setMaintenanceForm({...maintenanceForm, typeCustom: value})}
                  placeholder="Décrivez le type d'intervention..."
                  rows={2}
                />
              </FormGroup>
            )}

            <FormGroup label="Notes">
              <Textarea 
                value={maintenanceForm.notes}
                onChange={(value) => setMaintenanceForm({...maintenanceForm, notes: value})}
                placeholder="Notes ou instructions pour l'intervention..."
                rows={3}
              />
            </FormGroup>
          </div>
        </div>
      </Modal>
    </div>
  );
}
