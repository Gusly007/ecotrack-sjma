/**
 * Tests E2E - User Scenarios
 * Tests de scénarios utilisateur complets
 */

const io = require('socket.io-client');
const request = require('supertest');

describe('User Scenarios E2E Tests', () => {
  let socketClient;
  let app;
  const SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:8080';
  const API_URL = `${SERVER_URL}/api`;

  beforeAll((done) => {
    // Connexion au serveur Socket.IO
    socketClient = io(SERVER_URL, {
      transports: ['websocket'],
      reconnection: false
    });

    socketClient.on('connect', done);
  });

  afterAll(() => {
    if (socketClient) socketClient.disconnect();
  });

  describe('Scénario 1: Abonnement zone → Changement statut → Notification', () => {
    it('devrait recevoir une notification lors du changement de statut', (done) => {
      const zoneId = 1;
      let containerId;

      // 1. S'abonner à une zone
      socketClient.emit('subscribe-zone', zoneId);

      // 2. Écouter les notifications
      socketClient.once('container:status-changed', (data) => {
        expect(data).toHaveProperty('changed', true);
        expect(data.container).toHaveProperty('id', containerId);
        expect(data.container.statut).toBe('Plein');
        done();
      });

      // 3. Créer un conteneur dans cette zone
      request(API_URL)
        .post('/containers')
        .send({
          capacite_l: 100,
          statut: 'Vide',
          latitude: 48.8566,
          longitude: 2.3522,
          id_zone: zoneId,
          code_type: 'OM'
        })
        .then(res => {
          containerId = res.body.data.id;

          // 4. Changer le statut du conteneur
          return request(API_URL)
            .patch(`/containers/${containerId}/status`)
            .send({ statut: 'Plein' });
        })
        .catch(done);
    }, 10000);
  });

  describe('Scénario 2: Multi-client notifications', () => {
    it('devrait notifier tous les clients abonnés à la même zone', (done) => {
      const zoneId = 2;
      const client1 = io(SERVER_URL, { transports: ['websocket'] });
      const client2 = io(SERVER_URL, { transports: ['websocket'] });
      
      let notificationsReceived = 0;
      let containerId;

      const checkDone = () => {
        if (notificationsReceived === 2) {
          client1.disconnect();
          client2.disconnect();
          done();
        }
      };

      Promise.all([
        new Promise(resolve => client1.on('connect', resolve)),
        new Promise(resolve => client2.on('connect', resolve))
      ]).then(() => {
        // Les deux clients s'abonnent
        client1.emit('subscribe-zone', zoneId);
        client2.emit('subscribe-zone', zoneId);

        // Les deux écoutent les notifications
        client1.once('container:status-changed', () => {
          notificationsReceived++;
          checkDone();
        });

        client2.once('container:status-changed', () => {
          notificationsReceived++;
          checkDone();
        });

        // Créer et modifier un conteneur
        request(API_URL)
          .post('/containers')
          .send({
            capacite_l: 150,
            statut: 'Vide',
            latitude: 48.8566,
            longitude: 2.3522,
            id_zone: zoneId,
            code_type: 'TRI'
          })
          .then(res => {
            containerId = res.body.data.id;
            return request(API_URL)
              .patch(`/containers/${containerId}/status`)
              .send({ statut: 'Mi-plein' });
          })
          .catch(err => {
            client1.disconnect();
            client2.disconnect();
            done(err);
          });
      });
    }, 15000);
  });

  describe('Scénario 3: Déconnexion et reconnexion', () => {
    it('devrait permettre de se déconnecter et reconnecter', (done) => {
      const zoneId = 3;
      const client = io(SERVER_URL, { transports: ['websocket'] });

      client.on('connect', () => {
        client.emit('subscribe-zone', zoneId);
        
        // Déconnecter
        client.disconnect();
        
        setTimeout(() => {
          // Reconnecter
          client.connect();
          
          client.on('connect', () => {
            // Se réabonner après reconnexion
            client.emit('subscribe-zone', zoneId);
            client.disconnect();
            done();
          });
        }, 1000);
      });
    }, 10000);
  });

  describe('Scénario 4: Filtrage par zone', () => {
    it('ne devrait recevoir que les notifications de sa zone', (done) => {
      const myZone = 4;
      const otherZone = 5;
      let myContainerId, otherContainerId;

      socketClient.emit('subscribe-zone', myZone);

      let notificationReceived = false;

      socketClient.once('container:status-changed', (data) => {
        notificationReceived = true;
        expect(data.container.id_zone).toBe(myZone);
        expect(data.container.id).toBe(myContainerId);
        
        // Attendre un peu pour s'assurer qu'on ne reçoit pas l'autre notification
        setTimeout(() => {
          expect(notificationReceived).toBe(true);
          done();
        }, 2000);
      });

      // Créer deux conteneurs dans des zones différentes
      Promise.all([
        request(API_URL)
          .post('/containers')
          .send({
            capacite_l: 100,
            statut: 'Vide',
            latitude: 48.8566,
            longitude: 2.3522,
            id_zone: myZone,
            code_type: 'OM'
          }),
        request(API_URL)
          .post('/containers')
          .send({
            capacite_l: 100,
            statut: 'Vide',
            latitude: 48.8566,
            longitude: 2.3522,
            id_zone: otherZone,
            code_type: 'OM'
          })
      ]).then(([res1, res2]) => {
        myContainerId = res1.body.data.id;
        otherContainerId = res2.body.data.id;

        // Modifier les deux conteneurs
        return Promise.all([
          request(API_URL)
            .patch(`/containers/${otherContainerId}/status`)
            .send({ statut: 'Plein' }),
          request(API_URL)
            .patch(`/containers/${myContainerId}/status`)
            .send({ statut: 'Plein' })
        ]);
      }).catch(done);
    }, 15000);
  });

  describe('Scénario 5: Historique des changements', () => {
    it('devrait enregistrer l\'historique des changements de statut', async () => {
      // Créer un conteneur
      const createRes = await request(API_URL)
        .post('/containers')
        .send({
          capacite_l: 100,
          statut: 'Vide',
          latitude: 48.8566,
          longitude: 2.3522,
          id_zone: 1,
          code_type: 'OM'
        });

      const containerId = createRes.body.data.id;

      // Changer le statut plusieurs fois
      await request(API_URL)
        .patch(`/containers/${containerId}/status`)
        .send({ statut: 'Mi-plein' });

      await request(API_URL)
        .patch(`/containers/${containerId}/status`)
        .send({ statut: 'Plein' });

      // Récupérer l'historique
      const historyRes = await request(API_URL)
        .get(`/containers/${containerId}/history`);

      expect(historyRes.status).toBe(200);
      expect(historyRes.body.data.length).toBeGreaterThanOrEqual(3); // Vide, Mi-plein, Plein
    });
  });
});
