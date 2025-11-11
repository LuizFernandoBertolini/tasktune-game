-- Adicionar campos de XP e level na tabela user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS xp_total integer DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS level integer DEFAULT 1 NOT NULL;

-- Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_xp ON public.user_profiles(user_id, xp_total, level);