-- Add face_token column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN face_token TEXT;