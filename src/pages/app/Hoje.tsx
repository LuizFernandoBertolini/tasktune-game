import { useState, useEffect } from "react";
import { Plus, Flame, Clock, CheckCircle2, Target, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import XPCard from "@/components/XPCard";
import BadgeUnlockedModal from "@/components/BadgeUnlockedModal";
import { playSound } from "@/lib/sounds";

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
  const [newBadges, setNewBadges] = useState<any[]>([]);
  const [displayName, setDisplayName] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadTasks();
      loadStats();
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    const { data } = await supabase
      .from("user_profiles")
      .select("display_name")
      .eq("user_id", user?.id)
      .single();

    if (data) setDisplayName(data.display_name || "");
  };

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
    
    const { data: statsData } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", user?.id)
      .eq("day", today)
      .maybeSingle();

    const { data: todayTasks } = await supabase
      .from("tasks")
      .select("status")
      .eq("user_id", user?.id)
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`);

    const completed = todayTasks?.filter((t) => t.status === "done").length || 0;
    const total = todayTasks?.length || 0;

    setStats({
      minutes: statsData?.minutes_focused || 0,
      completed,
      total,
      streak: statsData?.streak || 0,
    });
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
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const { error } = await supabase
      .from("tasks")
      .update({ 
        status: "done",
        completed_at: new Date().toISOString()
      })
      .eq("id", taskId);

    if (error) {
      playSound("error", user?.id);
      toast.error("Erro ao completar tarefa");
    } else {
      playSound("task_completed", user?.id);
      
      const { data: xpData } = await supabase.functions.invoke('award-xp', {
        body: {
          user_id: user?.id,
          task_id: taskId,
          difficulty: task.difficulty,
          abandoned: false,
          minutes: 0
        }
      });

      const { data: badgesData } = await supabase.functions.invoke("check-badges", {
        body: { user_id: user?.id },
      });

      if (badgesData?.new_badges && badgesData.new_badges.length > 0) {
        setNewBadges(badgesData.new_badges);
      }

      if (xpData?.ok) {
        playSound("xp_gain", user?.id);
        toast.success(`Tarefa concluída! +${xpData.xp_awarded} XP`);
      } else {
        toast.success("Tarefa concluída!");
      }
      
      loadTasks();
      loadStats();
      window.dispatchEvent(new CustomEvent('xp-updated'));
    }
  };

  const difficultyConfig = {
    easy: { label: "Fácil", color: "bg-success/10 text-success border-success/30" },
    med: { label: "Média", color: "bg-accent/10 text-accent border-accent/30" },
    hard: { label: "Difícil", color: "bg-destructive/10 text-destructive border-destructive/30" },
  };

  const progress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
  const greeting = new Date().getHours() < 12 ? "Bom dia" : new Date().getHours() < 18 ? "Boa tarde" : "Boa noite";

  return (
    <>
      <BadgeUnlockedModal badges={newBadges} onClose={() => setNewBadges([])} />
      
      <div className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-foreground">
            {greeting}{displayName && `, ${displayName}`}
          </h1>
          <p className="text-sm text-muted-foreground">Vamos conquistar suas metas hoje</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <XPCard />
          
          <Card className="p-5 border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-accent flex items-center justify-center shadow-md">
                  <Flame className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sequência</p>
                  <p className="text-3xl font-bold text-foreground">{stats.streak}</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-3">dias consecutivos</p>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Progresso do dia</CardTitle>
              <span className="text-2xl font-bold text-primary">{progress.toFixed(0)}%</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} className="h-3" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span className="text-muted-foreground">{stats.completed} de {stats.total} tarefas</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">{stats.minutes} min focados</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <Plus className="w-6 h-6" />
                <span className="text-xs">Nova Tarefa</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Criar nova tarefa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="O que você precisa fazer?" />
                </div>
                <div>
                  <Label htmlFor="notes">Notas (opcional)</Label>
                  <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Detalhes adicionais..." rows={3} />
                </div>
                <div>
                  <Label htmlFor="difficulty">Dificuldade</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger id="difficulty"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Fácil</SelectItem>
                      <SelectItem value="med">Média</SelectItem>
                      <SelectItem value="hard">Difícil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreate} className="w-full">Criar tarefa</Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate("/app/foco")}>
            <Timer className="w-6 h-6" />
            <span className="text-xs">Foco</span>
          </Button>
          
          <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate("/app/relatorios")}>
            <Target className="w-6 h-6" />
            <span className="text-xs">Relatórios</span>
          </Button>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Suas tarefas</h2>
          
          {tasks.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Nenhuma tarefa ainda. Crie sua primeira tarefa!</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <Card key={task.id} className={`p-4 transition-all hover:shadow-md ${task.status === "done" ? "opacity-60" : ""}`}>
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => task.status !== "done" && handleComplete(task.id)}
                      className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        task.status === "done" ? "bg-success border-success" : "border-muted-foreground hover:border-primary"
                      }`}
                      disabled={task.status === "done"}
                    >
                      {task.status === "done" && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium mb-1 ${task.status === "done" ? "line-through" : ""}`}>{task.title}</h3>
                      {task.notes && <p className="text-sm text-muted-foreground mb-2">{task.notes}</p>}
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-lg border ${difficultyConfig[task.difficulty as keyof typeof difficultyConfig]?.color}`}>
                          {difficultyConfig[task.difficulty as keyof typeof difficultyConfig]?.label}
                        </span>
                        {task.status !== "done" && (
                          <Button size="sm" variant="ghost" onClick={() => navigate(`/app/foco/${task.id}`)} className="h-7 text-xs">
                            <Timer className="w-3 h-3 mr-1" />Focar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
