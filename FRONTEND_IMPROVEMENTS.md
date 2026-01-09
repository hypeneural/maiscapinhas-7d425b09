# 📋 Mais Capinhas ERP - Sugestões de Melhorias no Frontend

> Documento técnico para vibe coding com análise completa da stack atual e roadmap de melhorias.

---

## 📊 Análise da Stack Atual

### ✅ Pontos Fortes Identificados

| Área | Status | Detalhes |
|------|--------|----------|
| **PWA** | ⭐⭐⭐⭐ | Configuração robusta com VitePWA, manifest completo, ícones, shortcuts e cache strategies |
| **Design System** | ⭐⭐⭐⭐ | Tokens semânticos bem definidos, suporte light/dark mode, gradientes customizados |
| **Autenticação** | ⭐⭐⭐⭐ | Token management, session timeout, rate limiter client-side |
| **Tipagem** | ⭐⭐⭐⭐ | Types bem definidos para API, roles, permissions |
| **Code Splitting** | ⭐⭐⭐⭐ | Lazy loading implementado, chunks separados |
| **RBAC** | ⭐⭐⭐⭐⭐ | Sistema robusto com hierarquia, permissions granulares |

### ⚠️ Áreas que Precisam de Atenção

| Área | Status | Prioridade |
|------|--------|------------|
| **Responsividade Mobile** | ⭐⭐ | 🔴 Alta |
| **Segurança Frontend** | ⭐⭐⭐ | 🔴 Alta |
| **Performance Bundle** | ⭐⭐⭐ | 🟡 Média |
| **Acessibilidade (a11y)** | ⭐⭐ | 🟡 Média |
| **Testes** | ⭐ | 🟡 Média |
| **Animações/UX** | ⭐⭐⭐ | 🟢 Baixa |

---

## 🔴 PRIORIDADE ALTA

### 1. Responsividade Mobile

#### Problemas Atuais
```tsx
// ❌ MainLayout.tsx - Sidebar não é responsiva em mobile
<main className={cn(
  'transition-all duration-300 min-h-screen',
  sidebarCollapsed ? 'ml-16' : 'ml-64'  // Margem fixa não funciona em mobile
)}>
```

#### Solução Recomendada
```tsx
// ✅ MainLayout.tsx - Implementar drawer mobile
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export const MainLayout: React.FC = () => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <MobileSidebar onClose={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    );
  }
  // Desktop layout...
};
```

#### Checklist de Implementação
- [ ] Criar `MobileSidebar.tsx` com comportamento de drawer
- [ ] Adicionar breakpoints responsivos em todas as páginas
- [ ] Implementar bottom navigation para ações rápidas
- [ ] Ajustar tabelas para scroll horizontal ou cards em mobile
- [ ] Testar touch targets (mínimo 44x44px)
- [ ] Implementar swipe gestures para navegação

---

### 2. Segurança Frontend

#### 2.1 Validação de Inputs

##### Problema
```tsx
// ❌ Alguns componentes podem não validar inputs adequadamente
<Input value={amount} onChange={(e) => setAmount(e.target.value)} />
```

##### Solução
```tsx
// ✅ Sempre usar Zod + React Hook Form
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  amount: z.number()
    .min(0.01, 'Valor mínimo é R$ 0,01')
    .max(999999.99, 'Valor máximo excedido'),
  email: z.string()
    .email('Email inválido')
    .max(255)
    .transform(v => v.toLowerCase().trim()),
});
```

#### 2.2 XSS Prevention

##### Checklist
- [ ] **NUNCA** usar `dangerouslySetInnerHTML` sem sanitização
- [ ] Instalar e usar `dompurify` se precisar renderizar HTML
- [ ] Validar URLs antes de usar em `href` ou `src`
- [ ] Escapar dados dinâmicos em atributos HTML

```tsx
// ✅ Se precisar renderizar HTML externo
import DOMPurify from 'dompurify';

const SafeHTML = ({ html }: { html: string }) => (
  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
);
```

