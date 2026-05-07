import { useState, useEffect, useRef } from 'react';
import { Modal, FormGroup, FormRow, Input, Select } from '../../common';
import { zoneService } from '../../../services/zoneService';
import { containerService } from '../../../services/containerService';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

function isPointOnSegment(px, py, ax, ay, bx, by, eps = 1e-10) {
  const cross = (py - ay) * (bx - ax) - (px - ax) * (by - ay);
  if (Math.abs(cross) > eps) return false;
  const dot = (px - ax) * (bx - ax) + (py - ay) * (by - ay);
  if (dot < -eps) return false;
  const lenSq = (bx - ax) * (bx - ax) + (by - ay) * (by - ay);
  return dot <= lenSq + eps;
}

function isPointInRing(point, ring) {
  const [px, py] = point;
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];

    if (isPointOnSegment(px, py, xi, yi, xj, yj)) {
      return true;
    }

    const intersects = ((yi > py) !== (yj > py))
      && (px < ((xj - xi) * (py - yi)) / ((yj - yi) || Number.EPSILON) + xi);
    if (intersects) inside = !inside;
  }

  return inside;
}

function isPointInPolygon(point, polygonCoordinates) {
  if (!Array.isArray(polygonCoordinates) || polygonCoordinates.length === 0) return false;

  const outerRing = polygonCoordinates[0];
  if (!isPointInRing(point, outerRing)) return false;

  for (let i = 1; i < polygonCoordinates.length; i++) {
    if (isPointInRing(point, polygonCoordinates[i])) {
      return false;
    }
  }

  return true;
}

function isPointInZoneGeometry(latitude, longitude, geometry) {
  if (!geometry || !geometry.type || !geometry.coordinates) return false;

  const point = [longitude, latitude];

  if (geometry.type === 'Polygon') {
    return isPointInPolygon(point, geometry.coordinates);
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some((polygon) => isPointInPolygon(point, polygon));
  }

  return false;
}

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

function geometryToLeafletLayers(geometry) {
  if (!geometry || !geometry.type || !geometry.coordinates) return [];

  if (geometry.type === 'Polygon') {
    return geometry.coordinates.map((ring) => ring.map(([lng, lat]) => [lat, lng]));
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.flatMap((polygon) => polygon.map((ring) => ring.map(([lng, lat]) => [lat, lng])));
  }

  return [];
}

