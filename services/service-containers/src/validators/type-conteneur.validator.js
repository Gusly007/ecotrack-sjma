const Joi = require('joi');

const typeConteneurCreateSchema = Joi.object({
  code: Joi.string().min(2).max(50).required(),
  nom: Joi.string().valid('ORDURE', 'RECYCLAGE', 'VERRE', 'COMPOST').required(),
}).unknown(false);

const typeConteneurUpdateSchema = Joi.object({
  code: Joi.string().min(2).max(50),
  nom: Joi.string().valid('ORDURE', 'RECYCLAGE', 'VERRE', 'COMPOST'),
}).unknown(false);

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
  typeConteneurCreateSchema,
  typeConteneurUpdateSchema,
  validateSchema,
};
