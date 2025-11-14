import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Coins, ShoppingBag, Sparkles, Lock } from "lucide-react";
import { toast } from "sonner";

interface StoreItem {
  id: string;
  title: string;
  description: string;
  cost: number;
  icon: string;
  category: string;
}

interface UserReward {
  reward_id: string;
}

export default function Loja() {
  const [items, setItems] = useState<StoreItem[]>([]);
  const [userRewards, setUserRewards] = useState<UserReward[]>([]);
  const [coins, setCoins] = useState(0);
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadStore();
      loadUserCoins();
      loadUserRewards();
    }
  }, [user]);

  const loadStore = async () => {
    const { data } = await supabase
      .from("rewards_store")
      .select("*")
      .order("cost", { ascending: true });

    if (data) setItems(data);
  };

  const loadUserCoins = async () => {
    const { data } = await supabase
      .from("user_wallet")
      .select("coins")
      .eq("user_id", user?.id)
      .maybeSingle();

    setCoins(data?.coins || 0);
  };

  const loadUserRewards = async () => {
    const { data } = await supabase
      .from("user_rewards")
      .select("reward_id")
      .eq("user_id", user?.id);

    if (data) setUserRewards(data);
  };

  const handleRedeem = async (item: StoreItem) => {
    if (coins < item.cost) {
      toast.error("Moedas insuficientes!");
      return;
    }

    // Check if already owned
    if (userRewards.some(r => r.reward_id === item.id)) {
      toast.error("Você já possui este item!");
      return;
    }

    try {
      // Deduct coins
      const { error: walletError } = await supabase
        .from("user_wallet")
        .update({ coins: coins - item.cost })
        .eq("user_id", user?.id);

      if (walletError) throw walletError;

      // Add reward
      const { error: rewardError } = await supabase
        .from("user_rewards")
        .insert({
          user_id: user?.id,
          reward_id: item.id,
          active: true,
        });

      if (rewardError) throw rewardError;

      setCoins(coins - item.cost);
      setSelectedItem(item);
      setShowSuccess(true);
      loadUserRewards();
      
      toast.success("Recompensa desbloqueada!");
    } catch (error) {
      console.error("Error redeeming reward:", error);
      toast.error("Erro ao resgatar recompensa");
    }
  };

  const isOwned = (itemId: string) => {
    return userRewards.some(r => r.reward_id === itemId);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      theme: "bg-purple-500/10 text-purple-600 border-purple-500/20",
      timer_skin: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      sound: "bg-green-500/10 text-green-600 border-green-500/20",
      badge: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      avatar: "bg-pink-500/10 text-pink-600 border-pink-500/20",
      boost: "bg-red-500/10 text-red-600 border-red-500/20",
    };
    return colors[category] || "bg-gray-500/10 text-gray-600 border-gray-500/20";
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShoppingBag className="w-8 h-8" />
            Loja de Recompensas
          </h1>
          <p className="text-muted-foreground mt-1">
            Troque suas moedas por itens exclusivos
          </p>
        </div>
      </div>

      {/* Saldo Card */}
      <Card className="mb-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Seu Saldo
              </p>
              <div className="flex items-center gap-2">
                <Coins className="w-8 h-8 text-primary" />
                <span className="text-4xl font-bold">{coins}</span>
                <span className="text-muted-foreground">moedas</span>
              </div>
            </div>
            <Sparkles className="w-16 h-16 text-primary/20" />
          </div>
        </CardContent>
      </Card>

      {/* Store Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => {
          const owned = isOwned(item.id);
          const canAfford = coins >= item.cost;

          return (
            <Card 
              key={item.id} 
              className={`relative overflow-hidden transition-all ${
                owned ? 'opacity-60 border-green-500/50' : ''
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="text-4xl">{item.icon}</div>
                  {owned && (
                    <Badge variant="secondary" className="bg-green-500/20 text-green-600 border-green-500/30">
                      Adquirido
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg mt-2">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <Badge className={getCategoryColor(item.category)}>
                    {item.category}
                  </Badge>
                  <div className="flex items-center gap-1 font-bold text-primary">
                    <Coins className="w-4 h-4" />
                    {item.cost}
                  </div>
                </div>

                <Button 
                  onClick={() => handleRedeem(item)}
                  disabled={!canAfford || owned}
                  className="w-full"
                  variant={owned ? "secondary" : "default"}
                >
                  {owned ? (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Já possui
                    </>
                  ) : !canAfford ? (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Moedas insuficientes
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Resgatar
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              🎉 Recompensa Desbloqueada!
            </DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="text-center space-y-4 py-4">
              <div className="text-6xl">{selectedItem.icon}</div>
              <h3 className="text-xl font-bold">{selectedItem.title}</h3>
              <p className="text-muted-foreground">{selectedItem.description}</p>
              <div className="pt-4">
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  -{selectedItem.cost} moedas
                </Badge>
              </div>
              <Button onClick={() => setShowSuccess(false)} className="w-full">
                Continuar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
