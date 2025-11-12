import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Coins, Trophy, Lock, Sparkles, Award } from "lucide-react";

interface BadgeType {
  id: string;
  slug: string;
  name: string;
  description: string;
  xp_reward: number;
  earned?: boolean;
  earned_at?: string;
}

export default function Recompensas() {
  const [coins, setCoins] = useState(0);
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [totalXPFromBadges, setTotalXPFromBadges] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadCoins();
      loadBadges();
    }
  }, [user]);

  const loadCoins = async () => {
    const { data } = await supabase
      .from("rewards")
      .select("amount, type")
      .eq("user_id", user?.id);

    if (data) {
      const total = data.reduce((acc, r) => {
        return r.type === "earn" ? acc + r.amount : acc - r.amount;
      }, 0);
      setCoins(total);
    }
  };

  const loadBadges = async () => {
    // Load all badges
    const { data: allBadges } = await supabase.from("badges").select("*");

    // Load user's earned badges
    const { data: userBadges } = await supabase
      .from("user_badges")
      .select("badge_id, earned_at")
      .eq("user_id", user?.id);

    const earnedMap = new Map(userBadges?.map((ub) => [ub.badge_id, ub.earned_at]) || []);

    const badgesWithStatus = allBadges?.map((badge) => ({
      ...badge,
      earned: earnedMap.has(badge.id),
      earned_at: earnedMap.get(badge.id),
    })) || [];

    setBadges(badgesWithStatus);

    // Calcular XP total de badges
    const totalXP = badgesWithStatus
      .filter((b) => b.earned)
      .reduce((sum, b) => sum + (b.xp_reward || 0), 0);
    setTotalXPFromBadges(totalXP);
  };

  const earnedBadges = badges.filter((b) => b.earned);
  const lockedBadges = badges.filter((b) => !b.earned);

  const progress = badges.length > 0 ? (earnedBadges.length / badges.length) * 100 : 0;

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Minhas Conquistas</h1>

      {/* Card de Progresso */}
      <Card className="p-6 mb-4 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Progresso de Conquistas
              </p>
              <div className="flex items-center gap-2">
                <Trophy className="w-8 h-8 text-primary" />
                <span className="text-4xl font-bold">{earnedBadges.length}</span>
                <span className="text-muted-foreground">/ {badges.length}</span>
              </div>
            </div>
            <Award className="w-16 h-16 text-primary/20" />
          </div>
          
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">
              {Math.round(progress)}% concluído
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-center flex-1">
              <p className="text-2xl font-bold text-accent">{totalXPFromBadges}</p>
              <p className="text-xs text-muted-foreground">XP Total de Conquistas</p>
            </div>
            <div className="text-center flex-1 border-l">
              <p className="text-2xl font-bold text-primary">{earnedBadges.length}</p>
              <p className="text-xs text-muted-foreground">Desbloqueadas</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Card de Moedas */}
      <Card className="p-6 mb-6 bg-gradient-accent">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-accent-foreground/80 mb-1">
              Saldo de moedas
            </p>
            <div className="flex items-center gap-2">
              <Coins className="w-8 h-8 text-accent-foreground" />
              <span className="text-4xl font-bold text-accent-foreground">{coins}</span>
            </div>
          </div>
          <Sparkles className="w-16 h-16 text-accent-foreground/20" />
        </div>
      </Card>

      <Tabs defaultValue="conquistadas" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="conquistadas">
            Conquistadas ({earnedBadges.length})
          </TabsTrigger>
          <TabsTrigger value="bloqueadas">
            Bloqueadas ({lockedBadges.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conquistadas">
          {earnedBadges.length === 0 ? (
            <Card className="p-8 text-center">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Complete tarefas e sessões de foco para ganhar badges!
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {earnedBadges.map((badge) => (
                <Card key={badge.id} className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-3 animate-pulse">
                      <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-bold mb-1">
                      {badge.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      {badge.description}
                    </p>
                    <Badge variant="secondary" className="bg-accent text-accent-foreground">
                      +{badge.xp_reward} XP
                    </Badge>
                    {badge.earned_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(badge.earned_at).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bloqueadas">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {lockedBadges.map((badge) => (
              <Card key={badge.id} className="p-4 opacity-60 grayscale">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Lock className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-bold mb-1">{badge.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    {badge.description}
                  </p>
                  <Badge variant="outline" className="opacity-50">
                    {badge.xp_reward} XP
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Card className="p-6 mt-6">
        <h2 className="text-xl font-bold mb-4">Loja (em breve)</h2>
        <p className="text-muted-foreground text-sm">
          Em breve você poderá trocar suas moedas por temas personalizados e recursos extras!
        </p>
      </Card>
    </div>
  );
}
