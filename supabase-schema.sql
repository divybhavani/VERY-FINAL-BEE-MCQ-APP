-- Create tables for the academic portal

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'STUDENT',
    subject TEXT NOT NULL,
    adminId TEXT,
    year TEXT,
    division TEXT,
    roll TEXT,
    mobile_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Documents Table (Notes/Media)
CREATE TABLE IF NOT EXISTS public.documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    subject TEXT NOT NULL,
    division TEXT,
    uploadedBy TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tests Table
CREATE TABLE IF NOT EXISTS public.tests (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    division TEXT,
    totalQuestionsToAttempt INTEGER NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- 4. Results Table
CREATE TABLE IF NOT EXISTS public.results (
    id TEXT PRIMARY KEY,
    testId TEXT NOT NULL,
    studentId TEXT NOT NULL,
    studentName TEXT NOT NULL,
    subject TEXT NOT NULL,
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    "submittedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    subject TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to allow re-running the script
DROP POLICY IF EXISTS "Allow anonymous read access on users" ON public.users;
DROP POLICY IF EXISTS "Allow anonymous insert access on users" ON public.users;
DROP POLICY IF EXISTS "Allow anonymous update access on users" ON public.users;
DROP POLICY IF EXISTS "Allow anonymous delete access on users" ON public.users;

DROP POLICY IF EXISTS "Allow anonymous read access on documents" ON public.documents;
DROP POLICY IF EXISTS "Allow anonymous insert access on documents" ON public.documents;
DROP POLICY IF EXISTS "Allow anonymous update access on documents" ON public.documents;
DROP POLICY IF EXISTS "Allow anonymous delete access on documents" ON public.documents;

DROP POLICY IF EXISTS "Allow anonymous read access on tests" ON public.tests;
DROP POLICY IF EXISTS "Allow anonymous insert access on tests" ON public.tests;
DROP POLICY IF EXISTS "Allow anonymous update access on tests" ON public.tests;
DROP POLICY IF EXISTS "Allow anonymous delete access on tests" ON public.tests;

DROP POLICY IF EXISTS "Allow anonymous read access on results" ON public.results;
DROP POLICY IF EXISTS "Allow anonymous insert access on results" ON public.results;
DROP POLICY IF EXISTS "Allow anonymous update access on results" ON public.results;
DROP POLICY IF EXISTS "Allow anonymous delete access on results" ON public.results;

DROP POLICY IF EXISTS "Allow anonymous read access on notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow anonymous insert access on notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow anonymous update access on notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow anonymous delete access on notifications" ON public.notifications;

-- Create open policies for all tables
CREATE POLICY "Allow anonymous read access on users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access on users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access on users" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access on users" ON public.users FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access on documents" ON public.documents FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access on documents" ON public.documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access on documents" ON public.documents FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access on documents" ON public.documents FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access on tests" ON public.tests FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access on tests" ON public.tests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access on tests" ON public.tests FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access on tests" ON public.tests FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access on results" ON public.results FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access on results" ON public.results FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access on results" ON public.results FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access on results" ON public.results FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access on notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access on notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access on notifications" ON public.notifications FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access on notifications" ON public.notifications FOR DELETE USING (true);

-- Set up Storage Bucket for files
INSERT INTO storage.buckets (id, name, public) VALUES ('academic-assets', 'academic-assets', true) ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;

CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'academic-assets');
CREATE POLICY "Public Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'academic-assets');
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'academic-assets');
