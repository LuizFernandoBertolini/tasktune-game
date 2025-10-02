import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import AppLayout from "./pages/app/Layout";
import Hoje from "./pages/app/Hoje";
import Foco from "./pages/app/Foco";
import Recompensas from "./pages/app/Recompensas";
import Relatorios from "./pages/app/Relatorios";
import Config from "./pages/app/Config";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/app" element={<AppLayout />}>
              <Route path="hoje" element={<Hoje />} />
              <Route path="foco" element={<Foco />} />
              <Route path="foco/:taskId" element={<Foco />} />
              <Route path="recompensas" element={<Recompensas />} />
              <Route path="relatorios" element={<Relatorios />} />
              <Route path="config" element={<Config />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
