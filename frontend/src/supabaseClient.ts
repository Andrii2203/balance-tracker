import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
    'https://nbxwptppjigieeqahukr.supabase.co',
    process.env.REACT_APP_SUPABASE_KEY!
)