# 🚀 EcoTrack Containers Service

Microservice moderne pour la gestion des conteneurs de la plateforme EcoTrack avec **notifications en temps réel** via Socket.IO.

---

## ⚡ Quick Start

```bash
# 1. Clone et installe
npm install

# 2. Configure
cp .env.example .env
# Édite .env avec tes paramètres PostgreSQL

# 3. Initialise la BD
npm run init-db

# 4. Démarre
npm run dev

# ✨ Accède à http://localhost:8080/api
```

---

## 📖 Documentation complète

👉 **Consulte [README_COLLEGUES.md](./README_COLLEGUES.md)** pour les instructions détaillées des collègues.

Autres guides :
- 🧪 [TESTING.md](./TESTING.md) - Guide complet des tests
- 🚀 [DEPLOYMENT.md](./DEPLOYMENT.md) - Guide de déploiement
- 📚 [API Swagger](http://localhost:8080/api-docs) - Documentation interactive

---

## ✨ Fonctionnalités

- ✅ **REST API** complète pour les conteneurs
- ✅ **Socket.IO** notifications en temps réel
- ✅ **UUID v4** pour les identifiants uniques (CNT-XXXXX)
- ✅ **Historique** de tous les changements
- ✅ **Health check** avec état des services
- ✅ **40/40 tests** ✓ Tous passants
- ✅ **Swagger UI** documentation auto

---

## 🎯 API Principal

```
GET    /api/containers              # Lister
POST   /api/containers              # Créer
PATCH  /api/containers/:id/status   # Changer le statut
GET    /api/containers/:id/status/history  # Historique
GET    /health                      # Santé du service
```

---

## 🔌 Socket.IO

```javascript
const socket = io('http://localhost:8080');

// S'abonner à une zone
socket.emit('subscribe-zone', { id_zone: 1 });

// Recevoir les mises à jour
socket.on('container:status-changed', (data) => {
  console.log(data.uid, data.statut);
});
```

---

## 🛠️ Commandes

```bash
npm run dev                 # Mode développement
npm start                   # Mode production
npm test                    # Tous les tests
npm run test:socket         # Tests Socket.IO
npm run init-db            # Initialiser la BD
```

---

## 📊 Architecture

Service en couches :
- **Models** → Accès BD PostgreSQL
- **Services** → Logique métier + Socket.IO
- **Controllers** → Handlers HTTP
- **Routes** → Endpoints Express

Socket.IO intégré pour notifications zone-based.

---

## 🔒 Sécurité

- CORS configuré par environnement
- Validation d'entrées stricte
- Contrainte UNIQUE sur uid
- Transactions atomiques

---

## 📝 Statuts

- `ACTIF` - Opérationnel
- `INACTIF` - Désactivé
- `EN_MAINTENANCE` - En maintenance
- `HORS_SERVICE` - Hors service

---

## 📞 Besoin d'aide ?

1. Lis [README_COLLEGUES.md](./README_COLLEGUES.md)
2. Consulte [TESTING.md](./TESTING.md)
3. Vérifie la section Dépannage du README

---

**Prêt à lancer ? → [README_COLLEGUES.md](./README_COLLEGUES.md)** 🚀
