-- Adicionar campo low_stimulus na tabela user_profiles se não existir
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS low_stimulus boolean DEFAULT false;