#!/usr/bin/env node

/**
 * Script de Test Interactif Socket.IO
 * Permet de tester manuellement les fonctionnalités Socket.IO
 * 
 * Utilisation: node test-socket-interactive.js
 */

const io = require('socket.io-client');
const readline = require('readline');

const socket = io('http://localhost:3011');
let currentZones = new Set();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ============= SETUP SOCKET =============
socket.on('connect', () => {
  console.log('✅ Connecté au serveur');
  console.log(`📍 Socket ID: ${socket.id}\n`);
  showMenu();
});

socket.on('container:status-changed', (data) => {
  console.log('\n🔔 ✨ NOTIFICATION REÇUE ✨');
  console.log('═══════════════════════════════════');
  console.log(`  📦 Conteneur: ${data.uid}`);
  console.log(`  🔄 ${data.ancien_statut} → ${data.nouveau_statut}`);
  console.log(`  🗓️  ${new Date(data.date_changement).toLocaleString('fr-FR')}`);
  console.log(`  🌍 Zone: ${data.id_zone}`);
  console.log('═══════════════════════════════════\n');
  showMenu();
});

socket.on('disconnect', () => {
  console.log('❌ Déconnecté du serveur');
});

socket.on('error', (error) => {
  console.error('❌ Erreur Socket:', error);
  showMenu();
});

// ============= MENU =============
function showMenu() {
  console.log('\n📋 MENU:');
  console.log('  1. S\'abonner à une zone');
  console.log('  2. Se désabonner d\'une zone');
  console.log('  3. Afficher les zones actives');
  console.log('  4. Simuler un changement de statut');
  console.log('  5. Afficher l\'aide');
  console.log('  6. Quitter\n');

  rl.question('Choisissez une option (1-6): ', (choice) => {
    handleChoice(choice);
  });
}

function handleChoice(choice) {
  switch (choice.trim()) {
    case '1':
      subscribeToZone();
      break;
    case '2':
      unsubscribeFromZone();
      break;
    case '3':
      showActiveZones();
      break;
    case '4':
      simulateStatusChange();
      break;
    case '5':
      showHelp();
      break;
    case '6':
      quit();
      break;
    default:
      console.log('❌ Option invalide');
      showMenu();
  }
}

// ============= ACTIONS =============

function subscribeToZone() {
  rl.question('Entrez le numéro de zone (ex: 1): ', (zoneId) => {
    zoneId = parseInt(zoneId);
    if (isNaN(zoneId)) {
      console.log('❌ Zone invalide');
      showMenu();
      return;
    }

    socket.emit('subscribe-zone', zoneId);
    currentZones.add(zoneId);
    console.log(`✅ Abonné à la zone ${zoneId}`);
    showMenu();
  });
}

function unsubscribeFromZone() {
  if (currentZones.size === 0) {
    console.log('⚠️  Aucune zone active');
    showMenu();
    return;
  }

  console.log('Zones actives:', Array.from(currentZones).join(', '));
  rl.question('Entrez le numéro de zone à quitter (ex: 1): ', (zoneId) => {
    zoneId = parseInt(zoneId);
    if (!currentZones.has(zoneId)) {
      console.log('❌ Vous n\'êtes pas abonné à cette zone');
      showMenu();
      return;
    }

    socket.emit('unsubscribe-zone', zoneId);
    currentZones.delete(zoneId);
    console.log(`✅ Désabonné de la zone ${zoneId}`);
    showMenu();
  });
}

function showActiveZones() {
  if (currentZones.size === 0) {
    console.log('❌ Aucune zone active');
  } else {
    console.log('✅ Zones actives:', Array.from(currentZones).sort().join(', '));
  }
  showMenu();
}

function simulateStatusChange() {
  if (currentZones.size === 0) {
    console.log('⚠️  Abonnez-vous à une zone d\'abord');
    showMenu();
    return;
  }

  console.log('\n📌 SIMULATEUR DE CHANGEMENT DE STATUT');
  console.log('Statuts valides: ACTIF, INACTIF, EN_MAINTENANCE, HORS_SERVICE\n');

  rl.question('ID du conteneur: ', (id) => {
    rl.question('UID du conteneur (ex: CNT-123456789): ', (uid) => {
      rl.question('Ancien statut: ', (oldStatus) => {
        rl.question('Nouveau statut: ', (newStatus) => {
          rl.question('Zone: ', (zone) => {
            const mockData = {
              id_conteneur: parseInt(id),
              uid: uid,
              ancien_statut: oldStatus.toUpperCase(),
              nouveau_statut: newStatus.toUpperCase(),
              date_changement: new Date().toISOString(),
              id_zone: parseInt(zone)
            };

            console.log('\n📨 Données simulées:');
            console.log(JSON.stringify(mockData, null, 2));
            console.log('\n💡 Note: Ceci est une simulation. Pour un vrai test, lancez:');
            console.log(`curl -X PATCH http://localhost:3011/api/containers/${id}/status \`);
            console.log(`  -H "Content-Type: application/json" \\`);
            console.log(`  -d '{"statut": "${newStatus.toUpperCase()}"}'`);

            showMenu();
          });
        });
      });
    });
  });
}

function showHelp() {
  console.log(`
📖 GUIDE D'UTILISATION:

1. S'abonner à une zone:
   - Choisissez l'option 1
   - Entrez le numéro de zone (ex: 1)
   - Vous recevrez toutes les notifications de cette zone

2. Changer le statut d'un conteneur:
   - Dans un autre terminal, lancez:
   curl -X PATCH http://localhost:3011/api/containers/1/status \\
     -H "Content-Type: application/json" \\
     -d '{"statut": "EN_MAINTENANCE"}'
   
   - Vous verrez la notification s'afficher immédiatement

3. Pour tester plusieurs zones:
   - Abonnez-vous à plusieurs zones
   - Changez le statut de conteneurs dans différentes zones
   - Observez que vous recevez les notifications que des zones abonnées

4. Statuts valides:
   - ACTIF
   - INACTIF
   - EN_MAINTENANCE
   - HORS_SERVICE

💡 CONSEIL: Ouvrez plusieurs instances pour tester les notifications
           en temps réel vers plusieurs clients!
  `);
  showMenu();
}

function quit() {
  console.log('👋 Au revoir!');
  socket.disconnect();
  rl.close();
  process.exit(0);
}

// ============= STARTUP =============
console.log(`
╔═══════════════════════════════════════════╗
║  🧪 TESTEUR SOCKET.IO INTERACTIF          ║
║  Connecté à: http://localhost:3011        ║
╚═══════════════════════════════════════════╝
`);

// Gestion des fermetures
rl.on('close', () => {
  socket.disconnect();
  process.exit(0);
});
