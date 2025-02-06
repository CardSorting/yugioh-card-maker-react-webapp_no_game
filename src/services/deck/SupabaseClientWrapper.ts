import { supabase } from '../../supabaseClient';

export class SupabaseClientWrapper {
    from(table: string): any {
        return supabase.from(table);
    }

    auth(): any {
        return supabase.auth;
    }
}
