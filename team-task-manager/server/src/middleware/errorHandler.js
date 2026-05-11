/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  console.error('🔴 Server Error:', {
    message: err.message,
    code: err.code,
    details: err.details,
    stack: err.stack
  });

  // Handle Supabase errors
  if (err.code && err.code.startsWith('PGRST')) {
    statusCode = 400;
    message = 'Database error: ' + err.message;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired.';
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('🔴 Error stack:', err.stack);
  }

  res.status(statusCode).json({ 
    success: false, 
    message,
    ...(process.env.NODE_ENV === 'development' && { details: err.details, code: err.code })
  });
};

module.exports = errorHandler;