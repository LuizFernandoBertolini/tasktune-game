import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Play, Pause, X, Check, ArrowLeft } from "lucide-react";

export default function Foco() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [duration, setDuration] = useState(25);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (user) {
      loadProfile();
      if (taskId) {
        loadTask();
      }
    }
  }, [user, taskId]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const loadProfile = async () => {
    const { data } = await supabase
      .from("user_profiles")
      .select("pomodoro_duration")
      .eq("user_id", user?.id)
      .maybeSingle();

    if (data?.pomodoro_duration) {
      setDuration(data.pomodoro_duration);
      setTimeLeft(data.pomodoro_duration * 60);
    } else {
      setTimeLeft(25 * 60);
    }
  };

  const loadTask = async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .maybeSingle();

    if (data) setTask(data);
  };

  const handleStart = async () => {
    if (!sessionId) {
      const { data, error } = await supabase
        .from("focus_sessions")
        .insert({
          user_id: user?.id,
          task_id: taskId || null,
        })
        .select()
        .single();

      if (error) {
        toast.error("Erro ao iniciar sessão");
        return;
      }

      setSessionId(data.id);
      setStartTime(Date.now());
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleAbandon = async () => {
    if (sessionId) {
      const minutes = Math.floor((Date.now() - startTime) / 60000);
      await supabase
        .from("focus_sessions")
        .update({
          ended_at: new Date().toISOString(),
          abandoned: true,
          minutes,
        })
        .eq("id", sessionId);

      toast("Sessão abandonada", { description: "Tudo bem, você pode tentar novamente!" });
      navigate("/app/hoje");
    }
  };

  const handleComplete = async () => {
    if (sessionId) {
      const minutes = Math.floor((duration * 60 - timeLeft) / 60);
      
      await supabase
        .from("focus_sessions")
        .update({
          ended_at: new Date().toISOString(),
          abandoned: false,
          minutes,
        })
        .eq("id", sessionId);

      if (taskId) {
        await supabase
          .from("tasks")
          .update({ status: "done" })
          .eq("id", taskId);
      }

      // Call edge function for XP calculation
      const { data: sessionData } = await supabase
        .from("focus_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (sessionData) {
        await supabase.functions.invoke("award-xp", {
          body: {
            user_id: user?.id,
            task_id: taskId || null,
            difficulty: task?.difficulty || "easy",
            abandoned: false,
            minutes,
          },
        });
      }

      toast.success("Sessão concluída! 🎉", { description: `+XP ganhos!` });
      navigate("/app/hoje");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <Button variant="ghost" onClick={() => navigate("/app/hoje")} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>

      <Card className="p-8 text-center">
        {task && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">{task.title}</h2>
            {task.notes && <p className="text-muted-foreground">{task.notes}</p>}
          </div>
        )}

        <div className="mb-8">
          <div className="text-6xl md:text-8xl font-bold mb-4 font-mono">
            {formatTime(timeLeft)}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex flex-col gap-3">
          {!isRunning && timeLeft > 0 && (
            <Button size="lg" onClick={handleStart} className="w-full">
              <Play className="w-5 h-5 mr-2" />
              {sessionId ? "Continuar" : "Iniciar"}
            </Button>
          )}

          {isRunning && (
            <Button size="lg" onClick={handlePause} variant="secondary" className="w-full">
              <Pause className="w-5 h-5 mr-2" />
              Pausar
            </Button>
          )}

          {sessionId && (
            <>
              <Button
                size="lg"
                onClick={handleComplete}
                variant="outline"
                className="w-full"
              >
                <Check className="w-5 h-5 mr-2" />
                Concluir agora
              </Button>

              <Button
                size="lg"
                onClick={handleAbandon}
                variant="destructive"
                className="w-full"
              >
                <X className="w-5 h-5 mr-2" />
                Abandonar
              </Button>
            </>
          )}
        </div>

        <p className="text-sm text-muted-foreground mt-6">
          Respire fundo. {duration} minutos, você consegue.
        </p>
      </Card>
    </div>
  );
}
