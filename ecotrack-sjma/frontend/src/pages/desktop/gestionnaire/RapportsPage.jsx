import { useMemo, useState } from 'react';
import { Alert, Button, useAlert } from '../../../components/common';
import { reportService } from '../../../services/reportService';
import './RapportsPage.css';

const REPORT_TYPES = [
  { value: 'monthly_complete', label: 'Mensuel complet' },
  { value: 'routes_performance', label: 'Performance de tournée' },
  { value: 'environmental_impact', label: 'Analyse impact environnemental' }
];

const PERIODS = [
  { value: 'day', label: 'Jour' },
  { value: 'week', label: 'Semaine' },
  { value: 'month', label: 'Mois' }
];

const FORMATS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'csv', label: 'CSV' }
];

function reportTypeLabel(value) {
  return REPORT_TYPES.find((item) => item.value === value)?.label || value;
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('fr-FR');
}

export default function RapportsPage() {
  const { alert, showSuccess, showError, clearAlert } = useAlert();
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState('monthly_complete');
  const [format, setFormat] = useState('pdf');
  const [period, setPeriod] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [recentReports, setRecentReports] = useState(() => reportService.getRecentReports());

  const sortedRecent = useMemo(
    () => [...recentReports].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [recentReports]
  );

  const handleGenerate = async () => {
    try {
      setGenerating(true);

      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        showError('La date de début doit être inférieure à la date de fin.');
        return;
      }

      let generated;
      if (format === 'pdf') {
        generated = await reportService.generatePdfReport({ reportType, period });
      } else {
        generated = await reportService.generateCsvReport({ reportType, period, startDate, endDate });
      }

      setRecentReports(reportService.getRecentReports());
      showSuccess(`Rapport ${format.toUpperCase()} généré avec succès.`);

      if (generated) {
        await reportService.downloadRecentReport(generated);
      }
    } catch (error) {
      showError(error?.response?.data?.message || error?.message || 'Erreur lors de la génération du rapport.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (reportItem) => {
    try {
      await reportService.downloadRecentReport(reportItem);
    } catch (error) {
      showError(error?.response?.data?.message || error?.message || 'Impossible de télécharger ce rapport.');
    }
  };

  const handleClearRecent = () => {
    reportService.clearRecentReports();
    setRecentReports([]);
    showSuccess('Historique des rapports vide.');
  };

  return (
    <div className="rapports-page">
      <div className="rapports-header">
        <div>
          <h2>Rapports Gestionnaire</h2>
          <p>Générez vos rapports en PDF ou CSV et retrouvez les derniers exports.</p>
        </div>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={clearAlert} />}

      <section className="rapports-generator panel">
        <h3>Générer un rapport</h3>

        <div className="rapports-form-grid">
          <label>
            Type de rapport
            <select value={reportType} onChange={(event) => setReportType(event.target.value)}>
              {REPORT_TYPES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          <label>
            Format
            <select value={format} onChange={(event) => setFormat(event.target.value)}>
              {FORMATS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          <label>
            Période
            <select value={period} onChange={(event) => setPeriod(event.target.value)}>
              {PERIODS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          <label>
            Date début (optionnel)
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>

          <label>
            Date fin (optionnel)
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </label>
        </div>

        <div className="rapports-actions">
          <Button
            variant="primary"
            icon={format === 'pdf' ? 'fa-file-pdf' : 'fa-file-csv'}
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? <><i className="fas fa-spinner fa-spin"></i> Génération...</> : `Générer ${format.toUpperCase()}`}
          </Button>
        </div>
      </section>

      <section className="rapports-recent panel">
        <div className="rapports-recent-head">
          <h3>Rapports récents</h3>
          {!!sortedRecent.length && (
            <button type="button" className="btn-link" onClick={handleClearRecent}>
              Vider
            </button>
          )}
        </div>

        {!sortedRecent.length ? (
          <div className="rapports-empty">Aucun rapport récent.</div>
        ) : (
          <div className="rapports-table-wrap">
            <table className="rapports-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Type</th>
                  <th>Format</th>
                  <th>Période</th>
                  <th>Généré le</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sortedRecent.map((report) => (
                  <tr key={report.id}>
                    <td>{report.title || report.fileName || '-'}</td>
                    <td>{reportTypeLabel(report.reportType)}</td>
                    <td>{String(report.format || '').toUpperCase()}</td>
                    <td>{report.period || '-'}</td>
                    <td>{formatDateTime(report.generatedAt || report.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-download"
                        onClick={() => handleDownload(report)}
                      >
                        <i className="fas fa-download"></i>
                        Télécharger
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
