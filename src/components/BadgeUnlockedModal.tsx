import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Trophy, Sparkles } from "lucide-react";
import { playSound } from "@/lib/sounds";
import { useAuth } from "@/contexts/AuthContext";

interface BadgeData {
  id: string;
  name: string;
  description: string;
  xp_reward: number;
}

interface BadgeUnlockedModalProps {
  badges: BadgeData[];
  onClose: () => void;
}

export default function BadgeUnlockedModal({ badges, onClose }: BadgeUnlockedModalProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (badges.length > 0) {
      setOpen(true);
      playSound("xp_gain", user?.id);
    }
  }, [badges, user]);

  const handleClose = () => {
    setOpen(false);
    setTimeout(onClose, 300);
  };

  if (badges.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Trophy className="w-6 h-6 text-primary animate-pulse" />
            Conquista{badges.length > 1 ? 's' : ''} Desbloqueada{badges.length > 1 ? 's' : ''}!
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {badges.map((badge) => (
            <div 
              key={badge.id}
              className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 animate-fade-in"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">{badge.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {badge.description}
                  </p>
                  <Badge variant="secondary" className="bg-accent text-accent-foreground">
                    +{badge.xp_reward} XP
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
