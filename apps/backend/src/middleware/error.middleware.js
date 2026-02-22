// ── error.middleware.js ───────────────────────────────────────────
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
  
    // Prisma unique constraint
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Record already exists' });
    }
    // Prisma not found
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Record not found' });
    }
    // Zod validation
    if (err.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
      });
    }
  
    const status = err.status || err.statusCode || 500;
    res.status(status).json({
      error: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  };
  
  const notFound = (req, res) => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
  };
  
  module.exports = { errorHandler, notFound };