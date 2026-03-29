import { useState } from 'react';
import { Alert, Table, Pagination, Modal, ModalConfirmation, Filters, SearchBox, SelectFilter, FormGroup, FormRow, Input, Select, DetailView, useAlert } from '../../../components/common';
import { StatCard, StatsGrid } from '../../../components/common';
import './Conteneurs.css';

let mockConteneurs = [
  { id: 'CONT-2026-00123', type: 'Ordures', capacite: '1100L', zone: 'Centre', adresse: '15 Rue Victor Hugo', remplissage: 85, statut: 'Actif', lastCollecte: '12/01/2026' },
  { id: 'CONT-2026-00456', type: 'Recyclage', capacite: '660L', zone: 'Centre', adresse: 'Place Bellecour', remplissage: 52, statut: 'Actif', lastCollecte: '13/01/2026' },
  { id: 'CONT-2026-00789', type: 'Ordures', capacite: '1100L', zone: 'Centre', adresse: '22 Rue Gambetta', remplissage: 92, statut: 'Maintenance', lastCollecte: '10/01/2026' },
  { id: 'CONT-2026-00891', type: 'Ordures', capacite: '1100L', zone: 'Ouest', adresse: '8 Avenue de la République', remplissage: 42, statut: 'Hors service', lastCollecte: '08/01/2026' },
  { id: 'CONT-2026-00900', type: 'Verre', capacite: '500L', zone: 'Nord', adresse: '45 Rue de la Paix', remplissage: 68, statut: 'Actif', lastCollecte: '11/01/2026' },
  { id: 'CONT-2026-00901', type: 'Recyclage', capacite: '660L', zone: 'Est', adresse: '10 Rue de la République', remplissage: 75, statut: 'Actif', lastCollecte: '14/01/2026' },
  { id: 'CONT-2026-00902', type: 'Biodéchets', capacite: '240L', zone: 'Sud', adresse: '25 Avenue Jean Jaurès', remplissage: 33, statut: 'Actif', lastCollecte: '13/01/2026' },
  { id: 'CONT-2026-00903', type: 'Ordures', capacite: '1100L', zone: 'Centre', adresse: '88 Boulevard Leclerc', remplissage: 88, statut: 'Actif', lastCollecte: '12/01/2026' },
  { id: 'CONT-2026-00904', type: 'Verre', capacite: '500L', zone: 'Ouest', adresse: '3 Place Wilson', remplissage: 45, statut: 'Maintenance', lastCollecte: '09/01/2026' },
  { id: 'CONT-2026-00905', type: 'Recyclage', capacite: '770L', zone: 'Nord', adresse: '42 Rue Pasteur', remplissage: 60, statut: 'Actif', lastCollecte: '14/01/2026' },
  { id: 'CONT-2026-00906', type: 'Ordures', capacite: '1100L', zone: 'Est', adresse: '17 Rue Voltaire', remplissage: 95, statut: 'Hors service', lastCollecte: '07/01/2026' },
  { id: 'CONT-2026-00907', type: 'Biodéchets', capacite: '360L', zone: 'Sud', adresse: '55 Avenue de Lyon', remplissage: 28, statut: 'Actif', lastCollecte: '13/01/2026' },
];

const containerTypes = ['Ordures', 'Recyclage', 'Verre', 'Biodéchets'];
const containerCapacities = ['240L', '360L', '500L', '660L', '770L', '1100L'];
const zonesList = ['Centre', 'Nord', 'Sud', 'Est', 'Ouest'];
const statutsList = ['Actif', 'Maintenance', 'Hors service'];

