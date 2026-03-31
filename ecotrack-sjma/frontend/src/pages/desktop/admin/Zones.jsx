import { useState } from 'react';
import { Alert, Table, Pagination, Modal, ModalConfirmation, FormGroup, FormRow, Input, Select, Textarea, ColorPicker, DetailView, useAlert } from '../../../components/common';
import './Zones.css';

let mockZones = [
  { id: 'ZONE-001', nom: 'Zone Nord', conteneurs: 156, agents: 8, remplissage: 42, couleur: '#4CAF50', population: 25000, superficie: 12.5 },
  { id: 'ZONE-002', nom: 'Zone Sud', conteneurs: 134, agents: 7, remplissage: 55, couleur: '#2196F3', population: 22000, superficie: 10.2 },
  { id: 'ZONE-003', nom: 'Zone Est', conteneurs: 128, agents: 6, remplissage: 68, couleur: '#FF9800', population: 18000, superficie: 8.7 },
  { id: 'ZONE-004', nom: 'Centre', conteneurs: 182, agents: 12, remplissage: 51, couleur: '#9c27b0', population: 35000, superficie: 15.3 },
  { id: 'ZONE-005', nom: 'Zone Ouest', conteneurs: 110, agents: 5, remplissage: 73, couleur: '#f44336', population: 15000, superficie: 7.1 },
  { id: 'ZONE-006', nom: 'Zone Centre-Ouest', conteneurs: 95, agents: 4, remplissage: 38, couleur: '#00BCD4', population: 12000, superficie: 5.8 },
  { id: 'ZONE-007', nom: 'Zone Sud-Est', conteneurs: 88, agents: 4, remplissage: 62, couleur: '#E91E63', population: 11000, superficie: 6.2 },
  { id: 'ZONE-008', nom: 'Zone Nord-Est', conteneurs: 102, agents: 5, remplissage: 45, couleur: '#673AB7', population: 16000, superficie: 9.1 },
];

const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9c27b0', '#f44336', '#00BCD4', '#E91E63', '#673AB7'];

