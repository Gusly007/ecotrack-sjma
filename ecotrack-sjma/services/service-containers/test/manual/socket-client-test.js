#!/usr/bin/env node

/**
 * Client test Socket.IO pour EcoTrack Containers
 * Teste la transmission des notifications de changement de statut
 */

const io = require('socket.io-client');

// Connexion au serveur Socket.IO
const socket = io('http://localhost:3011');

// ID du conteneur et de la zone à utiliser pour les tests
const containerId = 113;
const zoneId = 1;

console.log('🔌 Tentative de connexion à Socket.IO...');

socket.on('connect', () => {
  console.log('✅ Connecté au serveur Socket.IO');
  console.log(`📍 Socket ID: ${socket.id}`);
  
  // S'abonner à la zone
  console.log(`\n📢 Souscription à la zone ${zoneId}...`);
  socket.emit('subscribe-zone', zoneId);
});

// Écouter les changements de statut
socket.on('container:status-changed', (data) => {
  console.log('\n🔔 ✨ NOTIFICATION DE CHANGEMENT DE STATUT ✨');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  ID Conteneur: ${data.id_conteneur}`);
  console.log(`  UID: ${data.uid}`);
  console.log(`  Ancien Statut: ${data.ancien_statut}`);
  console.log(`  Nouveau Statut: ${data.nouveau_statut} `);
  console.log(`  Date: ${new Date(data.date_changement).toLocaleString('fr-FR')}`);
  console.log(`  Zone: ${data.id_zone}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});

socket.on('disconnect', () => {
  console.log('❌ Déconnecté du serveur');
});

socket.on('error', (error) => {
  console.error('❌ Erreur Socket.IO:', error);
});

// Instructions
console.log(`\n📋 Instructions:
1. Le client est maintenant connecté et écoute les changements de la zone ${zoneId}
2. Pour tester, lancez une requête PATCH:
   
   curl -X PATCH http://localhost:3011/api/V1/containers/${containerId}/status \\
     -H "Content-Type: application/json" \\
     -d '{"statut": "EN_MAINTENANCE"}'
   
   Ou utilisez Postman/Insomnia pour changer le statut du conteneur ${containerId}
   
3. Vous devriez voir une notification s'afficher ici en temps réel

4. Pour arrêter ce client, appuyez sur Ctrl+C\n`);
