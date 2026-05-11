const bcrypt = require('bcryptjs');
const { supabase } = require('../config/db');

const User = {
  table: 'users',

  async findAll(filters = {}) {
    let query = supabase.from(this.table).select('*');
    if (filters.role) query = query.eq('role', filters.role);
    if (filters.isActive !== undefined) query = query.eq('is_active', filters.isActive === 'true');
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
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

  async findByEmail(email) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('email', email.toLowerCase())
      .single();
    if (error) return null;
    return data;
  },

  async findByEmailWithPassword(email) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('email', email.toLowerCase())
      .single();
    if (error) return null;
    return data;
  },

  async create(userData) {
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    const { data, error } = await supabase
      .from(this.table)
      .insert({
        name: userData.name,
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        role: userData.role || 'member',
        avatar: userData.avatar || '',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    delete data.password;
    return data;
  },

  async update(id, updates) {
    updates.updated_at = new Date().toISOString();
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

  async count(filter = {}) {
    let query = supabase.from(this.table).select('*', { count: 'exact', head: true });
    if (filter.role) query = query.eq('role', filter.role);
    if (filter.isActive !== undefined) query = query.eq('is_active', filter.isActive === 'true');
    const { count } = await query;
    return count || 0;
  },

  async addToProjects(userId, projectIds) {
    const user = await this.findById(userId);
    const currentProjects = user.projects || [];
    const newProjects = [...new Set([...currentProjects, ...projectIds])];
    return this.update(userId, { projects: newProjects });
  },

  async removeFromProjects(userId, projectId) {
    const user = await this.findById(userId);
    const projects = (user.projects || []).filter(p => p !== projectId);
    return this.update(userId, { projects });
  },

  comparePassword: async function(candidatePassword, hashedPassword) {
    return bcrypt.compare(candidatePassword, hashedPassword);
  }
};

module.exports = User;