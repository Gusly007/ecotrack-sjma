import { Table } from '../../common';
import './ConteneurList.css';

export default function ConteneurTable({ 
  conteneurs, 
  loading, 
  onView, 
  onEdit, 
  onDelete,
  canEdit,
  canDelete 
}) {
  const getFillClass = (pct) => {
    if (pct >= 90) return 'fill-critical';
    if (pct >= 70) return 'fill-high';
    return 'fill-medium';
  };

  const getStatutClass = (statut) => {
    switch (statut) {
      case 'ACTIF': return 'statut-actif';
      case 'EN_MAINTENANCE': return 'statut-maintenance';
      case 'INACTIF': return 'statut-hors-service';
      default: return '';
    }
  };

  const getStatutLabel = (statut) => {
    switch (statut) {
      case 'ACTIF': return 'Actif';
      case 'EN_MAINTENANCE': return 'Maintenance';
      case 'INACTIF': return 'Hors service';
      default: return statut;
    }
  };

  const getTypeClass = (type) => {
    switch (type?.toUpperCase()) {
      case 'ORDURE': return 'type-ordures';
      case 'RECYCLAGE': return 'type-recyclage';
      case 'VERRE': return 'type-verre';
      case 'COMPOST': return 'type-bio';
      default: return '';
    }
  };

  const columns = [
    { header: 'UID', accessor: 'uid', width: '150px' },
    { 
      header: 'Type', 
      render: (row) => (
        <span className={`type-badge ${getTypeClass(row.type_nom)}`}>
          {row.type_nom || row.type || '-'}
        </span>
      ),
      width: '120px'
    },
    { 
      header: 'Capacité', 
      render: (row) => `${row.capacite_l || 0}L`,
      width: '100px'
    },
    { 
      header: 'Zone', 
      render: (row) => row.zone_nom || row.zone || '-',
      width: '120px'
    },
    { 
      header: 'Remplissage', 
      render: (row) => {
        const pct = row.fill_level || row.remplissage || 0;
        return (
          <div className="fill-progress">
            <div className="fill-bar">
              <div className={`fill-fill ${getFillClass(pct)}`} style={{ width: `${pct}%` }}></div>
            </div>
            <span className={`fill-pct ${getFillClass(pct)}`}>{Math.round(pct)}%</span>
          </div>
        );
      },
      width: '150px'
    },
    { 
      header: 'Statut', 
      render: (row) => (
        <span className={`statut-badge ${getStatutClass(row.statut)}`}>
          <span className={`statut-dot ${getStatutClass(row.statut)}`}></span>
          {getStatutLabel(row.statut)}
        </span>
      ),
      width: '120px'
    },
    { 
      header: 'Actions', 
      render: (row) => (
        <div className="action-buttons">
          <button 
            className="btn-sm btn-info" 
            title="Voir" 
            onClick={(e) => { e.stopPropagation(); onView?.(row); }}
          >
            <i className="fas fa-search-plus"></i>
          </button>
          {canEdit && (
            <button 
              className="btn-sm btn-warning" 
              title="Modifier" 
              onClick={(e) => { e.stopPropagation(); onEdit?.(row); }}
            >
              <i className="fas fa-edit"></i>
            </button>
          )}
          {canDelete && (
            <button 
              className="btn-sm btn-danger" 
              title="Supprimer" 
              onClick={(e) => { e.stopPropagation(); onDelete?.(row); }}
            >
              <i className="fas fa-trash"></i>
            </button>
          )}
        </div>
      ),
      width: '140px'
    }
  ];

  return (
    <Table 
      columns={columns} 
      data={conteneurs}
      loading={loading}
      emptyMessage="Aucun conteneur trouvé"
    />
  );
}
