#!/usr/bin/env node
'use strict';

require('dotenv').config();

const kafkaAdminProducer = require('./kafkaAdminProducer');

async function run() {
  try {
    console.log('Connecting to Kafka producer...');
    await kafkaAdminProducer.connect();

    const event = {
      type: 'SERVICE_DOWN',
      source: 'manual-test-script',
      data: { service: 'test-service', url: 'http://test.local', error: 'manual-trigger' }
    };

    console.log('Sending admin event:', event);
    const ok = await kafkaAdminProducer.sendAdminEvent(event);
    console.log('Send result:', ok);

    await kafkaAdminProducer.disconnect();
    process.exit(ok ? 0 : 2);
  } catch (err) {
    console.error('Error sending admin event:', err);
    try { await kafkaAdminProducer.disconnect(); } catch (e) {}
    process.exit(1);
  }
}

run();
