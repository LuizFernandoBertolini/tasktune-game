import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Award } from "lucide-react";

export default function XPCard() {
  const { user } = useAuth();
  const [xpTotal, setXpTotal] = useState(0);
  const [level, setLevel] = useState(1);

  useEffect(() => {
    if (user) {
      loadXPData();
    }

    // Listen para atualização de XP
    const handleXPUpdate = () => {
      loadXPData();
    };
    
    window.addEventListener('xp-updated', handleXPUpdate);
    return () => window.removeEventListener('xp-updated', handleXPUpdate);
  }, [user]);

  const loadXPData = async () => {
    const { data } = await supabase
      .from("user_profiles")
      .select("xp_total, level")
      .eq("user_id", user?.id)
      .single();

    if (data) {
      setXpTotal(data.xp_total);
      setLevel(data.level);
    }
  };

  const xpForNextLevel = 100 * level;
  const progressPercentage = (xpTotal / xpForNextLevel) * 100;

  return (
    <Card className="p-5 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Nível</p>
            <p className="text-3xl font-bold text-foreground">{level}</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium text-foreground">{xpTotal} XP</span>
          <span className="text-muted-foreground">{xpForNextLevel} XP</span>
        </div>
        <Progress 
          value={progressPercentage} 
          className="h-3"
        />
      </div>
    </Card>
  );
}
