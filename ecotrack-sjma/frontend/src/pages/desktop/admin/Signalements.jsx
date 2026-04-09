import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Alert, Pagination, useAlert, Button, StatCard, StatsGrid } from '../../../components/common';
import SignalementFilters from '../../../components/desktop/shared/SignalementFilters';
import SignalementTable from '../../../components/desktop/shared/SignalementTable';
import SignalementDetailModal from '../../../components/desktop/shared/SignalementDetailModal';
import { signalementService } from '../../../services/signalementService';
import './Signalements.css';

export default function SignalementsPage() {
  const { user } = useAuth();
  const { alert, showSuccess, showError } = useAlert();

  const role = user?.role || user?.role_par_defaut || 'MANAGER';
  const canUpdate = role === 'ADMIN' || role === 'GESTIONNAIRE';

  const [signalements, setSignalements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [urgenceFilter, setUrgenceFilter] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const [selectedSignalement, setSelectedSignalement] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const normalizeStats = (rawStats) => {
    if (!rawStats) return null;

    return {
      total: Number(rawStats.total ?? rawStats.totalSignalements ?? 0),
      nouveaux: Number(rawStats.nouveaux ?? rawStats.nouveau ?? 0),
      enCours: Number(rawStats.enCours ?? rawStats.en_cours ?? 0),
      resolus: Number(rawStats.resolus ?? rawStats.resolu ?? 0),
      rejetes: Number(rawStats.rejetes ?? rawStats.rejete ?? 0)
    };
  };

  const loadSignalements = useCallback(async () => {
    try {
      setLoading(true);
      const response = await signalementService.getAll(currentPage, itemsPerPage, {
        statut: statutFilter || undefined,
        urgence: urgenceFilter || undefined,
        search: searchTerm || undefined
      });

      let data = [];
      let pagination = { totalPages: 1, total: 0 };

      if (response?.data) {
        data = response.data.data || [];
        pagination = response.data.pagination || { totalPages: 1, total: data.length };
      } else if (Array.isArray(response)) {
        data = response;
        pagination = { totalPages: 1, total: response.length };
      }

      setSignalements(data);
      setTotalPages(pagination.totalPages || 1);
      setTotalItems(pagination.total || 0);
    } catch (err) {
      console.error('Erreur chargement signalements:', err);
      showError('Erreur lors du chargement des signalements');
      setSignalements([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, statutFilter, urgenceFilter, searchTerm, showError]);

  const loadStats = useCallback(async () => {
    try {
      const response = await signalementService.getStats();
      const statsData = normalizeStats(response?.data || response);
      if (statsData) setStats(statsData);
    } catch (err) {
      console.error('Erreur stats:', err);
    }
  }, []);

  useEffect(() => {
    loadSignalements();
  }, [loadSignalements]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleView = (signalement) => {
    setSelectedSignalement(signalement);
    setShowDetailModal(true);
  };

  const handleUpdate = (signalement) => {
    setSelectedSignalement(signalement);
    setShowDetailModal(true);
  };

  const handleSuccess = () => {
    loadSignalements();
    loadStats();
    showSuccess('Signalement mis à jour avec succès');
  };

  const filteredStats = stats || {
    total: signalements.length,
    nouveaux: signalements.filter(s => s.statut?.toUpperCase() === 'NOUVEAU').length,
    enCours: signalements.filter(s => s.statut?.toUpperCase() === 'EN_COURS').length,
    resolus: signalements.filter(s => s.statut?.toUpperCase() === 'RESOLU').length,
    rejetes: signalements.filter(s => s.statut?.toUpperCase() === 'REJETE').length
  };

  return (
    <div className="signalements-page">
      <div className="page-header">
        <h1>Signalements Citoyens</h1>
      </div>

      {alert && (
        <Alert type={alert.type} message={alert.message} onClose={() => {}} />
      )}

      <StatsGrid>
        <StatCard 
          icon="fa-flag" 
          iconColor="blue" 
          label="Total signalements" 
          value={filteredStats.total || 0} 
        />
        <StatCard 
          icon="fa-inbox" 
          iconColor="blue" 
          label="Nouveaux" 
          value={filteredStats.nouveaux || filteredStats.nouveau || 0} 
        />
        <StatCard 
          icon="fa-spinner" 
          iconColor="orange" 
          label="En cours" 
          value={filteredStats.enCours || filteredStats.en_cours || 0} 
        />
        <StatCard 
          icon="fa-check-double" 
          iconColor="green" 
          label="Résolus" 
          value={filteredStats.resolus || 0} 
        />
        <StatCard 
          icon="fa-ban" 
          iconColor="red" 
          label="Rejetés" 
          value={filteredStats.rejetes || 0} 
        />
      </StatsGrid>

      <SignalementFilters
        searchValue={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setCurrentPage(1);
        }}
        statutFilter={statutFilter}
        onStatutChange={(v) => { setStatutFilter(v); setCurrentPage(1); }}
        urgenceFilter={urgenceFilter}
        onUrgenceChange={(v) => { setUrgenceFilter(v); setCurrentPage(1); }}
      />

      <div className="panel signalements-panel">
        <SignalementTable
          signalements={signalements}
          loading={loading}
          onView={handleView}
          onUpdate={handleUpdate}
          canUpdate={canUpdate}
          role={role}
        />

        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          showingFrom={(currentPage - 1) * itemsPerPage + 1}
          showingTo={Math.min(currentPage * itemsPerPage, totalItems)}
          totalItems={totalItems}
          label="signalements"
          onPageChange={setCurrentPage}
        />
      </div>

      <SignalementDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onSuccess={handleSuccess}
        signalement={selectedSignalement}
        role={role}
        canUpdate={canUpdate}
      />
    </div>
  );
}