#### 2.3 Token Storage

##### Situação Atual
O token está sendo armazenado em `sessionStorage` - isso é bom, mas pode ser melhorado:

```tsx
// ✅ Melhorias recomendadas no token.ts
// 1. Adicionar verificação de expiração
export function isTokenExpired(): boolean {
  const token = getToken();
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

// 2. Refresh token automático antes de expirar
export function scheduleTokenRefresh(token: string, refreshFn: () => Promise<string>) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  const expiresIn = payload.exp * 1000 - Date.now();
  const refreshTime = expiresIn - 60000; // 1 minuto antes
  
  setTimeout(async () => {
    const newToken = await refreshFn();
    setToken(newToken);
  }, refreshTime);
}
```

#### 2.4 Rate Limiting Melhorado

##### Problema Atual
Rate limiter só funciona por email, não protege contra ataques distribuídos.

##### Solução
```tsx
// ✅ Adicionar fingerprinting básico
import { getRateLimitRemainingTime, checkLoginRateLimit } from '@/lib/utils/rateLimiter';

// Criar fingerprint simples (não é perfeito, mas ajuda)
function getClientFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
  ];
  return btoa(components.join('|')).slice(0, 32);
}

// Usar combinação de email + fingerprint
const key = `${email}:${getClientFingerprint()}`;
```

#### 2.5 Content Security Policy

Adicionar headers CSP no servidor ou via meta tags:

```html
<!-- ✅ Adicionar em index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  connect-src 'self' https://api.maiscapinhas.com.br;
">
```

#### 2.6 Checklist de Segurança Completo

- [ ] Implementar CSRF tokens para mutações
- [ ] Adicionar rate limiting global por IP (backend)
- [ ] Validar todos os inputs com Zod
- [ ] Sanitizar dados antes de exibir
- [ ] Implementar logout em todas as abas (BroadcastChannel API)
- [ ] Adicionar Content-Security-Policy
- [ ] Auditar dependências com `npm audit`
- [ ] Remover console.logs em produção
- [ ] Mascarar dados sensíveis em logs

---

## 🟡 PRIORIDADE MÉDIA

### 3. Performance

#### 3.1 Bundle Size Optimization

##### Análise Atual
```js
// vite.config.ts - Chunks já configurados ✅
manualChunks: {
  'vendor-react': ['react', 'react-dom', 'react-router-dom'],
  'vendor-ui': ['@radix-ui/react-dialog', ...],
  'vendor-query': ['@tanstack/react-query'],
}
```

##### Melhorias Sugeridas
```js
// ✅ Adicionar mais granularidade
manualChunks: {
  'vendor-react': ['react', 'react-dom', 'react-router-dom'],
  'vendor-ui-dialog': ['@radix-ui/react-dialog', '@radix-ui/react-alert-dialog'],
  'vendor-ui-menu': ['@radix-ui/react-dropdown-menu', '@radix-ui/react-menubar'],
  'vendor-ui-form': ['@radix-ui/react-checkbox', '@radix-ui/react-radio-group', '@radix-ui/react-select'],
  'vendor-charts': ['recharts'],
  'vendor-query': ['@tanstack/react-query'],
  'vendor-date': ['date-fns'],
}
```

#### 3.2 Image Optimization

```tsx
// ✅ Criar componente de imagem otimizado
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  priority = false,
}) => (
  <img
    src={src}
    alt={alt}
    width={width}
    height={height}
    loading={priority ? 'eager' : 'lazy'}
    decoding="async"
    className="object-cover"
  />
);
```

#### 3.3 React Query Optimization

```tsx
// ✅ Configurar stale time e cache por tipo de dados
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min para dados gerais
      gcTime: 1000 * 60 * 30, // 30 min no cache
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Dados que mudam raramente (lojas, usuários)
const useStores = () => useQuery({
  queryKey: ['stores'],
  queryFn: fetchStores,
  staleTime: 1000 * 60 * 30, // 30 min
});

// Dados em tempo real (vendas do dia)
const useTodaySales = () => useQuery({
  queryKey: ['sales', 'today'],
  queryFn: fetchTodaySales,
  staleTime: 1000 * 30, // 30 seg
  refetchInterval: 1000 * 60, // Refetch a cada 1 min
});
```

