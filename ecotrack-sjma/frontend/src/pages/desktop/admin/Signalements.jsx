import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Table, Pagination, Filters, SearchBox, SelectFilter, useAlert } from '../../../components/common';
import { StatCard, StatsGrid } from '../../../components/common';
import './Signalements.css';

let mockSignalements = [
  { id: 'SIG-001234', type: 'Débordement', conteneur: 'CONT-00456', conteneurAdresse: 'Place Bellecour', zone: 'Centre', urgence: 'Haute', statut: 'Nouveau', date: '14/01/2026 09:15', utilisateur: 'Jean Dupont', description: 'Le conteneur vert à l\'angle de la rue Victor Hugo est plein depuis 3 jours. Les déchets débordent sur le trottoir.' },
  { id: 'SIG-001230', type: 'Capteur', conteneur: 'CONT-00891', conteneurAdresse: '22 Rue Gambetta', zone: 'Centre', urgence: 'Basse', statut: 'En cours', date: '13/01/2026 10:00', utilisateur: 'Marie Martin', description: 'Le capteur semble défectueux, les données de remplissage ne sont plus transmises.' },
  { id: 'SIG-001210', type: 'Dégradation', conteneur: 'CONT-00789', conteneurAdresse: '8 Avenue de la République', zone: 'Centre', urgence: 'Moyenne', statut: 'En cours', date: '12/01/2026 14:30', utilisateur: 'Paul Dubois', description: 'Le couvercle du conteneur est cassé et ne ferme plus correctement.' },
  { id: 'SIG-001198', type: 'Débordement', conteneur: 'CONT-01023', conteneurAdresse: '45 Rue de la Paix', zone: 'Nord', urgence: 'Basse', statut: 'Résolu', date: '10/01/2026 08:00', utilisateur: 'Sophie Bernard', description: 'Conteneur débordant depuis plusieurs jours.' },
  { id: 'SIG-001150', type: 'Accès bloqué', conteneur: 'CONT-00567', conteneurAdresse: '12 Rue Nationale', zone: 'Sud', urgence: 'Moyenne', statut: 'Résolu', date: '07/01/2026 11:20', utilisateur: 'Lucas Petit', description: 'Le conteneur est bloqué par des véhicules stationnés.' },
  { id: 'SIG-001145', type: 'Débordement', conteneur: 'CONT-00234', conteneurAdresse: '78 Rue de la République', zone: 'Est', urgence: 'Haute', statut: 'Nouveau', date: '14/01/2026 11:30', utilisateur: 'Emma Moreau', description: 'Conteneur de recyclage plein à ras bord.' },
  { id: 'SIG-001140', type: 'Capteur', conteneur: 'CONT-00678', conteneurAdresse: '5 Place Wilson', zone: 'Ouest', urgence: 'Moyenne', statut: 'Nouveau', date: '13/01/2026 16:45', utilisateur: 'Nathan Garcia', description: 'Le capteu de température ne fonctionne plus.' },
  { id: 'SIG-001135', type: 'Dégradation', conteneur: 'CONT-00345', conteneurAdresse: '33 Avenue Jean Jaurès', zone: 'Centre', urgence: 'Basse', statut: 'En cours', date: '12/01/2026 09:20', utilisateur: 'Chloé Martinez', description: 'Le conteneur est tagué graffitis.' },
  { id: 'SIG-001130', type: 'Accès bloqué', conteneur: 'CONT-00999', conteneurAdresse: '10 Rue Pasteur', zone: 'Nord', urgence: 'Haute', statut: 'En cours', date: '11/01/2026 14:10', utilisateur: 'Thomas Laurent', description: 'Camion poubelle bloqué par une voiture.' },
  { id: 'SIG-001125', type: 'Débordement', conteneur: 'CONT-00444', conteneurAdresse: '22 Boulevard Leclerc', zone: 'Sud', urgence: 'Moyenne', statut: 'Résolu', date: '09/01/2026 07:55', utilisateur: 'Inès Rousseau', description: 'Conteneur débordant depuis 2 jours.' },
  { id: 'SIG-001120', type: 'Capteur', conteneur: 'CONT-00777', conteneurAdresse: '88 Rue Nationale', zone: 'Est', urgence: 'Basse', statut: 'Résolu', date: '08/01/2026 12:30', utilisateur: 'Hugo Dubois', description: 'Capteur de poids défaillant.' },
  { id: 'SIG-001115', type: 'Dégradation', conteneur: 'CONT-00222', conteneurAdresse: '14 Rue Voltaire', zone: 'Ouest', urgence: 'Haute', statut: 'Nouveau', date: '14/01/2026 08:00', utilisateur: 'Manon Petit', description: 'Conteneur incendié.' },
  { id: 'SIG-001110', type: 'Accès bloqué', conteneur: 'CONT-00888', conteneurAdresse: '67 Avenue de Lyon', zone: 'Centre', urgence: 'Moyenne', statut: 'En cours', date: '10/01/2026 10:15', utilisateur: 'Lucas Bernard', description: 'Conteneur inaccessible.' },
];

