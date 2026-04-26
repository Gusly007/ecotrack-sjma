const Joi = require('joi');

/**
 * Validation des paramètres de requête pour les endpoints de statistiques
 */

// Schéma pour les dates
const dateSchema = Joi.date().iso();

// Schéma pour pagination
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

// Schéma pour les filtres de date
const dateRangeSchema = Joi.object({
  startDate: dateSchema,
  endDate: dateSchema.min(Joi.ref('startDate'))
}).and('startDate', 'endDate');

// Schéma pour l'historique de remplissage
const fillHistoryQuerySchema = Joi.object({
  days: Joi.number().integer().min(1).max(365).default(30),
  startDate: dateSchema,
  endDate: dateSchema
}).without('days', ['startDate', 'endDate']);

// Schéma pour les stats par zone
const statsByZoneSchema = Joi.object({
  zoneId: Joi.number().integer().min(1)
});

// Schéma pour les stats par type
const statsByTypeSchema = Joi.object({
  typeId: Joi.number().integer().min(1)
});

// Schéma pour les conteneurs critiques
const criticalContainersSchema = Joi.object({
  threshold: Joi.number().integer().min(0).max(100).default(80),
  includeInactive: Joi.boolean().default(false)
});

/**
 * Middleware de validation générique
 */
function validateQuery(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Paramètres de requête invalides',
        errors
      });
    }

    req.query = value;
    next();
  };
}

/**
 * Middleware de validation pour les paramètres d'URL
 */
function validateParams(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Paramètres invalides',
        errors
      });
    }

    req.params = value;
    next();
  };
}

/**
 * Schémas pour les paramètres d'URL
 */
const containerIdParamSchema = Joi.object({
  id: Joi.number().integer().min(1).required()
});

module.exports = {
  // Middlewares
  validateQuery,
  validateParams,
  
  // Schémas de query
  paginationSchema,
  dateRangeSchema,
  fillHistoryQuerySchema,
  statsByZoneSchema,
  statsByTypeSchema,
  criticalContainersSchema,
  
  // Schémas de params
  containerIdParamSchema
};
