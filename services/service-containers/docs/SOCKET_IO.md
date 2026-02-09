# Socket.IO - Notifications en Temps Réel

## Configuration

Socket.IO est maintenant intégré à votre API pour envoyer des notifications en temps réel lors des changements de statut des conteneurs.

### Serveur

- **URL**: `ws://localhost:3011`
- **Transport**: WebSocket
- **CORS**: Activé pour toutes les origines

## Événements

### 1. Connection - Connexion Client

```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3011');

socket.on('connect', () => {
  console.log('Connecté au serveur Socket.IO');
});
```

### 2. Subscribe Zone - S'abonner à une zone

Le client s'abonne aux changements de statut d'une zone spécifique.

**Client:**
```javascript
// S'abonner à la zone 1
socket.emit('subscribe-zone', 1);

// Écouter les changements de statut
socket.on('container:status-changed', (data) => {
  console.log('Changement de statut:', {
    id_conteneur: data.id_conteneur,
    uid: data.uid,
    ancien_statut: data.ancien_statut,
    nouveau_statut: data.nouveau_statut,
    date_changement: data.date_changement,
    id_zone: data.id_zone
  });
  
  // Mettre à jour l'interface utilisateur
  updateContainerUI(data);
});
```

### 3. Unsubscribe Zone - Se désabonner d'une zone

```javascript
// Se désabonner de la zone 1
socket.emit('unsubscribe-zone', 1);
```

### 4. Disconnect - Déconnexion

```javascript
socket.on('disconnect', () => {
  console.log('Déconnecté du serveur');
});
```

## Flux Complet d'Utilisation

### Côté Client (Frontend)

```javascript
// 1. Connexion
const socket = io('http://localhost:3011');

socket.on('connect', () => {
  console.log('Connecté');
  
  // 2. S'abonner aux changements de la zone 1
  socket.emit('subscribe-zone', 1);
});

// 3. Écouter les notifications de changement de statut
socket.on('container:status-changed', (data) => {
  console.log('✅ Un conteneur a changé de statut:', {
    conteneur: data.uid,
    ancien_statut: data.ancien_statut,
    nouveau_statut: data.nouveau_statut,
    heure: new Date(data.date_changement).toLocaleTimeString('fr-FR')
  });
  
  // Mettre à jour le DOM
  const containerElement = document.getElementById(`container-${data.id_conteneur}`);
  if (containerElement) {
    containerElement.querySelector('.status').textContent = data.nouveau_statut;
    containerElement.classList.add('updated');
  }
});

// 4. Gérer les changements de zone
document.getElementById('zone-selector').addEventListener('change', (e) => {
  const oldZone = parseInt(e.target.dataset.oldZone);
  const newZone = parseInt(e.target.value);
  
  // Se désabonner de l'ancienne zone
  socket.emit('unsubscribe-zone', oldZone);
  
  // S'abonner à la nouvelle zone
  socket.emit('subscribe-zone', newZone);
  
  e.target.dataset.oldZone = newZone;
});

// 5. Gestion de la déconnexion
socket.on('disconnect', () => {
  console.log('❌ Déconnecté. Reconnexion...');
});
```

### Côté API (Serveur)

Lors du changement de statut:

```javascript
// Dans containercontroller.js - updateStatus()
const updated = await this.service.updateStatus(id, statut);

if (updated.changed && this.socketService) {
  const container = await this.service.getContainerById(id);
  if (container && container.id_zone) {
    // Émettre aux clients de cette zone
    this.socketService.emitStatusChange(container.id_zone, updated);
  }
}
```

## Structure des Données

### Événement: `container:status-changed`

```json
{
  "id_conteneur": 1,
  "uid": "CNT-ABC123XYZ789",
  "ancien_statut": "ACTIF",
  "nouveau_statut": "EN_MAINTENANCE",
  "date_changement": "2025-01-16T10:30:45.123Z",
  "id_zone": 1
}
```

## Exemple Complet - React

```jsx
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

function ContainerList({ zoneId }) {
  const [socket, setSocket] = useState(null);
  const [containers, setContainers] = useState([]);

  useEffect(() => {
    // Connexion Socket.IO
    const newSocket = io('http://localhost:3011');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connecté');
      newSocket.emit('subscribe-zone', zoneId);
    });

    newSocket.on('container:status-changed', (data) => {
      // Mettre à jour le conteneur dans la liste
      setContainers(prev =>
        prev.map(c =>
          c.id_conteneur === data.id_conteneur
            ? { ...c, statut: data.nouveau_statut }
            : c
        )
      );
    });

    return () => {
      if (newSocket) {
        newSocket.emit('unsubscribe-zone', zoneId);
        newSocket.disconnect();
      }
    };
  }, [zoneId]);

  return (
    <div>
      {containers.map(container => (
        <div key={container.id_conteneur}>
          <p>{container.uid}</p>
          <span className={`status ${container.statut.toLowerCase()}`}>
            {container.statut}
          </span>
        </div>
      ))}
    </div>
  );
}

export default ContainerList;
```

## Exemple Complet - Vue.js

```vue
<template>
  <div class="containers">
    <div
      v-for="container in containers"
      :key="container.id_conteneur"
      class="container-card"
      :class="container.statut.toLowerCase()"
    >
      <p>{{ container.uid }}</p>
      <span class="status">{{ container.statut }}</span>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import io from 'socket.io-client';

const props = defineProps(['zoneId']);
const containers = ref([]);
let socket = null;

onMounted(() => {
  socket = io('http://localhost:3011');

  socket.on('connect', () => {
    socket.emit('subscribe-zone', props.zoneId);
  });

  socket.on('container:status-changed', (data) => {
    const index = containers.value.findIndex(
      c => c.id_conteneur === data.id_conteneur
    );
    if (index > -1) {
      containers.value[index].statut = data.nouveau_statut;
    }
  });
});

onUnmounted(() => {
  if (socket) {
    socket.emit('unsubscribe-zone', props.zoneId);
    socket.disconnect();
  }
});
</script>

<style scoped>
.container-card.en_maintenance {
  background-color: #fff3cd;
  border: 2px solid #ffc107;
}

.container-card.actif {
  background-color: #d4edda;
  border: 2px solid #28a745;
}
</style>
```

## Installation Client

### npm
```bash
npm install socket.io-client
```

### HTML CDN
```html
<script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
```

## Tests

### Avec cURL et wscat

```bash
# Installer wscat
npm install -g wscat

# Connecter et s'abonner
wscat -c ws://localhost:3011

# Dans le terminal wscat:
> {"type":"subscribe-zone","data":1}
```

### Avec Postman

1. Créer une requête WebSocket
2. URL: `ws://localhost:3011`
3. Envoyer un message: `subscribe-zone:1`

## Avantages

✅ **Notifications en temps réel** - Pas besoin de polling
✅ **Scalable** - Support des rooms par zone
✅ **Efficace** - Seuls les clients intéressés reçoivent les mises à jour
✅ **Réactif** - Mise à jour instantanée de l'interface
✅ **Fiable** - Reconnexion automatique en cas de déconnexion

## Troubleshooting

### CORS Error
```
Vérifier que CORS est activé dans socket.service.js
cors: {
  origin: '*',
  methods: ['GET', 'POST']
}
```

### Connection refused
- Vérifier que le serveur est lancé sur le port 3000
- Vérifier la configuration réseau/firewall
- Vérifier l'URL: `http://localhost:3011` ou `ws://localhost:3011`

### Événements non reçus
- Vérifier que le client est abonné à la bonne zone
- Vérifier que le conteneur a un id_zone défini
- Vérifier les logs du serveur et du client
