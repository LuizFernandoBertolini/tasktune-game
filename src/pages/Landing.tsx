import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Target, Trophy, TrendingUp, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="mb-6">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
              FOCUS
            </h1>
            <p className="text-2xl md:text-3xl font-semibold text-foreground mb-6">
              Foque no que importa
            </p>
          </div>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            Um app gamificado de organização e foco, pensado especialmente para pessoas com TDAH.
            Transforme suas tarefas em conquistas.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-gradient-primary hover:shadow-glow text-lg px-8 py-6">
              Começar agora
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="p-6 hover:shadow-card transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Gamificação</h3>
            <p className="text-muted-foreground">
              Ganhe XP, desbloqueie badges e acumule moedas a cada tarefa concluída.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-card transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-gradient-success flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Foco Guiado</h3>
            <p className="text-muted-foreground">
              Timer Pomodoro personalizado para manter você focado sem distrações.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-card transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-gradient-accent flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Relatórios Simples</h3>
            <p className="text-muted-foreground">
              Acompanhe seu progresso e mantenha streaks de produtividade.
            </p>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-20 text-sm text-muted-foreground">
          <p>© 2025 FOCUS. Feito com dedicação para você.</p>
        </div>
      </div>
    </div>
  );
}
