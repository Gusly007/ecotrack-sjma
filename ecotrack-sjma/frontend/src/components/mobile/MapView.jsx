import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

// Fix default marker icons for Leaflet + Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function createColorIcon(color) {
  return L.divIcon({
    className: 'map-marker-custom',
    html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><i class="fas fa-trash" style="color:#fff;font-size:0.7rem;"></i></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export const markerIcons = {
  green: createColorIcon('#4CAF50'),
  orange: createColorIcon('#FF9800'),
  red: createColorIcon('#f44336'),
  blue: createColorIcon('#2196F3'),
};

function FitBounds({ markers }) {
  const map = useMap();
  useEffect(() => {
    if (markers && markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [markers, map]);
  return null;
}

export default function MapView({ center = [33.9716, -6.8498], zoom = 13, markers = [], height = '200px', onMarkerClick, fitBounds = false }) {
  return (
    <div className="map-view-container" style={{ height }}>
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} style={{ height: '100%', width: '100%', borderRadius: '12px' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {fitBounds && markers.length > 0 && <FitBounds markers={markers} />}
        {markers.map((m, i) => (
          <Marker
            key={m.id || i}
            position={[m.lat, m.lng]}
            icon={m.icon || markerIcons.green}
            eventHandlers={onMarkerClick ? { click: () => onMarkerClick(m) } : undefined}
          >
            {m.popup && <Popup>{m.popup}</Popup>}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
