const { supabase } = require('../config/db');

const Project = {
  table: 'projects',

  async findAll(filters = {}) {
    let query = supabase.from(this.table).select('*');
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.priority) query = query.eq('priority', filters.priority);
    if (filters.owner) query = query.eq('owner', filters.owner);
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
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

  async create(projectData) {
    const { data, error } = await supabase
      .from(this.table)
      .insert({
        name: projectData.name,
        description: projectData.description || '',
        status: projectData.status || 'active',
        priority: projectData.priority || 'medium',
        color: projectData.color || '#6366f1',
        owner: projectData.owner,
        members: projectData.members || [],
        due_date: projectData.dueDate || null,
        start_date: projectData.startDate || new Date().toISOString(),
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
    if (updates.dueDate) {
      updates.due_date = updates.dueDate;
      delete updates.dueDate;
    }
    if (updates.startDate) {
      updates.start_date = updates.startDate;
      delete updates.startDate;
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

  async addMembers(id, userIds) {
    const project = await this.findById(id);
    const currentMembers = project.members || [];
    const newMembers = [...new Set([...currentMembers, ...userIds])];
    return this.update(id, { members: newMembers });
  },

  async removeMember(id, userId) {
    const project = await this.findById(id);
    const members = (project.members || []).filter(m => m !== userId);
    return this.update(id, { members });
  },

  async count(filter = {}) {
    let query = supabase.from(this.table).select('*', { count: 'exact', head: true });
    if (filter.status) query = query.eq('status', filter.status);
    const { count } = await query;
    return count || 0;
  }
};

module.exports = Project;