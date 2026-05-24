import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { containerService } from '../services/containerService';

export default function ScanResult() {
  const { uid: rawUid } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [container, setContainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tourneeId, setTourneeId] = useState(null);

  // Extraire l'UID même si on reçoit l'URL complète
  const uid = (() => {
    if (!rawUid) return '';
    if (rawUid.includes('http')) {
      const parts = rawUid.split('/');
      return parts[parts.length - 1];
    }
    return rawUid;
  })();

  useEffect(() => {
    const fetch = async () => {
      try {
        const decodedUid = decodeURIComponent(uid);
        console.log('ScanResult: Fetching container with UID:', decodedUid);
        
        // Tous les rôles peuvent voir les infos du conteneur
        const res = await containerService.getByUid(decodedUid);
        console.log('ScanResult: Container API response:', res);
        setContainer(res);
      } catch (error) {
        console.error('ScanResult: Error fetching container:', error);
        console.error('ScanResult: Error response:', error.response?.data);
        console.error('ScanResult: Error status:', error.response?.status);
        setContainer(null);
      } finally {
        setLoading(false);
      }
    };
    if (uid) fetch();
    else setLoading(false);
  }, [uid]);

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="scan-result-container">
      <h2>Conteneur : {uid}</h2>
      
      {container ? (
        <div className="container-info">
          <div className="info-card">
            <h3>Informations du conteneur</h3>
            <p><strong>UID :</strong> {container.uid}</p>
            <p><strong>Type :</strong> {container.type_conteneur || 'N/A'}</p>
            <p><strong>Zone :</strong> {container.zone_nom || 'N/A'}</p>
            <p><strong>Capacité :</strong> {container.capacite_l} L</p>
            <p><strong>Statut :</strong> {container.statut}</p>
            <p><strong>Remplissage :</strong> {container.fill_level ? `${container.fill_level}%` : 'N/A'}</p>
            {container.date_installation && (
              <p><strong>Installation :</strong> {new Date(container.date_installation).toLocaleDateString()}</p>
            )}
          </div>

          {user?.role === 'AGENT' && tourneeId && (
            <div className="actions">
              <button onClick={() => navigate(`/agent/tournee/etape/nouveau?container=${uid}`)}>
                Enregistrer une collecte
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="error-message">
          <h3>Conteneur non trouvé</h3>
          <p>UID: {uid}</p>
          <p>Vérifiez le QR code ou l'UID saisi.</p>
        </div>
      )}
    </div>
  );
}
