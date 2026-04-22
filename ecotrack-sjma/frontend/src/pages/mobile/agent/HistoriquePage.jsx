import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import MobileLayout from '../../../components/mobile/MobileLayout';
import MobileListItem from '../../../components/mobile/MobileListItem';
import EmptyState from '../../../components/mobile/EmptyState';
import { fetchAgentHistory } from '../../../services/tourneeService';
import './HistoriquePage.css';

const STATUT_COLORS = {
  TERMINEE: { bg: '#e8f5e9', color: '#4CAF50' },
  EN_COURS: { bg: '#fff3e0', color: '#FF9800' },
  ANNULEE: { bg: '#fef0f0', color: '#f44336' },
  PLANIFIEE: { bg: '#e3f2fd', color: '#2196F3' },
};

export default function HistoriquePage() {
  const { user } = useAuth();
  const [tournees, setTournees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const userId = user?.id_utilisateur || user?.id;
        const res = await fetchAgentHistory(userId);
        setTournees(res.data || []);
      } catch {
        setTournees([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  if (loading) {
    return (
      <MobileLayout title="Historique" showBack>
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: '#4CAF50' }}></i>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Historique" showBack>
      {tournees.length === 0 ? (
        <EmptyState icon="fa-history" title="Aucun historique" message="Vos tournees passees apparaitront ici." />
      ) : (
        tournees.map((t, i) => {
          const style = STATUT_COLORS[t.statut] || STATUT_COLORS.PLANIFIEE;
          return (
            <MobileListItem
              key={t.id_tournee || i}
              icon="fa-route"
              iconColor={style.color}
              iconBg={style.bg}
              title={`${t.code || `Tournee #${t.id_tournee}`}`}
              subtitle={`${t.date_tournee ? new Date(t.date_tournee).toLocaleDateString('fr-FR') : ''} — ${t.zone_nom || ''}`}
              right={
                <span className="historique-badge" style={{ background: style.bg, color: style.color }}>
                  {t.statut}
                </span>
              }
            />
          );
        })
      )}
    </MobileLayout>
  );
}