#### 3.4 Virtualization para Listas Longas

```bash
npm install @tanstack/react-virtual
```

```tsx
// ✅ Para tabelas com muitos registros
import { useVirtualizer } from '@tanstack/react-virtual';

const VirtualizedTable = ({ data }: { data: Sale[] }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((item) => (
          <TableRow key={item.key} data={data[item.index]} />
        ))}
      </div>
    </div>
  );
};
```

---

### 4. Acessibilidade (a11y)

#### 4.1 Problemas Comuns

```tsx
// ❌ Botão sem texto acessível
<Button onClick={close}><X /></Button>

// ✅ Com aria-label
<Button onClick={close} aria-label="Fechar modal"><X /></Button>
```

#### 4.2 Checklist a11y

- [ ] Todos os botões de ícone têm `aria-label`
- [ ] Formulários têm labels associados
- [ ] Cores têm contraste mínimo 4.5:1 (AA)
- [ ] Focus visible em todos elementos interativos
- [ ] Skip links para navegação principal
- [ ] Roles ARIA em componentes customizados
- [ ] Anúncios de loading states com `aria-live`
- [ ] Keyboard navigation funcional (Tab, Enter, Escape)

#### 4.3 Implementar Skip Link

```tsx
// ✅ Adicionar em MainLayout.tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded"
>
  Pular para o conteúdo principal
</a>

<main id="main-content" tabIndex={-1}>
  {/* content */}
</main>
```

#### 4.4 Loading States Acessíveis

```tsx
// ✅ Anunciar mudanças de estado
<div aria-live="polite" aria-busy={isLoading}>
  {isLoading ? (
    <span className="sr-only">Carregando dados...</span>
  ) : (
    <Table data={data} />
  )}
</div>
```

---

### 5. Testes

#### 5.1 Setup Recomendado

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
});
```

#### 5.2 Testes Prioritários

```tsx
// ✅ Testar hooks críticos
// src/hooks/__tests__/usePermissions.test.ts
describe('usePermissions', () => {
  it('should return correct permissions for admin role', () => {
    // ...
  });
  
  it('should deny access for insufficient role', () => {
    // ...
  });
});

// ✅ Testar componentes de autenticação
// src/components/__tests__/ProtectedRoute.test.tsx
describe('ProtectedRoute', () => {
  it('should redirect to login when not authenticated', () => {
    // ...
  });
  
  it('should show content when authenticated', () => {
    // ...
  });
});
```

---

## 🟢 PRIORIDADE BAIXA

### 6. Animações e UX

#### 6.1 Framer Motion Integration

```bash
npm install framer-motion
```

```tsx
// ✅ Page transitions
import { motion, AnimatePresence } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const AnimatedPage: React.FC<PropsWithChildren> = ({ children }) => (
  <motion.div
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);
```

#### 6.2 Skeleton Loading

```tsx
// ✅ Criar skeletons específicos por página
const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-32 rounded-xl" />
      ))}
    </div>
    <Skeleton className="h-64 rounded-xl" />
  </div>
);
```

#### 6.3 Micro-interactions

```tsx
// ✅ Feedback visual em ações
const ActionButton = ({ onClick, children }) => (
  <motion.button
    onClick={onClick}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="btn-primary"
  >
    {children}
  </motion.button>
);
```

---

### 7. PWA Enhancements

#### 7.1 Melhorias Sugeridas

```tsx
// ✅ Background Sync para offline
if ('serviceWorker' in navigator && 'SyncManager' in window) {
  navigator.serviceWorker.ready.then((reg) => {
    return reg.sync.register('sync-sales');
  });
}

