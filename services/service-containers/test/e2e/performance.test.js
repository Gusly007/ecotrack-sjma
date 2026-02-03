/**
 * Tests Performance
 * Tests de charge et stabilité
 */

const io = require('socket.io-client');
const request = require('supertest');

describe('Performance Tests', () => {
  const SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:8080';
  const API_URL = `${SERVER_URL}/api`;

  describe('Charge API', () => {
    it('devrait gérer des requêtes concurrentes', async () => {
      const requests = Array(50).fill(null).map(() =>
        request(API_URL).get('/containers')
      );

      const start = Date.now();
      const responses = await Promise.all(requests);
      const duration = Date.now() - start;

      // Toutes les requêtes devraient réussir
      responses.forEach(res => {
        expect([200, 304]).toContain(res.status);
      });

      // Devrait terminer en moins de 5 secondes
      expect(duration).toBeLessThan(5000);
      
      console.log(`50 requêtes concurrentes terminées en ${duration}ms`);
    }, 10000);

    it('devrait gérer des créations en masse', async () => {
      const containers = Array(20).fill(null).map((_, i) => ({
        capacite_l: 100,
        statut: 'Vide',
        latitude: 48.8566 + (i * 0.001),
        longitude: 2.3522 + (i * 0.001),
        id_zone: 1,
        code_type: 'OM'
      }));

      const requests = containers.map(container =>
        request(API_URL)
          .post('/containers')
          .send(container)
      );

      const start = Date.now();
      const responses = await Promise.all(requests);
      const duration = Date.now() - start;

      const successCount = responses.filter(r => r.status === 201).length;
      
      expect(successCount).toBeGreaterThan(15); // Au moins 75% de succès
      console.log(`${successCount}/20 conteneurs créés en ${duration}ms`);
    }, 15000);
  });

  describe('Charge Socket.IO', () => {
    it('devrait gérer plusieurs clients simultanés', (done) => {
      const clientCount = 20;
      const clients = [];
      let connectedCount = 0;

      const start = Date.now();

      // Créer plusieurs clients
      for (let i = 0; i < clientCount; i++) {
        const client = io(SERVER_URL, {
          transports: ['websocket'],
          reconnection: false
        });

        client.on('connect', () => {
          connectedCount++;
          client.emit('subscribe-zone', 1);

          if (connectedCount === clientCount) {
            const duration = Date.now() - start;
            console.log(`${clientCount} clients connectés en ${duration}ms`);

            // Déconnecter tous les clients
            clients.forEach(c => c.disconnect());
            
            expect(connectedCount).toBe(clientCount);
            expect(duration).toBeLessThan(3000);
            done();
          }
        });

        clients.push(client);
      }
    }, 10000);

    it('devrait diffuser efficacement à plusieurs clients', (done) => {
      const clientCount = 10;
      const clients = [];
      let receivedCount = 0;
      let containerId;

      Promise.all(
        Array(clientCount).fill(null).map(() =>
          new Promise(resolve => {
            const client = io(SERVER_URL, { transports: ['websocket'] });
            client.on('connect', () => {
              client.emit('subscribe-zone', 1);
              clients.push(client);
              resolve();
            });
          })
        )
      ).then(() => {
        const start = Date.now();

        // Tous les clients écoutent
        clients.forEach(client => {
          client.once('container:status-changed', () => {
            receivedCount++;
            
            if (receivedCount === clientCount) {
              const duration = Date.now() - start;
              console.log(`Notification diffusée à ${clientCount} clients en ${duration}ms`);

              clients.forEach(c => c.disconnect());
              
              expect(receivedCount).toBe(clientCount);
              expect(duration).toBeLessThan(2000);
              done();
            }
          });
        });

        // Créer et modifier un conteneur
        request(API_URL)
          .post('/containers')
          .send({
            capacite_l: 100,
            statut: 'Vide',
            latitude: 48.8566,
            longitude: 2.3522,
            id_zone: 1,
            code_type: 'OM'
          })
          .then(res => {
            containerId = res.body.data.id;
            return request(API_URL)
              .patch(`/containers/${containerId}/status`)
              .send({ statut: 'Plein' });
          })
          .catch(err => {
            clients.forEach(c => c.disconnect());
            done(err);
          });
      });
    }, 15000);
  });

  describe('Notifications en rafale', () => {
    it('devrait gérer plusieurs notifications rapides', (done) => {
      const zoneId = 1;
      const notificationCount = 10;
      let receivedNotifications = 0;

      const client = io(SERVER_URL, { transports: ['websocket'] });

      client.on('connect', () => {
        client.emit('subscribe-zone', zoneId);

        client.on('container:status-changed', () => {
          receivedNotifications++;
          
          if (receivedNotifications === notificationCount) {
            client.disconnect();
            expect(receivedNotifications).toBe(notificationCount);
            done();
          }
        });

        // Créer plusieurs conteneurs et les modifier rapidement
        const containerPromises = Array(notificationCount).fill(null).map((_, i) =>
          request(API_URL)
            .post('/containers')
            .send({
              capacite_l: 100 + i,
              statut: 'Vide',
              latitude: 48.8566 + (i * 0.001),
              longitude: 2.3522 + (i * 0.001),
              id_zone: zoneId,
              code_type: 'OM'
            })
        );

        Promise.all(containerPromises)
          .then(responses => {
            const statusPromises = responses.map(res =>
              request(API_URL)
                .patch(`/containers/${res.body.data.id}/status`)
                .send({ statut: 'Plein' })
            );
            return Promise.all(statusPromises);
          })
          .catch(err => {
            client.disconnect();
            done(err);
          });
      });
    }, 20000);
  });

  describe('Stabilité', () => {
    it('devrait rester stable sous charge continue', async () => {
      const duration = 5000; // 5 secondes
      const start = Date.now();
      const results = [];

      while (Date.now() - start < duration) {
        const response = await request(API_URL).get('/containers');
        results.push(response.status);
        
        // Petite pause pour éviter de surcharger
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const successCount = results.filter(status => status === 200).length;
      const successRate = (successCount / results.length) * 100;

      console.log(`Taux de succès: ${successRate.toFixed(2)}% sur ${results.length} requêtes`);
      
      expect(successRate).toBeGreaterThan(95); // Au moins 95% de succès
    }, 10000);
  });

  describe('Mémoire et fuites', () => {
    it('devrait nettoyer les connexions Socket.IO fermées', (done) => {
      const clients = [];

      // Créer et fermer rapidement plusieurs connexions
      for (let i = 0; i < 50; i++) {
        const client = io(SERVER_URL, {
          transports: ['websocket'],
          reconnection: false
        });

        client.on('connect', () => {
          client.emit('subscribe-zone', 1);
          
          setTimeout(() => {
            client.disconnect();
          }, 100);
        });

        clients.push(client);
      }

      // Attendre que toutes les connexions soient fermées
      setTimeout(() => {
        // Vérifier qu'une nouvelle connexion fonctionne toujours
        const testClient = io(SERVER_URL, { transports: ['websocket'] });
        
        testClient.on('connect', () => {
          testClient.disconnect();
          done();
        });

        testClient.on('connect_error', (err) => {
          done(err);
        });
      }, 3000);
    }, 10000);
  });
});
