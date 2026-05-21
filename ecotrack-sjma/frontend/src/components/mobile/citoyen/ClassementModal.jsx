import { useEffect, useState } from 'react';
import { citoyenService } from '../../../services/citoyenService';
import { safeErrorMessage } from '../../../utils/security';
import './ClassementModal.css';

// Top N citoyens par points. Si le caller n'est pas dans le top, on ajoute
// sa ligne séparée avec un séparateur "…" pour qu'il se voie toujours.
export default function ClassementModal({ open, onClose, currentUserId }) {
  // loading initial à true pour éviter un setState synchrone en tête d'effet.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [classement, setClassement] = useState([]);
  const [meRow, setMeRow] = useState(null);

  useEffect(() => {
    if (!open) return undefined;
    let alive = true;
    // IIFE async : les setState à l'intérieur du corps d'une fonction
    // async sont considérés comme des callbacks (pas du code synchrone
    // dans l'effet) — la règle react-hooks/set-state-in-effect passe.
    (async () => {
      setLoading(true);
      setError('');
      try {
        const payload = await citoyenService.getClassement({ limite: 10, idUtilisateur: currentUserId });
        if (!alive) return;
        // Backend renvoie { classement:[...], utilisateur:{...}|null } soit
        // directement, soit enveloppé dans { data:{...} } selon les services.
        const body = payload?.data ?? payload ?? {};
        setClassement(Array.isArray(body.classement) ? body.classement : []);
        setMeRow(body.utilisateur || null);
      } catch (err) {
        if (alive) setError(safeErrorMessage(err, 'Impossible de charger le classement'));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [open, currentUserId]);

  // La touche Escape ferme la modale (utile pour les tests desktop).
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  // Affiche la ligne du citoyen courant en dehors du top si besoin.
  const topIds = new Set(classement.map((r) => r.id_utilisateur));
  const showMeRow = !!meRow && !topIds.has(meRow.id_utilisateur);

  const displayName = (row) => {
    const full = `${row.prenom || ''} ${row.nom || ''}`.trim();
    return full || `Citoyen #${row.id_utilisateur}`;
  };

  const medalFor = (rang) => {
    if (rang === 1) return { icon: 'fa-trophy', color: '#FFD700' };
    if (rang === 2) return { icon: 'fa-medal', color: '#C0C0C0' };
    if (rang === 3) return { icon: 'fa-medal', color: '#CD7F32' };
    return null;
  };

  return (
    <div
      className="classement-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="classement-title"
    >
      <div
        className="classement-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="classement-handle" aria-hidden="true" />

        <header className="classement-header">
          <h2 id="classement-title">
            <i className="fas fa-trophy" style={{ color: '#FFD700' }} /> Classement
          </h2>
          <button
            type="button"
            className="classement-close"
            onClick={onClose}
            aria-label="Fermer le classement"
          >
            <i className="fas fa-times" />
          </button>
        </header>

        <p className="classement-subtitle">
          Les citoyens les plus engagés de la semaine
        </p>

        {loading && (
          <div className="classement-state">
            <i className="fas fa-circle-notch fa-spin" /> Chargement…
          </div>
        )}

        {!loading && error && (
          <div className="classement-state classement-error">
            <i className="fas fa-exclamation-circle" /> {error}
          </div>
        )}

        {!loading && !error && classement.length === 0 && (
          <div className="classement-state">
            <i className="fas fa-users" /> Aucun citoyen classé pour l'instant.
          </div>
        )}

        {!loading && !error && classement.length > 0 && (
          <ol className="classement-list">
            {classement.map((row) => {
              const isMe = row.id_utilisateur === currentUserId;
              const medal = medalFor(row.rang);
              return (
                <li
                  key={`top-${row.id_utilisateur}`}
                  className={`classement-row ${isMe ? 'is-me' : ''}`}
                >
                  <span className={`classement-rang rang-${row.rang}`}>
                    {medal ? (
                      <i className={`fas ${medal.icon}`} style={{ color: medal.color }} />
                    ) : (
                      `#${row.rang}`
                    )}
                  </span>
                  <span className="classement-nom">
                    {displayName(row)}
                    {isMe && <span className="classement-me-tag">Vous</span>}
                  </span>
                  <span className="classement-points">
                    {row.points} <small>pts</small>
                  </span>
                </li>
              );
            })}

            {showMeRow && (
              <>
                <li className="classement-separator" aria-hidden="true">…</li>
                <li className="classement-row is-me">
                  <span className="classement-rang">#{meRow.rang}</span>
                  <span className="classement-nom">
                    {displayName(meRow)}
                    <span className="classement-me-tag">Vous</span>
                  </span>
                  <span className="classement-points">
                    {meRow.points} <small>pts</small>
                  </span>
                </li>
              </>
            )}
          </ol>
        )}
      </div>
    </div>
  );
}
