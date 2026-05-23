const {
  anomalieSchema,
  validateSchema,
} = require('../../../src/validators/tournee.validator');

describe('anomalieSchema', () => {
  const valid = {
    id_conteneur: 3,
    type_anomalie: 'CONTENEUR_INACCESSIBLE',
    description: 'Acces bloque par une voiture',
  };

  it('accepte un payload mobile complet', () => {
    expect(() => validateSchema(anomalieSchema, valid)).not.toThrow();
  });

  it('accepte les nouveaux types ajoutes', () => {
    ['CONTENEUR_PLEIN', 'CONTENEUR_SALE', 'MAUVAISE_ODEUR', 'CAPTEUR_DEFAILLANT', 'CONTENEUR_ENDOMMAGE']
      .forEach((t) => {
        expect(() => validateSchema(anomalieSchema, { ...valid, type_anomalie: t })).not.toThrow();
      });
  });

  it('accepte la gravite optionnelle', () => {
    expect(() => validateSchema(anomalieSchema, { ...valid, gravite: 'Haute' })).not.toThrow();
  });

  it('rejette si id_conteneur manque', () => {
    const { id_conteneur, ...rest } = valid;
    expect(() => validateSchema(anomalieSchema, rest)).toThrow(/conteneur/i);
  });

  it('rejette si id_conteneur est null', () => {
    expect(() => validateSchema(anomalieSchema, { ...valid, id_conteneur: null })).toThrow();
  });

  it('rejette si type_anomalie est inconnu', () => {
    expect(() => validateSchema(anomalieSchema, { ...valid, type_anomalie: 'AUTRE' })).toThrow();
  });

  it('rejette si description manque', () => {
    const { description, ...rest } = valid;
    expect(() => validateSchema(anomalieSchema, rest)).toThrow(/description/i);
  });

  it('rejette une description > 500 caracteres', () => {
    const longDesc = 'x'.repeat(501);
    expect(() => validateSchema(anomalieSchema, { ...valid, description: longDesc })).toThrow();
  });
});
