const bcrypt = require('bcryptjs');
const { supabase } = require('../config/db');
const User = require('../models/User');
const { generateToken } = require('../utils/generateToken');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return errorResponse(res, { message: 'Email already registered.', statusCode: 409 });
    }

    const userCount = await User.count();
    const assignedRole = userCount === 0 ? 'admin' : (role || 'member');

    const user = await User.create({ name, email, password, role: assignedRole });
    const token = generateToken(user.id, user.role, user.email);

    await User.update(user.id, { last_login: new Date().toISOString() });

    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return successResponse(res, {
      statusCode: 201,
      message: 'Account created successfully.',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          initials,
          avatar: user.avatar,
          created_at: user.created_at
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findByEmailWithPassword(email);
    if (!user) {
      return errorResponse(res, { message: 'Invalid email or password.', statusCode: 401 });
    }

    if (!user.is_active) {
      return errorResponse(res, { message: 'Your account has been deactivated.', statusCode: 403 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return errorResponse(res, { message: 'Invalid email or password.', statusCode: 401 });
    }

    const token = generateToken(user.id, user.role, user.email);

    await User.update(user.id, { last_login: new Date().toISOString() });

    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return successResponse(res, {
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          initials,
          avatar: user.avatar,
          last_login: user.last_login
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return errorResponse(res, { message: 'User not found.', statusCode: 404 });
    }

    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, status, color')
      .in('id', user.projects || []);

    return successResponse(res, { data: { user: { ...user, projects: projects || [] } } });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (avatar !== undefined) updates.avatar = avatar;

    const user = await User.update(req.user.id, updates);
    return successResponse(res, { message: 'Profile updated.', data: { user } });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findByEmailWithPassword(req.user.email);
    if (!user) {
      return errorResponse(res, { message: 'User not found.', statusCode: 404 });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return errorResponse(res, { message: 'Current password is incorrect.', statusCode: 400 });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.update(req.user.id, { password: hashedPassword });

    return successResponse(res, { message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword };