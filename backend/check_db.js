import { supabase } from './config/supabase.js';

async function check() {
  const { data, error } = await supabase.from('users').select('*').limit(5);
  if (error) {
    console.error("DB Error:", error.message);
  } else {
    console.log("Users:", data);
    if (data.length > 0 && !('status' in data[0])) {
      console.log("WARNING: 'status' column is MISSING!");
    } else {
      console.log("SUCCESS: 'status' column is present.");
    }
  }
}
check();
