// Middleware de validation Zod générique
// Express 5 makes req.query read-only, so we mutate its properties in place
// instead of reassigning. Parsed result is also exposed on req.validatedQuery.
export function validateQuery(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.query);
      req.validatedQuery = parsed;
      // Merge parsed values back into req.query in a compatible way
      try {
        for (const [k, v] of Object.entries(parsed)) {
          if (v !== undefined) req.query[k] = v;
        }
      } catch {
        // req.query is fully read-only — rely on req.validatedQuery instead
      }
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
