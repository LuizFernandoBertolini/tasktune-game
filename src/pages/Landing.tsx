import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Target, Trophy, TrendingUp, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto mb-20">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Produtividade gamificada</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-6">
              FOCUS
            </h1>
            <p className="text-3xl md:text-4xl font-semibold text-foreground mb-6">
              Foque no que importa
            </p>
          </div>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Um app gamificado de organização e foco, pensado especialmente para pessoas com TDAH.
            Transforme suas tarefas em conquistas.
          </p>
          <Link to="/auth">
            <Button size="lg" className="text-base px-10 py-7 shadow-glow">
              Começar agora
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="p-8 hover:shadow-lg transition-all hover:-translate-y-1 border-primary/10">
            <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center mb-5 shadow-md">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">Gamificação</h3>
            <p className="text-muted-foreground leading-relaxed">
              Ganhe XP, desbloqueie badges e acumule moedas a cada tarefa concluída.
            </p>
          </Card>

          <Card className="p-8 hover:shadow-lg transition-all hover:-translate-y-1 border-success/10">
            <div className="w-14 h-14 rounded-xl bg-gradient-success flex items-center justify-center mb-5 shadow-md">
              <Target className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">Foco Guiado</h3>
            <p className="text-muted-foreground leading-relaxed">
              Timer Pomodoro personalizado para manter você focado sem distrações.
            </p>
          </Card>

          <Card className="p-8 hover:shadow-lg transition-all hover:-translate-y-1 border-accent/10">
            <div className="w-14 h-14 rounded-xl bg-gradient-accent flex items-center justify-center mb-5 shadow-md">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">Relatórios Simples</h3>
            <p className="text-muted-foreground leading-relaxed">
              Acompanhe seu progresso e mantenha streaks de produtividade.
            </p>
          </Card>
        </div>

        <div className="text-center mt-24 text-sm text-muted-foreground">
          <p>© 2025 FOCUS. Feito com dedicação para você.</p>
        </div>
      </div>
    </div>
  );
}
