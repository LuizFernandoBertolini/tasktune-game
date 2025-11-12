-- Adicionar xp_reward na tabela badges
ALTER TABLE public.badges 
ADD COLUMN IF NOT EXISTS xp_reward integer DEFAULT 0;

-- Adicionar notified na tabela user_badges
ALTER TABLE public.user_badges 
ADD COLUMN IF NOT EXISTS notified boolean DEFAULT false;

-- Inserir badges padrão
INSERT INTO public.badges (slug, name, description, xp_reward, rule_json) VALUES
('primeiro-passo', 'Primeiro Passo', 'Complete sua primeira tarefa', 10, '{"type": "tasks_completed", "count": 1}'::jsonb),
('rotina-iniciada', 'Rotina Iniciada', 'Conclua 5 tarefas no mesmo dia', 20, '{"type": "tasks_per_day", "count": 5}'::jsonb),
('constancia-tudo', 'Constância é Tudo', 'Mantenha 3 dias seguidos de streak', 25, '{"type": "streak_days", "count": 3}'::jsonb),
('foco-total', 'Foco Total', 'Conclua uma sessão de foco sem pausas', 15, '{"type": "focus_completed", "count": 1}'::jsonb),
('produtividade-pro', 'Produtividade Nível Pro', 'Alcance 100 tarefas concluídas', 50, '{"type": "tasks_completed", "count": 100}'::jsonb),
('matador-pendencias', 'Matador de Pendências', 'Complete 10 tarefas em um dia', 40, '{"type": "tasks_per_day", "count": 10}'::jsonb),
('maratona-foco', 'Maratona de Foco', 'Conclua 5 sessões de foco no mesmo dia', 35, '{"type": "focus_per_day", "count": 5}'::jsonb),
('mente-ferro', 'Mente de Ferro', 'Mantenha uma sequência de 10 dias de streak', 60, '{"type": "streak_days", "count": 10}'::jsonb),
('organizacao-suprema', 'Organização Suprema', 'Tenha 7 dias consecutivos com 100% das tarefas concluídas', 100, '{"type": "perfect_days", "count": 7}'::jsonb),
('campeao-semana', 'Campeão da Semana', 'Alcance mais de 200 minutos focados em uma semana', 75, '{"type": "weekly_minutes", "count": 200}'::jsonb),
('heroi-tempo', 'Herói do Tempo', 'Complete tarefas antes do horário previsto 20 vezes', 40, '{"type": "early_completions", "count": 20}'::jsonb),
('controle-total', 'Controle Total', 'Não abandonar nenhuma sessão de foco por 5 dias seguidos', 45, '{"type": "no_abandon_days", "count": 5}'::jsonb),
('sabio-foco', 'Sábio do Foco', 'Alcançar o nível 10 de XP', 80, '{"type": "level", "count": 10}'::jsonb),
('mentor-rotina', 'Mentor da Rotina', 'Mantenha 30 dias de streak', 150, '{"type": "streak_days", "count": 30}'::jsonb)
ON CONFLICT (slug) DO NOTHING;