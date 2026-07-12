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
      
      return (data || []).map((dbUser: any) => {
        const { roll, adminid, ...rest } = dbUser;
        return {
          ...rest,
          rollNumber: roll,
          adminId: adminid
        } as User;
      });
    } catch (error) {
      logError('getUsers', error);
      return [];
    }
  },

  async addUser(user: User): Promise<void> {
    try {
      const { rollNumber, adminId, ...restUser } = user;
      const dbUser = {
        ...restUser,
        roll: rollNumber,
        adminid: adminId
      };

      const { error } = await supabase
        .from('users')
        .upsert(dbUser, { onConflict: 'id' });
      
      if (error) {
        // If the mobile_number column is missing, try without it to prevent crashing
        const isMissingColumn = 
          (error.message?.includes('mobile_number') && error.message?.includes('schema cache')) ||
          error.message?.includes('column users.mobile_number does not exist') ||
          error.code === '42703';
          
        if (isMissingColumn) {
          console.warn("mobile_number column missing. Retrying without it. Please run the SQL migration.");
          const { mobile_number, ...userWithoutMobile } = dbUser;
          const { error: retryError } = await supabase
            .from('users')
            .upsert(userWithoutMobile, { onConflict: 'id' });
            
          if (retryError) throw retryError;
          return;
        }
        throw error;
      }
    } catch (error) {
      logError('addUser', error);
      throw error;
    }
  },

  async getUserCount(subject: Subject): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('subject', subject)
        .eq('role', 'STUDENT');
      
      if (error) throw error;
      return count || 0;
    } catch (error) {
      logError('getUserCount', error);
      return 0;
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
      
      return (data || []).map((dbDoc: any) => {
        const { url, uploadedby, createdAt, ...rest } = dbDoc;
        return {
          ...rest,
          fileUrl: url,
          uploadedBy: uploadedby || 'Unknown', // Map uploadedby back to uploadedBy
          createdAt: new Date(createdAt).getTime() // Convert back to number
        } as AcademicNote;
      });
    } catch (error) {
      logError('getDocuments', error);
      return [];
    }
  },

  async addDocument(doc: AcademicNote): Promise<void> {
    try {
      const { fileUrl, uploadedBy, createdAt, ...restDoc } = doc;
      const dbDoc = {
        ...restDoc,
        url: fileUrl,
        uploadedby: uploadedBy, // Map uploadedBy to uploadedby
        createdAt: new Date(createdAt).toISOString() // Convert number to ISO string
      };

      const { error } = await supabase
        .from('documents')
        .insert([dbDoc]); // Use array for explicit insert
      
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
      
      // Map totalQuestionsToAttempt back to timeLimit
      return (data || []).map(test => {
        const mappedTest = { 
          ...test, 
          timeLimit: test.totalquestionstoattempt, 
          createdBy: 'Admin',
          createdAt: new Date(test.createdAt).getTime() 
        };
        delete mappedTest.totalquestionstoattempt;
        return mappedTest;
      });
    } catch (error) {
      logError('getTests', error);
      return [];
    }
  },

  async addTest(test: Test): Promise<void> {
    try {
      // Map timeLimit to totalQuestionsToAttempt to match the database schema
      const { timeLimit, createdBy, createdAt, ...restTest } = test;
      const dbTest = {
        ...restTest,
        totalquestionstoattempt: timeLimit || test.questions.length,
        createdAt: new Date(createdAt).toISOString()
      };

      const { error } = await supabase
        .from('tests')
        .insert([dbTest]);
      
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
      return (data || []).map((dbResult: any) => {
        const { total, testid, studentid, studentname, submittedAt, ...rest } = dbResult;
        return {
          ...rest,
          testId: testid,
          studentId: studentid,
          studentName: studentname,
          totalQuestions: total,
          attempts: [], // fallback since it's not in db
          rollNumber: 'N/A', // fallback
          division: 'ALL', // fallback
          testTitle: 'Test', // fallback
          submittedAt: new Date(submittedAt).getTime()
        } as Result;
      });
    } catch (error) {
      logError('getResults', error);
      return [];
    }
  },

  async addResult(result: Result): Promise<void> {
    try {
      const { totalQuestions, attempts, rollNumber, division, testTitle, testId, studentId, studentName, submittedAt, ...restResult } = result;
      const dbResult = {
        ...restResult,
        testid: testId,
        studentid: studentId,
        studentname: studentName,
        total: totalQuestions,
        submittedAt: new Date(submittedAt).toISOString()
      };

      const { error } = await supabase
        .from('results')
        .insert([dbResult]);
      
      if (error) throw error;
    } catch (error) {
      logError('addResult', error);
      throw error;
    }
  },

  async deleteResult(id: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.from('results').delete().eq('id', id).select();
      if (error) throw error;
      return !!data && data.length > 0;
    } catch (error) {
      logError('deleteResult', error);
      return false;
    }
  },

  async deleteUser(id: string): Promise<boolean> {
    try {
      // Also delete associated results to clean up dashboard
      await supabase.from('results').delete().eq('studentId', id);
      
      const { data, error } = await supabase.from('users').delete().eq('id', id).select();
      if (error) throw error;
      return !!data && data.length > 0;
    } catch (error) {
      logError('deleteUser', error);
      return false;
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
      return (data || []).map((dbNotif: any) => {
        const { type, createdAt, ...rest } = dbNotif;
        return {
          ...rest,
          classTarget: type, // Map type back to classTarget
          createdAt: new Date(createdAt).getTime()
        } as Notification;
      });
    } catch (error) {
      logError('getNotifications', error);
      return [];
    }
  },

  async addNotification(notification: Notification): Promise<void> {
    try {
      const { classTarget, createdAt, ...restNotif } = notification;
      const dbNotif = {
        ...restNotif,
        type: classTarget, // Map classTarget to type
        createdAt: new Date(createdAt).toISOString()
      };

      const { error } = await supabase
        .from('notifications')
        .insert([dbNotif]);
      
      if (error) throw error;
    } catch (error) {
      logError('addNotification', error);
      throw error;
    }
  },

  // Storage
  async uploadFile(file: File, bucket: string = 'academic-assets', onProgress?: (progress: number) => void): Promise<string> {
    try {
      return new Promise((resolve, reject) => {
        // Calculate a realistic upload time based on file size
        // Assume an average upload speed of 2MB/s (2,000,000 bytes/s)
        const uploadSpeedBps = 2000000;
        const fileSize = file.size;
        
        // Minimum 1.5s, maximum 30s
        let totalUploadTimeMs = Math.max(1500, Math.min(30000, (fileSize / uploadSpeedBps) * 1000));
        
        let currentProgress = 0;
        const updateIntervalMs = 100; // Update every 100ms
        const progressPerInterval = 100 / (totalUploadTimeMs / updateIntervalMs);

        const progressInterval = setInterval(() => {
          currentProgress += progressPerInterval;
          // Add some randomness for realism
          currentProgress += (Math.random() * 2 - 1); 
          
          if (currentProgress >= 95) {
            currentProgress = 95; // Hold at 95% until file is actually read
            clearInterval(progressInterval);
          }
          
          if (onProgress) {
            onProgress(Math.min(95, Math.max(0, Math.round(currentProgress))));
          }
        }, updateIntervalMs);

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          clearInterval(progressInterval);
          
          // Smooth finish to 100%
          let finishProgress = currentProgress;
          const finishInterval = setInterval(() => {
            finishProgress += 5;
            if (finishProgress >= 100) {
              clearInterval(finishInterval);
              if (onProgress) onProgress(100);
              
              setTimeout(() => {
                resolve(reader.result as string);
              }, 400);
            } else {
              if (onProgress) onProgress(Math.round(finishProgress));
            }
          }, 50);
        };
        reader.onerror = error => {
          clearInterval(progressInterval);
          reject(error);
        };
      });
    } catch (error: any) {
      logError('uploadFile', error);
      throw new Error('Failed to process file upload. Try uploading a smaller file.');
    }
  }
};
