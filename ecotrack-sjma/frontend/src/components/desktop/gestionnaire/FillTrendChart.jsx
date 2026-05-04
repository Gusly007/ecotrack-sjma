import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pagination } from '../../common';
import { analyticsService } from '../../../services/analyticsService';

const PAGE_SIZE = 10;

function clampPercent(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
}

function formatDateLabel(dateValue) {
  if (!dateValue) return '-';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue);
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

function barColor(level) {
  if (level >= 80) return 'linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)';
  if (level >= 50) return 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)';
  return 'linear-gradient(180deg, #22c55e 0%, #15803d 100%)';
}

export default function FillTrendChart({ days = 30, pageSize = PAGE_SIZE }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [points, setPoints] = useState([]);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyticsService.getFillTrends(days);
      const raw = result?.data?.trends ?? result?.trends ?? [];
      setPoints(
        Array.isArray(raw)
          ? raw.map((p) => ({
              dateLabel: formatDateLabel(p.date),
              level: clampPercent(p.avgFillLevel),
              measurementCount: Number(p.measurementCount ?? 0),
            }))
          : []
      );
      setPage(1);
    } catch {
      setError('Impossible de charger les tendances de remplissage.');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(points.length / pageSize));
  const paginated = useMemo(
    () => points.slice((page - 1) * pageSize, page * pageSize),
    [points, page, pageSize]
  );

  const avgLevel = useMemo(() => {
    if (!paginated.length) return 0;
    return paginated.reduce((sum, p) => sum + p.level, 0) / paginated.length;
  }, [paginated]);

  if (loading) {
    return (
      <div className="ftc-wrap">
        <div className="ftc-header">
          <h3>Evolution du taux de remplissage ({days} jours)</h3>
        </div>
        <div className="ftc-empty"><i className="fas fa-spinner fa-spin" /> Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ftc-wrap">
        <div className="ftc-header">
          <h3>Evolution du taux de remplissage ({days} jours)</h3>
          <button type="button" className="ftc-retry-btn" onClick={load}>
            <i className="fas fa-redo" /> Réessayer
          </button>
        </div>
        <div className="ftc-empty ftc-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="ftc-wrap">
      <div className="ftc-header">
        <h3>Evolution du taux de remplissage ({days} jours)</h3>
        <span className="ftc-count">{points.length} point{points.length !== 1 ? 's' : ''}</span>
      </div>

      {!points.length ? (
        <div className="ftc-empty">Aucune donnée de tendance disponible.</div>
      ) : (
        <>
          <div className="ftc-avg-row">
            <span className="ftc-avg-label">Moyenne sur la page</span>
            <span
              className={`ftc-avg-badge ${
                avgLevel >= 80 ? 'danger' : avgLevel >= 50 ? 'warning' : 'ok'
              }`}
            >
              {avgLevel.toFixed(1)}%
            </span>
          </div>

          <div className="ftc-chart">
            {paginated.map((point, index) => (
              <div className="ftc-col" key={`${point.dateLabel}-${index}`} title={`${point.measurementCount} mesure(s)`}>
                <div className="ftc-value">{point.level.toFixed(0)}%</div>
                <div className="ftc-bar-wrap">
                  <div
                    className="ftc-bar"
                    style={{
                      height: `${Math.max(4, point.level)}%`,
                      background: barColor(point.level),
                    }}
                  />
                </div>
                <div className="ftc-label">{point.dateLabel}</div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            showingFrom={(page - 1) * pageSize + 1}
            showingTo={Math.min(page * pageSize, points.length)}
            totalItems={points.length}
            label="jour"
          />
        </>
      )}
    </div>
  );
}
