const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('SUPABASE_URL set:', !!supabaseUrl);
console.log('SUPABASE_KEY set:', !!supabaseKey);

let supabase = null;

if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project')) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized');
  } catch (err) {
    console.error('❌ Failed to create Supabase client:', err.message);
  }
} else {
  console.warn('⚠️  Supabase credentials not configured properly');
}

const connectDB = async () => {
  if (!supabase) {
    console.log('⚠️  Running in demo mode without database');
    return;
  }
  
  try {
    const { data, error } = await supabase.from('users').select('id').limit(1);
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('✅ Supabase connected (table exists)');
      } else {
        console.log('⚠️  Tables may not exist yet:', error.message);
      }
    } else {
      console.log('✅ Supabase connected successfully');
    }
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message);
  }
};

module.exports = { supabase, connectDB };