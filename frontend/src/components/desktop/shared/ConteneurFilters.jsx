import { Filters, SearchBox, SelectFilter } from '../../common';

export default function ConteneurFilters({ 
  searchValue, 
  onSearchChange,
  typeFilter,
  onTypeChange,
  zoneFilter,
  onZoneChange,
  statutFilter,
  onStatutChange,
  types = [],
  zones = [],
  statuts = []
}) {
  return (
    <Filters>
      <SearchBox 
        value={searchValue} 
        onChange={onSearchChange} 
        placeholder="Rechercher par UID ou adresse..." 
      />
      <SelectFilter 
        value={typeFilter}
        onChange={onTypeChange}
        options={[
          { value: '', label: 'Tous les types' },
          ...types.map(t => ({ 
            value: t.id_type?.toString() || t.id?.toString(), 
            label: t.nom || t.code || t 
          }))
        ]}
      />
      <SelectFilter 
        value={zoneFilter}
        onChange={onZoneChange}
        options={[
          { value: '', label: 'Toutes les zones' },
          ...zones.map(z => ({ 
            value: z.id_zone?.toString() || z.id?.toString(), 
            label: z.nom || z 
          }))
        ]}
      />
      <SelectFilter 
        value={statutFilter}
        onChange={onStatutChange}
        options={[
          { value: '', label: 'Tous les statuts' },
          { value: 'ACTIF', label: 'Actif' },
          { value: 'INACTIF', label: 'Hors service' },
          { value: 'EN_MAINTENANCE', label: 'Maintenance' }
        ]}
      />
    </Filters>
  );
}
