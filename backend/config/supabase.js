import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseClient;

try {
  if (!supabaseUrl || supabaseUrl === 'your_project_url_here' || !supabaseUrl.startsWith('http')) {
    console.warn('⚠️ Supabase environment variables are missing or invalid in backend/.env');
    console.warn('⚠️ The server will start, but database queries will fail until this is fixed.');
    // Create a dummy proxy that throws an error when used
    supabaseClient = new Proxy({}, {
      get: () => { throw new Error('Supabase is not configured. Please add valid SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env'); }
    });
  } else {
    supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
  }
} catch (error) {
  console.error('Failed to initialize Supabase client:', error.message);
}

export const supabase = supabaseClient;
