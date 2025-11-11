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
    <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5">
      <div className="flex items-center gap-2 mb-3">
        <Award className="w-5 h-5 text-primary" />
        <div>
          <p className="text-sm text-muted-foreground">Nível</p>
          <p className="text-2xl font-bold text-foreground">{level}</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{xpTotal} XP</span>
          <span>{xpForNextLevel} XP</span>
        </div>
        <Progress 
          value={progressPercentage} 
          className="h-2 transition-all duration-500 ease-out"
        />
      </div>
    </Card>
  );
}
