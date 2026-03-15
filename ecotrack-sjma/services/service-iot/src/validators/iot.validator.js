/**
 * Validateurs pour les données IoT
 */
const Joi = require('joi');

const simulateSchema = Joi.object({
  uid_capteur: Joi.string().max(30).required(),
  fill_level: Joi.number().min(0).max(100).required(),
  battery: Joi.number().min(0).max(100).required(),
  temperature: Joi.number().min(-50).max(100).allow(null).optional()
});

const alertUpdateSchema = Joi.object({
  statut: Joi.string().valid('RESOLUE', 'IGNOREE').required()
    .messages({
      'any.only': 'Le statut doit être RESOLUE ou IGNOREE',
      'any.required': 'statut est obligatoire'
    })
});

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(1000).default(50),
  id_conteneur: Joi.number().integer().min(1).optional(),
  id_capteur: Joi.number().integer().min(1).optional(),
  type_alerte: Joi.string().valid('DEBORDEMENT', 'BATTERIE_FAIBLE', 'CAPTEUR_DEFAILLANT').optional(),
  statut: Joi.string().valid('ACTIVE', 'RESOLUE', 'IGNOREE').optional(),
  date_debut: Joi.date().iso().optional(),
  date_fin: Joi.date().iso().optional()
}).unknown(false);

const containerQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(1000).default(100)
}).unknown(false);

/**
 * Valide req.params.id comme entier positif
 */
function validateParamId(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Paramètre id invalide',
      details: ['id doit être un entier positif'],
      timestamp: new Date().toISOString()
    });
  }
  req.params.id = id;
  next();
}

function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      const details = error.details.map(d => d.message);
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Données invalides',
        details,
        timestamp: new Date().toISOString()
      });
    }
    req.body = value;
    next();
  };
}

function validateQuery(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, { abortEarly: false, stripUnknown: true });
    if (error) {
      const details = error.details.map(d => d.message);
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Paramètres de requête invalides',
        details,
        timestamp: new Date().toISOString()
      });
    }
    req.query = value;
    next();
  };
}

module.exports = {
  simulateSchema,
  alertUpdateSchema,
  paginationSchema,
  containerQuerySchema,
  validate,
  validateQuery,
  validateParamId
};
