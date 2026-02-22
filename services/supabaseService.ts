
import { supabase } from './supabase';
import { Subject, User, AcademicNote, Test, Result, Notification } from '../types';

export const supabaseService = {
  // Users
  async getUsers(subject: Subject): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('subject', subject);
    
    if (error) throw error;
    return data || [];
  },

  async addUser(user: User): Promise<void> {
    const { error } = await supabase
      .from('users')
      .upsert(user);
    
    if (error) throw error;
  },

  // Documents
  async getDocuments(subject: Subject): Promise<AcademicNote[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('subject', subject);
    
    if (error) throw error;
    return data || [];
  },

  async addDocument(doc: AcademicNote): Promise<void> {
    const { error } = await supabase
      .from('documents')
      .insert(doc);
    
    if (error) throw error;
  },

  async deleteDocument(id: string, division?: string): Promise<boolean> {
    let query = supabase.from('documents').delete().eq('id', id);
    if (division && division !== 'ALL') {
      query = query.eq('division', division);
    }
    const { error, count } = await query.select();
    if (error) throw error;
    return !!count && count > 0;
  },

  // Tests
  async getTests(subject: Subject): Promise<Test[]> {
    const { data, error } = await supabase
      .from('tests')
      .select('*')
      .eq('subject', subject);
    
    if (error) throw error;
    return data || [];
  },

  async addTest(test: Test): Promise<void> {
    const { error } = await supabase
      .from('tests')
      .insert(test);
    
    if (error) throw error;
  },

  async deleteTest(id: string, division?: string): Promise<boolean> {
    let query = supabase.from('tests').delete().eq('id', id);
    if (division && division !== 'ALL') {
      query = query.eq('division', division);
    }
    const { error, count } = await query.select();
    if (error) throw error;
    return !!count && count > 0;
  },

  // Results
  async getResults(subject: Subject): Promise<Result[]> {
    const { data, error } = await supabase
      .from('results')
      .select('*')
      .eq('subject', subject);
    
    if (error) throw error;
    return data || [];
  },

  async addResult(result: Result): Promise<void> {
    const { error } = await supabase
      .from('results')
      .insert(result);
    
    if (error) throw error;
  },

  // Notifications
  async getNotifications(subject: Subject): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('subject', subject);
    
    if (error) throw error;
    return data || [];
  },

  async addNotification(notification: Notification): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .insert(notification);
    
    if (error) throw error;
  }
};
