import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormGroup, Select, Textarea, Alert, Modal, useAlert } from '../../../components/common';
import './SignalementDetail.css';

const mockSignalements = [
  { id: 'SIG-001234', type: 'Débordement', conteneur: 'CONT-00456', conteneurAdresse: '15 Rue Victor Hugo', zone: 'Centre', urgence: 'Haute', statut: 'Nouveau', date: '14/01/2026 09:15', utilisateur: 'Jean Dupont', description: 'Le conteneur vert à l\'angle de la rue Victor Hugo est plein depuis 3 jours. Les déchets débordent sur le trottoir.' },
  { id: 'SIG-001230', type: 'Capteur', conteneur: 'CONT-00891', conteneurAdresse: '22 Rue Gambetta', zone: 'Centre', urgence: 'Basse', statut: 'En cours', date: '13/01/2026 10:00', utilisateur: 'Marie Martin', description: 'Le capteur semble défectueux, les données de remplissage ne sont plus transmises.' },
  { id: 'SIG-001210', type: 'Dégradation', conteneur: 'CONT-00789', conteneurAdresse: '8 Avenue de la République', zone: 'Centre', urgence: 'Moyenne', statut: 'En cours', date: '12/01/2026 14:30', utilisateur: 'Paul Dubois', description: 'Le couvercle du conteneur est cassé et ne ferme plus correctement.' },
  { id: 'SIG-001198', type: 'Débordement', conteneur: 'CONT-01023', conteneurAdresse: '45 Rue de la Paix', zone: 'Nord', urgence: 'Basse', statut: 'Résolu', date: '10/01/2026 08:00', utilisateur: 'Sophie Bernard', description: 'Conteneur débordant depuis plusieurs jours.' },
  { id: 'SIG-001150', type: 'Accès bloqué', conteneur: 'CONT-00567', conteneurAdresse: '12 Rue Nationale', zone: 'Sud', urgence: 'Moyenne', statut: 'Résolu', date: '07/01/2026 11:20', utilisateur: 'Lucas Petit', description: 'Le conteneur est bloqué par des véhicules stationnés.' },
  { id: 'SIG-001145', type: 'Débordement', conteneur: 'CONT-00234', conteneurAdresse: '78 Rue de la République', zone: 'Est', urgence: 'Haute', statut: 'Nouveau', date: '14/01/2026 11:30', utilisateur: 'Emma Moreau', description: 'Conteneur de recyclage plein à ras bord.' },
  { id: 'SIG-001140', type: 'Capteur', conteneur: 'CONT-00678', conteneurAdresse: '5 Place Wilson', zone: 'Ouest', urgence: 'Moyenne', statut: 'Nouveau', date: '13/01/2026 16:45', utilisateur: 'Nathan Garcia', description: 'Le capteur de température ne fonctionne plus.' },
  { id: 'SIG-001135', type: 'Dégradation', conteneur: 'CONT-00345', conteneurAdresse: '33 Avenue Jean Jaurès', zone: 'Centre', urgence: 'Basse', statut: 'En cours', date: '12/01/2026 09:20', utilisateur: 'Chloé Martinez', description: 'Le conteneur est tagué graffitis.' },
  { id: 'SIG-001130', type: 'Accès bloqué', conteneur: 'CONT-00999', conteneurAdresse: '10 Rue Pasteur', zone: 'Nord', urgence: 'Haute', statut: 'En cours', date: '11/01/2026 14:10', utilisateur: 'Thomas Laurent', description: 'Camion poubelle bloqué par une voiture.' },
  { id: 'SIG-001125', type: 'Débordement', conteneur: 'CONT-00444', conteneurAdresse: '22 Boulevard Leclerc', zone: 'Sud', urgence: 'Moyenne', statut: 'Résolu', date: '09/01/2026 07:55', utilisateur: 'Inès Rousseau', description: 'Conteneur débordant depuis 2 jours.' },
  { id: 'SIG-001120', type: 'Capteur', conteneur: 'CONT-00777', conteneurAdresse: '88 Rue Nationale', zone: 'Est', urgence: 'Basse', statut: 'Résolu', date: '08/01/2026 12:30', utilisateur: 'Hugo Dubois', description: 'Capteur de poids défaillant.' },
  { id: 'SIG-001115', type: 'Dégradation', conteneur: 'CONT-00222', conteneurAdresse: '14 Rue Voltaire', zone: 'Ouest', urgence: 'Haute', statut: 'Nouveau', date: '14/01/2026 08:00', utilisateur: 'Manon Petit', description: 'Conteneur incendié.' },
  { id: 'SIG-001110', type: 'Accès bloqué', conteneur: 'CONT-00888', conteneurAdresse: '67 Avenue de Lyon', zone: 'Centre', urgence: 'Moyenne', statut: 'En cours', date: '10/01/2026 10:15', utilisateur: 'Lucas Bernard', description: 'Conteneur inaccessible.' },
];

