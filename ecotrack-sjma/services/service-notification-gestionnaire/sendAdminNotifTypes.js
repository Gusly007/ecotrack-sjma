#!/usr/bin/env node
'use strict';

require('dotenv').config();

const kafkaAdminProducer = require('./kafkaAdminProducer');
const { ADMIN_NOTIF_TYPES } = require('./src/services/adminNotificationService');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  try {
    console.log('Connecting to Kafka producer...');
    await kafkaAdminProducer.connect();

    const types = Object.values(ADMIN_NOTIF_TYPES || {});
    if (!types || types.length === 0) {
      console.error('No ADMIN_NOTIF_TYPES found');
      process.exit(2);
    }

    for (const t of types) {
      const event = {
        type: t,
        source: 'manual-test-all-types',
        data: { service: 'test-service', info: `test for ${t}` }
      };
      console.log('Sending:', event.type);
      const ok = await kafkaAdminProducer.sendAdminEvent(event);
      console.log('Result for', t, ':', ok);
      await sleep(500);
    }

    await kafkaAdminProducer.disconnect();
    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Error while sending admin events:', err);
    try { await kafkaAdminProducer.disconnect(); } catch (e) {}
    process.exit(1);
  }
}

run();
