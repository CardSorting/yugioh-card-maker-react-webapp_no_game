import { supabase } from '../supabaseClient';
import { Session } from '@supabase/supabase-js';

class SessionManager {
  async getSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  onAuthStateChange(callback: (event: any, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  async signOut() {
    await supabase.auth.signOut();
  }
}

export const sessionManager = new SessionManager();
