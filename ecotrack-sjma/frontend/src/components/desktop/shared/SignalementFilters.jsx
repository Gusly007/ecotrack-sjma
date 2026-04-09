import { Filters, SearchBox, SelectFilter } from '../../common';

export default function SignalementFilters({ 
  searchValue, 
  onSearchChange,
  statutFilter,
  onStatutChange,
  urgenceFilter,
  onUrgenceChange,
  zones = []
}) {
  const statuts = [
    { value: '', label: 'Tous les statuts' },
    { value: 'NOUVEAU', label: 'Nouveau' },
    { value: 'EN_COURS', label: 'En cours' },
    { value: 'RESOLU', label: 'Résolu' },
    { value: 'REJETE', label: 'Rejeté' }
  ];

  const urgences = [
    { value: '', label: 'Toutes urgences' },
    { value: 'HAUTE', label: 'Haute' },
    { value: 'MOYENNE', label: 'Moyenne' },
    { value: 'BASSE', label: 'Basse' }
  ];

  return (
    <Filters>
      <SearchBox 
        value={searchValue} 
        onChange={onSearchChange} 
        placeholder="Rechercher par ID, description, conteneur ou zone..." 
      />
      <SelectFilter 
        value={statutFilter}
        onChange={onStatutChange}
        options={statuts}
      />
      <SelectFilter 
        value={urgenceFilter}
        onChange={onUrgenceChange}
        options={urgences}
      />
      {zones.length > 0 && (
        <SelectFilter 
          value=""
          onChange={() => {}}
          options={[
            { value: '', label: 'Toutes zones' },
            ...zones.map(z => ({ 
              value: z.id_zone?.toString() || z.id?.toString(), 
              label: z.nom || z 
            }))
          ]}
        />
      )}
    </Filters>
  );
}
