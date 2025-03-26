// src/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://app.tabtracker.ai';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogInNlcnZpY2Vfcm9sZSIsCiAgImlzcyI6ICJzdXBhYmFzZSIsCiAgImlhdCI6IDE3NDEyNzY4MDAsCiAgImV4cCI6IDE4OTkwNDMyMDAKfQ.jExVtLyjX-PD4oem2eLllgP3Pm6KZxpQXx7c5gnl1Tc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);