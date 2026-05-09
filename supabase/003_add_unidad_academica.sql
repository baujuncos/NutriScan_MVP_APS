-- Add unidad_academica column to academic_data
-- Run this in the Supabase SQL Editor

ALTER TABLE public.academic_data
  ADD COLUMN IF NOT EXISTS unidad_academica text;
