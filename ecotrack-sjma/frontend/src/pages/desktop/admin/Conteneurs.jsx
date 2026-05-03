import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Alert, Pagination, Modal, ModalConfirmation, DetailView, useAlert, Button, StatCard, StatsGrid } from '../../../components/common';
import ConteneurFilters from '../../../components/desktop/shared/ConteneurFilters';
import ConteneurTable from '../../../components/desktop/shared/ConteneurTable';
import ConteneurAddModal from '../../../components/desktop/shared/ConteneurAddModal';
import ConteneurEditModal from '../../../components/desktop/shared/ConteneurEditModal';
import { containerService } from '../../../services/containerService';
import { zoneService } from '../../../services/zoneService';
import { typeConteneurService } from '../../../services/typeConteneurService';
import '../../../components/common/Pagination.css';
import './Conteneurs.css';

export default function ConteneursPage() {
  const { user } = useAuth();
  const { alert, showSuccess, showError } = useAlert();
  
  // Données
  const [conteneurs, setConteneurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;
  
  // Types et zones pour les filtres
  const [types, setTypes] = useState([]);
  const [zones, setZones] = useState([]);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedConteneur, setSelectedConteneur] = useState(null);

  // Permissions selon le rôle
  const role = user?.role || user?.role_par_defaut || 'MANAGER';
  const canCreate = role === 'ADMIN';
  const canEdit = role === 'ADMIN';
  const canDelete = role === 'ADMIN';

  // Charger les types de conteneurs
  const loadTypes = useCallback(async () => {
    try {
      const response = await typeConteneurService.getAll();
      let data = [];
      if (response.data) {
        data = response.data.data || response.data || [];
      } else if (Array.isArray(response)) {
        data = response;
      }
      setTypes(data);
    } catch (err) {
      console.error('Erreur chargement types:', err);
    }
  }, []);

  // Charger les zones
  const loadZones = useCallback(async () => {
    try {
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
    }
  }, []);

  // Charger les statistiques
  const loadStats = useCallback(async () => {
    try {
      const response = await containerService.getStatistics();
      if (response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Erreur stats:', err);
    }
  }, []);

  // Charger les conteneurs
  const loadConteneurs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await containerService.getAll(currentPage, itemsPerPage, {
        statut: statutFilter || undefined,
        id_zone: zoneFilter || undefined,
        id_type: typeFilter || undefined,
        search: searchTerm || undefined
      });
      
      let data = [];
      let pagination = { pages: 1, total: 0 };

      // Le service frontend retourne deja le payload API (pas l'objet Axios).
      if (response?.data && Array.isArray(response.data)) {
        // Format: { data: [...], pagination: {...} }
        data = response.data;
        pagination = response.pagination || pagination;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        // Format legacy imbrique
        data = response.data.data;
        pagination = response.data.pagination || pagination;
      } else if (Array.isArray(response)) {
        // Fallback legacy
        data = response;
      }
      
      // Charger aussi le fill_level pour chaque conteneur
      const fillResponse = await containerService.getWithFillLevel().catch(() => null);
      let fillData = [];
      if (fillResponse?.data) {
        fillData = fillResponse.data.data || fillResponse.data || [];
      } else if (Array.isArray(fillResponse)) {
        fillData = fillResponse;
      }
      
      // Fusionner les données
      const fillMap = {};
      fillData.forEach(f => {
        fillMap[f.id_conteneur || f.id] = f;
      });
      const safeData = Array.isArray(data) ? data : [];
      const safeTotalItems = pagination.total ?? safeData.length;
      const safeTotalPages = pagination.pages || pagination.totalPages || Math.max(1, Math.ceil(safeTotalItems / itemsPerPage));

      const mergedData = safeData.map(c => ({
        ...c,
        fill_level: fillMap[c.id_conteneur || c.id]?.fill_level || 0
      }));
      
      setConteneurs(mergedData);
      setTotalPages(safeTotalPages);
      setTotalItems(safeTotalItems);
    } catch (err) {
      console.error('Erreur chargement conteneurs:', err);
      showError('Erreur lors du chargement des conteneurs');
      setConteneurs([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, statutFilter, zoneFilter, typeFilter, searchTerm, showError]);

  // Chargement initial
  useEffect(() => {
    loadTypes();
    loadZones();
    loadStats();
  }, [loadTypes, loadZones, loadStats]);

  useEffect(() => {
    loadConteneurs();
  }, [loadConteneurs]);

  // Handlers
  const handleView = (conteneur) => {
    setSelectedConteneur(conteneur);
    setShowViewModal(true);
  };

  const handleEdit = (conteneur) => {
    setSelectedConteneur(conteneur);
    setShowEditModal(true);
  };

  const handleDelete = (conteneur) => {
    setSelectedConteneur(conteneur);
    setShowDeleteModal(true);
  };

  const handleAddSuccess = () => {
    loadConteneurs();
    loadStats();
    showSuccess('Conteneur ajouté avec succès');
  };

  const handleEditSuccess = () => {
    loadConteneurs();
    loadStats();
    showSuccess('Conteneur mis à jour avec succès');
  };

  const handleDeleteConfirm = async () => {
    try {
      const id = selectedConteneur.id_conteneur || selectedConteneur.id;
      await containerService.delete(id);
      showSuccess('Conteneur supprimé avec succès');
      setShowDeleteModal(false);
      loadConteneurs();
      loadStats();
    } catch (err) {
      showError(err.message || 'Erreur lors de la suppression');
    }
  };

  const enrichedConteneurs = useMemo(() => {
    const typeMap = new Map(
      (types || []).map((t) => [
        Number(t.id_type ?? t.id),
        t.nom || t.code || null
      ])
    );
    const zoneMap = new Map(
      (zones || []).map((z) => [
        Number(z.id_zone ?? z.id),
        z.nom || null
      ])
    );

    return (conteneurs || []).map((c) => {
      const typeId = Number(c.id_type);
      const zoneId = Number(c.id_zone);

      return {
        ...c,
        type_nom: c.type_nom || typeMap.get(typeId) || c.type || null,
        zone_nom: c.zone_nom || zoneMap.get(zoneId) || c.zone || null
      };
    });
  }, [conteneurs, types, zones]);

  return (
    <div className="conteneurs-page">
      <div className="users-header">
        <h2 className="page-title">Gestion des Conteneurs</h2>
        {canCreate && (
          <Button variant="primary" onClick={() => setShowAddModal(true)} icon="fa-plus">
            Ajouter un conteneur
          </Button>
        )}
      </div>

      {alert && (
        <Alert type={alert.type} message={alert.message} onClose={() => {}} />
      )}

      {stats && (
        <StatsGrid>
          <StatCard 
            icon="fa-dumpster" 
            iconColor="green" 
            label="Total conteneurs" 
            value={stats.total_conteneurs || stats.total || 0} 
          />
          <StatCard 
            icon="fa-check-circle" 
            iconColor="blue" 
            label="Actifs" 
            value={stats.actifs || 0} 
          />
          <StatCard 
            icon="fa-tools" 
            iconColor="orange" 
            label="En maintenance" 
            value={stats.en_maintenance || 0} 
          />
          <StatCard 
            icon="fa-exclamation-circle" 
            iconColor="red" 
            label="Hors service" 
            value={stats.hors_service || stats.inactifs || 0} 
          />
        </StatsGrid>
      )}

      <ConteneurFilters
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        typeFilter={typeFilter}
        onTypeChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}
        zoneFilter={zoneFilter}
        onZoneChange={(v) => { setZoneFilter(v); setCurrentPage(1); }}
        statutFilter={statutFilter}
        onStatutChange={(v) => { setStatutFilter(v); setCurrentPage(1); }}
        types={types}
        zones={zones}
      />

      <div className="panel conteneurs-panel">
        <ConteneurTable
          conteneurs={enrichedConteneurs}
          loading={loading}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          canEdit={canEdit}
          canDelete={canDelete}
        />
        
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          showingFrom={(currentPage - 1) * itemsPerPage + 1}
          showingTo={Math.min(currentPage * itemsPerPage, totalItems)}
          totalItems={totalItems}
          label="conteneurs"
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modal d'ajout */}
      <ConteneurAddModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
        types={types}
      />

      {/* Modal de visualisation */}
      <Modal 
        isOpen={showViewModal} 
        onClose={() => setShowViewModal(false)} 
        title="Détails du conteneur" 
        headerIcon="fa-dumpster" 
        headerColor="#4CAF50" 
        size="md"
      >
        {selectedConteneur && (
          <>
            <DetailView items={[
              { label: 'UID', value: selectedConteneur.uid || selectedConteneur.id },
              { label: 'Type', value: selectedConteneur.type_nom || selectedConteneur.type || '-' },
              { label: 'Capacité', value: `${selectedConteneur.capacite_l || 0}L` },
              { label: 'Zone', value: selectedConteneur.zone_nom || selectedConteneur.zone || '-' },
              { label: 'Remplissage', value: `${Math.round(selectedConteneur.fill_level || 0)}%` },
              { 
                label: 'Statut', 
                value: (
                  <span className={`statut-badge ${
                    selectedConteneur.statut === 'ACTIF' ? 'statut-actif' : 
                    selectedConteneur.statut === 'EN_MAINTENANCE' ? 'statut-maintenance' : 'statut-hors-service'
                  }`}>
                    {selectedConteneur.statut === 'ACTIF' ? 'Actif' : 
                     selectedConteneur.statut === 'EN_MAINTENANCE' ? 'Maintenance' : 'Hors service'}
                  </span>
                )
              }
            ]} />
            {canEdit && (
              <div className="modal-actions">
                <Button 
                  variant="primary" 
                  onClick={() => { 
                    setShowViewModal(false); 
                    handleEdit(selectedConteneur); 
                  }}
                  icon="fa-edit"
                >
                  Modifier
                </Button>
              </div>
            )}
          </>
        )}
      </Modal>

      {/* Modal d'édition */}
      <ConteneurEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleEditSuccess}
        conteneur={selectedConteneur}
        types={types}
      />

      {/* Modal de confirmation suppression */}
      <ModalConfirmation 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        title="Confirmer la suppression" 
        message={`Êtes-vous sûr de vouloir supprimer le conteneur ${selectedConteneur?.uid || selectedConteneur?.id} ? Cette action est irréversible.`} 
        confirmText="Supprimer" 
        onConfirm={handleDeleteConfirm} 
        danger 
      />
    </div>
  );
}
