const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  validate
];

const loginValidator = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

const projectValidator = [
  body('name').trim().notEmpty().withMessage('Project name is required').isLength({ min: 3, max: 100 }).withMessage('Name must be 3-100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  validate
];

const taskValidator = [
  body('title').trim().notEmpty().withMessage('Task title is required').isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
  body('project').notEmpty().withMessage('Project ID is required'),
  validate
];

const taskStatusValidator = [
  body('status').notEmpty().withMessage('Status is required').isIn(['todo', 'in-progress', 'completed']).withMessage('Invalid status'),
  validate
];

const commentValidator = [
  body('text').trim().notEmpty().withMessage('Comment text is required').isLength({ max: 1000 }).withMessage('Comment cannot exceed 1000 characters'),
  validate
];

module.exports = { registerValidator, loginValidator, projectValidator, taskValidator, taskStatusValidator, commentValidator, validate };