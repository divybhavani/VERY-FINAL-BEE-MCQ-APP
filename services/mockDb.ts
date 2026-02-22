
import { Subject, User, AcademicNote, Test, Result, Role, Question, Notification } from '../types';

class MockDatabase {
  private getStorage<T>(key: string): T[] {
    const data = localStorage.getItem(`spark_db_${key}`);
    return data ? JSON.parse(data) : [];
  }

  private setStorage<T>(key: string, data: T[]) {
    localStorage.setItem(`spark_db_${key}`, JSON.stringify(data));
  }

  // Users
  getUsers(subject: Subject): User[] {
    return this.getStorage<User>('users').filter(u => u.subject === subject);
  }

  addUser(user: User) {
    const users = this.getStorage<User>('users');
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      users[index] = user;
    } else {
      users.push(user);
    }
    this.setStorage('users', users);
  }

  // Documents
  getDocuments(subject: Subject): AcademicNote[] {
    return this.getStorage<AcademicNote>('documents').filter(d => d.subject === subject);
  }

  addDocument(doc: AcademicNote) {
    const docs = this.getStorage<AcademicNote>('documents');
    docs.push(doc);
    this.setStorage('documents', docs);
  }

  deleteDocument(id: string, division?: string): boolean {
    const docs = this.getStorage<AcademicNote>('documents');
    const filtered = docs.filter(d => {
      const idMatch = String(d.id) === String(id);
      if (!idMatch) return true;
      if (!division || division === 'ALL') return false;
      return d.division !== division;
    });
    this.setStorage('documents', filtered);
    return docs.length !== filtered.length;
  }

  // Tests
  getTests(subject: Subject): Test[] {
    return this.getStorage<Test>('tests').filter(t => t.subject === subject);
  }

  addTest(test: Test) {
    const tests = this.getStorage<Test>('tests');
    tests.push(test);
    this.setStorage('tests', tests);
  }

  deleteTest(id: string, division?: string): boolean {
    const tests = this.getStorage<Test>('tests');
    const filteredTests = tests.filter(t => {
      const idMatch = String(t.id) === String(id);
      if (!idMatch) return true;
      if (!division || division === 'ALL') return false;
      return t.division !== division;
    });
    this.setStorage('tests', filteredTests);
    return tests.length !== filteredTests.length;
  }

  // Results
  getResults(subject: Subject): Result[] {
    return this.getStorage<Result>('results').filter(r => r.subject === subject);
  }

  addResult(result: Result) {
    const results = this.getStorage<Result>('results');
    results.push(result);
    this.setStorage('results', results);
  }

  // Notifications
  getNotifications(subject: Subject): Notification[] {
    return this.getStorage<Notification>('notifications').filter(n => n.subject === subject);
  }

  addNotification(notification: Notification) {
    const notifications = this.getStorage<Notification>('notifications');
    notifications.push(notification);
    this.setStorage('notifications', notifications);
  }
}

export const db = new MockDatabase();
