import { useState } from 'react';
import { Pagination, Modal, ModalConfirmation, FormGroup, FormRow, Input, ColorPicker } from '../../common';
import ZoneMap from './ZoneMap';
import './ZoneList.css';

const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9c27b0', '#f44336', '#00BCD4', '#E91E63', '#673AB7'];

/**
 * ZoneList - Composant partagé pour la liste des zones
 * @param {Object} props
 * @param {Array} props.zones - Liste des zones
 * @param {boolean} props.loading - Chargement en cours
 * @param {string} props.role - 'ADMIN' ou 'MANAGER'
 * @param {function} props.onView - Callback pour voir les détails
 * @param {function} props.onEdit - Callback pour modifier
 * @param {function} props.onDelete - Callback pour supprimer
 * @param {function} props.onRefresh - Callback pour actualiser
 */
export default function ZoneList({
  zones = [],
  loading = false,
  role = 'MANAGER',
  onView,
  onEdit,
  onDelete,
  onRefresh
}) {
  const [selectedZone, setSelectedZone] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const canEdit = role === 'ADMIN' || role === 'MANAGER';
  const canDelete = role === 'ADMIN';

  const handleView = (zone) => {
    setSelectedZone(zone);
    setShowViewModal(true);
    if (onView) onView(zone);
  };

  const handleEdit = (zone) => {
    setSelectedZone({ ...zone });
    setShowEditModal(true);
    if (onEdit) onEdit(zone);
  };

  const handleDelete = (zone) => {
    setSelectedZone(zone);
    setShowDeleteModal(true);
    if (onDelete) onDelete(zone);
  };

  const handleUpdateZone = () => {
    if (onEdit && selectedZone) {
      onEdit(selectedZone, true);
      setShowEditModal(false);
    }
  };

  const handleDeleteZone = () => {
    if (onDelete && selectedZone) {
      onDelete(selectedZone, true);
      setShowDeleteModal(false);
    }
  };

  const columns = [
    { 
      header: 'Zone', 
      render: (row) => (
        <span className="zone-name-cell">
          <span className="status-dot" style={{ background: row.couleur || '#4CAF50' }}></span>
          <span className="zone-nom">{row.nom}</span>
        </span>
      )
    },
    { header: 'Code', accessor: 'code' },
    { 
      header: 'Population', 
      render: (row) => (
        <span className="population-cell">
          <i className="fas fa-users"></i>
          {(row.population || 0).toLocaleString()} hab
        </span>
      )
    },
    { 
      header: 'Superficie', 
      render: (row) => (
        <span className="superficie-cell">
          <i className="fas fa-expand"></i>
          {row.superficie_km2 || 0} km²
        </span>
      )
    },
    { 
      header: 'Actions', 
      render: (row) => (
        <div className="action-buttons">
          <button 
            className="btn-action btn-view" 
            title="Voir" 
            onClick={() => handleView(row)}
          >
            <i className="fas fa-eye"></i>
          </button>
          {canEdit && (
            <button 
              className="btn-action btn-edit" 
              title="Modifier" 
              onClick={() => handleEdit(row)}
            >
              <i className="fas fa-edit"></i>
            </button>
          )}
          {canDelete && (
            <button 
              className="btn-action btn-delete" 
              title="Supprimer" 
              onClick={() => handleDelete(row)}
            >
              <i className="fas fa-trash"></i>
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="zone-list-container">
      {/* Tableau */}
      <div className="table-responsive">
        <table className="zone-table">
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th key={index}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="loading-cell">
                  <i className="fas fa-spinner fa-spin"></i> Chargement...
                </td>
              </tr>
            ) : zones.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="empty-cell">
                  <i className="fas fa-map-marked-alt"></i>
                  <span>Aucune zone trouvée</span>
                </td>
              </tr>
            ) : (
              zones.map((zone, index) => (
                <tr key={zone.id_zone || zone.id || index}>
                  {columns.map((col, colIndex) => (
                    <td key={colIndex}>
                      {col.accessor ? zone[col.accessor] : col.render ? col.render(zone) : ''}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de visualisation */}
      <Modal 
        isOpen={showViewModal} 
        onClose={() => setShowViewModal(false)} 
        title="Détails de la zone" 
        headerIcon="fa-map-marker-alt" 
        headerColor="#2196F3" 
        size="md"
      >
        {selectedZone && (
          <>
            <div className="zone-detail-header">
              <span className="zone-color-badge" style={{ background: selectedZone.couleur }}></span>
              <h3>{selectedZone.nom}</h3>
            </div>
            
            <div className="zone-detail-grid">
              <div className="detail-item">
                <span className="detail-label">Code</span>
                <span className="detail-value">{selectedZone.code}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Population</span>
                <span className="detail-value">{(selectedZone.population || 0).toLocaleString()} hab</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Superficie</span>
                <span className="detail-value">{selectedZone.superficie_km2 || 0} km²</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Coordonnées</span>
                <span className="detail-value">
                  {selectedZone.latitude}, {selectedZone.longitude}
                </span>
              </div>
            </div>

            {selectedZone.latitude && selectedZone.longitude && (
              <div className="zone-detail-map">
                <h5><i className="fas fa-map"></i> Localisation</h5>
                <ZoneMap 
                  zones={[{
                    ...selectedZone,
                    id: selectedZone.id_zone || selectedZone.id,
                    couleur: selectedZone.couleur || '#4CAF50'
                  }]}
                  isDrawing={false}
                  readOnly={true}
                />
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowViewModal(false)}>
                Fermer
              </button>
              {canEdit && (
                <button 
                  className="btn-primary" 
                  onClick={() => { 
                    setShowViewModal(false); 
                    handleEdit(selectedZone); 
                  }}
                >
                  <i className="fas fa-edit"></i> Modifier
                </button>
              )}
            </div>
          </>
        )}
      </Modal>

      {/* Modal d'édition */}
      <Modal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)} 
        title="Modifier la zone" 
        headerIcon="fa-edit"
        headerColor="#FF9800"
        size="md"
      >
        {selectedZone && (
          <>
            <FormRow>
              <FormGroup label="Nom">
                <Input 
                  value={selectedZone.nom || ''} 
                  onChange={(val) => setSelectedZone({...selectedZone, nom: val})} 
                  placeholder="Nom de la zone"
                />
              </FormGroup>
              <FormGroup label="Code">
                <Input value={selectedZone.code || ''} disabled />
              </FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup label="Population">
                <Input 
                  type="number" 
                  value={selectedZone.population || 0} 
                  onChange={(val) => setSelectedZone({...selectedZone, population: parseInt(val) || 0})} 
                />
              </FormGroup>
              <FormGroup label="Superficie (km²)">
                <Input 
                  type="number" 
                  step="0.01"
                  value={selectedZone.superficie_km2 || 0} 
                  onChange={(val) => setSelectedZone({...selectedZone, superficie_km2: parseFloat(val) || 0})} 
                />
              </FormGroup>
            </FormRow>
            <FormGroup label="Couleur">
              <ColorPicker 
                value={selectedZone.couleur || '#4CAF50'} 
                onChange={(val) => setSelectedZone({...selectedZone, couleur: val})} 
                colors={colors} 
              />
            </FormGroup>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowEditModal(false)}>
                Annuler
              </button>
              <button className="btn-primary" onClick={handleUpdateZone}>
                <i className="fas fa-save"></i> Enregistrer
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* Modal de confirmation suppression */}
      <ModalConfirmation 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        title="Confirmer la suppression" 
        message={`Êtes-vous sûr de vouloir supprimer la zone "${selectedZone?.nom}" ? Cette action est irréversible.`} 
        confirmText="Supprimer" 
        onConfirm={handleDeleteZone} 
        danger 
      />
    </div>
  );
}
