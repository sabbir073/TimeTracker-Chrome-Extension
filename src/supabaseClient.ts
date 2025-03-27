// src/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://localhost:3000';
const supabaseAnonKey = 'abcd';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
