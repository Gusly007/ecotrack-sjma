const logger = require('../utils/logger');
const DateUtils = require('../utils/dateUtils');

let ChartJSNodeCanvas;
try {
  const chartModule = require('chartjs-node-canvas');
  ChartJSNodeCanvas = chartModule.ChartJSNodeCanvas || chartModule.default || chartModule;
} catch (e) {
  logger.warn('chartjs-node-canvas not available, image generation disabled');
}

class ChartService {
  constructor() {
    this.chartJSNodeCanvas = typeof ChartJSNodeCanvas === 'function' ? new ChartJSNodeCanvas({ 
      width: 800, 
      height: 400 
    }) : null;
  }

  /**
   * Générer un graphique en ligne (évolution)
   */
  async generateLineChart(data, options = {}) {
    if (!this.chartJSNodeCanvas) {
      logger.warn('Chart generation not available');
      return null;
    }
    try {
      const configuration = {
        type: 'line',
        data: {
          labels: data.labels,
          datasets: [{
            label: options.label || 'Données',
            data: data.values,
            borderColor: options.color || '#6366F1',
            backgroundColor: options.backgroundColor || 'rgba(99, 102, 241, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: options.title || 'Graphique'
            },
            legend: {
              display: options.showLegend !== false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: options.maxY || undefined
            }
          }
        }
      };

      const imageBuffer = await this.chartJSNodeCanvas.renderToBuffer(configuration);
      return imageBuffer;
    } catch (error) {
      logger.error('Error generating line chart:', error);
      throw error;
    }
  }

  /**
   * Générer un graphique en barres
   */
  async generateBarChart(data, options = {}) {
    if (!this.chartJSNodeCanvas) {
      logger.warn('Chart generation not available');
      return null;
    }
    try {
      const configuration = {
        type: 'bar',
        data: {
          labels: data.labels,
          datasets: [{
            label: options.label || 'Données',
            data: data.values,
            backgroundColor: options.colors || [
              '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: options.title || 'Graphique'
            }
          }
        }
      };

      const imageBuffer = await this.chartJSNodeCanvas.renderToBuffer(configuration);
      return imageBuffer;
    } catch (error) {
      logger.error('Error generating bar chart:', error);
      throw error;
    }
  }

  /**
   * Préparer les données pour Chart.js (format JSON)
   */
  static prepareChartData(evolution) {
    return {
      labels: evolution.map(d => DateUtils.formatDate(d.date, 'dd/MM')),
      datasets: [
        {
          label: 'Remplissage Moyen',
          data: evolution.map(d => d.avg_fill_level),
          borderColor: '#6366F1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Maximum',
          data: evolution.map(d => d.max_fill_level),
          borderColor: '#EF4444',
          borderDash: [5, 5],
          fill: false
        }
      ]
    };
  }
}

module.exports = ChartService;