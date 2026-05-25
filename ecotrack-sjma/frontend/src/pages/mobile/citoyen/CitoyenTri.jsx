import { useState } from 'react';
import MobileScreenHeader from '../../../components/mobile/MobileScreenHeader';
import {
  TYPE_ESTIMATIONS,
  CO2_FACTORS,
  URGENCE_MULTIPLIER,
  METHODOLOGY_NOTE,
} from '../../../utils/impactEstimation';
import './CitoyenTri.css';

// Libellés FR pour les types de signalement (clé = code backend dans
// TYPE_ESTIMATIONS). Permet à la section pédagogique d'afficher des
// intitulés clairs sans dupliquer la table source.
const TYPE_LABELS = {
  DEPOT_SAUVAGE: 'Dépôt sauvage',
  CONTENEUR_PLEIN: 'Débordement',
  MAUVAISE_ODEUR: 'Mauvaise odeur',
  CONTENEUR_INACCESSIBLE: 'Inaccessibilité',
  CONTENEUR_SALE: 'Conteneur sale',
  CONTENEUR_ENDOMMAGE: 'Dégradation',
  CAPTEUR_DEFAILLANT: 'Capteur défaillant',
};

const MATIERE_LABELS = {
  biodechets: 'Biodéchets',
  methanisation: 'Biodéchets (méthanisation)',
  pet: 'Plastique PET',
  acier: 'Acier / ferreux',
  verre: 'Verre',
  mixte: 'Mixte (moyenne prudente)',
  aucune: 'Aucune (incident technique)',
};

const URGENCE_LABELS = {
  BASSE: 'Basse',
  MOYENNE: 'Moyenne',
  HAUTE: 'Haute',
  URGENTE: 'Urgente',
};

// Références ADEME / sources officielles utilisées pour les facteurs
// d'émissions évitées. Affichées dans la section pédagogique.
const ADEME_SOURCES = [
  {
    label: 'ADEME — Base Empreinte (facteurs d\'émission officiels)',
    url: 'https://base-empreinte.ademe.fr',
  },
  {
    label: 'ADEME — Émissions évitées (Base Carbone)',
    url: 'https://prod-basecarbonesolo.ademe-dri.fr/documentation/UPLOAD_DOC_FR/emissions_evitees_2.htm',
  },
  {
    label: 'ADEME — Méthanisation des déchets',
    url: 'https://prod-basecarbonesolo.ademe-dri.fr/documentation/UPLOAD_DOC_FR/methanisation2_2.htm',
  },
  {
    label: 'ADEME — Tri des déchets professionnels',
    url: 'https://economie-circulaire.ademe.fr/tri-dechets-professionnels',
  },
  {
    label: 'ADEME — Dépôts sauvages : caractérisation',
    url: 'https://librairie.ademe.fr/economie-circulaire-et-dechets/2278-caracterisation-de-la-problematique-des-dechets-sauvages.html',
  },
  {
    label: 'Feuille de route décarbonation — filière verre (gouv.fr)',
    url: 'https://www.entreprises.gouv.fr/files/files/Priorites-et-actions/Transition-ecologique/feuille-de-route-verre.pdf',
  },
];

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

// Sous-sections de l'encart pédagogique (collapsible).
const IMPACT_SECTIONS = [
  { id: 'types', label: 'Estimations par type de signalement', icon: 'fa-flag' },
  { id: 'co2', label: 'Facteurs CO₂ par matière', icon: 'fa-cloud' },
  { id: 'urgence', label: 'Multiplicateur d\'urgence', icon: 'fa-tachometer-alt' },
  { id: 'regles', label: 'Règles d\'attribution', icon: 'fa-balance-scale' },
  { id: 'sources', label: 'Sources officielles', icon: 'fa-external-link-alt' },
];

const fmtKg = (n) => `${n} kg`;
const fmtCO2 = (n) => `${Number(n).toFixed(3)} kgCO₂e/kg`;

