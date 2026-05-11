const { supabase } = require('../config/db');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { successResponse, errorResponse, paginationMeta } = require('../utils/apiResponse');

const createProject = async (req, res, next) => {
  try {
    const { name, description, status, priority, color, members, dueDate, startDate } = req.body;

    const project = await Project.create({
      name,
      description,
      status,
      priority,
      color,
      dueDate,
      startDate,
      owner: req.user.id,
      members: members || []
    });

    if (members && members.length > 0) {
      for (const memberId of members) {
        await User.addToProjects(memberId, [project.id]);
      }
    }

    await User.addToProjects(req.user.id, [project.id]);

    // Fetch owner details
    const { data: owner } = await supabase.from('users').select('id, name, email, avatar').eq('id', project.owner).single();
    const { data: memberUsers } = await supabase.from('users').select('id, name, email, avatar, role').in('id', project.members || []);

    return successResponse(res, {
      statusCode: 201,
      message: 'Project created.',
      data: {
        project: {
          ...project,
          owner,
          members: memberUsers || []
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const getAllProjects = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, search, status, priority } = req.query;
    const skip = (page - 1) * limit;

    let query = supabase
      .from('projects')
      .select('*', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(skip, skip + Number(limit) - 1);

    if (req.user.role !== 'admin') {
      query = query.or(`owner.eq.${req.user.id},members.cs.{${req.user.id}}`);
    }
    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);
    if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);

    const { data: projects, count } = await query;

    // Enrich with task counts
    const enrichedProjects = await Promise.all((projects || []).map(async (p) => {
      const { data: tasks } = await supabase
        .from('tasks')
        .select('status')
        .eq('project', p.id);

      const stats = { total: 0, todo: 0, 'in-progress': 0, completed: 0 };
      if (tasks) {
        tasks.forEach(t => {
          stats[t.status] = (stats[t.status] || 0) + 1;
          stats.total++;
        });
      }

      return { ...p, taskStats: stats };
    }));

    return successResponse(res, {
      data: { projects: enrichedProjects },
      meta: paginationMeta(count || 0, page, limit)
    });
  } catch (error) {
    next(error);
  }
};

const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return errorResponse(res, { message: 'Project not found.', statusCode: 404 });
    }

    // Access check
    if (req.user.role !== 'admin') {
      const isMember = project.members?.includes(req.user.id);
      const isOwner = project.owner === req.user.id;
      if (!isMember && !isOwner) {
        return errorResponse(res, { message: 'Access denied.', statusCode: 403 });
      }
    }

    // Get task stats
    const { data: tasks } = await supabase
      .from('tasks')
      .select('status')
      .eq('project', project.id);

    const statMap = { total: 0, todo: 0, 'in-progress': 0, completed: 0 };
    if (tasks) {
      tasks.forEach(t => {
        statMap[t.status] = (statMap[t.status] || 0) + 1;
        statMap.total++;
      });
    }

    const progress = statMap.total > 0 ? Math.round((statMap.completed / statMap.total) * 100) : 0;

    // Fetch owner and members
    const { data: owner } = await supabase.from('users').select('id, name, email, avatar, role').eq('id', project.owner).single();
    const { data: memberUsers } = await supabase.from('users').select('id, name, email, avatar, role').in('id', project.members || []);

    return successResponse(res, {
      data: {
        project: { ...project, owner, members: memberUsers || [] },
        taskStats: statMap,
        progress
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const { name, description, status, priority, color, dueDate } = req.body;

    const project = await Project.update(req.params.id, {
      name,
      description,
      status,
      priority,
      color,
      dueDate
    });

    if (!project) {
      return errorResponse(res, { message: 'Project not found.', statusCode: 404 });
    }

    const { data: owner } = await supabase.from('users').select('id, name, email, avatar').eq('id', project.owner).single();
    const { data: memberUsers } = await supabase.from('users').select('id, name, email, avatar, role').in('id', project.members || []);

    return successResponse(res, {
      message: 'Project updated.',
      data: { project: { ...project, owner, members: memberUsers || [] } }
    });
  } catch (error) {
    next(error);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return errorResponse(res, { message: 'Project not found.', statusCode: 404 });
    }

    await Task.deleteByProject(project.id);

    // Remove project from all users
    const allUsers = await User.findAll({});
    for (const user of (allUsers.data || [])) {
      if (user.projects?.includes(project.id)) {
        await User.removeFromProjects(user.id, project.id);
      }
    }

    await Project.delete(req.params.id);

    return successResponse(res, { message: 'Project and all related tasks deleted.' });
  } catch (error) {
    next(error);
  }
};

const addMembers = async (req, res, next) => {
  try {
    const { userIds } = req.body;
    if (!userIds || !Array.isArray(userIds)) {
      return errorResponse(res, { message: 'userIds array is required.', statusCode: 400 });
    }

    await Project.addMembers(req.params.id, userIds);

    for (const userId of userIds) {
      await User.addToProjects(userId, [req.params.id]);
    }

    const project = await Project.findById(req.params.id);
    const { data: memberUsers } = await supabase.from('users').select('id, name, email, avatar, role').in('id', project.members || []);

    return successResponse(res, { message: 'Members added.', data: { members: memberUsers || [] } });
  } catch (error) {
    next(error);
  }
};

const removeMember = async (req, res, next) => {
  try {
    await Project.removeMember(req.params.id, req.params.userId);
    await User.removeFromProjects(req.params.userId, req.params.id);

    const project = await Project.findById(req.params.id);
    const { data: memberUsers } = await supabase.from('users').select('id, name, email, avatar, role').in('id', project.members || []);

    return successResponse(res, { message: 'Member removed.', data: { members: memberUsers || [] } });
  } catch (error) {
    next(error);
  }
};

module.exports = { createProject, getAllProjects, getProjectById, updateProject, deleteProject, addMembers, removeMember };