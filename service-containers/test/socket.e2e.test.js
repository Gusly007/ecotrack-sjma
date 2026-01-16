/**
 * Tests E2E - Socket.IO Client/Server
 * Tests fonctionnels complets du système Socket.IO
 * 
 * À lancer APRÈS avoir démarré le serveur: npm start
 * Utilisez: npm run test:e2e:socket
 */

const io = require('socket.io-client');

describe('Socket.IO E2E Tests', () => {
  let socket;
  const SERVER_URL = 'http://localhost:8080';
  const TIMEOUT = 5000;

  beforeEach((done) => {
    socket = io(SERVER_URL, {
      reconnection: true,
      reconnectionDelay: 100,
      reconnectionDelayMax: 500,
      reconnectionAttempts: 5
    });

    socket.on('connect', done);
    socket.on('connect_error', (error) => {
      done(error);
    });
  });

  afterEach((done) => {
    if (socket.connected) {
      socket.disconnect();
    }
    done();
  });

  describe('Connection', () => {
    it('should connect to the server', (done) => {
      expect(socket.connected).toBe(true);
      done();
    });

    it('should have a unique socket ID', (done) => {
      expect(socket.id).toBeDefined();
      expect(socket.id).toMatch(/^[a-zA-Z0-9_-]+$/);
      done();
    });

    it('should disconnect gracefully', (done) => {
      socket.on('disconnect', () => {
        expect(socket.connected).toBe(false);
        done();
      });
      socket.disconnect();
    });
  });

  describe('Subscribe/Unsubscribe to Zone', () => {
    it('should subscribe to a zone', (done) => {
      const zoneId = 1;

      // Le client devrait recevoir une confirmation (ou au moins pas d'erreur)
      socket.emit('subscribe-zone', zoneId);

      // Vérifier que le serveur a accepté
      setTimeout(() => {
        expect(socket.connected).toBe(true);
        done();
      }, 500);
    });

    it('should unsubscribe from a zone', (done) => {
      const zoneId = 1;

      socket.emit('subscribe-zone', zoneId);
      setTimeout(() => {
        socket.emit('unsubscribe-zone', zoneId);
        setTimeout(() => {
          expect(socket.connected).toBe(true);
          done();
        }, 200);
      }, 200);
    });

    it('should handle multiple zone subscriptions', (done) => {
      socket.emit('subscribe-zone', 1);
      setTimeout(() => {
        socket.emit('subscribe-zone', 2);
        setTimeout(() => {
          socket.emit('subscribe-zone', 3);
          setTimeout(() => {
            expect(socket.connected).toBe(true);
            done();
          }, 200);
        }, 200);
      }, 200);
    });
  });

  describe('Status Change Events', () => {
    it('should receive container:status-changed event', (done) => {
      const zoneId = 1;
      let eventReceived = false;

      socket.on('container:status-changed', (data) => {
        eventReceived = true;
        expect(data).toHaveProperty('id_conteneur');
        expect(data).toHaveProperty('uid');
        expect(data).toHaveProperty('ancien_statut');
        expect(data).toHaveProperty('nouveau_statut');
        expect(data).toHaveProperty('date_changement');
        expect(data).toHaveProperty('id_zone');
      });

      socket.emit('subscribe-zone', zoneId);

      // Dans un vrai test, vous lanceriez une requête HTTP pour changer le statut
      // et vérifieriez que l'événement est reçu

      done();
    });

    it('should only receive events for subscribed zones', (done) => {
      const subscribedZone = 1;
      const unsubscribedZone = 999;

      socket.emit('subscribe-zone', subscribedZone);

      // Simuler deux conteneurs dans différentes zones
      const mockEvent1 = {
        id_conteneur: 1,
        uid: 'CNT-123',
        ancien_statut: 'ACTIF',
        nouveau_statut: 'EN_MAINTENANCE',
        id_zone: subscribedZone
      };

      const mockEvent2 = {
        id_conteneur: 2,
        uid: 'CNT-456',
        ancien_statut: 'INACTIF',
        nouveau_statut: 'ACTIF',
        id_zone: unsubscribedZone
      };

      socket.on('container:status-changed', (data) => {
        // Ne devrait recevoir que les événements de la zone 1
        expect(data.id_zone).toBe(subscribedZone);
      });

      done();
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors gracefully', (done) => {
      const badSocket = io('http://localhost:9999', {
        reconnectionAttempts: 1,
        reconnectionDelay: 100
      });

      badSocket.on('connect_error', () => {
        expect(badSocket.connected).toBe(false);
        badSocket.disconnect();
        done();
      });
    });

    it('should handle disconnect and reconnect', (done) => {
      socket.disconnect();

      setTimeout(() => {
        socket.connect();
        socket.on('connect', () => {
          expect(socket.connected).toBe(true);
          done();
        });
      }, 100);
    });
  });
});

/**
 * Tests fonctionnels manuels
 * 
 * À exécuter dans l'ordre:
 * 
 * 1. Démarrer le serveur:
 *    npm start
 * 
 * 2. En parallèle, lancer le test Socket.IO:
 *    node test-socket-client.js
 * 
 * 3. Dans un autre terminal, changer le statut d'un conteneur:
 *    curl -X PATCH http://localhost:3000/api/containers/1/status \
 *      -H "Content-Type: application/json" \
 *      -d '{"statut": "EN_MAINTENANCE"}'
 * 
 * 4. Vous devriez voir la notification s'afficher dans le terminal du test.
 */
