import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Award, Calendar, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface UserReward {
  id: string;
  reward_id: string;
  redeemed_at: string;
  active: boolean;
  rewards_store: {
    title: string;
    description: string;
    icon: string;
    category: string;
    cost: number;
  };
}

export default function MinhasRecompensas() {
  const [rewards, setRewards] = useState<UserReward[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadRewards();
    }
  }, [user]);

  const loadRewards = async () => {
    const { data } = await supabase
      .from("user_rewards")
      .select(`
        *,
        rewards_store (
          title,
          description,
          icon,
          category,
          cost
        )
      `)
      .eq("user_id", user?.id)
      .order("redeemed_at", { ascending: false });

    if (data) setRewards(data as any);
  };

  const toggleActive = async (rewardId: string, currentActive: boolean) => {
    const { error } = await supabase
      .from("user_rewards")
      .update({ active: !currentActive })
      .eq("id", rewardId);

    if (error) {
      toast.error("Erro ao atualizar item");
      return;
    }

    setRewards(rewards.map(r => 
      r.id === rewardId ? { ...r, active: !currentActive } : r
    ));
    
    toast.success(currentActive ? "Item desativado" : "Item ativado");
  };

  const activeRewards = rewards.filter(r => r.active);
  const inactiveRewards = rewards.filter(r => !r.active);

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <Award className="w-8 h-8" />
        Minhas Recompensas
      </h1>

      {/* Stats Card */}
      <Card className="mb-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{rewards.length}</p>
              <p className="text-sm text-muted-foreground">Total de Itens</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-accent">{activeRewards.length}</p>
              <p className="text-sm text-muted-foreground">Itens Ativos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {rewards.length === 0 ? (
        <Card className="p-12 text-center">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-bold mb-2">Nenhuma recompensa ainda</h3>
          <p className="text-muted-foreground mb-4">
            Complete tarefas e ganhe moedas para comprar itens na loja!
          </p>
          <Button onClick={() => window.location.href = "/app/loja"}>
            Ir para a Loja
          </Button>
        </Card>
      ) : (
        <>
          {/* Active Rewards */}
          {activeRewards.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Itens Ativos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeRewards.map((reward) => (
                  <Card key={reward.id} className="border-primary/30">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="text-4xl">{reward.rewards_store.icon}</div>
                        <Badge variant="default">Ativo</Badge>
                      </div>
                      <CardTitle className="text-lg mt-2">
                        {reward.rewards_store.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {reward.rewards_store.description}
                      </p>
                      
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {new Date(reward.redeemed_at).toLocaleDateString('pt-BR')}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Ativar</span>
                          <Switch
                            checked={reward.active}
                            onCheckedChange={() => toggleActive(reward.id, reward.active)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Inactive Rewards */}
          {inactiveRewards.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Itens Desativados</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inactiveRewards.map((reward) => (
                  <Card key={reward.id} className="opacity-60">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="text-4xl">{reward.rewards_store.icon}</div>
                        <Badge variant="outline">Inativo</Badge>
                      </div>
                      <CardTitle className="text-lg mt-2">
                        {reward.rewards_store.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {reward.rewards_store.description}
                      </p>
                      
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {new Date(reward.redeemed_at).toLocaleDateString('pt-BR')}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Ativar</span>
                          <Switch
                            checked={reward.active}
                            onCheckedChange={() => toggleActive(reward.id, reward.active)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
