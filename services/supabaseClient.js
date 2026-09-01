import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const getEnv = () => {
    if (typeof window !== 'undefined' && window.__ENV__) return window.__ENV__;
    if (typeof import.meta !== 'undefined' && import.meta.env) return import.meta.env;
    return {};
};

const env = getEnv();
const url = env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

export const supabase = (url && key) ? createClient(url, key) : null;
export default supabase;
