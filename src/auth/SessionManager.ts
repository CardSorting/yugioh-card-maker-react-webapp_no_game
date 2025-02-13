import jwt from 'jsonwebtoken';
import { EventEmitter } from 'events';
import client from '../client';
import { User } from '../types/profile';

export interface Session {
  user: User;
  token: string;
}

class SessionManager extends EventEmitter {
  private currentSession: Session | null = null;
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

  constructor() {
    super();
    // Initialize session from localStorage on startup
    this.initializeSession();
  }

  private async initializeSession() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const session = await this.validateAndGetSession(token);
        this.currentSession = session;
        this.emit('authStateChange', 'SIGNED_IN', session);
      } catch (error) {
        console.error('Error initializing session:', error);
        this.currentSession = null;
        localStorage.removeItem('token');
        this.emit('authStateChange', 'SIGNED_OUT', null);
      }
    } else {
      this.currentSession = null;
      this.emit('authStateChange', 'SIGNED_OUT', null);
    }
  }

  private async validateAndGetSession(token: string): Promise<Session | null> {
    try {
      // Verify token and get userId
      const { userId } = jwt.verify(token, this.JWT_SECRET) as { userId: string };
      
      // Get user data
      const { data } = await client.get<{ user: User }>(`/auth/me?userId=${userId}`);

      if (!data.user) {
        throw new Error('User not found');
      }

      return {
        user: data.user,
        token
      };
    } catch (error) {
      console.error('Error validating session:', error);
      return null;
    }
  }

  async getSession(): Promise<Session | null> {
    const token = localStorage.getItem('token');
    if (!token) return null;

    if (this.currentSession?.token === token) {
      return this.currentSession;
    }

    const session = await this.validateAndGetSession(token);
    this.currentSession = session;
    return session;
  }

  onAuthStateChange(callback: (event: 'SIGNED_IN' | 'SIGNED_OUT', session: Session | null) => void) {
    this.on('authStateChange', callback);
    return () => this.off('authStateChange', callback);
  }

  async signOut() {
    localStorage.removeItem('token');
    this.currentSession = null;
    this.emit('authStateChange', 'SIGNED_OUT', null);
  }

  // Helper method to update session when signing in
  async setSession(token: string) {
    const session = await this.validateAndGetSession(token);
    if (session) {
      localStorage.setItem('token', token);
      this.currentSession = session;
      this.emit('authStateChange', 'SIGNED_IN', session);
    }
  }
}

export const sessionManager = new SessionManager();
