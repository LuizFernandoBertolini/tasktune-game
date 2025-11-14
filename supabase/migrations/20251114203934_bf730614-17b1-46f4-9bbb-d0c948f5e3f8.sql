-- Criar tabela de loja de recompensas
CREATE TABLE IF NOT EXISTS public.rewards_store (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cost INTEGER NOT NULL CHECK (cost > 0),
  icon TEXT,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de recompensas do usuário
CREATE TABLE IF NOT EXISTS public.user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards_store(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  active BOOLEAN DEFAULT true,
  UNIQUE(user_id, reward_id)
);

-- Criar tabela de carteira do usuário
CREATE TABLE IF NOT EXISTS public.user_wallet (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  coins INTEGER DEFAULT 0 CHECK (coins >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rewards_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallet ENABLE ROW LEVEL SECURITY;

-- Políticas para rewards_store (todos podem ler)
CREATE POLICY "Loja é pública" ON public.rewards_store
  FOR SELECT USING (true);

-- Políticas para user_rewards (usuário gerencia suas próprias recompensas)
CREATE POLICY "Usuários gerenciam suas recompensas" ON public.user_rewards
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para user_wallet (usuário gerencia sua própria carteira)
CREATE POLICY "Usuários gerenciam sua carteira" ON public.user_wallet
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_user_wallet_updated_at
  BEFORE UPDATE ON public.user_wallet
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Inserir itens padrões na loja
INSERT INTO public.rewards_store (title, description, cost, icon, category) VALUES
  ('Tema Aurora', 'Tema especial com cores suaves e gradientes inspirados na aurora boreal', 120, '🌌', 'theme'),
  ('Tema Neon Focus', 'Tema vibrante com cores neon para máxima energia e foco', 150, '⚡', 'theme'),
  ('Círculo de Energia', 'Skin exclusiva do cronômetro com animação de círculo pulsante', 80, '⭕', 'timer_skin'),
  ('Som Exclusivo de Foco', 'Trilha sonora relaxante especial para sessões de foco', 60, '🎵', 'sound'),
  ('Badge Dourada', 'Badge premium dourada exibida no seu perfil', 200, '🏆', 'badge'),
  ('Ícone Premium', 'Ícone especial premium para personalizar seu avatar', 50, '👑', 'avatar'),
  ('Bônus XP 24h', 'Ganhe o dobro de XP por 24 horas em todas as atividades', 100, '✨', 'boost');

-- Criar função para inicializar carteira do usuário
CREATE OR REPLACE FUNCTION public.initialize_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_wallet (user_id, coins)
  VALUES (NEW.user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar carteira quando criar perfil
CREATE TRIGGER on_profile_created_initialize_wallet
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_user_wallet();