-- Perfis de usuários (dados extras)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  tz text DEFAULT 'America/Sao_Paulo',
  pomodoro_duration integer DEFAULT 25,
  font_size text DEFAULT 'medium',
  high_contrast boolean DEFAULT false,
  sound_feedback boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Tarefas
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  notes text,
  difficulty text CHECK (difficulty IN ('easy','med','hard')) DEFAULT 'easy',
  due_date date,
  periodicity text CHECK (periodicity IN ('none','daily','weekly','monthly')) DEFAULT 'none',
  status text CHECK (status IN ('todo','doing','done','archived')) DEFAULT 'todo',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sessões de foco
CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  abandoned boolean DEFAULT false,
  minutes integer DEFAULT 0
);

-- Recompensas (moedas ganhas ou gastas)
CREATE TABLE IF NOT EXISTS public.rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text CHECK (type IN ('earn','spend')) NOT NULL,
  amount integer NOT NULL,
  meta jsonb,
  created_at timestamptz DEFAULT now()
);

-- Badges catálogo
CREATE TABLE IF NOT EXISTS public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  rule_json jsonb NOT NULL,
  icon_url text
);

-- Badges por usuário
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Estatísticas diárias agregadas
CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day date NOT NULL,
  minutes_focused integer DEFAULT 0,
  tasks_done integer DEFAULT 0,
  streak integer DEFAULT 0,
  PRIMARY KEY (user_id, day)
);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para tasks
DROP TRIGGER IF EXISTS trg_tasks_updated_at ON public.tasks;
CREATE TRIGGER trg_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Habilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para tasks
CREATE POLICY "Users can manage own tasks" ON public.tasks
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para focus_sessions
CREATE POLICY "Users can manage own sessions" ON public.focus_sessions
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para rewards
CREATE POLICY "Users can view own rewards" ON public.rewards
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para badges (leitura pública)
CREATE POLICY "Badges are publicly readable" ON public.badges
FOR SELECT USING (true);

-- Políticas RLS para user_badges
CREATE POLICY "Users can view own badges" ON public.user_badges
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para user_stats
CREATE POLICY "Users can view own stats" ON public.user_stats
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Seeds de badges
INSERT INTO public.badges (slug, name, description, rule_json) VALUES
('primeiro-foco', 'Primeiro Foco', 'Conclua sua primeira sessão de foco.', '{"type":"first_focus"}'),
('streak-3', 'Aquecendo', 'Mantenha streak de 3 dias.', '{"type":"streak","min":3}'),
('streak-7', 'Uma Semana!', 'Streak de 7 dias.', '{"type":"streak","min":7}'),
('tarefas-10', 'Produtivo', 'Complete 10 tarefas.', '{"type":"tasks_done","min":10}'),
('hard-5', 'Casca Grossa', 'Conclua 5 tarefas "hard".', '{"type":"hard_tasks","min":5}')
ON CONFLICT (slug) DO NOTHING;

-- Função para criar perfil ao registrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$;

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();