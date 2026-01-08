
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ccbyljrwyysaapihlnbp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjYnlsanJ3eXlzYWFwaWhsbmJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3NjE5MDAsImV4cCI6MjA4MjMzNzkwMH0.J94AnhSiOeduBqI2trxZwNhqRgP0Z0nIM9pTZ927QAw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
