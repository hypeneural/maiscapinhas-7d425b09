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
const KpisColaboradores = lazy(() => import("@/pages/gestao/KpisColaboradores"));
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

// Clientes
const Clientes = lazy(() => import("@/pages/clientes/Clientes"));
const CustomerForm = lazy(() => import("@/pages/clientes/CustomerForm"));
const CustomerDetail = lazy(() => import("@/pages/clientes/CustomerDetail"));

// Pedidos
const Pedidos = lazy(() => import("@/pages/pedidos/Pedidos"));
const PedidoForm = lazy(() => import("@/pages/pedidos/PedidoForm"));
const PedidoDetail = lazy(() => import("@/pages/pedidos/PedidoDetail"));

// Capas Personalizadas
const Capas = lazy(() => import("@/pages/capas/Capas"));
const CapaForm = lazy(() => import("@/pages/capas/CapaForm"));
const CapaDetail = lazy(() => import("@/pages/capas/CapaDetail"));

// Customer Upload (Public)
const CustomerUpload = lazy(() => import("@/pages/upload/CustomerUpload"));

// Phone Catalog (Admin)
const PhoneCatalog = lazy(() => import("@/pages/config/PhoneCatalog"));

// WhatsApp Instances (Super Admin)
const WhatsAppInstances = lazy(() => import("@/pages/config/WhatsAppInstances"));
const WhatsAppInstanceForm = lazy(() => import("@/pages/config/WhatsAppInstanceForm"));

// Comunicados
const Comunicados = lazy(() => import("@/pages/comunicados/Comunicados"));
const ComunicadosAdmin = lazy(() => import("@/pages/config/comunicados/ComunicadosAdmin"));
const ComunicadoForm = lazy(() => import("@/pages/config/comunicados/ComunicadoForm"));

// Produção (Admin)
const ProducaoCarrinho = lazy(() => import("@/pages/producao/ProducaoCarrinho"));
const ProducaoPedidos = lazy(() => import("@/pages/producao/ProducaoPedidos"));
const ProducaoPedidoDetail = lazy(() => import("@/pages/producao/ProducaoPedidoDetail"));

// Fábrica
const FabricaPedidos = lazy(() => import("@/pages/fabrica/FabricaPedidos"));
const FabricaPedidoDetail = lazy(() => import("@/pages/fabrica/FabricaPedidoDetail"));

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

              {/* Public upload route - no auth required */}
              <Route path="/upload/:capaId" element={<CustomerUpload />} />
              <Route path="/upload/:capaId/:token" element={<CustomerUpload />} />

              {/* Protected routes */}
              <Route element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }>
                <Route path="/" element={<Dashboard />} />

                {/* Clientes - All authenticated users */}
                <Route path="/clientes" element={<Clientes />} />
                <Route path="/clientes/novo" element={<CustomerForm />} />
                <Route path="/clientes/:id" element={<CustomerDetail />} />
                <Route path="/clientes/:id/editar" element={<CustomerForm />} />

                {/* Pedidos - All authenticated users */}
                <Route path="/pedidos" element={<Pedidos />} />
                <Route path="/pedidos/novo" element={<PedidoForm />} />
                <Route path="/pedidos/:id" element={<PedidoDetail />} />
                <Route path="/pedidos/:id/editar" element={<PedidoForm />} />

                {/* Capas Personalizadas - All authenticated users */}
                <Route path="/capas" element={<Capas />} />
                <Route path="/capas/novo" element={<CapaForm />} />
                <Route path="/capas/:id" element={<CapaDetail />} />
                <Route path="/capas/:id/editar" element={<CapaForm />} />

                {/* Capas - Carrinho e Pedidos de Produção (Admin) */}
                <Route path="/capas/carrinho" element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <ProducaoCarrinho />
                  </ProtectedRoute>
                } />
                <Route path="/capas/pedidos" element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <ProducaoPedidos />
                  </ProtectedRoute>
                } />
                <Route path="/capas/pedidos/:id" element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <ProducaoPedidoDetail />
                  </ProtectedRoute>
                } />

                {/* Comunicados - All authenticated users */}
                <Route path="/comunicados" element={<Comunicados />} />

                {/* Fábrica - Factory role + Admin/Super Admin */}
                <Route path="/fabrica" element={<Navigate to="/fabrica/pedidos" replace />} />
                <Route path="/fabrica/pedidos" element={
                  <ProtectedRoute requiredRoles={['fabrica', 'admin']}>
                    <FabricaPedidos />
                  </ProtectedRoute>
                } />
                <Route path="/fabrica/pedidos/:id" element={
                  <ProtectedRoute requiredRoles={['fabrica', 'admin']}>
                    <FabricaPedidoDetail />
                  </ProtectedRoute>
                } />

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
                <Route path="/gestao/kpis-colaboradores" element={
                  <ProtectedRoute requiredRoles={['gerente', 'admin']}>
                    <KpisColaboradores />
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
                <Route path="/config/catalogo" element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <PhoneCatalog />
                  </ProtectedRoute>
                } />

                {/* WhatsApp Instances - Super Admin */}
                <Route path="/config/whatsapp" element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <WhatsAppInstances />
                  </ProtectedRoute>
                } />
                <Route path="/config/whatsapp/:id" element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <WhatsAppInstanceForm />
                  </ProtectedRoute>
                } />

                {/* Gerenciar Comunicados - Gerente and Admin */}
                <Route path="/config/comunicados" element={
                  <ProtectedRoute requiredRoles={['gerente', 'admin']}>
                    <ComunicadosAdmin />
                  </ProtectedRoute>
                } />
                <Route path="/config/comunicados/novo" element={
                  <ProtectedRoute requiredRoles={['gerente', 'admin']}>
                    <ComunicadoForm />
                  </ProtectedRoute>
                } />
                <Route path="/config/comunicados/:id" element={
                  <ProtectedRoute requiredRoles={['gerente', 'admin']}>
                    <ComunicadoForm />
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
