
import { supabase, logError } from './supabase';
import { Subject, User, AcademicNote, Test, Result, Notification } from '../types';

export const supabaseService = {
  // Users
  async getUsers(subject: Subject): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('subject', subject);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      logError('getUsers', error);
      return [];
    }
  },

  async addUser(user: User): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .upsert(user, { onConflict: 'id' });
      
      if (error) throw error;
    } catch (error) {
      logError('addUser', error);
      throw error;
    }
  },

  // Documents
  async getDocuments(subject: Subject): Promise<AcademicNote[]> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('subject', subject)
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      logError('getDocuments', error);
      return [];
    }
  },

  async addDocument(doc: AcademicNote): Promise<void> {
    try {
      const { error } = await supabase
        .from('documents')
        .insert([doc]); // Use array for explicit insert
      
      if (error) throw error;
    } catch (error) {
      logError('addDocument', error);
      throw error;
    }
  },

  async deleteDocument(id: string, division?: string): Promise<boolean> {
    try {
      let query = supabase.from('documents').delete().eq('id', id);
      if (division && division !== 'ALL') {
        query = query.eq('division', division);
      }
      const { data, error } = await query.select();
      if (error) throw error;
      return !!data && data.length > 0;
    } catch (error) {
      logError('deleteDocument', error);
      return false;
    }
  },

  // Tests
  async getTests(subject: Subject): Promise<Test[]> {
    try {
      const { data, error } = await supabase
        .from('tests')
        .select('*')
        .eq('subject', subject)
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      logError('getTests', error);
      return [];
    }
  },

  async addTest(test: Test): Promise<void> {
    try {
      const { error } = await supabase
        .from('tests')
        .insert([test]);
      
      if (error) throw error;
    } catch (error) {
      logError('addTest', error);
      throw error;
    }
  },

  async deleteTest(id: string, division?: string): Promise<boolean> {
    try {
      let query = supabase.from('tests').delete().eq('id', id);
      if (division && division !== 'ALL') {
        query = query.eq('division', division);
      }
      const { data, error } = await query.select();
      if (error) throw error;
      return !!data && data.length > 0;
    } catch (error) {
      logError('deleteTest', error);
      return false;
    }
  },

  // Results
  async getResults(subject: Subject): Promise<Result[]> {
    try {
      const { data, error } = await supabase
        .from('results')
        .select('*')
        .eq('subject', subject)
        .order('submittedAt', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      logError('getResults', error);
      return [];
    }
  },

  async addResult(result: Result): Promise<void> {
    try {
      const { error } = await supabase
        .from('results')
        .insert([result]);
      
      if (error) throw error;
    } catch (error) {
      logError('addResult', error);
      throw error;
    }
  },

  // Notifications
  async getNotifications(subject: Subject): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('subject', subject)
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      logError('getNotifications', error);
      return [];
    }
  },

  async addNotification(notification: Notification): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert([notification]);
      
      if (error) throw error;
    } catch (error) {
      logError('addNotification', error);
      throw error;
    }
  },

  // Storage
  async uploadFile(file: File, bucket: string = 'academic-assets'): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      logError('uploadFile', error);
      throw error;
    }
  }
};
