import { useState } from 'react';
import MobileLayout from '../../../components/mobile/MobileLayout';
import MobileCard from '../../../components/mobile/MobileCard';
import './NotificationSettings.css';

export default function NotificationSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('notif_prefs')) || {
        alertes: true,
        tournees: true,
      };
    } catch {
      return { alertes: true, tournees: true };
    }
  });

  const toggle = (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    localStorage.setItem('notif_prefs', JSON.stringify(updated));
  };

  return (
    <MobileLayout title="Parametres notifications" showBack>
      <MobileCard>
        <div className="notif-setting-item">
          <div>
            <strong><i className="fas fa-exclamation-circle" style={{ color: '#f44336', marginRight: 8 }}></i>Alertes</strong>
            <p>Conteneurs critiques, urgences</p>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" checked={settings.alertes} onChange={() => toggle('alertes')} />
            <span className="toggle-slider"></span>
          </label>
        </div>
        <div className="notif-setting-item">
          <div>
            <strong><i className="fas fa-route" style={{ color: '#2196F3', marginRight: 8 }}></i>Tournees</strong>
            <p>Assignation, changements de tournee</p>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" checked={settings.tournees} onChange={() => toggle('tournees')} />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </MobileCard>
    </MobileLayout>
  );
}
