const Joi = require('joi');

const createTourneeSchema = Joi.object({
  code: Joi.string().max(20).optional(),
  date_tournee: Joi.string().isoDate().required().messages({
    'any.required': 'La date de tournée est requise',
    'string.isoDate': 'La date doit être au format ISO (YYYY-MM-DD)'
  }),
  statut: Joi.string().valid('PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE').default('PLANIFIEE'),
  distance_prevue_km: Joi.number().positive().optional(),
  duree_prevue_min: Joi.number().integer().positive().required().messages({
    'any.required': 'La durée prévue est requise'
  }),
  id_vehicule: Joi.number().integer().positive().optional().allow(null),
  id_zone: Joi.number().integer().positive().required().messages({
    'any.required': 'La zone est requise'
  }),
  id_agent: Joi.number().integer().positive().required().messages({
    'any.required': "L'agent est requis"
  })
});

const updateTourneeSchema = Joi.object({
  date_tournee: Joi.string().isoDate().optional(),
  distance_prevue_km: Joi.number().positive().optional(),
  duree_prevue_min: Joi.number().integer().positive().optional(),
  duree_reelle_min: Joi.number().integer().min(0).optional(),
  distance_reelle_km: Joi.number().min(0).optional(),
  id_vehicule: Joi.number().integer().positive().optional().allow(null),
  id_zone: Joi.number().integer().positive().optional(),
  id_agent: Joi.number().integer().positive().optional()
}).min(1);

const updateStatutSchema = Joi.object({
  statut: Joi.string().valid('PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE').required().messages({
    'any.required': 'Le statut est requis',
    'any.only': 'Statut invalide. Valeurs: PLANIFIEE, EN_COURS, TERMINEE, ANNULEE'
  })
});

const optimizeSchema = Joi.object({
  id_zone: Joi.number().integer().positive().required().messages({
    'any.required': 'La zone est requise'
  }),
  date_tournee: Joi.string().isoDate().required().messages({
    'any.required': 'La date de tournée est requise'
  }),
  seuil_remplissage: Joi.number().min(0).max(100).default(70),
  id_agent: Joi.number().integer().positive().required().messages({
    'any.required': "L'agent est requis"
  }),
  id_vehicule: Joi.number().integer().positive().optional().allow(null),
  algorithme: Joi.string().valid('nearest_neighbor', '2opt').default('2opt')
});

const anomalieSchema = Joi.object({
  id_conteneur: Joi.number().integer().positive().required().messages({
    'any.required': 'Le conteneur est requis'
  }),
  type_anomalie: Joi.string().valid('CONTENEUR_INACCESSIBLE', 'CONTENEUR_ENDOMMAGE', 'CAPTEUR_DEFAILLANT').required().messages({
    'any.required': "Le type d'anomalie est requis",
    'any.only': 'Type invalide. Valeurs: CONTENEUR_INACCESSIBLE, CONTENEUR_ENDOMMAGE, CAPTEUR_DEFAILLANT'
  }),
  description: Joi.string().max(500).required().messages({
    'any.required': 'La description est requise'
  })
});

function validateSchema(schema, data) {
  const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: true });
  if (error) {
    const details = error.details.map(d => d.message).join(', ');
    const ApiError = require('../utils/api-error');
    throw ApiError.badRequest(`Validation échouée: ${details}`);
  }
  return value;
}

module.exports = {
  createTourneeSchema,
  updateTourneeSchema,
  updateStatutSchema,
  optimizeSchema,
  anomalieSchema,
  validateSchema
};
