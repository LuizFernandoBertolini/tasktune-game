import { Home, Timer, Award, TrendingUp, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/app/hoje", icon: Home, label: "Hoje" },
  { to: "/app/foco", icon: Timer, label: "Foco" },
  { to: "/app/recompensas", icon: Award, label: "Recompensas" },
  { to: "/app/relatorios", icon: TrendingUp, label: "Relatórios" },
  { to: "/app/config", icon: Settings, label: "Config" },
];

export const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-0 flex-1",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="text-xs font-medium truncate w-full text-center">
              {label}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
