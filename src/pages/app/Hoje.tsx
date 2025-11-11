import { useState, useEffect } from "react";
import { Plus, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Task {
  id: string;
  title: string;
  notes: string | null;
  difficulty: string;
  status: string;
  due_date: string | null;
}

export default function Hoje() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState({ minutes: 0, completed: 0, total: 0, streak: 0 });
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadTasks();
      loadStats();
    }
  }, [user]);

  const loadTasks = async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user?.id)
      .neq("status", "archived")
      .order("created_at", { ascending: false });

    if (data) setTasks(data);
  };

  const loadStats = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", user?.id)
      .eq("day", today)
      .maybeSingle();

    if (data) {
      const completed = tasks.filter((t) => t.status === "done").length;
      const total = tasks.length || 1;
      setStats({
        minutes: data.minutes_focused,
        completed,
        total,
        streak: data.streak,
      });
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) return;

    const { error } = await supabase.from("tasks").insert({
      user_id: user?.id,
      title,
      notes,
      difficulty,
    });

    if (error) {
      toast.error("Erro ao criar tarefa");
    } else {
      toast.success("Tarefa criada!");
      setOpen(false);
      setTitle("");
      setNotes("");
      setDifficulty("easy");
      loadTasks();
    }
  };

  const handleComplete = async (taskId: string) => {
    const { error } = await supabase
      .from("tasks")
      .update({ 
        status: "done",
        completed_at: new Date().toISOString()
      })
      .eq("id", taskId);

    if (error) {
      toast.error("Erro ao completar tarefa");
    } else {
      toast.success("Tarefa concluída! +XP");
      loadTasks();
      loadStats();
    }
  };

  const difficultyColors = {
    easy: "bg-success/20 text-success border-success",
    med: "bg-accent/20 text-accent-foreground border-accent",
    hard: "bg-destructive/20 text-destructive border-destructive",
  };

  const progress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Hoje</h1>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progresso do dia</span>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-accent" />
              <span className="text-sm font-bold">{stats.streak} dias</span>
            </div>
          </div>
          <Progress value={progress} className="mb-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{stats.minutes} min focados</span>
            <span>
              {stats.completed}/{stats.total} tarefas
            </span>
          </div>
        </Card>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Suas tarefas</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nova tarefa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar nova tarefa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="O que você precisa fazer?"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalhes adicionais..."
                />
              </div>
              <div>
                <Label htmlFor="difficulty">Dificuldade</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Fácil</SelectItem>
                    <SelectItem value="med">Média</SelectItem>
                    <SelectItem value="hard">Difícil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full">
                Criar tarefa
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {tasks.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">
            Nada por aqui ainda. Que tal criar a primeira tarefa?
          </p>
          <Button onClick={() => setOpen(true)}>Criar tarefa</Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card
              key={task.id}
              className={`p-4 ${task.status === "done" ? "opacity-60" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className={`font-medium mb-1 ${task.status === "done" ? "line-through" : ""}`}>
                    {task.title}
                  </h3>
                  {task.notes && (
                    <p className="text-sm text-muted-foreground mb-2">{task.notes}</p>
                  )}
                  <span
                    className={`text-xs px-2 py-1 rounded-full border ${
                      difficultyColors[task.difficulty as keyof typeof difficultyColors]
                    }`}
                  >
                    {task.difficulty === "easy"
                      ? "Fácil"
                      : task.difficulty === "med"
                      ? "Média"
                      : "Difícil"}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {task.status === "todo" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/app/foco/${task.id}`)}
                      >
                        Iniciar
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleComplete(task.id)}
                      >
                        Concluir
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
