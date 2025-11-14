import { Home, ListTodo, Timer, Award } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/app/hoje", icon: Home, label: "Home" },
  { to: "/app/hoje", icon: ListTodo, label: "Tarefas" },
  { to: "/app/foco", icon: Timer, label: "Foco" },
  { to: "/app/recompensas", icon: Award, label: "Recompensas" },
];

export const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16 px-4 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-1.5 px-4 py-2 rounded-xl transition-all min-w-0 flex-1",
                isActive
                  ? "text-primary scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )
            }
          >
            <Icon className="w-6 h-6 shrink-0" />
            <span className="text-xs font-medium truncate w-full text-center">
              {label}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