const statutsList = ['Nouveau', 'En cours', 'Résolu', 'Rejeté'];
const urgencesList = ['Haute', 'Moyenne', 'Basse'];

export default function SignalementsPage() {
  const navigate = useNavigate();
  const { alert, showSuccess } = useAlert();
  const [signalements, setSignalements] = useState(mockSignalements);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('Tous');
  const [filterUrgence, setFilterUrgence] = useState('Toutes');

  const filteredSignalements = signalements.filter(sig => {
    const matchSearch = sig.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       sig.conteneur.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatut = filterStatut === 'Tous' || sig.statut === filterStatut;
    const matchUrgence = filterUrgence === 'Toutes' || sig.urgence === filterUrgence;
    return matchSearch && matchStatut && matchUrgence;
  });

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentSignalements = filteredSignalements.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredSignalements.length / itemsPerPage);

  const getUrgenceClass = (urgence) => {
    switch (urgence) {
      case 'Haute': return 'urgence-haute';
      case 'Moyenne': return 'urgence-moyenne';
      case 'Basse': return 'urgence-basse';
      default: return '';
    }
  };

  const getStatutClass = (statut) => {
    switch (statut) {
      case 'Nouveau': return 'statut-nouveau';
      case 'En cours': return 'statut-cours';
      case 'Résolu': return 'statut-resolu';
      case 'Rejeté': return 'statut-rejete';
      default: return '';
    }
  };

  const handleView = (id) => {
    navigate(`/admin/signalements/${id}`);
  };

  const handleUpdate = (id) => {
    navigate(`/admin/signalements/${id}`);
  };

  const columns = [
    { header: 'ID', accessor: 'id', render: (row) => <strong>{row.id}</strong> },
    { header: 'Type', accessor: 'type' },
    { header: 'Conteneur', accessor: 'conteneur' },
    { header: 'Zone', accessor: 'zone' },
    { header: 'Urgence', render: (row) => <span className={`urgence-badge ${getUrgenceClass(row.urgence)}`}>{row.urgence}</span> },
    { header: 'Statut', render: (row) => (
      <span className={`statut-badge ${getStatutClass(row.statut)}`}>
        <span className={`statut-dot ${getStatutClass(row.statut)}`}></span>
        {row.statut}
      </span>
    )},
    { header: 'Soumis le', accessor: 'date' },
    { header: 'Actions', render: (row) => (
      <div className="action-buttons">
        <button className="btn-primary btn-sm" onClick={() => handleView(row.id)}>Voir</button>
        {row.statut !== 'Résolu' && row.statut !== 'Rejeté' && (
          <button className="btn-outline btn-sm" onClick={() => handleUpdate(row.id)}>Mettre à jour</button>
        )}
      </div>
    )}
  ];

  return (
    <div className="signalements-page">
      <div className="page-header">
        <h1>Signalements Citoyens</h1>
      </div>

      <StatsGrid>
        <StatCard icon="fa-flag" iconColor="blue" label="Total signalements" value={signalements.length} change="Ce mois" />
        <StatCard icon="fa-inbox" iconColor="blue" label="Nouveaux" value={signalements.filter(s => s.statut === 'Nouveau').length} change="En attente de triage" />
        <StatCard icon="fa-spinner" iconColor="orange" label="En cours" value={signalements.filter(s => s.statut === 'En cours').length} change="Agents assignés" />
        <StatCard icon="fa-check-double" iconColor="green" label="Résolus" value={signalements.filter(s => s.statut === 'Résolu').length} change="Temps moy: 4h 32min" />
      </StatsGrid>

      <Filters>
        <SearchBox value={searchTerm} onChange={setSearchTerm} placeholder="Rechercher par ID, conteneur..." />
        <SelectFilter value={filterStatut} onChange={setFilterStatut} options={[{value: 'Tous', label: 'Tous statuts'}, ...statutsList.map(s => ({value: s, label: s}))]} />
        <SelectFilter value={filterUrgence} onChange={setFilterUrgence} options={[{value: 'Toutes', label: 'Toutes urgences'}, ...urgencesList.map(u => ({value: u, label: u}))]} />
      </Filters>

      <Table columns={columns} data={currentSignalements} />

      <Pagination currentPage={currentPage} totalPages={totalPages} showingTo={indexOfLast} totalItems={filteredSignalements.length} label="signalements" onPageChange={setCurrentPage} />
    </div>
  );
}