export default function CitoyenTri() {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [impactOpen, setImpactOpen] = useState(false);
  const [impactSection, setImpactSection] = useState(null);

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

        {/* Section pédagogique additive : expliquer le calcul d'impact
            environnemental affiché ailleurs dans l'app (home, détail
            signalement, écran succès). Repliée par défaut pour ne pas
            alourdir la page de tri. */}
        {!search && (
          <section className="tri-impact" aria-labelledby="tri-impact-title">
            <button
              type="button"
              className="tri-impact-toggle"
              onClick={() => setImpactOpen((v) => !v)}
              aria-expanded={impactOpen}
            >
              <div className="tri-cat-icon-wrap tri-impact-icon">
                <i className="fas fa-leaf"></i>
              </div>
              <div className="tri-impact-toggle-text">
                <span id="tri-impact-title" className="tri-impact-title">Comprendre l'impact environnemental</span>
                <span className="tri-impact-subtitle">Comment sont calculés les kg triés et le CO₂ évité</span>
              </div>
              <i className={`fas fa-chevron-${impactOpen ? 'up' : 'down'} tri-chevron`}></i>
            </button>

            {impactOpen && (
              <div className="tri-impact-body">
                <p className="tri-impact-intro">
                  Quand un signalement est <strong>validé</strong> (pris en charge
                  par un agent), l'app estime le poids de déchets remis dans la
                  bonne filière de tri. Quand il est <strong>résolu</strong>, on
                  ajoute une estimation de CO₂ évité, calculée à partir de
                  facteurs d'émissions ADEME selon la matière dominante.
                </p>

                {IMPACT_SECTIONS.map((sec) => {
                  const open = impactSection === sec.id;
                  return (
                    <div key={sec.id} className="tri-impact-section">
                      <button
                        type="button"
                        className="tri-impact-section-header"
                        onClick={() => setImpactSection(open ? null : sec.id)}
                        aria-expanded={open}
                      >
                        <i className={`fas ${sec.icon} tri-impact-section-icon`} aria-hidden="true"></i>
                        <span>{sec.label}</span>
                        <i className={`fas fa-chevron-${open ? 'up' : 'down'} tri-chevron`}></i>
                      </button>

                      {open && sec.id === 'types' && (
                        <div className="tri-impact-section-body">
                          <p className="tri-impact-note">
                            Fourchettes prudentes en kilogrammes de déchets remis
                            dans la bonne filière, par type d'incident.
                          </p>
                          <div className="tri-impact-table-wrap">
                            <table className="tri-impact-table">
                              <thead>
                                <tr>
                                  <th>Type</th>
                                  <th className="num">Min</th>
                                  <th className="num">Max</th>
                                  <th>Matière dominante</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(TYPE_ESTIMATIONS).map(([code, info]) => (
                                  <tr key={code}>
                                    <td>{TYPE_LABELS[code] || code}</td>
                                    <td className="num">{fmtKg(info.min)}</td>
                                    <td className="num">{fmtKg(info.max)}</td>
                                    <td>
                                      {MATIERE_LABELS[info.matiere] || info.matiere}
                                      {!info.hasCO2Filiere && (
                                        <span className="tri-impact-badge"> indicateur qualité</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {open && sec.id === 'co2' && (
                        <div className="tri-impact-section-body">
                          <p className="tri-impact-note">
                            Émissions évitées par kilogramme de matière correctement
                            orientée vers sa filière de valorisation (source : ADEME
                            Base Carbone, feuille de route filière verre).
                          </p>
                          <div className="tri-impact-table-wrap">
                            <table className="tri-impact-table">
                              <thead>
                                <tr>
                                  <th>Matière</th>
                                  <th className="num">Facteur</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(CO2_FACTORS).map(([mat, factor]) => (
                                  <tr key={mat}>
                                    <td>{MATIERE_LABELS[mat] || mat}</td>
                                    <td className="num">
                                      {factor === 0 ? '—' : fmtCO2(factor)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <p className="tri-impact-note tri-impact-note-small">
                            Exemples : 10 kg de PET recyclés ≈ 30,62 kgCO₂e évités —
                            10 kg de biodéchets compostés ≈ 0,27 kgCO₂e évités.
                          </p>
                        </div>
                      )}

                      {open && sec.id === 'urgence' && (
                        <div className="tri-impact-section-body">
                          <p className="tri-impact-note">
                            L'urgence choisie au signalement ajuste l'estimation : un
                            débordement urgent libère typiquement plus de déchets
                            non captés qu'une situation basse.
                          </p>
                          <div className="tri-impact-table-wrap">
                            <table className="tri-impact-table">
                              <thead>
                                <tr>
                                  <th>Urgence</th>
                                  <th className="num">Multiplicateur</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(URGENCE_MULTIPLIER).map(([u, m]) => (
                                  <tr key={u}>
                                    <td>{URGENCE_LABELS[u] || u}</td>
                                    <td className="num">× {m.toFixed(1)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {open && sec.id === 'regles' && (
                        <div className="tri-impact-section-body">
                          <ul className="tri-impact-rules">
                            <li>
                              <strong>kg triés</strong> : comptés dès que le statut
                              passe à <em>En cours</em> ou <em>Résolu</em>.
                            </li>
                            <li>
                              <strong>CO₂ évité</strong> : compté uniquement si le
                              statut est <em>Résolu</em> <strong>et</strong> que la
                              matière a une filière de valorisation identifiable.
                            </li>
                            <li>
                              <strong>Incidents techniques</strong> (capteur
                              défaillant, conteneur sale, dégradation) : affichage
                              comme indicateur de qualité de service, sans
                              attribution directe de CO₂.
                            </li>
                            <li>
                              <strong>Estimations</strong>, pas mesures réelles :
                              toutes les valeurs sont préfixées par <code>≈</code>
                              dans l'app.
                            </li>
                          </ul>
                        </div>
                      )}

                      {open && sec.id === 'sources' && (
                        <div className="tri-impact-section-body">
                          <p className="tri-impact-note">
                            Les coefficients utilisés proviennent de sources
                            officielles publiques. Cliquez pour consulter.
                          </p>
                          <ul className="tri-impact-sources">
                            {ADEME_SOURCES.map((src) => (
                              <li key={src.url}>
                                <a href={src.url} target="_blank" rel="noopener noreferrer">
                                  <i className="fas fa-external-link-alt" aria-hidden="true"></i>
                                  <span>{src.label}</span>
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}

                <p className="tri-impact-methodology">{METHODOLOGY_NOTE}</p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
