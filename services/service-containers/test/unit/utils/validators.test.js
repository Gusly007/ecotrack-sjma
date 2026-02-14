const Validators = require('../../src/utils/Validators');

function expectValidationError(fn, message) {
  try {
    fn();
    throw new Error('Expected validation error was not thrown');
  } catch (error) {
    expect(error.name).toBe('ValidationError');
    if (message) {
      expect(error.message).toBe(message);
    }
  }
}

describe('Validators', () => {
  test('validateContainerId throws for invalid id', () => {
    expectValidationError(
      () => Validators.validateContainerId(0),
      'ID de conteneur invalide: doit être un nombre entier positif'
    );
  });

  test('validateContainerUid validates CNT format', () => {
    expectValidationError(
      () => Validators.validateContainerUid('123'),
      'UID de conteneur invalide: doit respecter le format CNT-XXXXXXXXXXXX (11 ou 12 caractères)'
    );
    expect(Validators.validateContainerUid('CNT-ABCDEF123456')).toBeUndefined();
    expect(Validators.validateContainerUid('CNT-ABCDEF12345')).toBeUndefined();
  });

  test('validateContainerData enforces required fields on create', () => {
    expectValidationError(
      () => Validators.validateContainerData({}),
      'Champ requis manquant: capacite_l'
    );
  });

  test('validateContainerData blocks statut update', () => {
    expectValidationError(
      () => Validators.validateContainerData({ statut: 'ACTIF' }, { isUpdate: true }),
      'Le statut doit être modifié via la méthode updateStatus dédiée'
    );
  });

  test('validateContainerData requires latitude and longitude together', () => {
    expectValidationError(
      () => Validators.validateContainerData({ latitude: 1 }, { isUpdate: true }),
      'Latitude et longitude doivent être fournies ensemble'
    );
  });

  test('validateZoneData enforces required fields on create', () => {
    expectValidationError(
      () => Validators.validateZoneData({ code: 'Z1', nom: 'Zone' }),
      'Champ requis manquant: population'
    );
  });

  test('validateZoneData accepts valid update', () => {
    expect(
      Validators.validateZoneData({ population: 10, superficie_km2: 2.5 }, { isUpdate: true })
    ).toBe(true);
  });

  test('validateTypeConteneurData validates nom list', () => {
    expectValidationError(
      () => Validators.validateTypeConteneurData({ code: 'ORD', nom: 'INVALID' }),
      'Nom de type conteneur invalide: "INVALID". Valeurs acceptées: ORDURE, RECYCLAGE, VERRE, COMPOST'
    );
  });

  test('validatePagination validates limits', () => {
    expectValidationError(
      () => Validators.validatePagination(0, 10),
      'Page invalide: doit être un nombre entier >= 1'
    );
    expectValidationError(
      () => Validators.validatePagination(1, 2000),
      'Limite invalide: doit être un nombre entier entre 1 et 1000'
    );
  });
});
