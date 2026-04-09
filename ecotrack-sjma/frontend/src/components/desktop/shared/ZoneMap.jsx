import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import './ZoneMap.css';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

export default function ZoneMap({ 
  zones = [], 
  isDrawing = false, 
  onZoneCreated, 
  onZoneClick,
  role = 'MANAGER',
  readOnly = false,
  drawingColor = '#4CAF50'
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const drawControlRef = useRef(null);
  const drawnLayerRef = useRef(null);
  const zonesLayerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialiser la carte
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [48.8566, 2.3522],
      zoom: 12,
      zoomControl: true
    });
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Layer for existing zones
    zonesLayerRef.current = L.featureGroup().addTo(map);
    
    // Layer for drawn shapes
    drawnLayerRef.current = L.featureGroup().addTo(map);

    mapInstanceRef.current = map;
    setMapReady(true);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Gérer le mode dessin
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !drawnLayerRef.current) return;

    const map = mapInstanceRef.current;
    
    // Supprimer l'ancien contrôle si existe
    if (drawControlRef.current) {
      map.removeControl(drawControlRef.current);
      drawControlRef.current = null;
    }

    if (isDrawing && !readOnly) {
      // Créer le contrôle de dessin
      const drawControl = new L.Control.Draw({
        position: 'topright',
        draw: {
          polygon: {
            allowIntersection: false,
            showArea: true,
            shapeOptions: {
              color: drawingColor,
              fillColor: drawingColor,
              fillOpacity: 0.4,
              weight: 3
            }
          },
          circle: {
            showArea: true,
            shapeOptions: {
              color: drawingColor,
              fillColor: drawingColor,
              fillOpacity: 0.4,
              weight: 3
            }
          },
          polyline: false,
          marker: false,
          circlemarker: false,
          rectangle: false
        },
        edit: {
          featureGroup: drawnLayerRef.current,
          remove: true
        }
      });
      
      map.addControl(drawControl);
      drawControlRef.current = drawControl;

      // Dessiner un seul shape à la fois - supprimer l'ancien
      drawnLayerRef.current.clearLayers();

      // Event quand le dessin est terminé
      const onDrawCreated = (e) => {
        const layer = e.layer;
        const layerType = e.layerType;
        
        // Supprimer les dessins précédents
        drawnLayerRef.current.clearLayers();
        drawnLayerRef.current.addLayer(layer);
        
        // Calculer l'aire en km²
        let area = 0;
        let centerLat, centerLng;
        let geometry;
        
        if (layerType === 'circle') {
          // Pour le cercle, utiliser le rayon
          const center = layer.getLatLng();
          const radiusMeters = layer.getRadius();
          area = (Math.PI * radiusMeters * radiusMeters) / 1000000;
          centerLat = center.lat;
          centerLng = center.lng;
          
          // Convertir le cercle en polygone (polygoniser)
          const centerPoint = L.latLng(centerLat, centerLng);
          const numPoints = 64;
          const coords = [];
          for (let i = 0; i <= numPoints; i++) {
            const angle = (i / numPoints) * 2 * Math.PI;
            const dx = radiusMeters * Math.cos(angle);
            const dy = radiusMeters * Math.sin(angle);
            const point = L.CRS.Earth.unproject(L.latLng(centerLat + dy / 111320, centerLng + dx / (111320 * Math.cos(centerLat * Math.PI / 180))));
            coords.push([point.lng, point.lat]);
          }
          geometry = {
            type: 'Polygon',
            coordinates: [coords]
          };
        } else {
          // Pour polygone
          const latlngs = layer.getLatLngs()[0];
          if (latlngs && latlngs.length > 0) {
            area = L.GeometryUtil.geodesicArea(latlngs) / 1000000;
          }
          const bounds = layer.getBounds();
          centerLat = bounds.getCenter().lat;
          centerLng = bounds.getCenter().lng;
          
          // Convertir en GeoJSON
          const geoJson = layer.toGeoJSON();
          geometry = geoJson.geometry;
        }
        
        if (onZoneCreated) {
          onZoneCreated({
            geometry: geometry,
            coordinates: geometry.coordinates,
            area: Math.round(area * 100) / 100,
            center: {
              lat: Math.round(centerLat * 1000000) / 1000000,
              lng: Math.round(centerLng * 1000000) / 1000000
            },
            layerType: layerType
          });
        }
      };

      map.on(L.Draw.Event.CREATED, onDrawCreated);

      // Automatically start polygon drawing after a short delay
      setTimeout(() => {
        if (drawControlRef.current && drawControlRef.current._toolbars.draw) {
          const polygonHandler = new L.Draw.Polygon(map, drawControlRef.current.options.draw.polygon);
          polygonHandler.enable();
        }
      }, 100);

      return () => {
        if (drawControlRef.current) {
          map.removeControl(drawControlRef.current);
          drawControlRef.current = null;
        }
        map.off(L.Draw.Event.CREATED, onDrawCreated);
      };
    }
  }, [isDrawing, mapReady, readOnly, onZoneCreated, drawingColor]);

  // Afficher les zones sur la carte
  useEffect(() => {
    if (!mapReady || !zonesLayerRef.current || !mapInstanceRef.current) return;

    zonesLayerRef.current.clearLayers();

    zones.forEach(zone => {
      try {
        let zoneLayer;
        const color = zone.couleur || '#4CAF50';
        
        // Si la zone a une géométrie polygonale
        if (zone.geometry && zone.geometry.coordinates && zone.geometry.type === 'Polygon') {
          const coords = zone.geometry.coordinates;
          // Vérifier que coords[0] est bien un tableau de coordonnées
          if (coords && coords[0] && Array.isArray(coords[0]) && coords[0].length > 0 && Array.isArray(coords[0][0])) {
            // Convertir les coordonnées [lng, lat] en [lat, lng] pour Leaflet
            const latlngs = coords[0].map(coord => [coord[1], coord[0]]);
            zoneLayer = L.polygon(latlngs, {
              color: color,
              fillColor: color,
              fillOpacity: 0.4,
              weight: 3
            });
          }
        } else if (zone.latitude && zone.longitude) {
          // Fallback vers le cercle avec la superficie
          const radius = zone.superficie_km2 
            ? Math.sqrt(zone.superficie_km2 / Math.PI) * 1000
            : 1000;
            
          zoneLayer = L.circle([zone.latitude, zone.longitude], {
            color: color,
            fillColor: color,
            fillOpacity: 0.4,
            radius: radius,
            weight: 3
          });
        }

        if (zoneLayer) {
          const popupContent = `
            <div class="zone-popup">
              <h3 style="color: ${color}; margin: 0 0 8px 0;">${zone.nom}</h3>
              <p style="margin: 4px 0;"><strong>Code:</strong> ${zone.code || zone.id_zone || zone.id}</p>
              <p style="margin: 4px 0;"><strong>Population:</strong> ${zone.population?.toLocaleString() || 0} hab</p>
              <p style="margin: 4px 0;"><strong>Superficie:</strong> ${zone.superficie_km2 || 0} km²</p>
            </div>
          `;

          zoneLayer.bindPopup(popupContent);
          
          zoneLayer.on('click', () => {
            if (onZoneClick) {
              onZoneClick(zone);
            }
          });

          zonesLayerRef.current.addLayer(zoneLayer);
        }
      } catch (err) {
        console.warn('Error rendering zone:', zone.nom, err);
      }
    });

    // Ajuster la vue pour voir toutes les zones
    if (zones.length > 0 && zonesLayerRef.current.getLayers().length > 0) {
      const bounds = zonesLayerRef.current.getBounds();
      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    }
  }, [zones, mapReady, onZoneClick]);

  return (
    <div ref={mapRef} className="zone-map-container" style={{ height: '500px', width: '100%' }}>
      {!mapReady && (
        <div className="map-loading">
          <i className="fas fa-spinner fa-spin"></i> Chargement de la carte...
        </div>
      )}
    </div>
  );
}
