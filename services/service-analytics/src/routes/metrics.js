const express = require('express');
const fetch = require('node-fetch');
const logger = require('../utils/logger').default || require('../utils/logger');
const authMiddleware = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://prometheus:9090';

const queryPrometheus = async (query) => {
  try {
    const response = await fetch(`${PROMETHEUS_URL}/api/v1/query?query=${encodeURIComponent(query)}`);
    const data = await response.json();
    return data.status === 'success' ? data.data.result : [];
  } catch (err) {
    logger.error('Prometheus query failed:', err.message);
    return [];
  }
};

const queryPrometheusRange = async (query, time) => {
  try {
    const end = Math.floor(Date.now() / 1000);
    const start = end - time;
    const response = await fetch(`${PROMETHEUS_URL}/api/v1/query_range?query=${encodeURIComponent(query)}&start=${start}&end=${end}&step=60`);
    const data = await response.json();
    return data.status === 'success' ? data.data.result : [];
  } catch (err) {
    logger.error('Prometheus range query failed:', err.message);
    return [];
  }
};

router.get('/overview', authMiddleware, requirePermission('analytics:read'), async (req, res) => {
  try {
    const [servicesUp, cpuUsage, memoryUsage, diskUsage, networkIn, networkOut] = await Promise.all([
      queryPrometheus('up{job=~"service-.*"}'),
      queryPrometheus('(1 - avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) by (instance)) * 100'),
      queryPrometheus('(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100'),
      queryPrometheus('(1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100'),
      queryPrometheus('rate(node_network_receive_bytes_total[1m]) * 8 / 1000000'),
      queryPrometheus('rate(node_network_transmit_bytes_total[1m]) * 8 / 1000000')
    ]);

    const services = servicesUp.map(s => ({
      name: s.metric.job,
      status: s.value[1] === '1' ? 'up' : 'down',
      instance: s.metric.instance
    }));

    const infrastructure = {
      cpu: cpuUsage.length > 0 ? parseFloat(cpuUsage[0].value[1]).toFixed(1) : 0,
      memory: memoryUsage.length > 0 ? parseFloat(memoryUsage[0].value[1]).toFixed(1) : 0,
      disk: diskUsage.length > 0 ? parseFloat(diskUsage[0].value[1]).toFixed(1) : 0,
      networkIn: networkIn.length > 0 ? parseFloat(networkIn[0].value[1]).toFixed(2) : 0,
      networkOut: networkOut.length > 0 ? parseFloat(networkOut[0].value[1]).toFixed(2) : 0
    };

    res.json({
      services,
      infrastructure,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/services', authMiddleware, requirePermission('analytics:read'), async (req, res) => {
  try {
    const [servicesUp, latencyAvg, errorRate] = await Promise.all([
      queryPrometheus('up'),
      queryPrometheus('rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m]) * 1000'),
      queryPrometheus('rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100')
    ]);

    const services = servicesUp.map(s => {
      const lat = latencyAvg.find(l => l.metric.job === s.metric.job);
      const err = errorRate.find(e => e.metric.job === s.metric.job);
      return {
        name: s.metric.job,
        status: s.value[1] === '1' ? 'up' : 'down',
        latency_ms: lat ? parseFloat(lat.value[1]).toFixed(2) : null,
        error_rate: err ? parseFloat(err.value[1]).toFixed(3) : 0
      };
    });

    res.json({ services, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/iot', authMiddleware, requirePermission('analytics:read'), async (req, res) => {
  try {
    const [sensorsTotal, sensorsActive, sensorsInactive, lowBattery, lastMeasureAge, containersCritical, containersWarning] = await Promise.all([
      queryPrometheus('ecotrack_iot_sensors_total'),
      queryPrometheus('ecotrack_iot_sensors_total - ecotrack_iot_sensors_inactive_12h'),
      queryPrometheus('ecotrack_iot_sensors_inactive_12h'),
      queryPrometheus('ecotrack_iot_sensors_low_battery'),
      queryPrometheus('ecotrack_iot_last_measurement_age'),
      queryPrometheus('ecotrack_containers_critical'),
      queryPrometheus('ecotrack_containers_warning')
    ]);

    const getValue = (arr) => arr.length > 0 ? parseInt(arr[0].value[1]) : 0;

    res.json({
      sensors: {
        total: getValue(sensorsTotal),
        active: getValue(sensorsActive),
        inactive_12h: getValue(sensorsInactive),
        low_battery: getValue(lowBattery)
      },
      last_measurement_age_seconds: getValue(lastMeasureAge),
      containers: {
        critical: getValue(containersCritical),
        warning: getValue(containersWarning)
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/kafka', authMiddleware, requirePermission('analytics:read'), async (req, res) => {
  try {
    const [messagesIn, consumerLag, brokerInfo] = await Promise.all([
      queryPrometheus('rate(kafka_server_brokertopicmessages_in_total[1m]) * 60'),
      queryPrometheus('kafka_consumer_group_lag'),
      queryPrometheus('kafka_brokers')
    ]);

    const getValue = (arr) => arr.length > 0 ? parseFloat(arr[0].value[1]).toFixed(2) : 0;
    const brokerCount = brokerInfo.length > 0 ? parseInt(brokerInfo[0].value[1]) : 0;

    res.json({
      messages_per_min: getValue(messagesIn),
      consumer_lag: getValue(consumerLag),
      broker_status: brokerCount > 0 ? 'up' : 'down',
      broker_count: brokerCount,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/database', authMiddleware, requirePermission('analytics:read'), async (req, res) => {
  try {
    const [connections, maxConnections, cacheHitRatio] = await Promise.all([
      queryPrometheus('ecotrack_db_connections'),
      queryPrometheus('ecotrack_db_max_connections'),
      queryPrometheus('rate(pg_stat_database_blks_hit[5m]) / (rate(pg_stat_database_blks_hit[5m]) + rate(pg_stat_database_blks_read[5m])) * 100')
    ]);

    const getValue = (arr) => arr.length > 0 ? parseFloat(arr[0].value[1]).toFixed(1) : 0;

    res.json({
      connections: {
        active: getValue(connections),
        max: getValue(maxConnections)
      },
      cache_hit_ratio: getValue(cacheHitRatio),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/alerts', authMiddleware, requirePermission('analytics:read'), async (req, res) => {
  try {
    const { severity, service, status } = req.query;
    const response = await fetch(`${PROMETHEUS_URL}/api/v1/alerts`);
    const data = await response.json();
    
    if (data.status === 'success') {
      const now = Date.now();
      
      let alerts = data.data.alerts.map(a => {
        const activeSince = new Date(a.activeAt).getTime();
        const minutesAgo = Math.floor((now - activeSince) / 60000);
        const hoursAgo = Math.floor(minutesAgo / 60);
        const daysAgo = Math.floor(hoursAgo / 24);
        
        let timeDisplay;
        if (daysAgo > 0) timeDisplay = `il y a ${daysAgo}j`;
        else if (hoursAgo > 0) timeDisplay = `il y a ${hoursAgo}h`;
        else if (minutesAgo > 0) timeDisplay = `il y a ${minutesAgo}min`;
        else timeDisplay = "à l'instant";
        
        return {
          id: `${a.labels.alertname}-${a.labels.instance || 'global'}-${activeSince}`,
          name: a.labels.alertname,
          severity: a.labels.severity || 'warning',
          severityLevel: getSeverityLevel(a.labels.severity),
          status: a.state,
          state: a.state,
          service: a.labels.job || a.labels.category || 'system',
          instance: a.labels.instance || null,
          description: a.annotations.description || a.annotations.summary || '',
          summary: a.annotations.summary || a.labels.alertname,
          action: a.annotations.action || '',
          category: a.labels.category || 'system',
          activeSince: a.activeAt,
          timeAgo: timeDisplay,
          minutesAgo,
          hoursAgo,
          daysAgo
        };
      });
      
      if (severity) alerts = alerts.filter(a => a.severity === severity);
      if (service) alerts = alerts.filter(a => a.service === service);
      if (status) alerts = alerts.filter(a => a.status === status);
      
      alerts.sort((a, b) => getSeverityOrder(a.severityLevel) - getSeverityOrder(b.severityLevel));
      
      const counts = {
        critical: alerts.filter(a => a.severity === 'critical').length,
        warning: alerts.filter(a => a.severity === 'warning').length,
        info: alerts.filter(a => a.severity === 'info').length
      };
      
      res.json({ 
        alerts, 
        counts,
        total: alerts.length,
        timestamp: new Date().toISOString() 
      });
    } else {
      res.json({ alerts: [], counts: { critical: 0, warning: 0, info: 0 }, total: 0, timestamp: new Date().toISOString() });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/alerts/counts', authMiddleware, requirePermission('analytics:read'), async (req, res) => {
  try {
    const response = await fetch(`${PROMETHEUS_URL}/api/v1/alerts`);
    const data = await response.json();
    
    if (data.status === 'success') {
      const counts = {
        critical: 0,
        warning: 0,
        info: 0,
        pending: 0,
        firing: 0
      };
      
      data.data.alerts.forEach(a => {
        const sev = a.labels.severity || 'warning';
        if (sev === 'critical' || sev === 'error') counts.critical++;
        else if (sev === 'warning') counts.warning++;
        else counts.info++;
        
        if (a.state === 'pending') counts.pending++;
        if (a.state === 'firing') counts.firing++;
      });
      
      res.json({ counts, timestamp: new Date().toISOString() });
    } else {
      res.json({ counts: { critical: 0, warning: 0, info: 0, pending: 0, firing: 0 }, timestamp: new Date().toISOString() });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function getSeverityLevel(severity) {
  switch (severity) {
    case 'critical': return 1;
    case 'error': return 1;
    case 'warning': return 2;
    case 'high': return 2;
    case 'medium': return 3;
    case 'info': return 4;
    default: return 3;
  }
}

function getSeverityOrder(level) {
  return level;
}

router.get('/history', authMiddleware, requirePermission('analytics:read'), async (req, res) => {
  try {
    const { metric = 'cpu', period = '3600' } = req.query;
    const metricMap = {
      cpu: '(1 - avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) by (instance)) * 100',
      memory: '(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100',
      disk: '(1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100'
    };
    const query = metricMap[metric] || metricMap.cpu;
    const data = await queryPrometheusRange(query, parseInt(period));
    
    const history = data.length > 0 ? data[0].values.map(v => ({
      timestamp: new Date(v[0] * 1000).toISOString(),
      value: parseFloat(v[1]).toFixed(2)
    })) : [];

    res.json({ metric, period, history, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
