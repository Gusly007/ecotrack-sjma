import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Alert, Table, Pagination, Modal, ModalConfirmation, FormGroup, FormRow, Input, ColorPicker, DetailView, useAlert, Button, StatCard, StatsGrid } from '../../../components/common';
import ZoneMap from '../../../components/desktop/shared/ZoneMap';
import ZoneCreationModal from '../../../components/desktop/shared/ZoneCreationModal';
import { zoneService } from '../../../services/zoneService';
import '../../../components/common/Pagination.css';
import './Zones.css';

const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9c27b0', '#f44336', '#00BCD4', '#E91E63', '#673AB7'];

export default function ZonesPage() {
  const { user } = useAuth();
  const { alert, showSuccess, showError } = useAlert();
  
  // Données
  const [zones, setZones] = useState([]);
  const [allZones, setAllZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 5;
  
  // Visibility state for map
  const [visibleZones, setVisibleZones] = useState(new Set());
  
  // Modals
  const [showCreationModal, setShowCreationModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);

  // Permissions selon le rôle
  const role = user?.role || 'MANAGER';
  const canCreate = role === 'ADMIN' || role === 'MANAGER';
  const canEdit = role === 'ADMIN' || role === 'MANAGER';
  const canDelete = role === 'ADMIN';

  // Charger les zones
  const loadZones = useCallback(async () => {
    try {
      setLoading(true);
      const response = await zoneService.getAll(currentPage, itemsPerPage);
      
      // On normalise ici les formats possibles pour eviter de perdre pagination.
      let data = [];
      let pagination = { pages: 1, total: 0 };
      
      if (response?.data && Array.isArray(response.data)) {
        // Format: { data: [...], pagination: {...} }
        data = response.data;
        pagination = response.pagination || pagination;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        // Format: { data: { data: [...], pagination: {...} } }
        data = response.data.data;
        pagination = response.data.pagination || pagination;
      } else if (Array.isArray(response)) {
        // Format legacy: [...]
        data = response;
      }
      
      const safeData = Array.isArray(data) ? data : [];
      const safeTotalItems = pagination.total ?? safeData.length;
      const safeTotalPages = pagination.pages || pagination.totalPages || Math.max(1, Math.ceil(safeTotalItems / itemsPerPage));

      setZones(safeData);
      setTotalPages(safeTotalPages);
      setTotalItems(safeTotalItems);
      
      // Initialize visibility for new zones (all visible by default)
      setVisibleZones(prev => {
        const newSet = new Set(prev);
        safeData.forEach(zone => {
          const id = zone.id_zone || zone.id;
          if (!newSet.has(id)) {
            newSet.add(id);
          }
        });
        return newSet;
      });
    } catch (err) {
      console.error('Erreur chargement zones:', err);
      showError('Erreur lors du chargement des zones');
      setZones([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, showError]);
  
  // Charger toutes les zones pour la carte
  const loadAllZonesForMap = useCallback(async () => {
    try {
      const response = await zoneService.getAll(1, 1000);
      let data = [];
      if (response.data) {
        data = response.data.data || response.data || [];
      } else if (Array.isArray(response)) {
        data = response;
      }
      setAllZones(Array.isArray(data) ? data : []);
      
      // Add all zones to visible set by default
      setVisibleZones(prev => {
        const newSet = new Set(prev);
        data.forEach(zone => {
          newSet.add(zone.id_zone || zone.id);
        });
        return newSet;
      });
    } catch (err) {
      console.error('Erreur chargement zones pour carte:', err);
    }
  }, []);

  // Charger les statistiques
  const loadStats = useCallback(async () => {
    try {
      const response = await zoneService.getStatistics();
      // L'API retourne { message: '...', data: {...} }
      if (response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Erreur stats:', err);
    }
  }, []);
  
  // Toggle zone visibility on map
  const toggleZoneVisibility = (zoneId) => {
    setVisibleZones(prev => {
      const newSet = new Set(prev);
      if (newSet.has(zoneId)) {
        newSet.delete(zoneId);
      } else {
        newSet.add(zoneId);
      }
      return newSet;
    });
  };
  
  // Toggle all zones visibility
  const toggleAllVisibility = (show) => {
    if (show) {
      setVisibleZones(new Set(allZones.map(z => z.id_zone || z.id)));
    } else {
      setVisibleZones(new Set());
    }
  };

  // Chargement initial
  useEffect(() => {
    loadZones();
    loadStats();
    loadAllZonesForMap();
  }, [loadZones, loadStats, loadAllZonesForMap]);

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

  const handleUpdateZone = async () => {
    try {
      await zoneService.update(selectedZone.id_zone || selectedZone.id, {
        couleur: selectedZone.couleur
      });
      
      showSuccess('Couleur mise à jour avec succès');
      setShowEditModal(false);
      loadZones();
      loadStats();
      loadAllZonesForMap();
    } catch (err) {
      showError(err.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleDeleteZone = async () => {
    try {
      await zoneService.delete(selectedZone.id_zone || selectedZone.id);
      showSuccess('Zone supprimée avec succès');
      setShowDeleteModal(false);
      loadZones();
      loadStats();
    } catch (err) {
      showError(err.message || 'Erreur lors de la suppression');
    }
  };

  const handleZoneCreated = () => {
    setCurrentPage(1); // Reset to first page
    loadZones();
    loadAllZonesForMap();
    loadStats();
    showSuccess('Zone créée avec succès');
  };

  const columns = [
    { 
      header: 'Zone', 
      render: (row) => (
        <span className="zone-name">
          <span className="status-dot" style={{ background: row.couleur || '#4CAF50' }}></span>
          {row.nom}
        </span>
      )
    },
    { header: 'Code', accessor: 'code' },
    { 
      header: 'Population', 
      render: (row) => `${(row.population || 0).toLocaleString()} hab`
    },
    { 
      header: 'Superficie', 
      render: (row) => `${row.superficie_km2 || 0} km²`
    },
    { 
      header: 'Actions', 
      render: (row) => {
        const zoneId = row.id_zone || row.id;
        const isVisible = visibleZones.has(zoneId);
        return (
          <div className="action-buttons">
            <button 
              className={`btn-sm ${isVisible ? 'btn-success' : 'btn-outline'}`}
              title={isVisible ? 'Cacher sur la carte' : 'Afficher sur la carte'}
              onClick={(e) => { e.stopPropagation(); toggleZoneVisibility(zoneId); }}
            >
              <i className={`fas ${isVisible ? 'fa-map-marker' : 'fa-map-marker-slash'}`}></i>
            </button>
            <button 
              className="btn-sm btn-info" 
              title="Voir" 
              onClick={(e) => { e.stopPropagation(); handleView(row); }}
            >
              <i className="fas fa-search-plus"></i>
            </button>
            {canEdit && (
              <button 
                className="btn-sm btn-warning" 
                title="Modifier" 
                onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
              >
                <i className="fas fa-palette"></i>
              </button>
            )}
            {canDelete && (
              <button 
                className="btn-sm btn-danger" 
                title="Supprimer" 
                onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
              >
                <i className="fas fa-trash"></i>
              </button>
            )}
          </div>
        );
      }
    }
  ];

  // Préparer les zones pour la carte (toutes, filtrées par visibilité)
  const zonesForMap = allZones
    .filter(zone => visibleZones.has(zone.id_zone || zone.id))
    .map(zone => ({
      id: zone.id_zone || zone.id,
      nom: zone.nom,
      code: zone.code,
      population: zone.population,
      superficie_km2: zone.superficie_km2,
      latitude: zone.latitude,
      longitude: zone.longitude,
      couleur: zone.couleur || '#4CAF50',
      conteneurs: zone.conteneurs || 0
    }));

  return (
    <div className="zones-page">
      <div className="users-header">
        <h2 className="page-title">Gestion des Zones</h2>
        {canCreate && (
          <Button variant="primary" onClick={() => setShowCreationModal(true)} icon="fa-draw-polygon">
            Nouvelle zone
          </Button>
        )}
      </div>

      {/* Alert */}
      {alert && (
        <Alert 
          type={alert.type} 
          message={alert.message} 
          onClose={() => {}} 
        />
      )}

      {/* Stats */}
      {stats && (
        <StatsGrid>
          <StatCard 
            icon="fa-map-marker-alt" 
            iconColor="blue" 
            label="Total zones" 
            value={stats.total_zones || 0} 
          />
          <StatCard 
            icon="fa-users" 
            iconColor="green" 
            label="Population totale" 
            value={`${(stats.population_totale || 0).toLocaleString()} hab`} 
          />
          <StatCard 
            icon="fa-expand" 
            iconColor="orange" 
            label="Superficie totale" 
            value={`${Number(stats.superficie_totale_km2 || 0).toFixed(1)} km²`} 
          />
          <StatCard 
            icon="fa-chart-pie" 
            iconColor="purple" 
            label="Moyenne population" 
            value={`${Math.round(Number(stats.population_moyenne || 0)).toLocaleString()} hab`} 
          />
        </StatsGrid>
      )}

      <div className="panel-grid">
        {/* Carte des zones */}
        <div className="panel zones-map-panel">
          <div className="panel-header-with-actions">
            <h3>
              <i className="fas fa-map" style={{ color: '#2196F3' }}></i> 
              Carte des zones ({zonesForMap.length}/{allZones.length})
            </h3>
            <div className="panel-header-buttons">
              <button 
                className="btn-sm btn-success"
                title="Afficher tout"
                onClick={() => toggleAllVisibility(true)}
              >
                <i className="fas fa-expand"></i> Tout
              </button>
              <button 
                className="btn-sm btn-outline"
                title="Cacher tout"
                onClick={() => toggleAllVisibility(false)}
              >
                <i className="fas fa-compress"></i> Aucun
              </button>
            </div>
          </div>
          <ZoneMap 
            zones={zonesForMap}
            isDrawing={false}
            onZoneClick={handleView}
            role={role}
          />
        </div>

        {/* Liste des zones */}
        <div className="panel zones-list-panel">
          <h3>
            <i className="fas fa-list" style={{ color: '#4CAF50' }}></i> 
            Liste des zones
          </h3>
          <div className="zones-table-container">
            <Table 
              columns={columns} 
              data={zones}
              loading={loading}
              emptyMessage="Aucune zone trouvée"
            />
          </div>
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages}
            showingFrom={(currentPage - 1) * itemsPerPage + 1}
            showingTo={Math.min(currentPage * itemsPerPage, totalItems)}
            totalItems={totalItems}
            label="zones"
            onPageChange={setCurrentPage} 
          />
        </div>
      </div>

      {/* Modal de création partagé */}
      <ZoneCreationModal
        isOpen={showCreationModal}
        onClose={() => setShowCreationModal(false)}
        onSuccess={handleZoneCreated}
        role={role}
        existingZones={zonesForMap}
      />

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
            <DetailView items={[
              { 
                label: 'Nom', 
                value: (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span 
                      className="status-dot" 
                      style={{ background: selectedZone.couleur || '#4CAF50' }}
                    ></span>
                    {selectedZone.nom}
                  </span>
                ) 
              },
              { label: 'Code', value: selectedZone.code },
              { 
                label: 'Population', 
                value: `${(selectedZone.population || 0).toLocaleString()} habitants` 
              },
              { 
                label: 'Superficie', 
                value: `${selectedZone.superficie_km2 || 0} km²` 
              },
              { 
                label: 'Coordonnées', 
                value: `${selectedZone.latitude}, ${selectedZone.longitude}` 
              },
              { 
                label: 'Couleur', 
                value: (
                  <span 
                    className="color-preview" 
                    style={{ background: selectedZone.couleur || '#4CAF50' }}
                  ></span>
                ) 
              }
            ]} />
            
            {/* Mini carte */}
            <div className="zone-detail-map">
              <h5>Localisation</h5>
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

            <div className="modal-actions">
              {canEdit && (
                <Button 
                  variant="primary" 
                  onClick={() => { 
                    setShowViewModal(false); 
                    handleEdit(selectedZone); 
                  }}
                  icon="fa-palette"
                >
                  Modifier la couleur
                </Button>
              )}
            </div>
          </>
        )}
      </Modal>

      {/* Modal d'édition */}
      <Modal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)} 
        title="Modifier la couleur" 
        headerIcon="fa-palette" 
        headerColor="#FF9800"
        size="sm"
      >
        {selectedZone && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span 
                style={{ 
                  display: 'inline-block',
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '12px',
                  background: selectedZone.couleur || '#4CAF50',
                  border: '3px solid #333'
                }} 
              ></span>
              <p style={{ marginTop: '10px', fontWeight: '500' }}>{selectedZone.nom}</p>
              <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '0.85rem' }}>{selectedZone.code}</p>
            </div>
            <FormGroup label="Couleur de la zone">
              <ColorPicker 
                value={selectedZone.couleur || '#4CAF50'} 
                onChange={(v) => setSelectedZone({...selectedZone, couleur: v})} 
                colors={colors} 
              />
            </FormGroup>
            <div className="modal-actions">
              <Button variant="primary" onClick={handleUpdateZone} icon="fa-save">
                Enregistrer
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* Modal de confirmation suppression */}
      <ModalConfirmation 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        title="Confirmer la suppression" 
        message={`Êtes-vous sûr de vouloir supprimer la zone ${selectedZone?.nom} ? Cette action est irréversible.`} 
        confirmText="Supprimer" 
        onConfirm={handleDeleteZone} 
        danger 
      />
    </div>
  );
}
