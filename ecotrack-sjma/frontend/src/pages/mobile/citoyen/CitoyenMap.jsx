import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { citoyenService } from '../../../services/citoyenService';
import AddressAutocomplete from '../../../components/common/AddressAutocomplete';
import './CitoyenMap.css';

// Corrige l'icône Leaflet par défaut (chemins cassés sous Vite).
const DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// Pourcentage de remplissage → couleur du marqueur. Fallback pseudo-aléatoire
// stable basé sur l'id quand le backend n'expose ni taux ni statut.
function containerFill(c) {
  if (c.taux_remplissage != null) return Math.round(Number(c.taux_remplissage));
  if (c.statut === 'PLEIN') return 95;
  if (c.statut === 'MAINTENANCE') return 50;
  if (c.statut === 'INACTIF') return 10;
  return (Math.abs((c.id_conteneur || 0) * 37) % 100);
}

function fillColor(fill) {
  if (fill >= 71) return '#f44336';
  if (fill >= 31) return '#FF9800';
  return '#4CAF50';
}

const TYPE_LABEL = {
  1: 'Ordures',
  2: 'Recyclage',
  3: 'Verre',
  4: 'Compost',
};

export default function CitoyenMap() {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const searchMarkerRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await citoyenService.getContainers({ limit: 200 });
        if (!alive) return;
        const list = Array.isArray(data) ? data : (data?.data || []);
        setContainers(list);
      } catch {
        // Liste vide : la légende affichera "Chargement…" puis 0 marker.
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (mapInstance.current || !mapRef.current) return;
    const map = L.map(mapRef.current, { center: [48.8566, 2.3522], zoom: 12, zoomControl: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapInstance.current = map;
    return () => { map.remove(); mapInstance.current = null; };
  }, []);

  // Affiche les marqueurs à chaque mise à jour de la liste.
  useEffect(() => {
    if (!mapInstance.current) return;
    const map = mapInstance.current;
    const layers = [];
    containers.forEach(c => {
      if (c.latitude == null || c.longitude == null) return;
      const fill = containerFill(c);
      const circle = L.circleMarker([c.latitude, c.longitude], {
        radius: 9, color: '#fff', weight: 2,
        fillColor: fillColor(fill), fillOpacity: 0.9
      }).addTo(map);
      circle.on('click', () => setSelected({
        id: c.id_conteneur,
        label: c.uid || `#${c.id_conteneur}`,
        fill,
        type: TYPE_LABEL[c.id_type] || 'Conteneur',
        capacite: c.capacite_l,
        id_zone: c.id_zone,
      }));
      layers.push(circle);
    });

    // Ajuste la vue aux conteneurs visibles. fitBounds peut lever si le
    // groupe est vide ou les coordonnées invalides — on log au lieu d'avaler.
    if (layers.length > 0) {
      try {
        const group = L.featureGroup(layers);
        map.fitBounds(group.getBounds().pad(0.1));
      } catch (e) {
        console.warn('fitBounds failed:', e);
      }
    }

    return () => layers.forEach(l => map.removeLayer(l));
  }, [containers]);

  // Sélection d'une suggestion BAN par <AddressAutocomplete /> :
  //   - on supprime l'ancien pin de recherche s'il existe,
  //   - on pose un nouveau pin sur la coordonnée renvoyée,
  //   - on centre la carte avec un léger flyTo,
  //   - on raccourcit le libellé dans le champ pour qu'il reste lisible
  //     (ex. "8 Boulevard du Port, 80000 Amiens" au lieu du context complet).
  const handlePickAddress = (r) => {
    if (!mapInstance.current || Number.isNaN(r.lat) || Number.isNaN(r.lon)) return;
    const map = mapInstance.current;
    if (searchMarkerRef.current) {
      try {
        map.removeLayer(searchMarkerRef.current);
      } catch (e) {
        console.warn('removeLayer failed:', e);
      }
    }
    const marker = L.marker([r.lat, r.lon]).addTo(map);
    marker.bindPopup(r.label).openPopup();
    searchMarkerRef.current = marker;
    map.flyTo([r.lat, r.lon], 16, { duration: 0.8 });
    // Met à jour le champ avec un libellé court pour ne pas le surcharger.
    setSearch(r.label);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation || !mapInstance.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const map = mapInstance.current;
        if (searchMarkerRef.current) {
          try {
            map.removeLayer(searchMarkerRef.current);
          } catch (e) {
            console.warn('removeLayer failed:', e);
          }
        }
        const marker = L.marker([latitude, longitude]).addTo(map);
        marker.bindPopup('Ma position').openPopup();
        searchMarkerRef.current = marker;
        map.flyTo([latitude, longitude], 16, { duration: 0.8 });
      },
      (err) => { console.warn('Geolocation error', err); },
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 60000 }
    );
  };

  return (
    <div className="citoyen-map-page">
      <div className="map-top-bar">
        <button className="map-back-btn" onClick={() => navigate('/citoyen')}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <AddressAutocomplete
          className="map-search-wrapper"
          value={search}
          onChange={setSearch}
          onSelect={handlePickAddress}
          placeholder="Rechercher une adresse..."
        />
        <button
          className="map-filter-btn"
          onClick={handleUseMyLocation}
          title="Centrer sur ma position"
          aria-label="Centrer sur ma position"
        >
          <i className="fas fa-location-crosshairs"></i>
        </button>
      </div>

      <div ref={mapRef} className="citoyen-leaflet-map">
        {/* Légende positionnée en absolute dans la carte pour rester visible
            sur mobile sans scroll. Chaque ligne explique ce que la couleur
            signifie (vide / moyen / plein) — le % est un indice secondaire. */}
        <div className="map-legend-overlay">
          <div className="map-legend-title">Niveau de remplissage</div>
          <div className="map-legend-row">
            <span className="legend-dot" style={{ background: '#4CAF50' }} />
            <strong>Vide</strong><span className="legend-range">0 – 30 %</span>
          </div>
          <div className="map-legend-row">
            <span className="legend-dot" style={{ background: '#FF9800' }} />
            <strong>Moyen</strong><span className="legend-range">31 – 70 %</span>
          </div>
          <div className="map-legend-row">
            <span className="legend-dot" style={{ background: '#f44336' }} />
            <strong>Plein</strong><span className="legend-range">71 – 100 %</span>
          </div>
          {loading && <div className="map-legend-loading">Chargement…</div>}
        </div>
      </div>

      {selected && (
        <div className="map-popup-card">
          <div className="map-popup-header">
            <div>
              <strong>{selected.label}</strong>
              <span className="popup-type">{selected.type}</span>
            </div>
            <div className="popup-fill-badge" style={{ background: fillColor(selected.fill) + '22', color: fillColor(selected.fill) }}>
              {selected.fill}% plein
            </div>
            <button className="popup-close" onClick={() => setSelected(null)}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="map-popup-body">
            <div className="popup-progress-bar">
              <div className="popup-progress-fill" style={{ width: selected.fill + '%', background: fillColor(selected.fill) }} />
            </div>
            <button className="popup-signaler-btn" onClick={() => navigate('/citoyen/signaler', { state: { conteneurUid: selected.label, id_conteneur: selected.id, type: selected.type, zone: selected.id_zone ? `Zone ${selected.id_zone}` : null } })}>
              <i className="fas fa-exclamation-triangle"></i> Signaler un problème
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
