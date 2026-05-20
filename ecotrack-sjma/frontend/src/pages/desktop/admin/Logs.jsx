import { useState, useEffect, useCallback } from 'react';
import { Filters, SearchBox, SelectFilter } from '../../../components/common';
import Pagination from '../../../components/common/Pagination';
import { logsService } from '../../../services/logsService';
import './Logs.css';

const PAGE_SIZE = 50;

const levelColors = {
  critical: 'critical',
  error: 'error',
  warning: 'warn',
  info: 'info'
};

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [filterService, setFilterService] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filters, setFilters] = useState({ services: [], actions: [], levels: [] });
  const [page, setPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const totalPages = Math.max(1, Math.ceil(totalLogs / PAGE_SIZE));

  useEffect(() => {
    loadFilters();
  }, []);

  const loadFilters = async () => {
    try {
      const response = await logsService.getFilters();
      setFilters(response.filters || { services: [], actions: [], levels: [] });
    } catch (err) {
      console.error('Failed to load filters:', err);
    }
  };

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE
      };

      if (filterLevel !== 'all') params.level = filterLevel;
      if (filterAction !== 'all') params.action = filterAction;
      if (filterService !== 'all') params.service = filterService;
      if (searchTerm) params.search = searchTerm;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await logsService.getLogs(params);
      setLogs(response.logs || []);
      setTotalLogs(response.total || 0);
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, filterLevel, filterAction, filterService, searchTerm, startDate, endDate]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleSearch = () => {
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const resetFilters = () => {
    setFilterLevel('all');
    setFilterAction('all');
    setFilterService('all');
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleExport = async (format = 'json') => {
    try {
      const params = {};
      if (filterLevel !== 'all') params.level = filterLevel;
      if (filterAction !== 'all') params.action = filterAction;
      if (filterService !== 'all') params.service = filterService;
      if (searchTerm) params.search = searchTerm;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      params.format = format;

      const data = await logsService.exportLogs(params);
      
      if (format === 'csv') {
        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `logs_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `logs_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (err) {
      console.error('Failed to export logs:', err);
    }
  };

  const handleDeleteLogs = async () => {
    setDeleting(true);
    try {
      const params = {};
      if (filterLevel !== 'all') params.level = filterLevel;
      if (filterAction !== 'all') params.action = filterAction;
      if (filterService !== 'all') params.service = filterService;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      await logsService.deleteLogs(params);
      setShowDeleteModal(false);
      loadLogs();
    } catch (err) {
      console.error('Failed to delete logs:', err);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="logs-page">
      <h1>Logs d'audit</h1>

      <Filters>
        <SelectFilter
          value={filterService}
          onChange={(value) => { setFilterService(value); setPage(1); }}
          options={[
            { value: 'all', label: 'Tous services' },
            ...(filters.services || []).map(s => ({ value: s, label: s }))
          ]}
        />
        <SelectFilter
          value={filterLevel}
          onChange={(value) => { setFilterLevel(value); setPage(1); }}
          options={[
            { value: 'all', label: 'Tous niveaux' },
            ...(filters.levels || []).map(l => ({ value: l, label: l.toUpperCase() }))
          ]}
        />
        <SelectFilter
          value={filterAction}
          onChange={(value) => { setFilterAction(value); setPage(1); }}
          options={[
            { value: 'all', label: 'Toutes actions' },
            ...(filters.actions || []).map(a => ({ value: a, label: a.toUpperCase() }))
          ]}
        />
      </Filters>

      <div className="logs-date-filters">
          <div className="date-input-group">
            <label>Du:</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="date-input"
            />
          </div>
          <div className="date-input-group">
            <label>Au:</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="date-input"
            />
          </div>
        <SearchBox
          value={searchTerm}
          onChange={setSearchTerm}
          onSubmit={handleSearch}
          placeholder="Rechercher dans les logs..."
        />
        <button className="btn-outline" onClick={() => handleExport('json')}>
          <i className="fas fa-download"></i> Export JSON
        </button>
        <button className="btn-outline" onClick={() => handleExport('csv')}>
          <i className="fas fa-file-csv"></i> Export CSV
        </button>
        <button className="btn-outline btn-danger" onClick={() => setShowDeleteModal(true)}>
          <i className="fas fa-trash"></i> Supprimer
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i> Chargement...
        </div>
      ) : (
        <div className="logs-list">
          {logs.length === 0 ? (
            <div className="empty-state">Aucun log trouvé</div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="log-entry">
                <span className="log-time">{formatDate(log.timestamp)}</span>
                <span className={`log-level ${levelColors[log.level] || 'info'}`}>
                  {log.level?.toUpperCase()}
                </span>
                <span className="log-service">{log.service}</span>
                <span className="log-action">{log.action?.toUpperCase()}</span>
                <span className="log-msg">{log.message}</span>
                {log.archived && <span className="log-archived-badge">Archivé</span>}
              </div>
            ))
          )}
        </div>
      )}

      {!loading && totalLogs > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          showingFrom={(page - 1) * PAGE_SIZE + 1}
          showingTo={Math.min(page * PAGE_SIZE, totalLogs)}
          totalItems={totalLogs}
          label="logs"
        />
      )}

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3><i className="fas fa-exclamation-triangle" style={{ color: '#f44336' }}></i> Supprimer les logs</h3>
            <p style={{ margin: '20px 0', color: '#666' }}>
              Voulez-vous vraiment supprimer les logs selon les filtres sélectionnés ?
              <br /><br />
              <strong>Seuls les logs archivés (antérieurs à 7 jours) seront supprimés.</strong>
              <br />
              Les logs récents non archivés sont conservés automatiquement.
            </p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>Annuler</button>
              <button className="btn-confirm-danger" onClick={handleDeleteLogs} disabled={deleting}>
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
