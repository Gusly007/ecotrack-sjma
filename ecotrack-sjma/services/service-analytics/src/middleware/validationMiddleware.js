const Joi = require('joi');
const logger = require('../utils/logger');

class ValidationMiddleware {
  static validateDashboardQuery() {
    return (req, res, next) => {
      const schema = Joi.object({
        period: Joi.string().valid('day', 'week', 'month', 'quarter', 'year')
      });

      const { error } = schema.validate(req.query);

      if (error) {
        logger.warn('Validation error:', error.details[0].message);
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      next();
    };
  }

  static validateDateRange() {
    return (req, res, next) => {
      const schema = Joi.object({
        startDate: Joi.date().iso().required(),
        endDate: Joi.date().iso().min(Joi.ref('startDate')).required()
      });

      const data = req.query.startDate ? req.query : req.body;
      const { error } = schema.validate({
        startDate: data.startDate,
        endDate: data.endDate
      });

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      next();
    };
  }

  static validateReportRequest() {
    return (req, res, next) => {
      const schema = Joi.object({
        format: Joi.string().valid('pdf', 'excel').default('pdf'),
        reportType: Joi.string().valid('daily', 'weekly', 'monthly').default('weekly'),
        email: Joi.string().email().optional()
      });

      const { error, value } = schema.validate(req.body);

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      req.body = value;
      next();
    };
  }

  static validatePrediction() {
    return (req, res, next) => {
      const schema = Joi.object({
        containerId: Joi.number().integer().positive().required(),
        daysAhead: Joi.number().integer().min(1).max(30).default(1),
        includeWeather: Joi.boolean().default(false)
      });

      const { error, value } = schema.validate(req.body);

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      req.body = value;
      next();
    };
  }
}

module.exports = ValidationMiddleware;