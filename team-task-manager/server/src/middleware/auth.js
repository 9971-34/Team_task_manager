const { verifyToken } = require('../utils/generateToken');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return errorResponse(res, { message: 'Not authorized. No token provided.', statusCode: 401 });
    }

    const decoded = verifyToken(token);
    req.user = { id: decoded.id, role: decoded.role, email: decoded.email };
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, { message: 'Invalid token.', statusCode: 401 });
    }
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, { message: 'Token has expired. Please log in again.', statusCode: 401 });
    }
    next(error);
  }
};

module.exports = { protect };