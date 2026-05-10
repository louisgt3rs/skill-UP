-- Run this in Supabase SQL Editor
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_connect_id TEXT;
