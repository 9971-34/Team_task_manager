const { errorResponse } = require('../utils/apiResponse');

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, { message: 'Not authenticated.', statusCode: 401 });
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(res, {
        message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`,
        statusCode: 403
      });
    }

    next();
  };
};

const isAdmin = authorize('admin');

module.exports = { authorize, isAdmin };