-- Adicionar campo completed_at na tabela tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Criar índice para melhorar performance das queries de relatório
CREATE INDEX IF NOT EXISTS idx_tasks_user_status_completed ON public.tasks(user_id, status, completed_at);

-- Atualizar tarefas existentes com status 'done' para ter completed_at = updated_at
UPDATE public.tasks 
SET completed_at = updated_at 
WHERE status = 'done' AND completed_at IS NULL;