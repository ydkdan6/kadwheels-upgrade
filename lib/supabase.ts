import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://rvznruhqruofmdhfimom.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2em5ydWhxcnVvZm1kaGZpbW9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MDcxOTUsImV4cCI6MjA2ODE4MzE5NX0.HfBJZg0cKqlzHEn4v8U5UZu-jYIPKUF8H8rjlbw2zVw';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);