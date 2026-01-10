import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryProvider } from "@/providers/QueryProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { GuestRoute } from "@/components/auth/GuestRoute";
import { MainLayout } from "@/layouts/MainLayout";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { Loader2 } from "lucide-react";

// Lazy loaded pages for better code splitting
const Login = lazy(() => import("@/pages/Login"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const LancarTurno = lazy(() => import("@/pages/conferencia/LancarTurno"));
const Divergencias = lazy(() => import("@/pages/conferencia/Divergencias"));
const HistoricoEnvelopes = lazy(() => import("@/pages/conferencia/HistoricoEnvelopes"));
const ExtratoVendas = lazy(() => import("@/pages/faturamento/ExtratoVendas"));
const MeusBonus = lazy(() => import("@/pages/faturamento/MeusBonus"));
const MinhasComissoes = lazy(() => import("@/pages/faturamento/MinhasComissoes"));
const RankingVendas = lazy(() => import("@/pages/gestao/RankingVendas"));
const DesempenhoLojas = lazy(() => import("@/pages/gestao/DesempenhoLojas"));
const QuebraCaixa = lazy(() => import("@/pages/gestao/QuebraCaixa"));
const MetasMensais = lazy(() => import("@/pages/config/MetasMensais"));
const TabelaBonus = lazy(() => import("@/pages/config/TabelaBonus"));
const RegrasComissao = lazy(() => import("@/pages/config/RegrasComissao"));
const CommissionRuleForm = lazy(() => import("@/pages/config/CommissionRuleForm"));
const BonusRuleForm = lazy(() => import("@/pages/config/BonusRuleForm"));
const GoalForm = lazy(() => import("@/pages/config/GoalForm"));
const GoalSplitsForm = lazy(() => import("@/pages/config/GoalSplitsForm"));
const UsuariosLojas = lazy(() => import("@/pages/config/UsuariosLojas"));
const UserForm = lazy(() => import("@/pages/config/UserForm"));
const StoreForm = lazy(() => import("@/pages/config/StoreForm"));
const Auditoria = lazy(() => import("@/pages/config/Auditoria"));
const Unauthorized = lazy(() => import("@/pages/Unauthorized"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes - only for non-authenticated users */}
              <Route path="/login" element={
                <GuestRoute>
                  <Login />
                </GuestRoute>
              } />
              <Route path="/forgot-password" element={
                <GuestRoute>
                  <ForgotPassword />
                </GuestRoute>
              } />

              {/* Protected routes */}
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

                {/* Config - Gerente and Admin */}
                <Route path="/config" element={<Navigate to="/config/metas" replace />} />
                <Route path="/config/metas" element={
                  <ProtectedRoute requiredRoles={['gerente', 'admin']}>
                    <MetasMensais />
                  </ProtectedRoute>
                } />
                <Route path="/config/metas/:id" element={
                  <ProtectedRoute requiredRoles={['gerente', 'admin']}>
                    <GoalForm />
                  </ProtectedRoute>
                } />
                <Route path="/config/metas/:id/splits" element={
                  <ProtectedRoute requiredRoles={['gerente', 'admin']}>
                    <GoalSplitsForm />
                  </ProtectedRoute>
                } />
                <Route path="/config/bonus" element={
                  <ProtectedRoute requiredRoles={['gerente', 'admin']}>
                    <TabelaBonus />
                  </ProtectedRoute>
                } />
                <Route path="/config/bonus/:id" element={
                  <ProtectedRoute requiredRoles={['gerente', 'admin']}>
                    <BonusRuleForm />
                  </ProtectedRoute>
                } />
                <Route path="/config/comissoes" element={
                  <ProtectedRoute requiredRoles={['gerente', 'admin']}>
                    <RegrasComissao />
                  </ProtectedRoute>
                } />
                <Route path="/config/comissoes/:id" element={
                  <ProtectedRoute requiredRoles={['gerente', 'admin']}>
                    <CommissionRuleForm />
                  </ProtectedRoute>
                } />
                <Route path="/config/usuarios" element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <UsuariosLojas />
                  </ProtectedRoute>
                } />
                <Route path="/config/usuarios/:id" element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <UserForm />
                  </ProtectedRoute>
                } />
                <Route path="/config/lojas" element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <UsuariosLojas />
                  </ProtectedRoute>
                } />
                <Route path="/config/lojas/:id" element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <StoreForm />
                  </ProtectedRoute>
                } />
                <Route path="/config/auditoria" element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <Auditoria />
                  </ProtectedRoute>
                } />
              </Route>

              {/* Unauthorized */}
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>

          {/* PWA Install Prompt */}
          <PWAInstallPrompt />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryProvider>
);

export default App;
