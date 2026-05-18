'use strict';

const VALID_TYPES = ['ALERTE', 'TOURNEE', 'BADGE', 'SYSTEME',
  'ADMIN_ALERTE', 'ADMIN_SERVICE', 'ADMIN_SEUIL',
  'ADMIN_ML', 'ADMIN_SECURITE', 'ADMIN_PERFORMANCE', 'ADMIN_IOT'
];

// ─── Helpers ─────────────────────────────────────────────────

const isPositiveInt = (v) => Number.isInteger(Number(v)) && Number(v) > 0;

const checkNotificationFields = ({ id_utilisateur, type, titre, corps }) => {
  const errors = [];

  if (!isPositiveInt(id_utilisateur)) {
    errors.push('id_utilisateur doit être un entier positif');
  }
  if (!type || !VALID_TYPES.includes(type)) {
    errors.push(`type invalide — valeurs acceptées : ${VALID_TYPES.join(', ')}`);
  }
  if (!titre || !String(titre).trim()) {
    errors.push('titre est obligatoire et ne peut pas être vide');
  }
  if (!corps || !String(corps).trim()) {
    errors.push('corps est obligatoire et ne peut pas être vide');
  }

  return errors;
};

// ─── Middleware validateCreateNotification ────────────────────

/**
 * Valide le body pour POST /notifications
 */
const validateCreateNotification = (req, res, next) => {
  const errors = checkNotificationFields(req.body || {});

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      details: errors
    });
  }

  next();
};

// ─── Middleware validateBulkNotifications ─────────────────────

/**
 * Valide le body pour POST /notifications/bulk
 * Attend un tableau non vide d'objets notification.
 */
const validateBulkNotifications = (req, res, next) => {
  const body = req.body;

  if (!Array.isArray(body) || body.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Le body doit être un tableau non vide'
    });
  }

  const allErrors = [];

  body.forEach((item, index) => {
    const errors = checkNotificationFields(item || {});
    if (errors.length > 0) {
      allErrors.push({ index, errors });
    }
  });

  if (allErrors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides dans le tableau',
      details: allErrors
    });
  }

  next();
};

module.exports = { validateCreateNotification, validateBulkNotifications };
