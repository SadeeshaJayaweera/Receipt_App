const { BadRequestError } = require('../errors/AppError');

/**
 * Higher-order middleware to validate incoming request data against a Zod schema.
 * @param {import('zod').ZodSchema} schema 
 * @param {'body' | 'query' | 'params'} source 
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const details = result.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code
      }));

      return next(new BadRequestError('Validation failed', details));
    }

    // Assign sanitized & parsed data back to req[source]
    req[source] = result.data;
    next();
  };
}

module.exports = validate;
