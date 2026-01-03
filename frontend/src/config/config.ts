export const CONFIG = {
    SUPABASE: {
        URL: process.env.REACT_APP_SUPABASE_URL || 'https://nbxwptppjigieeqahukr.supabase.co',
        ANON_KEY: process.env.REACT_APP_SUPABASE_KEY || '',
    },
    ANIMATION: {
        DISPLAY_MS: 300,
        ANIM_MS: 300,
    },
    CACHE: {
        PREFIX: 'supabase_cache_',
        DEFAULT_INTERVAL: 600000,
    },
    AUTH: {
        // Moved away from hardcoded email in code
        // This should ideally be handled via Supabase RLS or a 'roles' table
        ADMIN_ROLE_NAME: 'admin',
        ADMIN_EMAIL: '21karrat@gmail.com',
    }
} as const;
