const Joi = require('joi');

const zoneCreateSchema = Joi.object({
  code: Joi.string().min(2).max(50).required(),
  nom: Joi.string().min(2).required(),
  population: Joi.number().integer().min(0).required(),
  superficie_km2: Joi.number().min(0).required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
}).and('latitude', 'longitude').unknown(false);

const zoneUpdateSchema = Joi.object({
  code: Joi.string().min(2).max(50),
  nom: Joi.string().min(2),
  population: Joi.number().integer().min(0),
  superficie_km2: Joi.number().min(0),
  latitude: Joi.number().min(-90).max(90),
  longitude: Joi.number().min(-180).max(180),
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
  zoneCreateSchema,
  zoneUpdateSchema,
  validateSchema,
};
