import { useNavigate } from 'react-router-dom';
import { Table } from '../../common';
import './SignalementList.css';

export default function SignalementTable({ 
  signalements, 
  loading, 
  onView, 
  onUpdate,
  canUpdate,
  role
}) {
  const navigate = useNavigate();
  const getUrgenceClass = (urgence) => {
    switch (urgence?.toUpperCase()) {
      case 'HAUTE': return 'urgence-haute';
      case 'MOYENNE': return 'urgence-moyenne';
      case 'BASSE': return 'urgence-basse';
      default: return '';
    }
  };

  const getUrgenceLabel = (urgence) => {
    switch (urgence?.toUpperCase()) {
      case 'HAUTE': return 'Haute';
      case 'MOYENNE': return 'Moyenne';
      case 'BASSE': return 'Basse';
      default: return urgence || '-';
    }
  };

  const getStatutClass = (statut) => {
    switch (statut?.toUpperCase()) {
      case 'NOUVEAU': return 'statut-nouveau';
      case 'EN_COURS': return 'statut-cours';
      case 'RESOLU': return 'statut-resolu';
      case 'REJETE': return 'statut-rejete';
      default: return '';
    }
  };

  const getStatutLabel = (statut) => {
    switch (statut?.toUpperCase()) {
      case 'NOUVEAU': return 'Nouveau';
      case 'EN_COURS': return 'En cours';
      case 'RESOLU': return 'Résolu';
      case 'REJETE': return 'Rejeté';
      default: return statut || '-';
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const columns = [
    { 
      header: 'ID', 
      accessor: 'id_signalement',
      render: (row) => <strong style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{row.id_signalement || row.id}</strong>,
      width: '120px'
    },
    { 
      header: 'Type', 
      render: (row) => (
        <span className="type-badge">{row.type_nom || row.type_signalement || row.type || '-'}</span>
      ),
      width: '120px'
    },
    { 
      header: 'Conteneur', 
      render: (row) => (
        <span>
          <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{row.uid_conteneur || row.conteneur_uid || '-'}</span>
        </span>
      ),
      width: '130px'
    },
    { 
      header: 'Zone', 
      render: (row) => row.zone_nom || row.zone || '-',
      width: '100px'
    },
    { 
      header: 'Urgence', 
      render: (row) => (
        <span className={`urgence-badge ${getUrgenceClass(row.urgence)}`}>
          {getUrgenceLabel(row.urgence)}
        </span>
      ),
      width: '90px'
    },
    { 
      header: 'Statut', 
      render: (row) => (
        <span className={`statut-badge ${getStatutClass(row.statut)}`}>
          <span className={`statut-dot ${getStatutClass(row.statut)}`}></span>
          {getStatutLabel(row.statut)}
        </span>
      ),
      width: '110px'
    },
    { 
      header: 'Date', 
      render: (row) => (
        <span style={{ fontSize: '0.8rem', color: '#666' }}>
          {formatDate(row.date_creation || row.date_signalement)}
        </span>
      ),
      width: '140px'
    },
    { 
      header: '', 
      render: (row) => (
        <button 
          className="btn-sm btn-info" 
          title="Voir détails"
          onClick={(e) => { e.stopPropagation(); navigate(`/admin/signalements/${row.id_signalement || row.id}`); }}
        >
          <i className="fas fa-external-link-alt"></i>
        </button>
      ),
      width: '60px'
    }
  ];

  return (
    <Table 
      columns={columns} 
      data={signalements}
      loading={loading}
      emptyMessage="Aucun signalement trouvé"
      onRowClick={(row) => navigate(`/admin/signalements/${row.id_signalement || row.id}`)}
    />
  );
}