export default function ConteneurAddModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  types = []
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mapHint, setMapHint] = useState('Choisis une zone puis clique dans la zone sur la carte pour positionner le conteneur.');
  const [zones, setZones] = useState([]);
  const [loadingZones, setLoadingZones] = useState(true);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const zoneLayerRef = useRef(null);
  const markerRef = useRef(null);

  const [formData, setFormData] = useState({
    id_type: '',
    capacite_l: '',
    id_zone: '',
    latitude: '',
    longitude: '',
    adresse: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadZones();
      setFormData({
        id_type: types[0]?.id_type?.toString() || types[0]?.id?.toString() || '',
        capacite_l: '',
        id_zone: '',
        latitude: '',
        longitude: '',
        adresse: ''
      });
      setError('');
      setMapHint('Choisis une zone puis clique dans la zone sur la carte pour positionner le conteneur.');
    }
  }, [isOpen, types]);

  const selectedZone = zones.find((z) => Number(z.id_zone ?? z.id) === Number(formData.id_zone));

  useEffect(() => {
    if (!isOpen || !mapRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current, {
        center: [48.8566, 2.3522],
        zoom: 12,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      zoneLayerRef.current = L.featureGroup().addTo(map);
      markerRef.current = null;
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const zoneLayer = zoneLayerRef.current;
    zoneLayer.clearLayers();

    if (selectedZone?.geometry) {
      const layers = geometryToLeafletLayers(selectedZone.geometry);
      if (selectedZone.geometry.type === 'Polygon' && layers.length > 0) {
        L.polygon(layers, {
          color: selectedZone.couleur || '#4CAF50',
          fillColor: selectedZone.couleur || '#4CAF50',
          fillOpacity: 0.25,
          weight: 3
        }).addTo(zoneLayer);
      } else if (selectedZone.geometry.type === 'MultiPolygon' && layers.length > 0) {
        layers.forEach((polygon) => {
          L.polygon(polygon, {
            color: selectedZone.couleur || '#4CAF50',
            fillColor: selectedZone.couleur || '#4CAF50',
            fillOpacity: 0.25,
            weight: 3
          }).addTo(zoneLayer);
        });
      }

      if (zoneLayer.getLayers().length > 0) {
        const bounds = zoneLayer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
        }
      }
    }

    const onMapClick = (e) => {
      if (!selectedZone?.geometry) {
        setMapHint('Choisis une zone avant de placer un point.');
        return;
      }

      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      if (!isPointInZoneGeometry(lat, lng, selectedZone.geometry)) {
        setMapHint('Le point choisi est hors de la zone sélectionnée. Clique à l’intérieur du polygone.');
        return;
      }

      setFormData((prev) => ({
        ...prev,
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6)
      }));
      setMapHint('Point placé dans la zone. Tu peux ajuster le clic si besoin.');

      if (markerRef.current) {
        map.removeLayer(markerRef.current);
      }
      markerRef.current = L.marker([lat, lng]).addTo(map);
    };

    map.off('click');
    map.on('click', onMapClick);

    if (formData.latitude && formData.longitude) {
      const lat = parseFloat(formData.latitude);
      const lng = parseFloat(formData.longitude);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        if (markerRef.current) {
          map.removeLayer(markerRef.current);
        }
        markerRef.current = L.marker([lat, lng]).addTo(map);
      }
    }

    return () => {
      map.off('click', onMapClick);
    };
  }, [isOpen, selectedZone, formData.latitude, formData.longitude]);

  const loadZones = async () => {
    try {
      setLoadingZones(true);
      const response = await zoneService.getAll(1, 100);
      let data = [];
      if (response.data) {
        data = response.data.data || response.data || [];
      } else if (Array.isArray(response)) {
        data = response;
      }
      setZones(data);
    } catch (err) {
      console.error('Erreur chargement zones:', err);
    } finally {
      setLoadingZones(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.id_type || !formData.capacite_l || !formData.id_zone) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.latitude === '' || formData.longitude === '') {
      setError('La latitude et la longitude sont obligatoires');
      return;
    }

    const latitude = parseFloat(formData.latitude);
    const longitude = parseFloat(formData.longitude);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      setError('Latitude/longitude invalides');
      return;
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      setError('Latitude/longitude hors limites valides');
      return;
    }

    const selectedZoneId = parseInt(formData.id_zone, 10);
    const selectedZone = zones.find((z) => Number(z.id_zone ?? z.id) === selectedZoneId);
    if (!selectedZone || !selectedZone.geometry) {
      setError('Géométrie de zone introuvable. Veuillez recharger la page.');
      return;
    }

    if (!isPointInZoneGeometry(latitude, longitude, selectedZone.geometry)) {
      setError('La position du conteneur doit être à l\'intérieur de la zone sélectionnée');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = {
        id_type: parseInt(formData.id_type),
        capacite_l: parseInt(formData.capacite_l),
        id_zone: parseInt(formData.id_zone),
        latitude,
        longitude,
        statut: 'ACTIF'
      };

      await containerService.create(data);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const capacities = [
    { value: '240', label: '240L' },
    { value: '360', label: '360L' },
    { value: '500', label: '500L' },
    { value: '660', label: '660L' },
    { value: '770', label: '770L' },
    { value: '1100', label: '1100L' },
    { value: '1200', label: '1200L' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ajouter un conteneur"
      headerIcon="fa-plus-circle"
      headerColor="#4CAF50"
      size="md"
    >
      <div className="conteneur-form">
        {error && (
          <div className="form-error" style={{ color: '#f44336', marginBottom: '16px', padding: '8px', background: '#ffebee', borderRadius: '4px' }}>
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        <FormGroup label="Type de déchet" required>
          <Select 
            value={formData.id_type}
            onChange={(v) => setFormData({ ...formData, id_type: v })}
            options={types.map(t => ({ 
              value: t.id_type?.toString() || t.id?.toString(), 
              label: t.nom || t 
            }))}
            placeholder="Sélectionner un type"
          />
        </FormGroup>

        <FormGroup label="Capacité" required>
          <Select 
            value={formData.capacite_l}
            onChange={(v) => setFormData({ ...formData, capacite_l: v })}
            options={capacities}
            placeholder="Sélectionner une capacité"
          />
        </FormGroup>

        <FormGroup label="Zone" required>
          {loadingZones ? (
            <p style={{ color: '#666', fontSize: '0.85rem' }}>
              <i className="fas fa-spinner fa-spin"></i> Chargement...
            </p>
          ) : (
            <Select 
              value={formData.id_zone}
              onChange={(v) => {
                const zone = zones.find((z) => Number(z.id_zone ?? z.id) === Number(v));
                setFormData({
                  ...formData,
                  id_zone: v,
                });
              }}
              options={[
                { value: '', label: 'Sélectionner une zone' },
                ...zones.map(z => ({ 
                  value: z.id_zone?.toString() || z.id?.toString(), 
                  label: `${z.nom} (${z.latitude ?? '-'}, ${z.longitude ?? '-'})` 
                }))
              ]}
            />
          )}
          {selectedZone && (
            <p style={{ marginTop: '8px', color: '#666', fontSize: '0.85rem' }}>
              Conteneurs autorisés à l'intérieur de cette zone. Les GPS du conteneur restent libres tant qu'ils sont dans la géométrie.
            </p>
          )}
        </FormGroup>

        <FormRow>
          <FormGroup label="Latitude" required>
            <Input 
              type="number"
              step="0.000001"
              value={formData.latitude}
              onChange={(v) => setFormData({ ...formData, latitude: v })}
              placeholder="Ex: 48.8566"
            />
          </FormGroup>
          <FormGroup label="Longitude" required>
            <Input 
              type="number"
              step="0.000001"
              value={formData.longitude}
              onChange={(v) => setFormData({ ...formData, longitude: v })}
              placeholder="Ex: 2.3522"
            />
          </FormGroup>
        </FormRow>

        <div style={{ marginTop: '12px' }}>
          <div style={{ marginBottom: '8px', color: '#666', fontSize: '0.9rem' }}>
            {mapHint}
          </div>
          <div
            ref={mapRef}
            style={{ height: '320px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}
          />
        </div>

        <div className="modal-actions">
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <><i className="fas fa-spinner fa-spin"></i> Création...</>
            ) : (
              <><i className="fas fa-save"></i> Créer</>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
