#!/usr/bin/env node
'use strict';

// Simulation script: stub DB/Kafka/WebSocket and call adminNotificationService.processKafkaEvent

const path = require('path');

function stubModule(relPath, exportsObj) {
  const full = require.resolve(path.join(__dirname, relPath));
  require.cache[full] = { id: full, filename: full, loaded: true, exports: exportsObj };
}

// Stub notification repository
stubModule('./src/repositories/notification.repository', {
  createNotification: async (payload) => ({ id_notification: Math.floor(Math.random()*10000), ...payload }),
  createBulkNotifications: async (arr) => arr.map((n, i) => ({ id_notification: Math.floor(Math.random()*10000)+i, ...n })),
  findAllAdminUserIds: async () => [101, 102],
  getAdminNotifications: async (filters) => ({ data: [], total: 0, page: 1, limit: 20 }),
  getAdminNotificationStats: async (id) => ({ total: 0, non_lues: 0 })
});

// Stub cache
stubModule('./src/utils/cache', {
  invalidate: async () => true,
  invalidatePattern: async () => true
});

// Stub kafkaAdminProducer
stubModule('./kafkaAdminProducer', {
  connect: async () => true,
  disconnect: async () => true,
  sendAdminNotification: async (n) => { console.log('[stub kafka] sendAdminNotification', n); return true; },
  sendAdminEvent: async (e) => { console.log('[stub kafka] sendAdminEvent', e); return true; },
  ADMIN_TOPIC: 'ecotrack.admin.notifications',
  isConnected: () => true
});

// Stub websocket service
stubModule('./src/services/websocketAdminService', {
  emitAdminNotification: (n) => console.log('[stub ws] emitAdminNotification', n),
  createWebSocketAdminService: () => ({ emitAdminNotification: () => {} }),
  getWebSocketAdminService: () => null
});

// Now require the adminNotificationService and run processKafkaEvent for each type
const adminService = require('./src/services/adminNotificationService');
const { ADMIN_NOTIF_TYPES } = adminService;

(async () => {
  console.log('Simulating admin notification events for types:', Object.values(ADMIN_NOTIF_TYPES));

  for (const key of Object.keys(ADMIN_NOTIF_TYPES)) {
    const type = ADMIN_NOTIF_TYPES[key];
    const event = {
      type,
      source: 'simulate-local',
      data: { service: `svc-${type.toLowerCase()}`, url: 'http://example.local', error: 'simulated' }
    };
    console.log('\n---');
    console.log('Dispatching event:', event.type);
    try {
      const res = await adminService.processKafkaEvent(event);
      console.log('Result:', Array.isArray(res) ? `${res.length} notifications created` : res);
    } catch (err) {
      console.error('Error processing event', err);
    }
    await new Promise(r => setTimeout(r, 200));
  }

  console.log('\nSimulation complete');
  process.exit(0);
})();
