const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
  
    // Prisma errors
    if (err.code === 'P2002') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'A record with this data already exists',
      });
    }
  
    if (err.code === 'P2025') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Record not found',
      });
    }
  
    // Zod validation errors
    if (err.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
  
    // Default
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
    });
  };
  
  const notFound = (req, res) => {
    res.status(404).json({ error: `Route ${req.originalUrl} not found` });
  };
  
  module.exports = { errorHandler, notFound };