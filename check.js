import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qmhnfhxisrmxdafqowaa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtaG5maHhpc3JteGRhZnFvd2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NjMyNDIsImV4cCI6MjA4NzMzOTI0Mn0.njCWIKlTagNt65RNzBMtG7ZiHPSMxpqeQtMcZRNousg'
);

async function check() {
  const { data, error } = await supabase.from('users').select('*').limit(1);
  console.log('users:', data, error);
}

check();
