import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import MobileLayout from '../../../components/mobile/MobileLayout';
import MobileCard from '../../../components/mobile/MobileCard';
import './NotificationSettings.css';

const ALL_ITEMS = [
  {
    key: 'alertes',
    icon: 'fa-exclamation-circle',
    color: '#f44336',
    title: 'Alertes',
    desc: 'Conteneurs critiques, urgences',
    roles: ['AGENT', 'CITOYEN', 'GESTIONNAIRE', 'ADMIN'],
  },
  {
    key: 'tournees',
    icon: 'fa-route',
    color: '#2196F3',
    title: 'Tournees',
    desc: 'Assignation, changements de tournee',
    roles: ['AGENT', 'GESTIONNAIRE', 'ADMIN'],
  },
  {
    key: 'badges',
    icon: 'fa-medal',
    color: '#FF9800',
    title: 'Badges',
    desc: 'Nouveaux badges et recompenses',
    roles: ['CITOYEN'],
  },
  {
    key: 'systeme',
    icon: 'fa-cog',
    color: '#607d8b',
    title: 'Systeme',
    desc: 'Maintenance, mises a jour',
    roles: ['ADMIN'],
  },
];

const DEFAULT_PREFS = { alertes: true, tournees: true, badges: true, systeme: false };

export default function NotificationSettings() {
  const { user } = useAuth();
  const role = user?.role || user?.role_par_defaut || 'CITOYEN';

  const [settings, setSettings] = useState(() => {
    try {
      return { ...DEFAULT_PREFS, ...(JSON.parse(localStorage.getItem('notif_prefs')) || {}) };
    } catch {
      return DEFAULT_PREFS;
    }
  });

  const visibleItems = ALL_ITEMS.filter((item) => item.roles.includes(role));

  const toggle = (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    localStorage.setItem('notif_prefs', JSON.stringify(updated));
  };

  return (
    <MobileLayout title="Parametres notifications" showBack>
      <MobileCard>
        {visibleItems.map((item) => (
          <div key={item.key} className="notif-setting-item">
            <div>
              <strong>
                <i className={`fas ${item.icon}`} style={{ color: item.color, marginRight: 8 }}></i>
                {item.title}
              </strong>
              <p>{item.desc}</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={!!settings[item.key]}
                onChange={() => toggle(item.key)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        ))}
      </MobileCard>
    </MobileLayout>
  );
}
