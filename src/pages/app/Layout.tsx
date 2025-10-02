import { Outlet } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function AppLayout() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-20">
        <Outlet />
        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}
