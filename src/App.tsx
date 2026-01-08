import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryProvider } from "@/providers/QueryProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MainLayout } from "@/layouts/MainLayout";

// Pages
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
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

const App = () => (
  <QueryProvider>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />            {/* Protected routes */}
            <Route element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route path="/" element={<Dashboard />} />

              {/* Faturamento - Vendedor */}
              <Route path="/faturamento" element={<Navigate to="/faturamento/extrato" replace />} />
              <Route path="/faturamento/extrato" element={<ExtratoVendas />} />
              <Route path="/faturamento/bonus" element={<MeusBonus />} />
              <Route path="/faturamento/comissoes" element={<MinhasComissoes />} />

              {/* Conferência */}
              <Route path="/conferencia" element={<Navigate to="/conferencia/lancar" replace />} />
              <Route path="/conferencia/lancar" element={
                <ProtectedRoute requiredRoles={['conferente', 'gerente', 'admin']}>
                  <LancarTurno />
                </ProtectedRoute>
              } />
              <Route path="/conferencia/divergencias" element={
                <ProtectedRoute requiredRoles={['conferente', 'gerente', 'admin']}>
                  <Divergencias />
                </ProtectedRoute>
              } />
              <Route path="/conferencia/historico" element={
                <ProtectedRoute requiredRoles={['conferente', 'gerente', 'admin']}>
                  <HistoricoEnvelopes />
                </ProtectedRoute>
              } />

              {/* Gestão */}
              <Route path="/gestao" element={<Navigate to="/gestao/ranking" replace />} />
              <Route path="/gestao/ranking" element={
                <ProtectedRoute requiredRoles={['gerente', 'admin']}>
                  <RankingVendas />
                </ProtectedRoute>
              } />
              <Route path="/gestao/lojas" element={
                <ProtectedRoute requiredRoles={['gerente', 'admin']}>
                  <DesempenhoLojas />
                </ProtectedRoute>
              } />
              <Route path="/gestao/quebra" element={
                <ProtectedRoute requiredRoles={['gerente', 'admin']}>
                  <QuebraCaixa />
                </ProtectedRoute>
              } />

              {/* Config - Admin only */}
              <Route path="/config" element={<Navigate to="/config/metas" replace />} />
              <Route path="/config/metas" element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <MetasMensais />
                </ProtectedRoute>
              } />
              <Route path="/config/bonus" element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <TabelaBonus />
                </ProtectedRoute>
              } />
              <Route path="/config/comissoes" element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <RegrasComissao />
                </ProtectedRoute>
              } />
              <Route path="/config/usuarios" element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <UsuariosLojas />
                </ProtectedRoute>
              } />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryProvider>
);

export default App;
