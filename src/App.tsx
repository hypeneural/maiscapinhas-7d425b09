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
import HistoricoEnvelopes from "@/pages/conferencia/HistoricoEnvelopes";
import ExtratoVendas from "@/pages/faturamento/ExtratoVendas";
import MeusBonus from "@/pages/faturamento/MeusBonus";
import MinhasComissoes from "@/pages/faturamento/MinhasComissoes";
import RankingVendas from "@/pages/gestao/RankingVendas";
import DesempenhoLojas from "@/pages/gestao/DesempenhoLojas";
import QuebraCaixa from "@/pages/gestao/QuebraCaixa";
import MetasMensais from "@/pages/config/MetasMensais";
import TabelaBonus from "@/pages/config/TabelaBonus";
import RegrasComissao from "@/pages/config/RegrasComissao";
import UsuariosLojas from "@/pages/config/UsuariosLojas";
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
              <Route path="/conferencia/historico" element={<HistoricoEnvelopes />} />
              {/* Gestão */}
              <Route path="/gestao" element={<Navigate to="/gestao/ranking" replace />} />
              <Route path="/gestao/ranking" element={<RankingVendas />} />
              <Route path="/gestao/lojas" element={<DesempenhoLojas />} />
              <Route path="/gestao/quebra" element={<QuebraCaixa />} />
              {/* Config */}
              <Route path="/config" element={<Navigate to="/config/metas" replace />} />
              <Route path="/config/metas" element={<MetasMensais />} />
              <Route path="/config/bonus" element={<TabelaBonus />} />
              <Route path="/config/comissoes" element={<RegrasComissao />} />
              <Route path="/config/usuarios" element={<UsuariosLojas />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
