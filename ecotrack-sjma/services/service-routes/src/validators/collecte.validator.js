const Joi = require('joi');

const collecteSchema = Joi.object({
  id_conteneur: Joi.number().integer().positive().required().messages({
    'any.required': 'Le conteneur est requis'
  }),
  quantite_kg: Joi.number().positive().required().messages({
    'any.required': 'La quantité collectée est requise',
    'number.positive': 'La quantité doit être positive'
  })
});

const vehiculeSchema = Joi.object({
  numero_immatriculation: Joi.string().max(10).required().messages({
    'any.required': "Le numéro d'immatriculation est requis"
  }),
  modele: Joi.string().max(50).required().messages({
    'any.required': 'Le modèle est requis'
  }),
  capacite_kg: Joi.number().integer().positive().required().messages({
    'any.required': 'La capacité est requise'
  })
});

const updateVehiculeSchema = Joi.object({
  numero_immatriculation: Joi.string().max(10).optional(),
  modele: Joi.string().max(50).optional(),
  capacite_kg: Joi.number().integer().positive().optional()
}).min(1);

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
  collecteSchema,
  vehiculeSchema,
  updateVehiculeSchema,
  validateSchema
};
