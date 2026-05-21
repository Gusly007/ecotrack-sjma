import { useState } from 'react';
import MobileScreenHeader from '../../../components/mobile/MobileScreenHeader';
import './CitoyenTri.css';

// Référentiel statique pour la page « Guide du tri ». Les valeurs sont
// purement d'affichage (pas de dépendance backend) et reprennent le schéma
// de tri municipal français standard.
const triCategories = [
  {
    id: 'menager',
    name: 'Ordures ménagères',
    color: '#616161',
    icon: 'fa-trash',
    items: [
      'Restes alimentaires non compostables',
      'Couches, lingettes',
      'Poussières et balayures',
      'Cendres froides',
      'Mégots de cigarette',
    ],
  },
  {
    id: 'recyclage',
    name: 'Recyclage (jaune)',
    color: '#FFC107',
    icon: 'fa-recycle',
    items: [
      'Bouteilles et flacons en plastique',
      'Boîtes en carton',
      'Briques alimentaires',
      'Boîtes de conserve',
      'Canettes en aluminium',
      'Journaux, magazines, papier',
    ],
  },
  {
    id: 'verre',
    name: 'Verre',
    color: '#4CAF50',
    icon: 'fa-wine-bottle',
    items: [
      'Bouteilles en verre',
      'Bocaux et pots en verre',
      'Flacons de parfum',
      'Pas de vaisselle ni de miroirs',
    ],
  },
  {
    id: 'compost',
    name: 'Compost / Bio-déchets',
    color: '#8D6E63',
    icon: 'fa-seedling',
    items: [
      'Épluchures de fruits et légumes',
      'Marc de café, sachets de thé',
      'Coquilles d’œufs',
      'Restes de repas (sans viande/os)',
      'Petits déchets de jardin',
    ],
  },
  {
    id: 'dechetterie',
    name: 'Déchetterie / Encombrants',
    color: '#1976D2',
    icon: 'fa-truck',
    items: [
      'Meubles, matelas',
      'Électroménager',
      'Gravats et matériaux de construction',
      'Peinture, solvants, batteries',
      'Pneus, huile de vidange',
    ],
  },
];

export default function CitoyenTri() {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  const filtered = triCategories.map(cat => ({
    ...cat,
    items: cat.items.filter(item => !search || item.toLowerCase().includes(search.toLowerCase())),
  })).filter(cat => !search || cat.items.length > 0 || cat.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="tri-page">
      <MobileScreenHeader title="Guide du tri" backTo="/citoyen" />
      <div className="tri-body">
        <div className="tri-search">
          <i className="fas fa-search"></i>
          <input
            type="text" placeholder="Rechercher un déchet..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="tri-categories">
          {filtered.map(cat => (
            <div key={cat.id} className="tri-cat-card">
              <button
                className="tri-cat-header"
                style={{ borderLeft: `4px solid ${cat.color}` }}
                onClick={() => setExpanded(expanded === cat.id ? null : cat.id)}
              >
                <div className="tri-cat-icon-wrap" style={{ background: cat.color + '22', color: cat.color }}>
                  <i className={`fas ${cat.icon}`}></i>
                </div>
                <span>{cat.name}</span>
                <i className={`fas fa-chevron-${expanded === cat.id ? 'up' : 'down'} tri-chevron`}></i>
              </button>
              {(expanded === cat.id || !!search) && (
                <div className="tri-cat-items">
                  {cat.items.map((item, i) => (
                    <div key={i} className="tri-item">
                      <i className="fas fa-check" style={{ color: cat.color }}></i>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
