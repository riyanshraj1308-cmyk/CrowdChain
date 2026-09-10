export const validate =
  (schema) => (req, res, next) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.query !== undefined) Object.assign(req.query, parsed.query);
      if (parsed.params !== undefined) Object.assign(req.params, parsed.params);
      return next();
    } catch (err) {
      return next(err); // handled centrally by errorHandler (ZodError branch)
    }
  };
