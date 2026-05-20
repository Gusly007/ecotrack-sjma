import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './NotificationsPage.css';

const TYPE_LABELS = {
  ALERTE: 'Alerte',
  ADMIN_ALERTE: 'Alerte admin',
  ADMIN_SERVICE: 'Service hors ligne',
  ADMIN_SECURITE: 'Sécurité',
  ADMIN_IOT: 'IoT',
  ADMIN_PERFORMANCE: 'Performance',
  ADMIN_SEUIL: 'Seuil',
  ADMIN_ML: 'Machine Learning',
};

const TYPE_COLORS = {
  ALERTE:           { bg: '#fff3e0', color: '#e65100' },
  ADMIN_ALERTE:     { bg: '#ffebee', color: '#c62828' },
  ADMIN_SERVICE:    { bg: '#fce4ec', color: '#ad1457' },
  ADMIN_SECURITE:   { bg: '#f3e5f5', color: '#6a1b9a' },
  ADMIN_IOT:        { bg: '#e8f5e9', color: '#2e7d32' },
  ADMIN_PERFORMANCE:{ bg: '#e3f2fd', color: '#1565c0' },
  ADMIN_SEUIL:      { bg: '#e0f2f1', color: '#00695c' },
  ADMIN_ML:         { bg: '#ede7f6', color: '#4527a0' },
};

const PRIORITY_CONFIG = {
  1: { label: 'Urgent',  className: 'prio-urgent' },
  2: { label: 'Haute',   className: 'prio-haute' },
  3: { label: 'Normale', className: 'prio-normale' },
  4: { label: 'Basse',   className: 'prio-basse' },
};

