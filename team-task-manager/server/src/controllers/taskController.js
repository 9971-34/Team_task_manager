const { supabase } = require('../config/db');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { successResponse, errorResponse, paginationMeta } = require('../utils/apiResponse');

const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate, project, assignedTo, tags, estimatedHours } = req.body;

    const task = await Task.create({
      title,
      description,
      status,
      priority,
      dueDate,
      project,
      assignedTo,
      tags,
      estimatedHours,
      createdBy: req.user.id
    });

    return successResponse(res, {
      statusCode: 201,
      message: 'Task created.',
      data: { task }
    });
  } catch (error) {
    next(error);
  }
};

const getAllTasks = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status, priority, project, assignedTo, overdue } = req.query;
    const skip = (page - 1) * limit;

    let query = supabase
      .from('tasks')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(skip, skip + Number(limit) - 1);

    // Members only see tasks in their projects
    if (req.user.role !== 'admin') {
      const { data: memberProjects } = await supabase
        .from('projects')
        .select('id')
        .or(`owner.eq.${req.user.id},members.cs.{${req.user.id}}`);
      
      if (memberProjects) {
        query = query.in('project', memberProjects.map(p => p.id));
      }
    }

    if (project) query = query.eq('project', project);
    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);
    if (assignedTo) query = query.eq('assigned_to', assignedTo);
    if (overdue === 'true') {
      query = query.lt('due_date', new Date().toISOString()).neq('status', 'completed');
    }
    if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);

    const { data: tasks, count } = await query;

    // Enrich with project and assignedTo details
    const enrichedTasks = await Promise.all((tasks || []).map(async (t) => {
      let enriched = { ...t };
      
      if (t.project) {
        const { data: proj } = await supabase.from('projects').select('id, name, color').eq('id', t.project).single();
        enriched.project = proj;
      }
      
      if (t.assigned_to) {
        const { data: user } = await supabase.from('users').select('id, name, email, avatar').eq('id', t.assigned_to).single();
        enriched.assignedTo = user;
      }
      
      if (t.created_by) {
        const { data: creator } = await supabase.from('users').select('id, name, email').eq('id', t.created_by).single();
        enriched.createdBy = creator;
      }
      
      return enriched;
    }));

    return successResponse(res, {
      data: { tasks: enrichedTasks },
      meta: paginationMeta(count || 0, page, limit)
    });
  } catch (error) {
    next(error);
  }
};

const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return errorResponse(res, { message: 'Task not found.', statusCode: 404 });
    }

    // Enrich with relations
    if (task.project) {
      const { data: proj } = await supabase.from('projects').select('id, name, color, status').eq('id', task.project).single();
      task.project = proj;
    }

    if (task.assigned_to) {
      const { data: user } = await supabase.from('users').select('id, name, email, avatar, role').eq('id', task.assigned_to).single();
      task.assignedTo = user;
    }

    if (task.created_by) {
      const { data: creator } = await supabase.from('users').select('id, name, email').eq('id', task.created_by).single();
      task.createdBy = creator;
    }

    return successResponse(res, { data: { task } });
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return errorResponse(res, { message: 'Task not found.', statusCode: 404 });
    }

    const { title, description, status, priority, dueDate, assignedTo, tags, estimatedHours, actualHours } = req.body;

    const updates = { title, description, status, priority, dueDate, assignedTo, tags, estimatedHours, actualHours };
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);

    const updatedTask = await Task.update(req.params.id, updates);

    return successResponse(res, {
      message: 'Task updated.',
      data: { task: updatedTask }
    });
  } catch (error) {
    next(error);
  }
};

const updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) {
      return errorResponse(res, { message: 'Task not found.', statusCode: 404 });
    }

    if (req.user.role !== 'admin' && task.assigned_to !== req.user.id) {
      return errorResponse(res, { message: 'You can only update tasks assigned to you.', statusCode: 403 });
    }

    const updatedTask = await Task.update(req.params.id, { status });

    return successResponse(res, { message: `Task marked as ${status}.`, data: { task: updatedTask } });
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return errorResponse(res, { message: 'Task not found.', statusCode: 404 });
    }

    await Task.delete(req.params.id);
    return successResponse(res, { message: 'Task deleted.' });
  } catch (error) {
    next(error);
  }
};

const addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) {
      return errorResponse(res, { message: 'Task not found.', statusCode: 404 });
    }

    const updatedTask = await Task.addComment(req.params.id, req.user.id, text);
    return successResponse(res, { statusCode: 201, message: 'Comment added.', data: { comments: updatedTask.comments } });
  } catch (error) {
    next(error);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date().toISOString();
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    let projectFilter = {};
    let taskFilter = {};

    if (!isAdmin) {
      const { data: memberProjects } = await supabase
        .from('projects')
        .select('id')
        .or(`owner.eq.${userId},members.cs.{${userId}}`);

      if (memberProjects) {
        const projectIds = memberProjects.map(p => p.id);
        taskFilter.project = projectIds;
        projectFilter.id = projectIds;
        taskFilter.assigned_to = userId;
      } else {
        taskFilter.assigned_to = userId;
      }
    }

    const [
      { data: allTasks },
      { data: completedTasks },
      { data: inProgressTasks },
      { data: todoTasks },
      { data: overdueTasks },
      totalProjects,
      activeProjects,
      { data: recentTasks }
    ] = await Promise.all([
      supabase.from('tasks').select('status').match(taskFilter),
      supabase.from('tasks').select('id').match({ ...taskFilter, status: 'completed' }),
      supabase.from('tasks').select('id').match({ ...taskFilter, status: 'in-progress' }),
      supabase.from('tasks').select('id').match({ ...taskFilter, status: 'todo' }),
      supabase.from('tasks').select('id').match({ ...taskFilter, status: { not: 'completed' } }).lt('due_date', now),
      supabase.from('projects').select('id', { count: 'exact', head: true }).match(projectFilter),
      supabase.from('projects').select('id', { count: 'exact', head: true }).match({ ...projectFilter, status: 'active' }),
      supabase
        .from('tasks')
        .select('*')
        .match(taskFilter)
        .order('updated_at', { ascending: false })
        .limit(5)
    ]);

    const enrichedRecentTasks = await Promise.all((recentTasks || []).map(async (t) => {
      let enriched = { ...t };
      if (t.assigned_to) {
        const { data: user } = await supabase.from('users').select('id, name, initials, avatar').eq('id', t.assigned_to).single();
        enriched.assignedTo = user;
      }
      if (t.project) {
        const { data: proj } = await supabase.from('projects').select('id, name, color').eq('id', t.project).single();
        enriched.project = proj;
      }
      return enriched;
    }));

    return successResponse(res, {
      data: {
        overview: {
          totalTasks: allTasks?.length || 0,
          completedTasks: completedTasks?.length || 0,
          inProgressTasks: inProgressTasks?.length || 0,
          todoTasks: todoTasks?.length || 0,
          overdueTasks: overdueTasks?.length || 0,
          totalProjects: totalProjects.count || 0,
          activeProjects: activeProjects.count || 0
        },
        projectStats: [],
        recentTasks: enrichedRecentTasks
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createTask, getAllTasks, getTaskById, updateTask, updateTaskStatus, deleteTask, addComment, getDashboardStats };