import { ZodError } from 'zod';

export const validate = (schema) => (req, res, next) => {
  try {
    req.validated = {
      body: schema.body ? schema.body.parse(req.body) : req.body,
      params: schema.params ? schema.params.parse(req.params) : req.params,
      query: schema.query ? schema.query.parse(req.query) : req.query
    };
    return next();
  } catch (err) {
    if (err instanceof ZodError) {
      const issues = err.issues || err.errors || [];
      return res.status(400).json({
        error: 'Validation error',
        details: issues.map((e) => ({
          path: e.path.join('.'),
          message: e.message
        }))
      });
    }
    return next(err);
  }
};
