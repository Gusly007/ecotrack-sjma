// Middleware de validation Zod générique
export function validateQuery(schema) {
  return (req, res, next) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (err) {
      return res.status(400).json({ error: 'Paramètres invalides', details: err.errors });
    }
  };
}

export function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      return res.status(400).json({ error: 'Corps de requête invalide', details: err.errors });
    }
  };
}