const PAGE_SIZE = 20;

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || user?.role_par_defaut;
  const isAdmin = role === 'ADMIN';

  const config = useMemo(() => ({
    listPath:     isAdmin ? '/api/admin/notifications'          : '/api/notifications/list',
    markReadPath: (id) => isAdmin
      ? `/api/admin/notifications/${id}/read`
      : `/api/notifications/${id}/read`,
    markAllPath:  isAdmin ? '/api/admin/notifications/read-all' : '/api/notifications/read-all',
    deletePath:   (id) => isAdmin
      ? `/api/admin/notifications/${id}`
      : `/api/notifications/${id}`,
    backPath:     isAdmin ? '/admin' : '/gestionnaire',
  }), [isAdmin]);

  const [allNotifs, setAllNotifs]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [filter, setFilter]               = useState('all');
  const [typeFilter, setTypeFilter]       = useState('');
  const [page, setPage]                   = useState(1);
  const [actionLoading, setActionLoading] = useState(null);

  const load = useCallback(async (bust = false) => {
    setLoading(true);
    setError('');
    try {
      const params = { page: 1, limit: 100 };
      if (bust) params._t = Date.now();
      const res = await api.get(config.listPath, { params });
      const payload = res?.data?.data ?? res?.data ?? [];
      const items = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data) ? payload.data : [];
      setAllNotifs(items);
    } catch {
      setError('Impossible de charger les notifications');
    } finally {
      setLoading(false);
    }
  }, [config.listPath]);

  useEffect(() => {
    load();

    // Reload when tab becomes visible again
    const onVisible = () => { if (!document.hidden) load(); };
    document.addEventListener('visibilitychange', onVisible);

    // Auto-refresh every 30s to pick up new Kafka-pushed notifications
    const interval = setInterval(load, 30_000);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(interval);
    };
  }, [load]);

  const stats = useMemo(() => ({
    total:  allNotifs.length,
    unread: allNotifs.filter(n => !n.est_lu).length,
    read:   allNotifs.filter(n => n.est_lu).length,
  }), [allNotifs]);

  const availableTypes = useMemo(() =>
    [...new Set(allNotifs.map(n => n.type).filter(Boolean))],
    [allNotifs]
  );

  const filtered = useMemo(() => {
    let list = allNotifs;
    if (filter === 'unread') list = list.filter(n => !n.est_lu);
    if (filter === 'read')   list = list.filter(n => n.est_lu);
    if (typeFilter)          list = list.filter(n => n.type === typeFilter);
    return list;
  }, [allNotifs, filter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const notifyBell = () => window.dispatchEvent(new CustomEvent('notifications-refresh'));

  const handleMarkRead = async (notif) => {
    if (notif.est_lu) return;
    setActionLoading(notif.id_notification);
    try {
      await api.patch(config.markReadPath(notif.id_notification));
      setAllNotifs(prev => prev.map(n =>
        n.id_notification === notif.id_notification ? { ...n, est_lu: true } : n
      ));
      notifyBell();
      load(true);
    } catch { /* silent */ }
    finally { setActionLoading(null); }
  };

  const handleMarkAll = async () => {
    setActionLoading('all');
    try {
      await api.patch(config.markAllPath);
      setAllNotifs(prev => prev.map(n => ({ ...n, est_lu: true })));
      notifyBell();
      load(true);
    } catch { /* silent */ }
    finally { setActionLoading(null); }
  };

  const handleDelete = async (notif) => {
    const key = `del-${notif.id_notification}`;
    setActionLoading(key);
    try {
      await api.delete(config.deletePath(notif.id_notification));
      setAllNotifs(prev => prev.filter(n => n.id_notification !== notif.id_notification));
      notifyBell();
      load(true);
    } catch { /* silent */ }
    finally { setActionLoading(null); }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="notifs-page">

      {/* Header */}
      <div className="notifs-page-header">
        <div className="notifs-page-title">
          <button className="back-btn" onClick={() => navigate(config.backPath)}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h2><i className="fas fa-bell"></i> Mes notifications</h2>
        </div>
        <button
          className="btn-refresh"
          onClick={load}
          disabled={loading}
          title="Rafraîchir"
        >
          <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
        </button>
        <button
          className="btn-mark-all"
          onClick={handleMarkAll}
          disabled={actionLoading === 'all' || stats.unread === 0}
        >
          {actionLoading === 'all'
            ? <i className="fas fa-spinner fa-spin"></i>
            : <i className="fas fa-check-double"></i>
          }
          {' '}Tout marquer comme lu
        </button>
      </div>

      {/* Stats */}
      <div className="notifs-stats">
        <div className="stat-card">
          <span className="stat-number">{stats.total}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-card unread">
          <span className="stat-number">{stats.unread}</span>
          <span className="stat-label">Non lues</span>
        </div>
        <div className="stat-card read">
          <span className="stat-number">{stats.read}</span>
          <span className="stat-label">Lues</span>
        </div>
      </div>

      {/* Filters */}
      <div className="notifs-filters">
        <div className="filter-tabs">
          {[
            { key: 'all',    label: 'Toutes',   count: stats.total  },
            { key: 'unread', label: 'Non lues', count: stats.unread },
            { key: 'read',   label: 'Lues',     count: stats.read   },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              className={`filter-tab ${filter === key ? 'active' : ''}`}
              onClick={() => { setFilter(key); setPage(1); }}
            >
              {label}
              <span className="filter-count">{count}</span>
            </button>
          ))}
        </div>

        {availableTypes.length > 1 && (
          <select
            className="type-filter-select"
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          >
            <option value="">Tous les types</option>
            {availableTypes.map(t => (
              <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>
            ))}
          </select>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="notif-error-bar">
          <i className="fas fa-exclamation-circle"></i> {error}
          <button onClick={load} className="btn-retry">Réessayer</button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="notif-state-center">
          <i className="fas fa-spinner fa-spin fa-2x"></i>
          <p>Chargement des notifications...</p>
        </div>
      ) : paginated.length === 0 ? (
        <div className="notif-state-center">
          <i className="fas fa-bell-slash fa-2x" style={{ color: '#bbb' }}></i>
          <p style={{ color: '#888' }}>
            Aucune notification{filter === 'unread' ? ' non lue' : filter === 'read' ? ' lue' : ''}
          </p>
        </div>
      ) : (
        <div className="notifs-list">
          {paginated.map((notif) => (
            <div
              key={notif.id_notification}
              className={`notif-row ${notif.est_lu ? 'is-read' : 'is-unread'}`}
            >
              <span className={`notif-status-dot ${notif.est_lu ? 'read' : 'unread'}`}></span>

              <div className="notif-body-content">
                <div className="notif-titre">{notif.titre || 'Notification'}</div>
                <div className="notif-corps">{notif.corps || ''}</div>
                <div className="notif-meta-row">
                  {notif.type && (
                    <span
                      className="notif-type-chip"
                      style={{
                        background: TYPE_COLORS[notif.type]?.bg || '#f5f5f5',
                        color:      TYPE_COLORS[notif.type]?.color || '#666',
                      }}
                    >
                      {TYPE_LABELS[notif.type] || notif.type}
                    </span>
                  )}
                  {notif.priorite != null && PRIORITY_CONFIG[notif.priorite] && (
                    <span className={`notif-prio-chip ${PRIORITY_CONFIG[notif.priorite].className}`}>
                      {PRIORITY_CONFIG[notif.priorite].label}
                    </span>
                  )}
                  <span className="notif-date-chip">
                    <i className="fas fa-clock"></i> {formatDate(notif.date_creation)}
                  </span>
                </div>
              </div>

              <div className="notif-row-actions">
                {!notif.est_lu && (
                  <button
                    className="action-btn action-read"
                    title="Marquer comme lu"
                    onClick={() => handleMarkRead(notif)}
                    disabled={actionLoading === notif.id_notification}
                  >
                    {actionLoading === notif.id_notification
                      ? <i className="fas fa-spinner fa-spin"></i>
                      : <i className="fas fa-check"></i>
                    }
                  </button>
                )}
                <button
                  className="action-btn action-delete"
                  title="Supprimer"
                  onClick={() => handleDelete(notif)}
                  disabled={actionLoading === `del-${notif.id_notification}`}
                >
                  {actionLoading === `del-${notif.id_notification}`
                    ? <i className="fas fa-spinner fa-spin"></i>
                    : <i className="fas fa-trash-alt"></i>
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="notif-pagination">
          <span className="pagination-info">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} sur {filtered.length}
          </span>
          <div className="pagination-btns">
            <button
              className="page-btn"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                className={`page-btn ${p === page ? 'active' : ''}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              className="page-btn"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