export default function ZonesPage() {
  const { alert, showSuccess, showError } = useAlert();
  const [zones, setZones] = useState(mockZones);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [showForm, setShowForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);

  const [newZone, setNewZone] = useState({ nom: '', population: '' });

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentZones = zones.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(zones.length / itemsPerPage);

  const getRemplissageClass = (pourcentage) => {
    if (pourcentage >= 70) return 'fill-critical';
    if (pourcentage >= 50) return 'fill-high';
    return 'fill-medium';
  };

  const handleView = (zone) => {
    setSelectedZone(zone);
    setShowViewModal(true);
  };

  const handleEdit = (zone) => {
    setSelectedZone({ ...zone });
    setShowEditModal(true);
  };

  const handleDelete = (zone) => {
    setSelectedZone(zone);
    setShowDeleteModal(true);
  };

  const handleCreateZone = () => {
    if (!newZone.nom.trim()) {
      showError('Veuillez entrer un nom de zone');
      return;
    }
    const newId = `ZONE-2026-${String(zones.length + 1).padStart(3, '0')}`;
    const zone = {
      id: newId,
      nom: newZone.nom,
      conteneurs: 0,
      agents: 0,
      remplissage: 0,
      couleur: '#4CAF50',
      population: newZone.population || 0,
      superficie: parseFloat((Math.random() * 15).toFixed(1))
    };
    setZones([...zones, zone]);
    setShowForm(false);
    setNewZone({ nom: '', population: '' });
    showSuccess('Zone créée avec succès');
  };

  const handleUpdateZone = () => {
    if (!selectedZone.nom.trim()) {
      showError('Veuillez entrer un nom de zone');
      return;
    }
    setZones(zones.map(z => z.id === selectedZone.id ? selectedZone : z));
    setShowEditModal(false);
    showSuccess('Zone mise à jour avec succès');
  };

  const handleDeleteZone = () => {
    setZones(zones.filter(z => z.id !== selectedZone.id));
    showSuccess('Zone supprimée avec succès');
  };

  const columns = [
    { header: 'Zone', render: (row) => (
      <span className="zone-name">
        <span className="status-dot" style={{ background: row.couleur }}></span>
        {row.nom}
      </span>
    )},
    { header: 'Conteneurs', accessor: 'conteneurs' },
    { header: 'Agents', accessor: 'agents' },
    { header: 'Remplissage moy.', render: (row) => (
      <div className="fill-progress">
        <div className="fill-bar">
          <div className={`fill-fill ${getRemplissageClass(row.remplissage)}`} style={{ width: `${row.remplissage}%` }}></div>
        </div>
        <span className={`fill-pct ${getRemplissageClass(row.remplissage)}`}>{row.remplissage}%</span>
      </div>
    )},
    { header: 'Actions', render: (row) => (
      <div className="action-buttons">
        <button className="btn-sm btn-info" title="Voir" onClick={() => handleView(row)}><i className="fas fa-eye"></i></button>
        <button className="btn-sm btn-outline" title="Modifier" onClick={() => handleEdit(row)}><i className="fas fa-edit"></i></button>
        <button className="btn-sm btn-danger" title="Supprimer" onClick={() => handleDelete(row)}><i className="fas fa-trash"></i></button>
      </div>
    )}
  ];

  return (
    <div className="zones-page">
      <div className="users-header">
        <h2 className="page-title">Gestion des Zones</h2>
        <button className="btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          <i className="fas fa-draw-polygon"></i> Nouvelle zone
        </button>
      </div>

      <div className="panel-grid">
        <div className="panel">
          <h3><i className="fas fa-map" style={{ color: '#2196F3' }}></i> Carte des zones</h3>
          <div className="zones-map">
            <div className="map-grid"></div>
            {zones.map((zone) => (
              <div key={zone.id} className={`zone-label zone-${zone.nom.toLowerCase().replace(' ', '-')}`} style={{ borderColor: zone.couleur, color: zone.couleur }}>
                {zone.nom}
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <h3><i className="fas fa-list" style={{ color: '#4CAF50' }}></i> Liste des zones</h3>
          <Table columns={columns} data={currentZones} />
          <Pagination currentPage={currentPage} totalPages={totalPages} showingTo={indexOfLast} totalItems={zones.length} label="zones" onPageChange={setCurrentPage} />
        </div>
      </div>

      {showForm && (
        <div className="panel zone-form">
          <h3><i className="fas fa-draw-polygon" style={{ color: '#4CAF50' }}></i> Nouvelle zone</h3>
          <FormRow>
            <FormGroup label="Nom">
              <Input value={newZone.nom} onChange={v => setNewZone({...newZone, nom: v.target.value})} placeholder="Zone Nord-Est" />
            </FormGroup>
            <FormGroup label="Code (auto-généré)">
              <Input value={`ZONE-2026-${String(zones.length + 1).padStart(3, '0')}`} disabled />
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Population estimée">
              <Input type="number" value={newZone.population} onChange={v => setNewZone({...newZone, population: v.target.value})} placeholder="25000" />
            </FormGroup>
            <FormGroup label="Superficie (km², calculée)">
              <Input value={parseFloat((Math.random() * 15).toFixed(1))} disabled />
            </FormGroup>
          </FormRow>
          <FormGroup label="Coordonnées (géométrie)">
            <Textarea placeholder="Dessinez sur la carte ou collez les coordonnées GeoJSON..." />
          </FormGroup>
          <button className="btn-primary" onClick={handleCreateZone}><i className="fas fa-save"></i> Créer la zone</button>
        </div>
      )}

      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Détails de la zone" headerIcon="fa-map" headerColor="#2196F3" size="md">
        {selectedZone && (
          <>
            <DetailView items={[
              { label: 'Nom', value: <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span className="status-dot" style={{ background: selectedZone.couleur }}></span>{selectedZone.nom}</span> },
              { label: 'Code', value: selectedZone.id },
              { label: 'Conteneurs', value: selectedZone.conteneurs },
              { label: 'Agents', value: selectedZone.agents },
              { label: 'Population', value: `${selectedZone.population?.toLocaleString() || 0} habitants` },
              { label: 'Superficie', value: `${selectedZone.superficie} km²` },
              { label: 'Remplissage moyen', value: (
                <div className="fill-progress">
                  <div className="fill-bar" style={{ width: '100px' }}>
                    <div className={`fill-fill ${getRemplissageClass(selectedZone.remplissage)}`} style={{ width: `${selectedZone.remplissage}%` }}></div>
                  </div>
                  <span>{selectedZone.remplissage}%</span>
                </div>
              )},
              { label: 'Couleur', value: <span className="color-preview" style={{ background: selectedZone.couleur }}></span> }
            ]} />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowViewModal(false)}>Fermer</button>
              <button className="btn-primary" onClick={() => { setShowViewModal(false); handleEdit(selectedZone); }}><i className="fas fa-edit"></i> Modifier</button>
            </div>
          </>
        )}
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Modifier la zone" headerIcon="fa-edit" size="md">
        {selectedZone && (
          <>
            <FormRow>
              <FormGroup label="Nom">
                <Input value={selectedZone.nom} onChange={v => setSelectedZone({...selectedZone, nom: v.target.value})} />
              </FormGroup>
              <FormGroup label="Code">
                <Input value={selectedZone.id} disabled />
              </FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup label="Population estimée">
                <Input type="number" value={selectedZone.population} onChange={v => setSelectedZone({...selectedZone, population: parseInt(v.target.value)})} />
              </FormGroup>
              <FormGroup label="Superficie (km²)">
                <Input type="number" step="0.1" value={selectedZone.superficie} onChange={v => setSelectedZone({...selectedZone, superficie: parseFloat(v.target.value)})} />
              </FormGroup>
            </FormRow>
            <FormGroup label="Couleur">
              <ColorPicker value={selectedZone.couleur} onChange={v => setSelectedZone({...selectedZone, couleur: v})} colors={colors} />
            </FormGroup>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowEditModal(false)}>Annuler</button>
              <button className="btn-primary" onClick={handleUpdateZone}><i className="fas fa-save"></i> Enregistrer</button>
            </div>
          </>
        )}
      </Modal>

      <ModalConfirmation isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Confirmer la suppression" message={`Êtes-vous sûr de vouloir supprimer la zone ${selectedZone?.nom} ? Cette action est irréversible.`} confirmText="Supprimer" onConfirm={handleDeleteZone} danger />
    </div>
  );
}
