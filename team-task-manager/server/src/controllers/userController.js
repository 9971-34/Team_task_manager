const { supabase } = require('../config/db');
const { successResponse, errorResponse, paginationMeta } = require('../utils/apiResponse');

const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role, isActive } = req.query;
    const skip = (page - 1) * limit;

    let query = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(skip, skip + Number(limit) - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (role) query = query.eq('role', role);
    if (isActive !== undefined) query = query.eq('is_active', isActive === 'true');

    const { data: users, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return errorResponse(res, { message: error.message, statusCode: 500 });
    }

    return successResponse(res, {
      data: { users: users || [] },
      meta: paginationMeta(count || 0, page, limit)
    });
  } catch (error) {
    console.error('getAllUsers error:', error);
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse(res, { message: 'User not found.', statusCode: 404 });
      }
      return errorResponse(res, { message: error.message, statusCode: 500 });
    }

    // Get task stats
    const { data: tasks } = await supabase
      .from('tasks')
      .select('status')
      .eq('assigned_to', req.params.id);

    const stats = {};
    if (tasks) {
      tasks.forEach(t => {
        stats[t.status] = (stats[t.status] || 0) + 1;
      });
    }

    return successResponse(res, { data: { user, taskStats: stats } });
  } catch (error) {
    console.error('getUserById error:', error);
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { name, role, isActive, avatar } = req.body;

    if (req.params.id === req.user.id && role && role !== req.user.role) {
      return errorResponse(res, { message: 'You cannot change your own role.', statusCode: 400 });
    }

    const updates = {};
    if (name) updates.name = name;
    if (role) updates.role = role;
    if (isActive !== undefined) updates.is_active = isActive;
    if (avatar !== undefined) updates.avatar = avatar;

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse(res, { message: 'User not found.', statusCode: 404 });
      }
      return errorResponse(res, { message: error.message, statusCode: 500 });
    }

    return successResponse(res, { message: 'User updated.', data: { user } });
  } catch (error) {
    console.error('updateUser error:', error);
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return errorResponse(res, { message: 'You cannot delete your own account.', statusCode: 400 });
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      return errorResponse(res, { message: error.message, statusCode: 500 });
    }

    return successResponse(res, { message: 'User deleted successfully.' });
  } catch (error) {
    console.error('deleteUser error:', error);
    next(error);
  }
};

const getUserStats = async (req, res, next) => {
  try {
    const [
      { count: totalUsers },
      { count: adminCount },
      { count: memberCount },
      { count: activeCount }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'member'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true)
    ]);

    return successResponse(res, {
      data: {
        totalUsers: totalUsers || 0,
        adminCount: adminCount || 0,
        memberCount: memberCount || 0,
        activeCount: activeCount || 0
      }
    });
  } catch (error) {
    console.error('getUserStats error:', error);
    next(error);
  }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser, getUserStats };