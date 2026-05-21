import { useEffect, useRef, useState } from 'react';
import './AddressAutocomplete.css';

// Composant générique de recherche d'adresses françaises avec
// suggestions en temps réel.
//
// Source de données : Base Adresse Nationale (BAN) via
//   https://api-adresse.data.gouv.fr/search/
// Le service est gratuit, sans clé d'API, et couvre l'ensemble du
// territoire français (rues, communes, codes postaux, INSEE). C'est
// la référence officielle française — bien plus précise que Nominatim
// pour les adresses domestiques.
//
// Contrat (composant contrôlé — `value` géré par le parent) :
//
//   <AddressAutocomplete
//      value={search}
//      onChange={setSearch}
//      onSelect={(result) => { ... }}
//      placeholder="..."
//      className="..."
//   />
//
// La sélection passée à `onSelect` est normalisée :
//
//   { lat, lon, label, postcode, city, context, type, raw }
//
//   - lat / lon  : coordonnées WGS84 prêtes à passer à Leaflet
//   - label      : libellé complet ("8 Boulevard du Port 80000 Amiens")
//   - postcode   : code postal ("80000")
//   - city       : commune ("Amiens")
//   - context    : "80, Somme, Hauts-de-France"
//   - type       : "housenumber" | "street" | "locality" | "municipality"
//   - raw        : la feature GeoJSON brute si le parent veut creuser

const BAN_URL = 'https://api-adresse.data.gouv.fr/search/';

// Appel BAN avec autocomplete + abort. La BAN accepte `autocomplete=1`
// pour optimiser les suggestions partielles (équivalent du mode
// "as you type" de Google Maps).
async function searchBAN(query, { signal, limit = 5 } = {}) {
  const url = `${BAN_URL}?q=${encodeURIComponent(query)}&limit=${limit}&autocomplete=1`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`BAN ${res.status}`);
  return res.json();
}

// Convertit une feature GeoJSON BAN vers la forme normalisée renvoyée
// au parent. Les coordonnées GeoJSON sont [lon, lat] — on les inverse
// pour matcher l'ordre habituel utilisé par Leaflet.
const featureToResult = (f) => {
  const [lon, lat] = f.geometry.coordinates;
  const p = f.properties || {};
  return {
    id: p.id || `${p.label}-${lat}-${lon}`,
    lat,
    lon,
    label: p.label || '',
    postcode: p.postcode || '',
    city: p.city || '',
    context: p.context || '',
    type: p.type || '',
    raw: f,
  };
};

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Rechercher une adresse...',
  className = '',
  autoFocus = false,
  minChars = 3,
  limit = 5,
}) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Recherche débouncée (300 ms) — annule la requête en vol dès que
  // l'utilisateur continue à taper. Évite de bombarder la BAN.
  useEffect(() => {
    const q = (value || '').trim();
    if (q.length < minChars) {
      setResults([]);
      setLoading(false);
      return;
    }
    const ac = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const json = await searchBAN(q, { signal: ac.signal, limit });
        const arr = Array.isArray(json?.features) ? json.features.map(featureToResult) : [];
        setResults(arr);
        setOpen(true);
      } catch (e) {
        // Aborted = saisie continue, comportement normal — on ignore.
        if (e.name !== 'AbortError') console.warn('Address search failed:', e);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      ac.abort();
      clearTimeout(t);
    };
  }, [value, minChars, limit]);

  // Fermer la dropdown quand on clique ailleurs.
  useEffect(() => {
    const onDocClick = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const pick = (r) => {
    onSelect?.(r);
    setOpen(false);
  };

  // Entrée = sélectionne le 1er résultat (UX mobile : le clavier virtuel
  // cache souvent la dropdown).
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0) pick(results[0]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const trimmedQuery = (value || '').trim();

  return (
    <div className={`addr-autocomplete ${className}`} ref={containerRef}>
      <div className="addr-input-wrap">
        <i className="fas fa-search addr-search-icon" aria-hidden="true" />
        <input
          type="text"
          className="addr-input"
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          autoFocus={autoFocus}
        />
        {loading && <i className="fas fa-spinner fa-spin addr-loading" aria-hidden="true" />}
        {!loading && value && (
          <button
            type="button"
            className="addr-clear"
            onClick={() => { onChange?.(''); setResults([]); setOpen(false); }}
            aria-label="Effacer la recherche"
          >
            <i className="fas fa-times-circle" />
          </button>
        )}
      </div>

      {open && (
        <ul className="addr-results" role="listbox">
          {results.length === 0 && !loading && trimmedQuery.length >= minChars && (
            <li className="addr-empty">Aucune adresse trouvée pour « {value} »</li>
          )}
          {results.map((r) => (
            <li
              key={r.id}
              className="addr-result"
              role="option"
              onClick={() => pick(r)}
              onMouseDown={(e) => e.preventDefault()} // évite blur input
            >
              <i className="fas fa-map-marker-alt addr-result-icon" aria-hidden="true" />
              <div className="addr-result-text">
                <strong>{r.label}</strong>
                {r.context && <span>{r.context}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