// ✅ Push Notifications (requer backend)
async function subscribeToPush() {
  const reg = await navigator.serviceWorker.ready;
  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: VAPID_PUBLIC_KEY,
  });
  // Enviar subscription para o backend
}
```

#### 7.2 Offline-first Data

```tsx
// ✅ Implementar queue de ações offline
class OfflineQueue {
  private queue: Array<{ action: string; data: unknown }> = [];
  
  add(action: string, data: unknown) {
    this.queue.push({ action, data });
    localStorage.setItem('offline-queue', JSON.stringify(this.queue));
  }
  
  async flush() {
    const items = [...this.queue];
    for (const item of items) {
      await processAction(item);
      this.queue.shift();
    }
    localStorage.removeItem('offline-queue');
  }
}
```

---

### 8. Internacionalização (i18n)

#### Preparação para Futuro

```bash
npm install i18next react-i18next
```

```tsx
// ✅ Estrutura básica
// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ptBR from './locales/pt-BR.json';

i18n.use(initReactI18next).init({
  resources: { 'pt-BR': { translation: ptBR } },
  lng: 'pt-BR',
  fallbackLng: 'pt-BR',
});

// Uso em componentes
const { t } = useTranslation();
<h1>{t('dashboard.title')}</h1>
```

---

## 📁 Estrutura de Arquivos Sugerida

```
src/
├── components/
│   ├── ui/              # shadcn/ui (não modificar)
│   ├── common/          # Componentes reutilizáveis
│   │   ├── OptimizedImage.tsx
│   │   ├── SafeHTML.tsx
│   │   └── SkipLink.tsx
│   ├── layout/          # Layout components
│   │   ├── MobileNav.tsx
│   │   └── BottomNav.tsx
│   ├── skeletons/       # Loading skeletons
│   │   ├── DashboardSkeleton.tsx
│   │   └── TableSkeleton.tsx
│   └── ...
├── hooks/
│   ├── __tests__/       # Testes de hooks
│   └── ...
├── lib/
│   ├── security/        # Funções de segurança
│   │   ├── sanitize.ts
│   │   ├── validate.ts
│   │   └── csrf.ts
│   └── ...
├── test/
│   ├── setup.ts
│   └── utils.tsx
└── ...
```

---

## 🚀 Roadmap de Implementação

### Sprint 1 - Segurança & Mobile (1-2 semanas)
1. [ ] Implementar layout responsivo mobile
2. [ ] Adicionar validação Zod em todos os forms
3. [ ] Implementar CSP headers
4. [ ] Auditar e corrigir vulnerabilidades

### Sprint 2 - Performance (1 semana)
1. [ ] Otimizar bundle splitting
2. [ ] Implementar React Query otimizations
3. [ ] Adicionar virtualization em tabelas grandes
4. [ ] Lazy load de imagens

### Sprint 3 - Acessibilidade (1 semana)
1. [ ] Adicionar aria-labels em todos ícones
2. [ ] Implementar skip links
3. [ ] Verificar contraste de cores
4. [ ] Testar navegação por teclado

### Sprint 4 - Testes & UX (1-2 semanas)
1. [ ] Configurar Vitest
2. [ ] Escrever testes para hooks críticos
3. [ ] Adicionar Framer Motion
4. [ ] Implementar skeletons e micro-interactions

---

## 📚 Recursos Úteis

- [Web Vitals](https://web.dev/vitals/) - Métricas de performance
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/) - Acessibilidade
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) - Segurança
- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query) - Performance
- [PWA Checklist](https://web.dev/pwa-checklist/) - PWA

---

## 🔧 Comandos Úteis

```bash
# Analisar bundle
npm run build -- --report

# Auditar segurança
npm audit

# Verificar tipos
npx tsc --noEmit

# Lint
npm run lint

# Testes (após configurar)
npm run test
npm run test:coverage
```

---

**Última atualização:** Janeiro 2026  
**Autor:** Lovable AI  
**Versão do documento:** 1.0.0
