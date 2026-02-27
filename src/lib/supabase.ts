import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://maadmoayrogrhntlyqvn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hYWRtb2F5cm9ncmhudGx5cXZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxODk5MDgsImV4cCI6MjA4Nzc2NTkwOH0.KzTYILOztyY8eq2wYpbXC1ISXfZ_IKURE8CZmeAzitA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)