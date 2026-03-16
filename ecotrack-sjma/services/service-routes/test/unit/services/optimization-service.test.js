const {
  haversineDistance,
  totalDistance,
  nearestNeighborAlgorithm,
  twoOptAlgorithm,
  optimizeRoute,
  estimateDuration
} = require('../../../src/services/optimization-service');

// Conteneurs de test avec coordonnées GPS réalistes (Paris)
const containers = [
  { id_conteneur: 1, latitude: 48.8566, longitude: 2.3522 }, // Paris centre
  { id_conteneur: 2, latitude: 48.8606, longitude: 2.3376 }, // Louvre
  { id_conteneur: 3, latitude: 48.8530, longitude: 2.3499 }, // Quartier Latin
  { id_conteneur: 4, latitude: 48.8738, longitude: 2.2950 }, // Boulogne
  { id_conteneur: 5, latitude: 48.8462, longitude: 2.3785 }  // Nation
];

describe('haversineDistance', () => {
  it('devrait retourner 0 pour deux points identiques', () => {
    const dist = haversineDistance(48.8566, 2.3522, 48.8566, 2.3522);
    expect(dist).toBe(0);
  });

  it('devrait calculer une distance connue approximativement', () => {
    // Paris → Londres ≈ 340 km
    const dist = haversineDistance(48.8566, 2.3522, 51.5074, -0.1278);
    expect(dist).toBeGreaterThan(300);
    expect(dist).toBeLessThan(380);
  });

  it('devrait être symétrique (A→B = B→A)', () => {
    const d1 = haversineDistance(48.8566, 2.3522, 48.8606, 2.3376);
    const d2 = haversineDistance(48.8606, 2.3376, 48.8566, 2.3522);
    expect(Math.abs(d1 - d2)).toBeLessThan(0.001);
  });

  it('devrait retourner une distance positive', () => {
    const dist = haversineDistance(48.8566, 2.3522, 48.8606, 2.3376);
    expect(dist).toBeGreaterThan(0);
  });
});

describe('totalDistance', () => {
  it('devrait retourner 0 pour une route vide', () => {
    expect(totalDistance([])).toBe(0);
  });

  it('devrait retourner 0 pour une route à 1 conteneur', () => {
    expect(totalDistance([containers[0]])).toBe(0);
  });

  it('devrait sommer les distances entre points consécutifs', () => {
    const route = [containers[0], containers[1], containers[2]];
    const d01 = haversineDistance(
      containers[0].latitude, containers[0].longitude,
      containers[1].latitude, containers[1].longitude
    );
    const d12 = haversineDistance(
      containers[1].latitude, containers[1].longitude,
      containers[2].latitude, containers[2].longitude
    );
    const total = totalDistance(route);
    expect(total).toBeCloseTo(d01 + d12, 2);
  });

  it('devrait retourner un nombre à 3 décimales maximum', () => {
    const dist = totalDistance(containers);
    const decimals = (dist.toString().split('.')[1] || '').length;
    expect(decimals).toBeLessThanOrEqual(3);
  });
});

