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
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('user1234', salt);
  
  const { data, error } = await supabase
    .from('users')
    .upsert({ 
      username: 'test@gmail.com', 
      password: hashedPassword, 
      role: 'Cashier',
      status: 'approved'
    }, { onConflict: 'username' })
    .select();
    
  if (error) {
    if (error.code === 'PGRST204' || error.message.includes('column "status" of relation "users" does not exist')) {
       console.log("Column 'status' does not exist yet! Attempting upsert without status...");
       await supabase.from('users').upsert({ username: 'test@gmail.com', password: hashedPassword, role: 'Cashier' }, { onConflict: 'username' });
    } else {
       console.error("Error inserting test user:", error);
    }
  } else {
    console.log("Test user created/updated successfully:", data);
  }
}

run();
