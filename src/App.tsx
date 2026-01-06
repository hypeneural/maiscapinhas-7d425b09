import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { MainLayout } from "@/layouts/MainLayout";
import Dashboard from "@/pages/Dashboard";
import LancarTurno from "@/pages/conferencia/LancarTurno";
import Divergencias from "@/pages/conferencia/Divergencias";
import ExtratoVendas from "@/pages/faturamento/ExtratoVendas";
import MeusBonus from "@/pages/faturamento/MeusBonus";
import MinhasComissoes from "@/pages/faturamento/MinhasComissoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Dashboard />} />
              {/* Faturamento - Vendedor */}
              <Route path="/faturamento" element={<Navigate to="/faturamento/extrato" replace />} />
              <Route path="/faturamento/extrato" element={<ExtratoVendas />} />
              <Route path="/faturamento/bonus" element={<MeusBonus />} />
              <Route path="/faturamento/comissoes" element={<MinhasComissoes />} />
              {/* Conferência */}
              <Route path="/conferencia" element={<Navigate to="/conferencia/lancar" replace />} />
              <Route path="/conferencia/lancar" element={<LancarTurno />} />
              <Route path="/conferencia/divergencias" element={<Divergencias />} />
              <Route path="/conferencia/historico" element={<LancarTurno />} />
              {/* Gestão */}
              <Route path="/gestao" element={<Navigate to="/gestao/ranking" replace />} />
              <Route path="/gestao/ranking" element={<Dashboard />} />
              <Route path="/gestao/lojas" element={<Dashboard />} />
              <Route path="/gestao/quebra" element={<Dashboard />} />
              {/* Config */}
              <Route path="/config" element={<Navigate to="/config/metas" replace />} />
              <Route path="/config/metas" element={<Dashboard />} />
              <Route path="/config/bonus" element={<Dashboard />} />
              <Route path="/config/usuarios" element={<Dashboard />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
