const Joi = require('joi');

const containerCreateSchema = Joi.object({
  capacite_l: Joi.number().integer().min(100).max(5000).required(),
  statut: Joi.string().min(1).required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  id_zone: Joi.number().integer().positive().allow(null),
  id_type: Joi.number().integer().positive().allow(null),
}).and('latitude', 'longitude').unknown(false);

const containerUpdateSchema = Joi.object({
  capacite_l: Joi.number().integer().min(100).max(5000),
  latitude: Joi.number().min(-90).max(90),
  longitude: Joi.number().min(-180).max(180),
  id_zone: Joi.number().integer().positive().allow(null),
  id_type: Joi.number().integer().positive().allow(null),
  statut: Joi.forbidden(),
}).and('latitude', 'longitude').unknown(false);

function validateSchema(schema, data) {
  const { error } = schema.validate(data, { abortEarly: false });
  if (error) {
    const message = error.details.map((detail) => detail.message).join(', ');
    const err = new Error(`Validation invalide: ${message}`);
    err.name = 'ValidationError';
    throw err;
  }
}

module.exports = {
  containerCreateSchema,
  containerUpdateSchema,
  validateSchema,
};
