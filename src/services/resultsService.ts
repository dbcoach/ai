import { supabase } from '../lib/supabase';

export interface UserResult {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  original_query?: string;
  result_format: 'json' | 'csv' | 'table';
  storage_type: 'inline' | 'object_storage';
  data_size_bytes: number;
  is_favorite: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface ResultData {
  result_id: string;
  content_json?: any;
  content_text?: string;
  object_storage_path?: string;
}

export interface ResultCategory {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface ResultTag {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface CreateResultRequest {
  title: string;
  description?: string;
  original_query?: string;
  result_format: 'json' | 'csv' | 'table';
  data: any;
  metadata?: Record<string, any>;
  categories?: string[];
  tags?: string[];
}

export interface UpdateResultRequest {
  title?: string;
  description?: string;
  is_favorite?: boolean;
  metadata?: Record<string, any>;
  categories?: string[];
  tags?: string[];
}

export interface SearchResultsParams {
  query?: string;
  categories?: string[];
  tags?: string[];
  is_favorite?: boolean;
  result_format?: 'json' | 'csv' | 'table';
  limit?: number;
  offset?: number;
  sort_by?: 'created_at' | 'updated_at' | 'title';
  sort_order?: 'asc' | 'desc';
}

class ResultsService {
  private readonly MAX_INLINE_SIZE = 1024 * 1024; // 1MB threshold for inline storage

  async createResult(userId: string, request: CreateResultRequest): Promise<UserResult> {
    try {
      const dataString = JSON.stringify(request.data);
      const dataSizeBytes = new Blob([dataString]).size;
      const storageType = dataSizeBytes > this.MAX_INLINE_SIZE ? 'object_storage' : 'inline';

      // Insert the result metadata
      const { data: resultData, error: resultError } = await supabase
        .from('user_results')
        .insert({
          user_id: userId,
          title: request.title,
          description: request.description,
          original_query: request.original_query,
          result_format: request.result_format,
          storage_type: storageType,
          data_size_bytes: dataSizeBytes,
          metadata: request.metadata || {},
        })
        .select()
        .single();

      if (resultError) throw resultError;

      // Store the actual data
      if (storageType === 'inline') {
        await this.storeInlineData(resultData.id, request.result_format, request.data);
      } else {
        await this.storeObjectData(userId, resultData.id, request.result_format, request.data);
      }

      // Handle categories and tags
      if (request.categories?.length) {
        await this.assignCategories(userId, resultData.id, request.categories);
      }

      if (request.tags?.length) {
        await this.assignTags(userId, resultData.id, request.tags);
      }

      return resultData;
    } catch (error) {
      console.error('Error creating result:', error);
      throw error;
    }
  }

  private async storeInlineData(resultId: string, format: string, data: any): Promise<void> {
    const storeData: Partial<ResultData> = { result_id: resultId };

    if (format === 'json') {
      storeData.content_json = data;
    } else {
      storeData.content_text = typeof data === 'string' ? data : JSON.stringify(data);
    }

    const { error } = await supabase
      .from('result_data')
      .insert(storeData);

    if (error) throw error;
  }

