import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pagination } from '../../common';
import { analyticsService } from '../../../services/analyticsService';

const PAGE_SIZE = 5;

function clampPercent(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
}

function fillColor(rate) {
  if (rate >= 80) return 'linear-gradient(90deg, #ef4444 0%, #b91c1c 100%)';
  if (rate >= 50) return 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)';
  return 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)';
}

function normalizeZone(zone) {
  return {
    id: zone.id ?? zone.id_zone ?? zone.zone_id,
    label: zone.code || zone.name || zone.zone_code || zone.zone_nom || `Zone ${zone.id}`,
    containers: Number(zone.containerCount ?? zone.nombre_conteneurs ?? 0),
    fillRate: clampPercent(zone.fillRate ?? zone.taux_remplissage),
    collectionsCount: Number(zone.collectionsCount ?? zone.nombre_collectes ?? 0),
  };
}

export default function ZoneRepartitionTable({ pageSize = PAGE_SIZE }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zones, setZones] = useState([]);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState('fillRate');
  const [sortDir, setSortDir] = useState('desc');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyticsService.getZonePerformance();
      const raw = result?.data?.zones ?? result?.zones ?? [];
      setZones(Array.isArray(raw) ? raw.map(normalizeZone) : []);
    } catch {
      setError('Impossible de charger les données par zone.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sorted = useMemo(() => {
    return [...zones].sort((a, b) => {
      const va = a[sortField];
      const vb = b[sortField];
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortDir === 'asc' ? va - vb : vb - va;
    });
  }, [zones, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  function handleSort(field) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(1);
  }

  function sortIcon(field) {
    if (sortField !== field) return <i className="fas fa-sort zrt-sort-icon muted" />;
    return <i className={`fas fa-sort-${sortDir === 'asc' ? 'up' : 'down'} zrt-sort-icon`} />;
  }

  if (loading) {
    return (
      <div className="zrt-wrap">
        <div className="zrt-header">
          <h3>Répartition par zone</h3>
        </div>
        <div className="zrt-empty"><i className="fas fa-spinner fa-spin" /> Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="zrt-wrap">
        <div className="zrt-header">
          <h3>Répartition par zone</h3>
          <button type="button" className="zrt-retry-btn" onClick={load}>
            <i className="fas fa-redo" /> Réessayer
          </button>
        </div>
        <div className="zrt-empty zrt-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="zrt-wrap">
      <div className="zrt-header">
        <h3>Répartition par zone</h3>
        <span className="zrt-count">{zones.length} zone{zones.length !== 1 ? 's' : ''}</span>
      </div>

      {zones.length === 0 ? (
        <div className="zrt-empty">Aucune donnée par zone disponible.</div>
      ) : (
        <>
          <table className="zrt-table">
            <thead>
              <tr>
                <th className="zrt-th-zone" scope="col">
                  <button
                    type="button"
                    onClick={() => handleSort('label')}
                    style={{
                      background: 'none',
                      border: 0,
                      padding: 0,
                      font: 'inherit',
                      color: 'inherit',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    Zone {sortIcon('label')}
                  </button>
                </th>
                <th scope="col">
                  <button
                    type="button"
                    onClick={() => handleSort('containers')}
                    style={{
                      background: 'none',
                      border: 0,
                      padding: 0,
                      font: 'inherit',
                      color: 'inherit',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    Conteneurs {sortIcon('containers')}
                  </button>
                </th>
                <th scope="col">
                  <button
                    type="button"
                    onClick={() => handleSort('collectionsCount')}
                    style={{
                      background: 'none',
                      border: 0,
                      padding: 0,
                      font: 'inherit',
                      color: 'inherit',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    Collectes {sortIcon('collectionsCount')}
                  </button>
                </th>
                <th scope="col">
                  <button
                    type="button"
                    onClick={() => handleSort('fillRate')}
                    style={{
                      background: 'none',
                      border: 0,
                      padding: 0,
                      font: 'inherit',
                      color: 'inherit',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    Taux remplissage {sortIcon('fillRate')}
                  </button>
                </th>
                <th className="zrt-th-bar" scope="col">Niveau</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((zone) => (
                <tr key={zone.id ?? zone.label}>
                  <td className="zrt-td-label">{zone.label}</td>
                  <td className="zrt-td-num">{zone.containers}</td>
                  <td className="zrt-td-num">{zone.collectionsCount}</td>
                  <td className="zrt-td-rate">
                    <span
                      className={`zrt-rate-badge ${
                        zone.fillRate >= 80 ? 'danger' : zone.fillRate >= 50 ? 'warning' : 'ok'
                      }`}
                    >
                      {zone.fillRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="zrt-td-bar">
                    <div className="zrt-track">
                      <div
                        className="zrt-fill"
                        style={{ width: `${zone.fillRate}%`, background: fillColor(zone.fillRate) }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            showingFrom={(page - 1) * pageSize + 1}
            showingTo={Math.min(page * pageSize, zones.length)}
            totalItems={zones.length}
            label="zone"
          />
        </>
      )}
    </div>
  );
}