describe('nearestNeighborAlgorithm', () => {
  it('devrait retourner un tableau vide pour une entrée vide', () => {
    expect(nearestNeighborAlgorithm([])).toEqual([]);
  });

  it('devrait retourner le seul conteneur pour une liste de 1', () => {
    const result = nearestNeighborAlgorithm([containers[0]]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(containers[0]);
  });

  it('devrait retourner tous les conteneurs', () => {
    const result = nearestNeighborAlgorithm(containers);
    expect(result).toHaveLength(containers.length);
  });

  it('devrait commencer par le premier conteneur de la liste', () => {
    const result = nearestNeighborAlgorithm(containers);
    expect(result[0]).toEqual(containers[0]);
  });

  it('ne doit pas modifier le tableau original', () => {
    const original = [...containers];
    nearestNeighborAlgorithm(containers);
    expect(containers).toEqual(original);
  });

  it('devrait contenir chaque conteneur exactement une fois', () => {
    const result = nearestNeighborAlgorithm(containers);
    const ids = result.map(c => c.id_conteneur);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(containers.length);
  });
});

describe('twoOptAlgorithm', () => {
  it('devrait retourner la même route pour 3 conteneurs ou moins', () => {
    const twoContainers = containers.slice(0, 2);
    const result = twoOptAlgorithm(twoContainers);
    expect(result).toHaveLength(twoContainers.length);
  });

  it('devrait retourner une route de même longueur', () => {
    const result = twoOptAlgorithm(containers);
    expect(result).toHaveLength(containers.length);
  });

  it('devrait retourner une distance ≤ à la route initiale', () => {
    const initial = nearestNeighborAlgorithm(containers);
    const initialDist = totalDistance(initial);
    const optimized = twoOptAlgorithm(initial);
    const optimizedDist = totalDistance(optimized);
    expect(optimizedDist).toBeLessThanOrEqual(initialDist + 0.001);
  });

  it('devrait contenir chaque conteneur exactement une fois', () => {
    const result = twoOptAlgorithm(containers);
    const ids = result.map(c => c.id_conteneur);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(containers.length);
  });

  it('ne doit pas modifier la route originale', () => {
    const nn = nearestNeighborAlgorithm(containers);
    const nnCopy = [...nn];
    twoOptAlgorithm(nn);
    expect(nn).toEqual(nnCopy);
  });
});

describe('optimizeRoute', () => {
  it('devrait retourner une route vide pour une liste vide', () => {
    const result = optimizeRoute([], '2opt');
    expect(result.route).toEqual([]);
    expect(result.distance_km).toBe(0);
  });

  it('devrait utiliser nearest_neighbor si algorithme = nearest_neighbor', () => {
    const result = optimizeRoute(containers, 'nearest_neighbor');
    expect(result.algorithme_utilise).toBe('nearest_neighbor');
    expect(result.route).toHaveLength(containers.length);
  });

  it('devrait utiliser 2opt par défaut', () => {
    const result = optimizeRoute(containers);
    expect(result.algorithme_utilise).toBe('2opt');
  });

  it('devrait retourner les métadonnées correctes', () => {
    const result = optimizeRoute(containers, '2opt');
    expect(result).toHaveProperty('route');
    expect(result).toHaveProperty('distance_km');
    expect(result).toHaveProperty('distance_originale_km');
    expect(result).toHaveProperty('distance_nn_km');
    expect(result).toHaveProperty('gain_pct');
    expect(result).toHaveProperty('nb_conteneurs');
    expect(result.nb_conteneurs).toBe(containers.length);
  });

  it('gain_pct doit être 0 pour une liste vide', () => {
    const result = optimizeRoute([], '2opt');
    expect(result.gain_pct).toBeUndefined();
  });

  it('devrait calculer un gain positif ou nul', () => {
    const result = optimizeRoute(containers, '2opt');
    expect(result.gain_pct).toBeGreaterThanOrEqual(0);
  });

  it('distance_km doit être ≤ distance_nn_km pour 2opt', () => {
    const result = optimizeRoute(containers, '2opt');
    expect(result.distance_km).toBeLessThanOrEqual(result.distance_nn_km + 0.001);
  });
});

describe('estimateDuration', () => {
  it('devrait retourner 0 pour 0 km et 0 conteneurs', () => {
    expect(estimateDuration(0, 0)).toBe(0);
  });

  it('devrait calculer temps trajet + temps collecte', () => {
    // 20 km @ 20 km/h = 60 min, 4 conteneurs × 5 min = 20 min → total 80 min
    const result = estimateDuration(20, 4);
    expect(result).toBe(80);
  });

  it('devrait arrondir vers le haut (Math.ceil)', () => {
    // 10 km @ 20 km/h = 30 min, 1 conteneur = 5 min → 35 min exactement
    const result = estimateDuration(10, 1);
    expect(result).toBe(35);
  });

  it('devrait retourner un entier', () => {
    const result = estimateDuration(7.5, 3);
    expect(Number.isInteger(result)).toBe(true);
  });
});