const agents = [
  { id: 'AGT-007', nom: 'Marc Lefebvre' },
  { id: 'AGT-008', nom: 'Julie Renard' },
  { id: 'AGT-012', nom: 'Pierre Morel' },
];

const typesIntervention = ['Collecte urgente', 'Réparation', 'Nettoyage', 'Remplacement capteur', 'Autre'];
const priorites = ['Basse', 'Moyenne', 'Haute', 'Critique'];
const statutsList = ['Nouveau', 'En cours', 'Résolu', 'Rejeté'];

export default function SignalementDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { alert, showSuccess } = useAlert();
  
  const [signalement, setSignalement] = useState(null);
  const [nouveauStatut, setNouveauStatut] = useState('');
  const [agent, setAgent] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [historique, setHistorique] = useState([
    { date: '14/01 09:15', action: 'Signalement créé par Jean Dupont' },
    { date: '14/01 09:15', action: 'Notification envoyée aux gestionnaires Zone Centre' },
  ]);
  
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    type: '',
    typeCustom: '',
    date: '',
    priorite: 'Moyenne',
    agent: '',
  });

  useEffect(() => {
    const found = mockSignalements.find(s => s.id === id);
    if (found) {
      setSignalement(found);
      setNouveauStatut(found.statut);
    }
  }, [id]);

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

  const getStatutBadgeClass = (statut) => {
    switch (statut) {
      case 'Nouveau': return 'nouveau';
      case 'En cours': return 'encours';
      case 'Résolu': return 'resolu';
      case 'Rejeté': return 'rejete';
      default: return '';
    }
  };

  const getUrgenceClass = (urgence) => {
    switch (urgence) {
      case 'Haute': return 'haute';
      case 'Moyenne': return 'moyenne';
      case 'Basse': return 'basse';
      default: return '';
    }
  };

  const getStepStatus = (step) => {
    if (nouveauStatut === 'Résolu') return 'done';
    if (nouveauStatut === 'En cours') {
      return step === 'soumis' || step === 'encours' ? 'done' : 'pending';
    }
    if (nouveauStatut === 'Rejeté') {
      return step === 'soumis' ? 'done' : 'pending';
    }
    return step === 'soumis' ? 'done' : 'pending';
  };

  const getStepColor = (step) => {
    return getStepStatus(step) === 'done' ? '#4CAF50' : '#e0e0e0';
  };

  const handleUpdate = () => {
    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth()+1).toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const newHistorique = [...historique];
    
    if (nouveauStatut !== signalement.statut) {
      newHistorique.push({ date: dateStr, action: `Statut changé: ${signalement.statut} → ${nouveauStatut}` });
    }
    if (agent) {
      const agentInfo = agents.find(a => a.id === agent);
      const agentLabel = agentInfo ? agentInfo.nom : agent;
      newHistorique.push({ date: dateStr, action: `Agent ${agentLabel} assigné` });
    }
    if (commentaire) {
      newHistorique.push({ date: dateStr, action: `Commentaire ajouté` });
    }
    
    setHistorique(newHistorique);
    setSignalement({ ...signalement, statut: nouveauStatut });
    showSuccess('Statut mis à jour avec succès');
  };

  const handlePlanifierMaintenance = () => {
    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth()+1).toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const agentInfo = agents.find(a => a.id === maintenanceForm.agent);
    const agentLabel = agentInfo ? agentInfo.nom : '';
    const interventionType = maintenanceForm.type === 'Autre' ? maintenanceForm.typeCustom : maintenanceForm.type;
    setHistorique([...historique, { date: dateStr, action: `Intervention planifiée - ${interventionType}${agentLabel ? ' - ' + agentLabel : ''}` }]);
    setShowMaintenanceModal(false);
    setMaintenanceForm({ type: '', typeCustom: '', date: '', priorite: 'Moyenne', agent: '' });
    showSuccess('Intervention planifiée avec succès');
  };

  return (
    <div className="signalement-detail-page">
      {alert && <Alert type={alert.type} message={alert.message} />}
      
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/admin/signalements')}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h2>Signalement #{signalement.id}</h2>
        <span className={`statut-badge-large ${getStatutBadgeClass(nouveauStatut)}`}>{nouveauStatut}</span>
      </div>

      <div className="panel-grid">
        <div className="panel">
          <h3><i className="fas fa-info-circle" style={{ color: '#2196F3' }}></i> Informations du signalement</h3>
          <div className="info-list">
            <div className="info-row">
              <span>ID</span>
              <strong>{signalement.id}</strong>
            </div>
            <div className="info-row">
              <span>Type</span>
              <strong>{signalement.type}</strong>
            </div>
            <div className="info-row">
              <span>Conteneur</span>
              <strong>{signalement.conteneur}</strong>
            </div>
            <div className="info-row">
              <span>Adresse</span>
              <strong>{signalement.conteneurAdresse}</strong>
            </div>
            <div className="info-row">
              <span>Urgence</span>
              <strong><span className={`urgence-badge ${getUrgenceClass(signalement.urgence)}`}>{signalement.urgence}</span></strong>
            </div>
            <div className="info-row">
              <span>Soumis par</span>
              <strong>{signalement.utilisateur}</strong>
            </div>
            <div className="info-row">
              <span>Date</span>
              <strong>{signalement.date}</strong>
            </div>
          </div>

          <div className="description-box">
            <h4>Description</h4>
            <p>{signalement.description}</p>
          </div>

          <div className="photo-box">
            <h4>Photo jointe</h4>
            <div className="photo-placeholder">
              <i className="fas fa-image"></i>
            </div>
          </div>
        </div>

        <div className="panel">
          <h3><i className="fas fa-tasks" style={{ color: '#4CAF50' }}></i> Gestion du signalement</h3>
          
          <div className="timeline">
            <div className={`timeline-step ${getStepStatus('soumis')}`}>
              <div className="timeline-dot" style={{ background: getStepColor('soumis') }}></div>
              <span>Soumis</span>
              <small>{signalement.date.split(' ')[0]}</small>
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
              options={statutsList.map(s => ({ value: s, label: s }))}
            />
          </FormGroup>

          <FormGroup label="Assigner un agent">
            <Select 
              value={agent}
              onChange={setAgent}
              options={[
                { value: '', label: '— Sélectionner —' },
                ...agents.map(a => ({ value: a.id, label: `${a.nom} (${a.id})` }))
              ]}
            />
          </FormGroup>

          <FormGroup label="Commentaire / Réponse au citoyen">
            <Textarea 
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="Ajoutez un commentaire visible par le citoyen..."
            />
          </FormGroup>

          <button className="btn-primary btn-full" onClick={handleUpdate}>
            <i className="fas fa-save"></i> Mettre à jour le signalement
          </button>
          <button className="btn-outline btn-full" onClick={() => setShowMaintenanceModal(true)}>
            <i className="fas fa-wrench"></i> Planifier une intervention
          </button>

          <h3 style={{ marginTop: '24px' }}><i className="fas fa-history" style={{ color: '#FF9800' }}></i> Historique des actions</h3>
          <div className="historique-list">
            {historique.map((item, index) => (
              <div key={index} className="historique-item">
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
        size="md"
        showFooter={false}
      >
        <div className="maintenance-form">
          <FormGroup label="Conteneur">
            <div className="conteneur-info">
              <strong>{signalement.conteneur}</strong> — {signalement.conteneurAdresse}
            </div>
          </FormGroup>

          <FormGroup label="Type d'intervention">
            <Select 
              value={maintenanceForm.type}
              onChange={(v) => setMaintenanceForm({...maintenanceForm, type: v})}
              options={[
                { value: '', label: '— Sélectionner —' },
                ...typesIntervention.map(t => ({ value: t, label: t }))
              ]}
            />
          </FormGroup>

          {maintenanceForm.type === 'Autre' && (
            <FormGroup label="Préciser le type d'intervention">
              <Textarea 
                value={maintenanceForm.typeCustom}
                onChange={(e) => setMaintenanceForm({...maintenanceForm, typeCustom: e.target.value})}
                placeholder="Décrivez le type d'intervention..."
              />
            </FormGroup>
          )}

          <FormGroup label="Date planifiée">
            <input 
              type="date" 
              className="form-input"
              value={maintenanceForm.date}
              onChange={(e) => setMaintenanceForm({...maintenanceForm, date: e.target.value})}
            />
          </FormGroup>

          <FormGroup label="Priorité">
            <Select 
              value={maintenanceForm.priorite}
              onChange={(v) => setMaintenanceForm({...maintenanceForm, priorite: v})}
              options={priorites.map(p => ({ value: p, label: p }))}
            />
          </FormGroup>

          <FormGroup label="Agent assigné">
            <Select 
              value={maintenanceForm.agent}
              onChange={(v) => setMaintenanceForm({...maintenanceForm, agent: v})}
              options={[
                { value: '', label: '— Sélectionner —' },
                ...agents.map(a => ({ value: a.id, label: `${a.nom} (${a.id})` }))
              ]}
            />
          </FormGroup>

          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setShowMaintenanceModal(false)}>Annuler</button>
            <button className="btn-primary" onClick={handlePlanifierMaintenance}>
              <i className="fas fa-calendar-plus"></i> Planifier
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
