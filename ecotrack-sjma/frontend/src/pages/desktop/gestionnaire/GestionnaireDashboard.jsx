import './GestionnaireDashboard.css';

export default function GestionnaireDashboard() {
  return (
    <div className="gestionnaire-dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green"><i className="fas fa-route"></i></div>
          <div className="stat-label">Tournées actives</div>
          <div className="stat-value">12/15</div>
          <div className="stat-change">Aujourd'hui</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><i className="fas fa-users"></i></div>
          <div className="stat-label">Agents terrain</div>
          <div className="stat-value">28/30</div>
          <div className="stat-change">2 en congé</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><i className="fas fa-trash-alt"></i></div>
          <div className="stat-label">Conteneurs collectés</div>
          <div className="stat-value">432/650</div>
          <div className="stat-change">218 restants</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><i className="fas fa-exclamation-triangle"></i></div>
          <div className="stat-label">Alertes en attente</div>
          <div className="stat-value">5</div>
          <div className="stat-change down">3 critiques</div>
        </div>
      </div>

      <div className="panel-grid">
        <div className="panel">
          <h3><i className="fas fa-exclamation-circle" style={{ color: '#f44336' }}></i> Alertes urgentes</h3>
          <div className="alert-item critical"><i className="fas fa-fill-drip" style={{ color: '#f44336' }}></i> Zone Nord : 3 conteneurs débordants</div>
          <div className="alert-item warning"><i className="fas fa-clock" style={{ color: '#FF9800' }}></i> Agent AGT-007 : Retard de 45 min</div>
          <div className="alert-item warning"><i className="fas fa-truck" style={{ color: '#FF9800' }}></i> Camion CAM-012 : Maintenance requise</div>
          <div className="alert-item info"><i className="fas fa-info-circle" style={{ color: '#2196F3' }}></i> 12 signalements citoyens en attente</div>
          <div className="alert-item info"><i className="fas fa-microchip" style={{ color: '#2196F3' }}></i> Capteur CAPT-045 : batterie faible (15%)</div>
        </div>
        <div className="panel">
          <h3><i className="fas fa-chart-bar" style={{ color: '#4CAF50' }}></i> Collectes aujourd'hui</h3>
          <div className="chart-bars">
            <div className="chart-bar" style={{ height: '75%' }}><span className="bar-label">Zone N</span></div>
            <div className="chart-bar" style={{ height: '60%' }}><span className="bar-label">Zone S</span></div>
            <div className="chart-bar" style={{ height: '90%' }}><span className="bar-label">Centre</span></div>
            <div className="chart-bar" style={{ height: '45%', background: '#FF9800' }}><span className="bar-label">Zone E</span></div>
            <div className="chart-bar" style={{ height: '30%', background: '#FF9800' }}><span className="bar-label">Zone O</span></div>
          </div>
        </div>
      </div>

      <div className="chart-container">
        <h3>Tournées en cours</h3>
        <table className="bo-table">
          <thead>
            <tr>
              <th>Tournée</th>
              <th>Agent</th>
              <th>Zone</th>
              <th>Progression</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>T-2026-00042</td>
              <td>Marc Lefebvre</td>
              <td>Centre-Ville</td>
              <td>
                <div className="progress-bar" style={{ width: '120px', display: 'inline-block', verticalAlign: 'middle' }}>
                  <div className="progress-fill" style={{ width: '73%' }}></div>
                </div> 73%
              </td>
              <td><span className="status-dot green"></span>En cours</td>
            </tr>
            <tr>
              <td>T-2026-00043</td>
              <td>Julie Renard</td>
              <td>Zone Nord</td>
              <td>
                <div className="progress-bar" style={{ width: '120px', display: 'inline-block', verticalAlign: 'middle' }}>
                  <div className="progress-fill" style={{ width: '45%' }}></div>
                </div> 45%
              </td>
              <td><span className="status-dot green"></span>En cours</td>
            </tr>
            <tr>
              <td>T-2026-00044</td>
              <td>Pierre Morel</td>
              <td>Zone Sud</td>
              <td>
                <div className="progress-bar" style={{ width: '120px', display: 'inline-block', verticalAlign: 'middle' }}>
                  <div className="progress-fill" style={{ width: '92%' }}></div>
                </div> 92%
              </td>
              <td><span className="status-dot green"></span>Bientôt fini</td>
            </tr>
            <tr>
              <td>T-2026-00045</td>
              <td>Luc Bernard</td>
              <td>Zone Est</td>
              <td>
                <div className="progress-bar" style={{ width: '120px', display: 'inline-block', verticalAlign: 'middle' }}>
                  <div className="progress-fill" style={{ width: '10%' }}></div>
                </div> 10%
              </td>
              <td><span className="status-dot orange"></span>Retard</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}