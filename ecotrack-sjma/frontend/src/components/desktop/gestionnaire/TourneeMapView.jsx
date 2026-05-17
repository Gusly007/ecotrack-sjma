import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const TYPE_CONFIG = {
  ORD: { color: "#6b7280", label: "Ordures" },
  REC: { color: "#eab308", label: "Recyclage" },
  VER: { color: "#22c55e", label: "Verre" },
  COM: { color: "#a16207", label: "Compost" },
};

const FALLBACK_COLOR = "#6b7280";

const LINE_COLORS = [
  "#3b82f6", "#f97316", "#8b5cf6", "#ec4899", "#14b8a6", "#ef4444",
];

function buildPopup(etape, tourneeCode) {
  const status = etape.collectee ? "✓ Collecté" : "En attente";
  return `
    <div style="font-size:13px;min-width:140px">
      <strong>${etape.uid || `Conteneur #${etape.id_conteneur}`}</strong><br>
      <span style="color:#6b7280">${etape.type_nom || "Type inconnu"}</span><br>
      Tournée : ${tourneeCode}<br>
      Étape ${etape.sequence}<br>
      <span style="color:${etape.collectee ? "#22c55e" : "#f97316"}">${status}</span>
    </div>
  `;
}

export default function TourneeMapView({ tournees = [], focusedTourneeId }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef([]);

  // Init map once — center + zoom sont obligatoires au démarrage Leaflet,
  // fitBounds les écrasera dès que les données arrivent.
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: [46.5, 2.5], // centre France — écrasé par fitBounds à la 1ère donnée
      zoom: 6,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      layersRef.current = [];
    };
  }, []);

  // Redraw layers when data changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map._loaded) return;

    layersRef.current.forEach((l) => l.remove());
    layersRef.current = [];

    if (!tournees.length) return;

    const allLatLngs = [];

    tournees.forEach((tournee, idx) => {
      const lineColor = LINE_COLORS[idx % LINE_COLORS.length];
      const etapes = tournee.etapes || [];

      const coords = etapes
        .filter((e) => e.latitude != null && e.longitude != null)
        .map((e) => [parseFloat(e.latitude), parseFloat(e.longitude)]);

      if (coords.length > 1) {
        const line = L.polyline(coords, {
          color: lineColor,
          weight: 3,
          opacity: 0.65,
          dashArray: "8 4",
        }).addTo(map);
        layersRef.current.push(line);
      }

      etapes.forEach((etape) => {
        if (etape.latitude == null || etape.longitude == null) return;
        const lat = parseFloat(etape.latitude);
        const lng = parseFloat(etape.longitude);
        const cfg = TYPE_CONFIG[etape.type_code] || { color: FALLBACK_COLOR };
        const collected = etape.collectee;

        const marker = L.circleMarker([lat, lng], {
          radius: collected ? 5 : 8,
          fillColor: cfg.color,
          color: collected ? cfg.color : "#fff",
          weight: collected ? 1 : 2,
          opacity: collected ? 0.45 : 1,
          fillOpacity: collected ? 0.3 : 0.9,
        });

        marker.bindPopup(buildPopup(etape, tournee.code));
        marker.addTo(map);
        layersRef.current.push(marker);
        allLatLngs.push([lat, lng]);
      });

      // Agent position marker (last collected container)
      if (tournee.agent_latitude != null && tournee.agent_longitude != null) {
        const agentLat = parseFloat(tournee.agent_latitude);
        const agentLng = parseFloat(tournee.agent_longitude);
        const agentName = `${tournee.agent_prenom || ""} ${tournee.agent_nom || ""}`.trim() || "Agent";
        const initials = agentName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

        const agentIcon = L.divIcon({
          className: "",
          html: `<div style="
            background:${lineColor};
            color:#fff;
            width:28px;height:28px;
            border-radius:50%;
            border:3px solid #fff;
            box-shadow:0 2px 6px rgba(0,0,0,0.35);
            display:flex;align-items:center;justify-content:center;
            font-size:11px;font-weight:700;line-height:1;
          ">${initials}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const agentMarker = L.marker([agentLat, agentLng], { icon: agentIcon, zIndexOffset: 1000 });
        agentMarker.bindPopup(`
          <div style="font-size:13px;min-width:140px">
            <strong>${agentName}</strong><br>
            Tournée : ${tournee.code}<br>
            Dernière étape collectée : <strong>${tournee.agent_last_sequence}</strong>
          </div>
        `);
        agentMarker.addTo(map);
        layersRef.current.push(agentMarker);
      }
    });

    if (allLatLngs.length > 0) {
      map.fitBounds(allLatLngs, { padding: [32, 32] });
    }
  }, [tournees]);

  // Zoom to focused tournée
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map._loaded || !focusedTourneeId) return;
    const tournee = tournees.find((t) => t.id_tournee === focusedTourneeId);
    if (!tournee?.etapes?.length) return;

    const coords = tournee.etapes
      .filter((e) => e.latitude != null && e.longitude != null)
      .map((e) => [parseFloat(e.latitude), parseFloat(e.longitude)]);

    if (coords.length > 0) {
      map.fitBounds(coords, { padding: [40, 40], maxZoom: 16 });
    }
  }, [focusedTourneeId, tournees]);

  return (
    <div className="chart-container">
      <div className="map-header">
        <h3>Carte des tournées en cours</h3>
        <div className="map-legend">
          {Object.entries(TYPE_CONFIG).map(([code, cfg]) => (
            <span key={code} className="legend-item">
              <span className="legend-dot" style={{ background: cfg.color }} />
              {cfg.label}
            </span>
          ))}
          <span className="legend-item legend-collected">
            <span className="legend-dot legend-dot--faded" />
            Collecté
          </span>
        </div>
      </div>

      {tournees.length === 0 ? (
        <div className="empty-state">Aucune tournée active à afficher sur la carte.</div>
      ) : (
        <div ref={containerRef} className="tournee-map" />
      )}
    </div>
  );
}
