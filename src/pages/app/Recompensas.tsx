import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Coins, Trophy, Lock, Sparkles, Award, ShoppingBag, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  const [userRewardsCount, setUserRewardsCount] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadCoins();
      loadBadges();
      loadUserRewards();
    }
  }, [user]);

  const loadCoins = async () => {
    const { data } = await supabase
      .from("user_wallet")
      .select("coins")
      .eq("user_id", user?.id)
      .maybeSingle();

    setCoins(data?.coins || 0);
  };

  const loadUserRewards = async () => {
    const { data, count } = await supabase
      .from("user_rewards")
      .select("*", { count: 'exact' })
      .eq("user_id", user?.id);

    setUserRewardsCount(count || 0);
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

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Card de Moedas */}
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Saldo de Moedas
                </p>
                <div className="flex items-center gap-2">
                  <Coins className="w-8 h-8 text-primary" />
                  <span className="text-4xl font-bold">{coins}</span>
                </div>
              </div>
              <Sparkles className="w-12 h-12 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        {/* Card de Recompensas */}
        <Card className="bg-gradient-to-br from-accent/10 to-secondary/10 border-accent/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Itens da Loja
                </p>
                <div className="flex items-center gap-2">
                  <Gift className="w-8 h-8 text-accent" />
                  <span className="text-4xl font-bold">{userRewardsCount}</span>
                </div>
              </div>
              <ShoppingBag className="w-12 h-12 text-accent/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botões de Ação */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Button 
          onClick={() => navigate("/app/loja")}
          size="lg"
          className="h-16"
        >
          <ShoppingBag className="w-5 h-5 mr-2" />
          Ir para a Loja
        </Button>
        <Button 
          onClick={() => navigate("/app/minhas-recompensas")}
          variant="outline"
          size="lg"
          className="h-16"
        >
          <Gift className="w-5 h-5 mr-2" />
          Minhas Recompensas
        </Button>
      </div>

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

      {/* Info Card */}
      <Card className="p-6 bg-muted/50">
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <Coins className="w-5 h-5" />
          Como ganhar moedas?
        </h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Complete tarefas fáceis → <strong>+2 moedas</strong></li>
          <li>• Complete tarefas médias → <strong>+4 moedas</strong></li>
          <li>• Complete tarefas difíceis → <strong>+6 moedas</strong></li>
          <li>• Desbloqueie conquistas → <strong>+10 moedas</strong></li>
          <li>• Atinja 100% do progresso diário → <strong>+8 moedas</strong></li>
        </ul>
      </Card>
    </div>
  );
}