export default function ConteneursPage() {
  const { alert, showSuccess, showError } = useAlert();
  const [conteneurs, setConteneurs] = useState(mockConteneurs);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Tous');
  const [filterZone, setFilterZone] = useState('Toutes');
  const [filterStatut, setFilterStatut] = useState('Tous');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedConteneur, setSelectedConteneur] = useState(null);

  const [newConteneur, setNewConteneur] = useState({
    type: 'Ordures',
    capacite: '660L',
    zone: 'Centre',
    adresse: ''
  });

  const filteredConteneurs = conteneurs.filter(conteneur => {
    const matchSearch = conteneur.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       conteneur.adresse.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'Tous' || conteneur.type === filterType;
    const matchZone = filterZone === 'Toutes' || conteneur.zone === filterZone;
    const matchStatut = filterStatut === 'Tous' || conteneur.statut === filterStatut;
    return matchSearch && matchType && matchZone && matchStatut;
  });

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentConteneurs = filteredConteneurs.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredConteneurs.length / itemsPerPage);

  const getRemplissageClass = (pourcentage) => {
    if (pourcentage >= 90) return 'fill-critical';
    if (pourcentage >= 70) return 'fill-high';
    return 'fill-medium';
  };

  const getStatutClass = (statut) => {
    switch (statut) {
      case 'Actif': return 'statut-actif';
      case 'Maintenance': return 'statut-maintenance';
      case 'Hors service': return 'statut-hors-service';
      default: return '';
    }
  };

  const getTypeClass = (type) => {
    switch (type) {
      case 'Ordures': return 'type-ordures';
      case 'Recyclage': return 'type-recyclage';
      case 'Verre': return 'type-verre';
      case 'Biodéchets': return 'type-bio';
      default: return '';
    }
  };

  const handleView = (conteneur) => {
    setSelectedConteneur(conteneur);
    setShowViewModal(true);
  };

  const handleEdit = (conteneur) => {
    setSelectedConteneur({ ...conteneur });
    setShowEditModal(true);
  };

  const handleDelete = (conteneur) => {
    setSelectedConteneur(conteneur);
    setShowDeleteModal(true);
  };

  const handleAddConteneur = () => {
    if (!newConteneur.adresse.trim()) {
      showError('Veuillez entrer une adresse');
      return;
    }
    const newId = `CONT-2026-${String(conteneurs.length + 1).padStart(5, '0')}`;
    const conteneur = {
      ...newConteneur,
      id: newId,
      remplissage: 0,
      statut: 'Actif',
      lastCollecte: new Date().toLocaleDateString('fr-FR')
    };
    setConteneurs([...conteneurs, conteneur]);
    setShowAddModal(false);
    setNewConteneur({ type: 'Ordures', capacite: '660L', zone: 'Centre', adresse: '' });
    showSuccess('Conteneur ajouté avec succès');
  };

  const handleUpdateConteneur = () => {
    if (!selectedConteneur.adresse.trim()) {
      showError('Veuillez entrer une adresse');
      return;
    }
    setConteneurs(conteneurs.map(c => c.id === selectedConteneur.id ? selectedConteneur : c));
    setShowEditModal(false);
    showSuccess('Conteneur mis à jour avec succès');
  };

  const handleDeleteConteneur = () => {
    setConteneurs(conteneurs.filter(c => c.id !== selectedConteneur.id));
    showSuccess('Conteneur supprimé avec succès');
  };

  const columns = [
    { header: 'UID', accessor: 'id' },
    { header: 'Type', render: (row) => <span className={`type-badge ${getTypeClass(row.type)}`}>{row.type}</span> },
    { header: 'Capacité', accessor: 'capacite' },
    { header: 'Zone', accessor: 'zone' },
    { header: 'Adresse', accessor: 'adresse' },
    { header: 'Remplissage', render: (row) => (
      <div className="fill-progress">
        <div className="fill-bar">
          <div className={`fill-fill ${getRemplissageClass(row.remplissage)}`} style={{ width: `${row.remplissage}%` }}></div>
        </div>
        <span className={`fill-pct ${getRemplissageClass(row.remplissage)}`}>{row.remplissage}%</span>
      </div>
    )},
    { header: 'Statut', render: (row) => (
      <span className={`statut-badge ${getStatutClass(row.statut)}`}>
        <span className={`statut-dot ${getStatutClass(row.statut)}`}></span>
        {row.statut}
      </span>
    )},
    { header: 'Actions', render: (row) => (
      <div className="action-buttons">
        <button className="btn-sm btn-primary" title="Voir" onClick={() => handleView(row)}><i className="fas fa-eye"></i></button>
        <button className="btn-sm btn-outline" title="Modifier" onClick={() => handleEdit(row)}><i className="fas fa-edit"></i></button>
        <button className="btn-sm btn-danger" title="Supprimer" onClick={() => handleDelete(row)}><i className="fas fa-trash"></i></button>
      </div>
    )}
  ];

  return (
    <div className="conteneurs-page">
      <div className="users-header">
        <h2 className="page-title">Gestion des Conteneurs</h2>
        <button className="btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
          <i className="fas fa-plus"></i> Ajouter un conteneur
        </button>
      </div>

      <StatsGrid>
        <StatCard icon="fa-dumpster" iconColor="green" label="Total conteneurs" value={conteneurs.length} change={`${zonesList.length} zones couvertes`} />
        <StatCard icon="fa-check-circle" iconColor="blue" label="Actifs" value={conteneurs.filter(c => c.statut === 'Actif').length} change="opérationnels" />
        <StatCard icon="fa-tools" iconColor="orange" label="En maintenance" value={conteneurs.filter(c => c.statut === 'Maintenance').length} change="Interventions planifiées" />
        <StatCard icon="fa-exclamation-circle" iconColor="red" label="Hors service" value={conteneurs.filter(c => c.statut === 'Hors service').length} change="À remplacer" />
      </StatsGrid>

      <Filters>
        <SearchBox value={searchTerm} onChange={setSearchTerm} placeholder="Rechercher par UID ou adresse..." />
        <SelectFilter value={filterType} onChange={setFilterType} options={[{value: 'Tous', label: 'Tous les types'}, ...containerTypes.map(t => ({value: t, label: t}))]} />
        <SelectFilter value={filterZone} onChange={setFilterZone} options={[{value: 'Toutes', label: 'Toutes les zones'}, ...zonesList.map(z => ({value: z, label: z}))]} />
        <SelectFilter value={filterStatut} onChange={setFilterStatut} options={[{value: 'Tous', label: 'Tous les statuts'}, ...statutsList.map(s => ({value: s, label: s}))]} />
      </Filters>

      <Table columns={columns} data={currentConteneurs} />

      <Pagination currentPage={currentPage} totalPages={totalPages} showingTo={indexOfLast} totalItems={filteredConteneurs.length} label="conteneurs" onPageChange={setCurrentPage} />

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Ajouter un conteneur" headerIcon="fa-plus-circle" size="md">
        <FormGroup label="Type de déchet">
          <Select value={newConteneur.type} onChange={v => setNewConteneur({...newConteneur, type: v})} options={containerTypes.map(t => ({value: t, label: t}))} />
        </FormGroup>
        <FormRow>
          <FormGroup label="Capacité">
            <Select value={newConteneur.capacite} onChange={v => setNewConteneur({...newConteneur, capacite: v})} options={containerCapacities.map(c => ({value: c, label: c}))} />
          </FormGroup>
          <FormGroup label="Zone">
            <Select value={newConteneur.zone} onChange={v => setNewConteneur({...newConteneur, zone: v})} options={zonesList.map(z => ({value: z, label: z}))} />
          </FormGroup>
        </FormRow>
        <FormGroup label="Adresse">
          <Input value={newConteneur.adresse} onChange={v => setNewConteneur({...newConteneur, adresse: v.target.value})} placeholder="15 Rue Victor Hugo" />
        </FormGroup>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={() => setShowAddModal(false)}>Annuler</button>
          <button className="btn-primary" onClick={handleAddConteneur}><i className="fas fa-save"></i> Enregistrer</button>
        </div>
      </Modal>

      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Détails du conteneur" headerIcon="fa-dumpster" headerColor="#4CAF50" size="md">
        {selectedConteneur && (
          <>
            <DetailView items={[
              { label: 'UID', value: selectedConteneur.id },
              { label: 'Type', value: <span className={`type-badge ${getTypeClass(selectedConteneur.type)}`}>{selectedConteneur.type}</span> },
              { label: 'Capacité', value: selectedConteneur.capacite },
              { label: 'Zone', value: selectedConteneur.zone },
              { label: 'Adresse', value: selectedConteneur.adresse },
              { label: 'Remplissage', value: (
                <div className="fill-progress">
                  <div className="fill-bar" style={{ width: '100px' }}>
                    <div className={`fill-fill ${getRemplissageClass(selectedConteneur.remplissage)}`} style={{ width: `${selectedConteneur.remplissage}%` }}></div>
                  </div>
                  <span>{selectedConteneur.remplissage}%</span>
                </div>
              )},
              { label: 'Statut', value: <span className={`statut-badge ${getStatutClass(selectedConteneur.statut)}`}><span className={`statut-dot ${getStatutClass(selectedConteneur.statut)}`}></span>{selectedConteneur.statut}</span> },
              { label: 'Dernière collecte', value: selectedConteneur.lastCollecte }
            ]} />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowViewModal(false)}>Fermer</button>
              <button className="btn-primary" onClick={() => { setShowViewModal(false); handleEdit(selectedConteneur); }}><i className="fas fa-edit"></i> Modifier</button>
            </div>
          </>
        )}
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Modifier le conteneur" headerIcon="fa-edit" size="md">
        {selectedConteneur && (
          <>
            <FormGroup label="Type de déchet">
              <Select value={selectedConteneur.type} onChange={v => setSelectedConteneur({...selectedConteneur, type: v})} options={containerTypes.map(t => ({value: t, label: t}))} />
            </FormGroup>
            <FormRow>
              <FormGroup label="Capacité">
                <Select value={selectedConteneur.capacite} onChange={v => setSelectedConteneur({...selectedConteneur, capacite: v})} options={containerCapacities.map(c => ({value: c, label: c}))} />
              </FormGroup>
              <FormGroup label="Zone">
                <Select value={selectedConteneur.zone} onChange={v => setSelectedConteneur({...selectedConteneur, zone: v})} options={zonesList.map(z => ({value: z, label: z}))} />
              </FormGroup>
            </FormRow>
            <FormGroup label="Statut">
              <Select value={selectedConteneur.statut} onChange={v => setSelectedConteneur({...selectedConteneur, statut: v})} options={statutsList.map(s => ({value: s, label: s}))} />
            </FormGroup>
            <FormGroup label="Adresse">
              <Input value={selectedConteneur.adresse} onChange={v => setSelectedConteneur({...selectedConteneur, adresse: v.target.value})} />
            </FormGroup>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowEditModal(false)}>Annuler</button>
              <button className="btn-primary" onClick={handleUpdateConteneur}><i className="fas fa-save"></i> Enregistrer</button>
            </div>
          </>
        )}
      </Modal>

      <ModalConfirmation isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Confirmer la suppression" message={`Êtes-vous sûr de vouloir supprimer le conteneur ${selectedConteneur?.id} ? Cette action est irréversible.`} confirmText="Supprimer" onConfirm={handleDeleteConteneur} danger />
    </div>
  );
}
