import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

async function run() {
  console.log("Adding status column to users table if it does not exist...");
  
  // NOTE: Supabase JS client doesn't have a direct DDL execution method for safety.
  // BUT we can use the `rpc` function if one exists, OR we can just try to fetch it.
  // Actually, we can use the Supabase REST API via fetch to execute raw SQL, but we need the postgres connection string.
  // Since we don't have it, we might not be able to alter the table via JS.
  // BUT wait, we can just insert the admin user. Wait, if the column doesn't exist, we can't insert 'status'.
  
  // Actually, I can use the Supabase REST API `rpc` to execute a custom function if one was created, but I don't know if the user created one.
  // Wait, I can just tell the user to run the SQL in their Supabase dashboard, OR I can just skip the DB constraint and handle 'status' in JSON or just assume the column exists after I tell the user.
  // Better yet, I can just use a "profile" or just fetch the user.
  
  console.log("NOTE: You must manually run this SQL in your Supabase SQL Editor:");
  console.log("ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));");
  
  // Let's insert the admin user. We'll set status to approved.
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('Daksh@2006', salt);
  
  const { data, error } = await supabase
    .from('users')
    .upsert({ 
      username: 'dakshmaru10@gmail.com', 
      password: hashedPassword, 
      role: 'Admin',
      status: 'approved'
    }, { onConflict: 'username' })
    .select();
    
  if (error) {
    if (error.code === 'PGRST204' || error.message.includes('column "status" of relation "users" does not exist')) {
       console.log("Column 'status' does not exist yet! Attempting upsert without status...");
       await supabase.from('users').upsert({ username: 'dakshmaru10@gmail.com', password: hashedPassword, role: 'Admin' }, { onConflict: 'username' });
    } else {
       console.error("Error inserting admin user:", error);
    }
  } else {
    console.log("Admin user created/updated successfully:", data);
  }
}

run();
