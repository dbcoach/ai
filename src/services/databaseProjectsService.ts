import { supabase, handleAuthError } from '../lib/supabase';

export interface DatabaseProject {
  id: string;
  user_id: string;
  database_name: string;
  database_type: 'SQL' | 'NoSQL' | 'PostgreSQL' | 'MySQL' | 'MongoDB' | 'SQLite';
  description?: string;
  last_accessed: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

export interface DatabaseSession {
  id: string;
  project_id: string;
  session_name?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  query_count: number;
}

export interface DatabaseQuery {
  id: string;
  session_id: string;
  project_id: string;
  query_text: string;
  query_type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CREATE' | 'ALTER' | 'OTHER';
  results_data?: any;
  results_format: 'json' | 'csv' | 'table';
  execution_time_ms?: number;
  row_count?: number;
  success: boolean;
  error_message?: string;
  created_at: string;
}

export interface CreateProjectRequest {
  database_name: string;
  database_type: DatabaseProject['database_type'];
  description?: string;
  metadata?: Record<string, any>;
}

export interface CreateSessionRequest {
  project_id: string;
  session_name?: string;
  description?: string;
}

export interface CreateQueryRequest {
  session_id: string;
  project_id: string;
  query_text: string;
  query_type: DatabaseQuery['query_type'];
  results_data?: any;
  results_format: DatabaseQuery['results_format'];
  execution_time_ms?: number;
  row_count?: number;
  success: boolean;
  error_message?: string;
}

export interface ProjectStats {
  total_projects: number;
  total_sessions: number;
  total_queries: number;
  last_activity: string;
}

class DatabaseProjectsService {
  /**
   * Get all database projects for a user
   */
  async getProjects(userId: string): Promise<DatabaseProject[]> {
    try {
      const { data, error } = await supabase
        .from('database_projects')
        .select('*')
        .eq('user_id', userId)
        .order('last_accessed', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching projects:', error);
      
      // Handle auth errors gracefully
      const handled = await handleAuthError(error);
      if (handled) {
        return []; // Return empty array if auth error was handled
      }
      
      throw error;
    }
  }

  /**
   * Create a new database project
   */
  async createProject(userId: string, request: CreateProjectRequest): Promise<DatabaseProject> {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('database_projects')
        .insert({
          user_id: userId,
          database_name: request.database_name,
          database_type: request.database_type,
          description: request.description,
          metadata: request.metadata || {},
          last_accessed: now,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  /**
   * Update project's last accessed time
   */
  async updateProjectAccess(projectId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('database_projects')
        .update({ 
          last_accessed: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating project access:', error);
      throw error;
    }
  }

  /**
   * Get all sessions for a project
   */
  async getProjectSessions(projectId: string): Promise<DatabaseSession[]> {
    try {
      const { data, error } = await supabase
        .from('database_sessions')
        .select(`
          *,
          query_count:database_queries(count)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data?.map(session => ({
        ...session,
        query_count: session.query_count?.[0]?.count || 0
      })) || [];
    } catch (error) {
      console.error('Error fetching project sessions:', error);
      throw error;
    }
  }

  /**
   * Create a new session within a project
   */
  async createSession(request: CreateSessionRequest): Promise<DatabaseSession> {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('database_sessions')
        .insert({
          project_id: request.project_id,
          session_name: request.session_name || `Session ${new Date().toLocaleDateString()}`,
          description: request.description,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) throw error;

      // Update project's last accessed time
      await this.updateProjectAccess(request.project_id);

      return { ...data, query_count: 0 };
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Get all queries for a session
   */
  async getSessionQueries(sessionId: string): Promise<DatabaseQuery[]> {
    try {
      const { data, error } = await supabase
        .from('database_queries')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching session queries:', error);
      throw error;
    }
  }

  /**
   * Add a query to a session
   */
  async createQuery(request: CreateQueryRequest): Promise<DatabaseQuery> {
    try {
      const { data, error } = await supabase
        .from('database_queries')
        .insert({
          session_id: request.session_id,
          project_id: request.project_id,
          query_text: request.query_text,
          query_type: request.query_type,
          results_data: request.results_data,
          results_format: request.results_format,
          execution_time_ms: request.execution_time_ms,
          row_count: request.row_count,
          success: request.success,
          error_message: request.error_message,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Update project's last accessed time
      await this.updateProjectAccess(request.project_id);

      return data;
    } catch (error) {
      console.error('Error creating query:', error);
      throw error;
    }
  }

  /**
   * Get user's overall statistics
   */
  async getUserStats(userId: string): Promise<ProjectStats> {
    try {
      const { data: projects, error: projectsError } = await supabase
        .from('database_projects')
        .select('id, last_accessed')
        .eq('user_id', userId);

      if (projectsError) throw projectsError;

      const { data: sessions, error: sessionsError } = await supabase
        .from('database_sessions')
        .select('id')
        .in('project_id', projects?.map(p => p.id) || []);

      if (sessionsError) throw sessionsError;

      const { data: queries, error: queriesError } = await supabase
        .from('database_queries')
        .select('id')
        .in('project_id', projects?.map(p => p.id) || []);

      if (queriesError) throw queriesError;

      const lastActivity = projects?.reduce((latest, project) => {
        return new Date(project.last_accessed) > new Date(latest) 
          ? project.last_accessed 
          : latest;
      }, projects[0]?.last_accessed || new Date().toISOString()) || new Date().toISOString();

      return {
        total_projects: projects?.length || 0,
        total_sessions: sessions?.length || 0,
        total_queries: queries?.length || 0,
        last_activity: lastActivity
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  }

  /**
   * Delete a project and all its data
   */
  async deleteProject(projectId: string, userId: string): Promise<void> {
    try {
      // Delete queries first (foreign key constraints)
      await supabase
        .from('database_queries')
        .delete()
        .eq('project_id', projectId);

      // Delete sessions
      await supabase
        .from('database_sessions')
        .delete()
        .eq('project_id', projectId);

      // Delete project
      const { error } = await supabase
        .from('database_projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }

  /**
   * Search across all projects, sessions, and queries
   */
  async search(userId: string, searchTerm: string): Promise<{
    projects: DatabaseProject[];
    sessions: DatabaseSession[];
    queries: DatabaseQuery[];
  }> {
    try {
      // Get user's projects first
      const { data: userProjects } = await supabase
        .from('database_projects')
        .select('id')
        .eq('user_id', userId);

      const projectIds = userProjects?.map(p => p.id) || [];

      // Search projects
      const { data: projects } = await supabase
        .from('database_projects')
        .select('*')
        .eq('user_id', userId)
        .or(`database_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);

      // Search sessions
      const { data: sessions } = await supabase
        .from('database_sessions')
        .select('*')
        .in('project_id', projectIds)
        .or(`session_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);

      // Search queries
      const { data: queries } = await supabase
        .from('database_queries')
        .select('*')
        .in('project_id', projectIds)
        .or(`query_text.ilike.%${searchTerm}%,error_message.ilike.%${searchTerm}%`);

      return {
        projects: projects || [],
        sessions: sessions || [],
        queries: queries || []
      };
    } catch (error) {
      console.error('Error searching:', error);
      throw error;
    }
  }
}

export const databaseProjectsService = new DatabaseProjectsService();