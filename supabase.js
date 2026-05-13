import { createClient } from '@supabase/supabase-js'

// IMPORTANT: Replace these with your actual project URL and Anon Key 
// from your Supabase Dashboard (Settings -> API)
const supabaseUrl = 'https://yfpvgrisdciqbrziqjki.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmcHZncmlzZGNpcWJyemlxamtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NjM5MTMsImV4cCI6MjA5NDIzOTkxM30.CfoHZGWjaA_4hdiTZNVekc8NjryYZR2Kmc_Erogomx8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
