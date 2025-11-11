import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Flame, Target } from "lucide-react";

export default function Relatorios() {
  const [weekData, setWeekData] = useState<any[]>([]);
  const [monthData, setMonthData] = useState<any[]>([]);
  const [maxStreak, setMaxStreak] = useState(0);
  const [weekCompletedTasks, setWeekCompletedTasks] = useState(0);
  const [monthCompletedTasks, setMonthCompletedTasks] = useState(0);
  const [currentPeriod, setCurrentPeriod] = useState<"week" | "month">("week");
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadWeekData();
      loadMonthData();
      loadCompletedTasks("week");
      loadCompletedTasks("month");
    }
  }, [user]);

  const loadCompletedTasks = async (period: "week" | "month") => {
    // Calcular a data inicial baseada no período
    const now = new Date();
    let startDate: Date;
    
    if (period === "week") {
      // Início da semana (domingo)
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
    } else {
      // Início do mês
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    const { data, error, count } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user?.id)
      .eq("status", "done")
      .gte("completed_at", startDate.toISOString());

    if (!error && count !== null) {
      if (period === "week") {
        setWeekCompletedTasks(count);
      } else {
        setMonthCompletedTasks(count);
      }
    }
  };

  const loadWeekData = async () => {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const { data } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", user?.id)
      .gte("day", weekAgo.toISOString().slice(0, 10))
      .order("day");

    if (data) {
      const formatted = data.map((d) => ({
        day: new Date(d.day).toLocaleDateString("pt-BR", { weekday: "short" }),
        minutos: d.minutes_focused,
        tarefas: d.tasks_done,
      }));
      setWeekData(formatted);

      const max = Math.max(...data.map((d) => d.streak), 0);
      setMaxStreak(max);
    }
  };

  const loadMonthData = async () => {
    const today = new Date();
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const { data } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", user?.id)
      .gte("day", monthAgo.toISOString().slice(0, 10))
      .order("day");

    if (data) {
      const formatted = data.map((d) => ({
        day: new Date(d.day).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        minutos: d.minutes_focused,
        tarefas: d.tasks_done,
      }));
      setMonthData(formatted);
    }
  };

  const totalMinutes = currentPeriod === "week" 
    ? weekData.reduce((acc, d) => acc + d.minutos, 0)
    : monthData.reduce((acc, d) => acc + d.minutos, 0);
  
  const totalCompletedTasks = currentPeriod === "week" ? weekCompletedTasks : monthCompletedTasks;

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Relatórios</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Minutos</span>
          </div>
          <p className="text-2xl font-bold">{totalMinutes}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-success" />
            <span className="text-xs text-muted-foreground">Tarefas</span>
          </div>
          <p className="text-2xl font-bold">{totalCompletedTasks}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-accent" />
            <span className="text-xs text-muted-foreground">Maior streak</span>
          </div>
          <p className="text-2xl font-bold">{maxStreak}</p>
        </Card>
      </div>

      <Tabs 
        defaultValue="semana" 
        className="w-full"
        onValueChange={(value) => setCurrentPeriod(value === "semana" ? "week" : "month")}
      >
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="semana">Semana</TabsTrigger>
          <TabsTrigger value="mes">Mês</TabsTrigger>
        </TabsList>

        <TabsContent value="semana">
          <Card className="p-6">
            <h3 className="font-bold mb-4">Minutos focados (últimos 7 dias)</h3>
            {weekData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weekData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="minutos" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum dado ainda. Complete sessões de foco para ver seus relatórios!
              </p>
            )}
          </Card>

          <Card className="p-6 mt-4">
            <h3 className="font-bold mb-4">Tarefas concluídas (últimos 7 dias)</h3>
            {weekData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weekData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="tarefas" stroke="hsl(var(--success))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum dado ainda.
              </p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="mes">
          <Card className="p-6">
            <h3 className="font-bold mb-4">Minutos focados (últimos 30 dias)</h3>
            {monthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="minutos" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum dado ainda.
              </p>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
