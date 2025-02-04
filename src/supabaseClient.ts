import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ykifcwehtijnbpebhlda.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlraWZjd2VodGlqbmJwZWJobGRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1Nzg1ODYsImV4cCI6MjA1MjE1NDU4Nn0.JqzyVnGaTsFqc1QZRFt9aXn2Ri3zpRwn31wYesBQ2Y0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
    },
    global: {
        headers: { 'x-application-name': 'yugioh-card-maker' }
    },
    realtime: {
        params: {
            eventsPerSecond: 10
        }
    }
})