  private async storeObjectData(userId: string, resultId: string, format: string, data: any): Promise<void> {
    const fileName = `${userId}/${resultId}.${format === 'json' ? 'json' : 'csv'}`;
    const fileContent = format === 'json' ? JSON.stringify(data, null, 2) : data;

    const { error: uploadError } = await supabase.storage
      .from('user-results')
      .upload(fileName, fileContent, {
        contentType: format === 'json' ? 'application/json' : 'text/csv',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { error: dataError } = await supabase
      .from('result_data')
      .insert({
        result_id: resultId,
        object_storage_path: fileName
      });

    if (dataError) throw dataError;
  }

  async getResults(userId: string, params: SearchResultsParams = {}): Promise<UserResult[]> {
    try {
      let query = supabase
        .from('user_results')
        .select(`
          *,
          user_result_categories!inner(
            category_id,
            result_categories!inner(name)
          ),
          user_result_tags!inner(
            tag_id,
            result_tags!inner(name)
          )
        `)
        .eq('user_id', userId)
        .is('deleted_at', null);

      // Apply filters
      if (params.query) {
        query = query.or(`title.ilike.%${params.query}%,description.ilike.%${params.query}%,original_query.ilike.%${params.query}%`);
      }

      if (params.is_favorite !== undefined) {
        query = query.eq('is_favorite', params.is_favorite);
      }

      if (params.result_format) {
        query = query.eq('result_format', params.result_format);
      }

      // Apply sorting
      const sortBy = params.sort_by || 'created_at';
      const sortOrder = params.sort_order || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      if (params.limit) {
        query = query.limit(params.limit);
      }
      if (params.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching results:', error);
      throw error;
    }
  }

  async getResult(userId: string, resultId: string): Promise<UserResult | null> {
    try {
      const { data, error } = await supabase
        .from('user_results')
        .select('*')
        .eq('id', resultId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching result:', error);
      throw error;
    }
  }

  async getResultData(userId: string, resultId: string): Promise<any> {
    try {
      // First get the result metadata to check permissions
      const result = await this.getResult(userId, resultId);
      if (!result) {
        throw new Error('Result not found');
      }

      const { data, error } = await supabase
        .from('result_data')
        .select('*')
        .eq('result_id', resultId)
        .single();

      if (error) throw error;

      if (data.object_storage_path) {
        // Get data from object storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('user-results')
          .download(data.object_storage_path);

        if (downloadError) throw downloadError;

        const text = await fileData.text();
        return result.result_format === 'json' ? JSON.parse(text) : text;
      } else {
        // Return inline data
        return data.content_json || data.content_text;
      }
    } catch (error) {
      console.error('Error fetching result data:', error);
      throw error;
    }
  }

  async updateResult(userId: string, resultId: string, updates: UpdateResultRequest): Promise<UserResult> {
    try {
      const { data, error } = await supabase
        .from('user_results')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', resultId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      // Handle categories and tags updates
      if (updates.categories !== undefined) {
        await this.updateCategories(userId, resultId, updates.categories);
      }

      if (updates.tags !== undefined) {
        await this.updateTags(userId, resultId, updates.tags);
      }

      return data;
    } catch (error) {
      console.error('Error updating result:', error);
      throw error;
    }
  }

  async deleteResult(userId: string, resultId: string, soft: boolean = true): Promise<void> {
    try {
      if (soft) {
        // Soft delete
        const { error } = await supabase
          .from('user_results')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', resultId)
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Hard delete - remove from storage first
        const { data: resultData } = await supabase
          .from('result_data')
          .select('object_storage_path')
          .eq('result_id', resultId)
          .single();

        if (resultData?.object_storage_path) {
          await supabase.storage
            .from('user-results')
            .remove([resultData.object_storage_path]);
        }

        // Delete the result (cascade will handle related data)
        const { error } = await supabase
          .from('user_results')
          .delete()
          .eq('id', resultId)
          .eq('user_id', userId);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error deleting result:', error);
      throw error;
    }
  }

  async getCategories(userId: string): Promise<ResultCategory[]> {
    try {
      const { data, error } = await supabase
        .from('result_categories')
        .select('*')
        .eq('user_id', userId)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  async createCategory(userId: string, name: string): Promise<ResultCategory> {
    try {
      const { data, error } = await supabase
        .from('result_categories')
        .insert({
          user_id: userId,
          name: name.trim(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  async getTags(userId: string): Promise<ResultTag[]> {
    try {
      const { data, error } = await supabase
        .from('result_tags')
        .select('*')
        .eq('user_id', userId)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching tags:', error);
      throw error;
    }
  }

  async createTag(userId: string, name: string): Promise<ResultTag> {
    try {
      const { data, error } = await supabase
        .from('result_tags')
        .insert({
          user_id: userId,
          name: name.trim(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating tag:', error);
      throw error;
    }
  }

  private async assignCategories(userId: string, resultId: string, categoryNames: string[]): Promise<void> {
    for (const categoryName of categoryNames) {
      // Get or create category
      let category = await this.getCategoryByName(userId, categoryName);
      if (!category) {
        category = await this.createCategory(userId, categoryName);
      }

      // Link result to category
      await supabase
        .from('user_result_categories')
        .insert({
          result_id: resultId,
          category_id: category.id,
        });
    }
  }

  private async assignTags(userId: string, resultId: string, tagNames: string[]): Promise<void> {
    for (const tagName of tagNames) {
      // Get or create tag
      let tag = await this.getTagByName(userId, tagName);
      if (!tag) {
        tag = await this.createTag(userId, tagName);
      }

      // Link result to tag
      await supabase
        .from('user_result_tags')
        .insert({
          result_id: resultId,
          tag_id: tag.id,
        });
    }
  }

  private async updateCategories(userId: string, resultId: string, categoryNames: string[]): Promise<void> {
    // Remove existing category associations
    await supabase
      .from('user_result_categories')
      .delete()
      .eq('result_id', resultId);

    // Add new associations
    if (categoryNames.length > 0) {
      await this.assignCategories(userId, resultId, categoryNames);
    }
  }

  private async updateTags(userId: string, resultId: string, tagNames: string[]): Promise<void> {
    // Remove existing tag associations
    await supabase
      .from('user_result_tags')
      .delete()
      .eq('result_id', resultId);

    // Add new associations
    if (tagNames.length > 0) {
      await this.assignTags(userId, resultId, tagNames);
    }
  }

  private async getCategoryByName(userId: string, name: string): Promise<ResultCategory | null> {
    const { data, error } = await supabase
      .from('result_categories')
      .select('*')
      .eq('user_id', userId)
      .eq('name', name.trim())
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  private async getTagByName(userId: string, name: string): Promise<ResultTag | null> {
    const { data, error } = await supabase
      .from('result_tags')
      .select('*')
      .eq('user_id', userId)
      .eq('name', name.trim())
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async exportResults(userId: string, resultIds?: string[]): Promise<Blob> {
    try {
      let results: UserResult[];
      
      if (resultIds?.length) {
        // Export specific results
        const { data, error } = await supabase
          .from('user_results')
          .select('*')
          .eq('user_id', userId)
          .in('id', resultIds)
          .is('deleted_at', null);

        if (error) throw error;
        results = data || [];
      } else {
        // Export all results
        results = await this.getResults(userId);
      }

      const exportData = [];
      
      for (const result of results) {
        const data = await this.getResultData(userId, result.id);
        exportData.push({
          ...result,
          data: data
        });
      }

      const exportBlob = new Blob(
        [JSON.stringify(exportData, null, 2)],
        { type: 'application/json' }
      );

      return exportBlob;
    } catch (error) {
      console.error('Error exporting results:', error);
      throw error;
    }
  }

  async getStorageUsage(userId: string): Promise<{ totalBytes: number; totalResults: number }> {
    try {
      const { data, error } = await supabase
        .from('user_results')
        .select('data_size_bytes')
        .eq('user_id', userId)
        .is('deleted_at', null);

      if (error) throw error;

      const totalBytes = (data || []).reduce((sum, result) => sum + (result.data_size_bytes || 0), 0);
      const totalResults = data?.length || 0;

      return { totalBytes, totalResults };
    } catch (error) {
      console.error('Error getting storage usage:', error);
      throw error;
    }
  }
}

export const resultsService = new ResultsService();