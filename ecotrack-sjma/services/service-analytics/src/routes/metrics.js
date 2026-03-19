const express = require('express');
const fetch = require('node-fetch');
const logger = require('../utils/logger').default || require('../utils/logger');

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

router.get('/overview', async (req, res) => {
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

router.get('/services', async (req, res) => {
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

router.get('/iot', async (req, res) => {
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

router.get('/kafka', async (req, res) => {
  try {
    const [messagesIn, consumerLag, brokerUp] = await Promise.all([
      queryPrometheus('rate(kafka_server_brokertopicmessages_in_total[1m]) * 60'),
      queryPrometheus('kafka_consumer_group_lag'),
      queryPrometheus('kafka_broker_up')
    ]);

    const getValue = (arr) => arr.length > 0 ? parseFloat(arr[0].value[1]).toFixed(2) : 0;

    res.json({
      messages_per_min: getValue(messagesIn),
      consumer_lag: getValue(consumerLag),
      broker_status: brokerUp.length > 0 && brokerUp[0].value[1] === '1' ? 'up' : 'down',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/database', async (req, res) => {
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

router.get('/alerts', async (req, res) => {
  try {
    const response = await fetch(`${PROMETHEUS_URL}/api/v1/alerts`);
    const data = await response.json();
    
    if (data.status === 'success') {
      const alerts = data.data.alerts.map(a => ({
        name: a.labels.alertname,
        severity: a.labels.severity,
        status: a.state,
        description: a.annotations.description,
        activeSince: a.activeAt
      }));
      res.json({ alerts, timestamp: new Date().toISOString() });
    } else {
      res.json({ alerts: [], timestamp: new Date().toISOString() });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history', async (req, res) => {
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
