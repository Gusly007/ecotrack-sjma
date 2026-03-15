/**
 * Service d'optimisation des tournées de collecte
 * Implémente les algorithmes Nearest Neighbor et 2-opt
 */

/**
 * Calcule la distance Haversine entre deux points GPS (en km)
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Calcule la distance totale d'une route (liste de conteneurs ordonnés)
 */
function totalDistance(route) {
  let dist = 0;
  for (let i = 0; i < route.length - 1; i++) {
    dist += haversineDistance(
      route[i].latitude, route[i].longitude,
      route[i + 1].latitude, route[i + 1].longitude
    );
  }
  return parseFloat(dist.toFixed(3));
}

/**
 * Algorithme Nearest Neighbor (O(n²))
 * Commence par le premier conteneur et choisit toujours le plus proche non visité
 */
function nearestNeighborAlgorithm(containers) {
  if (containers.length === 0) return [];
  if (containers.length === 1) return [...containers];

  const unvisited = [...containers];
  const route = [];

  // Commencer par le premier conteneur (liste triée par fill_level desc)
  let current = unvisited.shift();
  route.push(current);

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = haversineDistance(
        current.latitude, current.longitude,
        unvisited[i].latitude, unvisited[i].longitude
      );
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = i;
      }
    }

    current = unvisited.splice(nearestIdx, 1)[0];
    route.push(current);
  }

  return route;
}

/**
 * Algorithme 2-opt pour améliorer une route existante
 * Essaie tous les échanges de paires d'arêtes pour réduire la distance
 */
function twoOptAlgorithm(route) {
  if (route.length <= 3) return [...route];

  let improved = true;
  let bestRoute = [...route];
  let bestDistance = totalDistance(bestRoute);
  let iterations = 0;
  const maxIterations = 1000;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = 0; i < bestRoute.length - 1; i++) {
      for (let j = i + 2; j < bestRoute.length; j++) {
        // Inverser le segment [i+1, j]
        const newRoute = [
          ...bestRoute.slice(0, i + 1),
          ...bestRoute.slice(i + 1, j + 1).reverse(),
          ...bestRoute.slice(j + 1)
        ];

        const newDistance = totalDistance(newRoute);
        if (newDistance < bestDistance - 0.001) {
          bestRoute = newRoute;
          bestDistance = newDistance;
          improved = true;
        }
      }
    }
  }

  return bestRoute;
}

/**
 * Optimise la route pour une liste de conteneurs
 * @param {Array} containers - Liste de conteneurs avec lat/lon
 * @param {string} algorithme - 'nearest_neighbor' ou '2opt'
 * @returns {Object} Route optimisée avec métadonnées
 */
function optimizeRoute(containers, algorithme = '2opt') {
  if (containers.length === 0) {
    return { route: [], distance_km: 0, algorithme_utilise: algorithme };
  }

  // Appliquer Nearest Neighbor d'abord
  const nnRoute = nearestNeighborAlgorithm(containers);
  const nnDistance = totalDistance(nnRoute);

  let finalRoute;
  let finalDistance;
  let algorithmeUtilise;

  if (algorithme === '2opt') {
    // Améliorer avec 2-opt
    finalRoute = twoOptAlgorithm(nnRoute);
    finalDistance = totalDistance(finalRoute);
    algorithmeUtilise = '2opt';
  } else {
    finalRoute = nnRoute;
    finalDistance = nnDistance;
    algorithmeUtilise = 'nearest_neighbor';
  }

  // Calculer le gain par rapport à l'ordre original
  const originalDistance = totalDistance(containers);
  const gainPct = originalDistance > 0
    ? parseFloat(((originalDistance - finalDistance) / originalDistance * 100).toFixed(2))
    : 0;

  return {
    route: finalRoute,
    distance_km: finalDistance,
    distance_originale_km: originalDistance,
    distance_nn_km: nnDistance,
    gain_pct: gainPct,
    algorithme_utilise: algorithmeUtilise,
    nb_conteneurs: finalRoute.length
  };
}

/**
 * Estime la durée d'une tournée basée sur la distance
 * Hypothèses: vitesse moyenne 20 km/h en ville, 5 min par collecte
 */
function estimateDuration(distanceKm, nbConteneurs) {
  const vitesseMoyenne = 20; // km/h
  const tempsTrajet = (distanceKm / vitesseMoyenne) * 60; // minutes
  const tempsCollecte = nbConteneurs * 5; // 5 minutes par conteneur
  return Math.ceil(tempsTrajet + tempsCollecte);
}

module.exports = {
  optimizeRoute,
  nearestNeighborAlgorithm,
  twoOptAlgorithm,
  totalDistance,
  haversineDistance,
  estimateDuration
};
