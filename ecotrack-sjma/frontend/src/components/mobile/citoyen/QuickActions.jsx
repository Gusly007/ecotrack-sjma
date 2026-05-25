import { useNavigate } from 'react-router-dom';
import './QuickActions.css';

const actionRoutes = {
  signaler: '/citoyen/signaler',
  carte: '/citoyen/carte',
  tri: '/citoyen/tri',
  defis: '/citoyen/defis',
};

export default function QuickActions({ actions }) {
  const navigate = useNavigate();

  return (
    <div className="mobile-quick-actions">
      {actions.map((action) => (
        <button
          key={action.id}
          className="mobile-action-card"
          onClick={() => navigate(actionRoutes[action.id] || '/citoyen')}
        >
          <div className="mobile-action-icon" style={{ background: action.color }}>
            <i className={`fas ${action.icon}`}></i>
          </div>
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
}
