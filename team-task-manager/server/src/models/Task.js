const { supabase } = require('../config/db');

const Task = {
  table: 'tasks',

  async findAll(filters = {}) {
    let query = supabase.from(this.table).select('*');
    if (filters.project) query = query.eq('project', filters.project);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.priority) query = query.eq('priority', filters.priority);
    if (filters.assignedTo) query = query.eq('assigned_to', filters.assignedTo);
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    if (filters.overdue === 'true') {
      query = query.lt('due_date', new Date().toISOString()).neq('status', 'completed');
    }
    return query;
  },

  async findById(id) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  },

  async create(taskData) {
    const { data, error } = await supabase
      .from(this.table)
      .insert({
        title: taskData.title,
        description: taskData.description || '',
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        project: taskData.project,
        assigned_to: taskData.assignedTo || null,
        created_by: taskData.createdBy,
        tags: taskData.tags || [],
        estimated_hours: taskData.estimatedHours || null,
        due_date: taskData.dueDate || null,
        order: taskData.order || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    updates.updated_at = new Date().toISOString();
    
    // Map camelCase to snake_case
    if (updates.assignedTo !== undefined) {
      updates.assigned_to = updates.assignedTo || null;
      delete updates.assignedTo;
    }
    if (updates.dueDate !== undefined) {
      updates.due_date = updates.dueDate || null;
      delete updates.dueDate;
    }
    if (updates.estimatedHours !== undefined) {
      updates.estimated_hours = updates.estimatedHours || null;
      delete updates.estimatedHours;
    }
    if (updates.actualHours !== undefined) {
      updates.actual_hours = updates.actualHours || null;
      delete updates.actualHours;
    }
    if (updates.createdBy !== undefined) {
      updates.created_by = updates.createdBy;
      delete updates.createdBy;
    }

    // Handle completedAt
    if (updates.status === 'completed' && !updates.completed_at) {
      updates.completed_at = new Date().toISOString();
    } else if (updates.status && updates.status !== 'completed') {
      updates.completed_at = null;
    }

    const { data, error } = await supabase
      .from(this.table)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async deleteByProject(projectId) {
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('project', projectId);
    if (error) throw error;
  },

  async addComment(taskId, userId, text) {
    const task = await this.findById(taskId);
    const comments = task.comments || [];
    comments.push({
      user: userId,
      text: text,
      created_at: new Date().toISOString()
    });
    return this.update(taskId, { comments });
  },

  async count(filter = {}) {
    let query = supabase.from(this.table).select('*', { count: 'exact', head: true });
    if (filter.project) query = query.eq('project', filter.project);
    if (filter.status) query = query.eq('status', filter.status);
    if (filter.assignedTo) query = query.eq('assigned_to', filter.assignedTo);
    const { count } = await query;
    return count || 0;
  },

  async aggregate(filter = {}) {
    let query = supabase.from(this.table).select('*', { count: 'exact', head: true });
    if (filter.project) query = query.eq('project', filter.project);
    if (filter.assignedTo) query = query.eq('assigned_to', filter.assignedTo);
    const { count } = await query;
    return count || 0;
  }
};

module.exports = Task;