import { useState } from 'react';
import { Filters, SearchBox, SelectFilter } from '../../../components/common';
import './Logs.css';

const mockLogs = [
  { id: 1, time: '14/01 10:32:45', level: 'CRITICAL', message: 'Service IoT — Connection lost to MQTT broker (mqtt.ecotrack.io:1883)' },
  { id: 2, time: '14/01 10:30:12', level: 'WARNING', message: 'Service Analytics — Response time exceeded threshold (850ms > 500ms)' },
  { id: 3, time: '14/01 10:15:03', level: 'WARNING', message: 'AUTH — 5 failed login attempts from IP 192.168.1.42 (user: admin@ecotrack.com)' },
  { id: 4, time: '14/01 09:45:22', level: 'INFO', message: 'USER — admin@ecotrack.com changed role of user #78 from AGENT to GESTIONNAIRE' },
  { id: 5, time: '14/01 09:32:10', level: 'INFO', message: 'AUTH — Login success: jean.dupont@email.com (IP: 78.23.45.12, device: iPhone)' },
  { id: 6, time: '14/01 08:45:01', level: 'INFO', message: 'AUTH — Login success: s.martin@ecotrack.com (IP: 192.168.1.10, device: Chrome/Win)' },
  { id: 7, time: '14/01 07:00:00', level: 'INFO', message: 'AUTH — Login success: admin@ecotrack.com (IP: 192.168.1.1, device: Chrome/Mac)' },
  { id: 8, time: '14/01 06:15:33', level: 'INFO', message: 'AUTH — Login success: m.lefebvre@ecotrack.com (IP: 10.0.1.5, device: Android)' },
  { id: 9, time: '14/01 02:00:00', level: 'INFO', message: 'SYSTEM — Automated backup completed successfully (2.4 GB, duration: 45s)' },
  { id: 10, time: '13/01 23:55:00', level: 'ERROR', message: 'IoT — Sensor CAPT-045 battery critical (5%) — last measurement: 23:54:12' },
];

const levelColors = {
  CRITICAL: 'critical',
  ERROR: 'error',
  WARNING: 'warn',
  INFO: 'info'
};

export default function LogsPage() {
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = mockLogs.filter(log => {
    const matchLevel = filterLevel === 'all' || log.level === filterLevel;
    const matchSearch = searchTerm === '' || log.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchLevel && matchSearch;
  });

  return (
    <div className="logs-page">
        <h1>Logs d'audit</h1>
        
        <Filters>
          <SelectFilter 
            value={filterLevel}
            onChange={setFilterLevel}
            options={[
              { value: 'all', label: 'Tous niveaux' },
              { value: 'INFO', label: 'INFO' },
              { value: 'WARNING', label: 'WARNING' },
              { value: 'ERROR', label: 'ERROR' },
              { value: 'CRITICAL', label: 'CRITICAL' }
            ]}
          />
          <SelectFilter 
            value={filterAction}
            onChange={setFilterAction}
            options={[
              { value: 'all', label: 'Toutes actions' },
              { value: 'LOGIN', label: 'LOGIN' },
              { value: 'LOGOUT', label: 'LOGOUT' },
              { value: 'CREATE', label: 'CREATE' },
              { value: 'UPDATE', label: 'UPDATE' },
              { value: 'DELETE', label: 'DELETE' }
            ]}
          />
          <SearchBox 
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Rechercher dans les logs..."
          />
          <button className="btn-outline">
            <i className="fas fa-download"></i> Exporter
          </button>
        </Filters>

        <div className="logs-list">
          {filteredLogs.map(log => (
            <div key={log.id} className="log-entry">
              <span className="log-time">{log.time}</span>
              <span className={`log-level ${levelColors[log.level]}`}>{log.level}</span>
              <span className="log-msg">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
  );
}
