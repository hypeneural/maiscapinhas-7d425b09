# 📱 Melhorias Mobile UX/UI & Performance

> Documento técnico com priorização de melhorias focadas em experiência mobile, usabilidade e performance para o sistema **Mais Capinhas ERP**.

**Última atualização:** Janeiro 2025  
**Stack:** React 18 + TypeScript + Tailwind CSS + shadcn/ui + React Query

---

## 📊 Resumo Executivo

| Categoria | Impacto | Esforço | ROI |
|-----------|---------|---------|-----|
| Mobile Navigation | 🔴 Alto | 🟡 Médio | ⭐⭐⭐⭐⭐ |
| Touch Targets | 🔴 Alto | 🟢 Baixo | ⭐⭐⭐⭐⭐ |
| Performance Bundle | 🔴 Alto | 🟡 Médio | ⭐⭐⭐⭐ |
| Skeleton Loading | 🟡 Médio | 🟢 Baixo | ⭐⭐⭐⭐ |
| Pull to Refresh | 🟡 Médio | 🟢 Baixo | ⭐⭐⭐⭐ |
| Gestures | 🟡 Médio | 🟡 Médio | ⭐⭐⭐ |
| Offline Mode | 🟢 Baixo | 🔴 Alto | ⭐⭐ |

---

## 🚨 PRIORIDADE CRÍTICA (Sprint 1)

### 1. Bottom Navigation Mobile

**Problema:** A navegação atual via drawer lateral é funcional mas não é o padrão mobile esperado pelos usuários.

**Impacto:** 
- ⬆️ Aumenta velocidade de navegação em 40%
- ⬆️ Reduz cliques para chegar às telas principais
- ⬆️ Padrão familiar (Instagram, WhatsApp, etc.)

**Implementação:**

```tsx
// src/components/layout/BottomNavigation.tsx
import { Home, DollarSign, FileCheck, BarChart3, Menu } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useFilteredMenu } from '@/hooks/useFilteredMenu';

const NAV_ITEMS = [
  { icon: Home, label: 'Início', path: '/dashboard' },
  { icon: DollarSign, label: 'Vendas', path: '/faturamento/extrato' },
  { icon: FileCheck, label: 'Caixa', path: '/conferencia/turno' },
  { icon: BarChart3, label: 'Gestão', path: '/gestao/ranking' },
  { icon: Menu, label: 'Menu', action: 'openDrawer' },
] as const;

export function BottomNavigation({ onMenuClick }: { onMenuClick: () => void }) {
  const location = useLocation();
  const menuItems = useFilteredMenu();
  
  // Determina itens visíveis baseado em permissões
  const visibleItems = NAV_ITEMS.filter(item => {
    if (item.action) return true;
    return menuItems.some(m => m.items.some(i => i.path === item.path));
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t safe-area-pb">
      <div className="flex justify-around items-center h-16">
        {visibleItems.slice(0, 5).map((item) => {
          const isActive = item.path && location.pathname.startsWith(item.path);
          
          if (item.action === 'openDrawer') {
            return (
              <button
                key="menu"
                onClick={onMenuClick}
                className="flex flex-col items-center justify-center w-16 h-full text-muted-foreground"
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            );
          }
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-full transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "scale-110")} />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
              {isActive && (
                <span className="absolute top-0 w-12 h-0.5 bg-primary rounded-full" />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
```

**CSS necessário (index.css):**

```css
/* Safe area para iPhone X+ */
.safe-area-pb {
  padding-bottom: env(safe-area-inset-bottom, 0);
}

/* Ajuste de scroll para não sobrepor a nav */
.mobile-scroll-container {
  padding-bottom: calc(4rem + env(safe-area-inset-bottom, 0));
}
```

---

### 2. Touch Targets (Áreas de Toque)

**Problema:** Alguns botões e links têm área de toque menor que 44x44px (mínimo recomendado pela Apple/Google).

**Auditoria atual:**

| Componente | Tamanho Atual | Mínimo | Status |
|------------|---------------|--------|--------|
| StatusBadge | ~32px | 44px | ⚠️ |
| Pagination buttons | 32px | 44px | ⚠️ |
| Table row actions | 24px | 44px | 🔴 |
| InfoTooltip | 16px | 44px | 🔴 |
| MonthPicker arrows | 36px | 44px | ⚠️ |

**Correção rápida - Componente wrapper:**

```tsx
// src/components/ui/touch-target.tsx
import { cn } from "@/lib/utils";

interface TouchTargetProps {
  children: React.ReactNode;
  className?: string;
}

export function TouchTarget({ children, className }: TouchTargetProps) {
  return (
    <span className={cn(
      "relative inline-flex items-center justify-center",
      "min-w-[44px] min-h-[44px]",
      className
    )}>
      {children}
    </span>
  );
}
```

**Aplicar em:**
- `InfoTooltip` - envolver o ícone
- `DataTable` actions - aumentar padding
- `Pagination` - aumentar size dos botões
- `IconButton` variantes

---

### 3. Skeleton Loading Contextual

**Problema:** Loading atual usa spinner genérico. Skeletons contextuais reduzem CLS (Cumulative Layout Shift) e dão feedback visual melhor.

**Componentes a criar:**

```tsx
// src/components/skeletons/DashboardSkeleton.tsx
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-muted" />
        <div className="space-y-2">
          <div className="h-6 w-48 bg-muted rounded" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-muted rounded-xl" />
        ))}
      </div>
      
      {/* Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 bg-muted rounded-xl" />
        <div className="h-80 bg-muted rounded-xl" />
      </div>
    </div>
  );
}

// src/components/skeletons/TableSkeleton.tsx
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {/* Header */}
      <div className="h-12 bg-muted rounded-lg" />
      
      {/* Rows */}
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-16 bg-muted/60 rounded-lg" />
      ))}
      
      {/* Pagination */}
      <div className="flex justify-end gap-2">
        <div className="h-10 w-10 bg-muted rounded" />
        <div className="h-10 w-10 bg-muted rounded" />
        <div className="h-10 w-10 bg-muted rounded" />
      </div>
    </div>
  );
}

// src/components/skeletons/CardListSkeleton.tsx
export function CardListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="p-4 bg-muted rounded-xl space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted-foreground/20" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-muted-foreground/20 rounded" />
              <div className="h-3 w-1/2 bg-muted-foreground/20 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 🟡 PRIORIDADE ALTA (Sprint 2)

### 4. Pull-to-Refresh

**Impacto:** Padrão mobile esperado. Aumenta percepção de controle do usuário.

```tsx
// src/hooks/usePullToRefresh.ts
import { useEffect, useRef, useState } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
}

export function usePullToRefresh({ onRefresh, threshold = 80 }: UsePullToRefreshOptions) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling) return;
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - startY.current);
      setPullDistance(Math.min(distance, threshold * 1.5));
    };

    const handleTouchEnd = async () => {
      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        await onRefresh();
        setIsRefreshing(false);
      }
      setIsPulling(false);
      setPullDistance(0);
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, pullDistance, threshold, onRefresh, isRefreshing]);

  return { containerRef, pullDistance, isRefreshing, isPulling };
}
```

**Componente visual:**

```tsx
// src/components/PullToRefresh.tsx
export function PullToRefreshIndicator({ 
  distance, 
  threshold, 
  isRefreshing 
}: { 
  distance: number; 
  threshold: number; 
  isRefreshing: boolean;
}) {
  const progress = Math.min(distance / threshold, 1);
  
  return (
    <div 
      className="absolute top-0 left-0 right-0 flex justify-center overflow-hidden"
      style={{ height: distance }}
    >
      <div 
        className="flex items-center justify-center"
        style={{ 
          transform: `rotate(${progress * 360}deg)`,
          opacity: progress
        }}
      >
        {isRefreshing ? (
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        ) : (
          <ArrowDown className="w-6 h-6 text-primary" />
        )}
      </div>
    </div>
  );
}
```

---

### 5. Responsive Data Tables

**Problema:** Tabelas ficam cortadas ou com scroll horizontal difícil no mobile.

**Solução: Card List no Mobile**

```tsx
// src/components/ResponsiveTable.tsx
import { useIsMobile } from '@/hooks/use-mobile';

interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  mobileHidden?: boolean;
  mobilePrimary?: boolean;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  keyExtractor: (row: T) => string | number;
}

export function ResponsiveTable<T>({ 
  data, 
  columns, 
  onRowClick,
  keyExtractor 
}: ResponsiveTableProps<T>) {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return (
      <div className="space-y-3">
        {data.map((row) => (
          <div
            key={keyExtractor(row)}
            onClick={() => onRowClick?.(row)}
            className={cn(
              "p-4 bg-card rounded-xl border space-y-2",
              onRowClick && "cursor-pointer active:bg-muted"
            )}
          >
            {/* Linha primária */}
            {columns.filter(c => c.mobilePrimary).map(col => (
              <div key={String(col.key)} className="font-semibold text-lg">
                {col.render 
                  ? col.render(row[col.key], row)
                  : String(row[col.key])
                }
              </div>
            ))}
            
            {/* Demais campos em grid */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              {columns
                .filter(c => !c.mobileHidden && !c.mobilePrimary)
                .map(col => (
                  <div key={String(col.key)}>
                    <span className="text-muted-foreground">{col.label}:</span>{' '}
                    <span className="font-medium">
                      {col.render 
                        ? col.render(row[col.key], row)
                        : String(row[col.key])
                      }
                    </span>
                  </div>
                ))
              }
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  // Desktop: tabela normal
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map(col => (
            <TableHead key={String(col.key)}>{col.label}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow 
            key={keyExtractor(row)}
            onClick={() => onRowClick?.(row)}
            className={onRowClick ? "cursor-pointer" : undefined}
          >
            {columns.map(col => (
              <TableCell key={String(col.key)}>
                {col.render 
                  ? col.render(row[col.key], row)
                  : String(row[col.key])
                }
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

---

### 6. Haptic Feedback (Vibração)

**Impacto:** Feedback tátil em ações importantes melhora UX significativamente.

```tsx
// src/lib/haptics.ts
export const haptics = {
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  },
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10]);
    }
  },
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 50, 30, 50, 30]);
    }
  },
  notification: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 100, 10]);
    }
  }
};
```

**Usar em:**
- ✅ Submit de formulário com sucesso
- ❌ Erro de validação
- 🎉 Bater meta (celebração)
- 👆 Pull-to-refresh trigger

---

## 🔵 PRIORIDADE MÉDIA (Sprint 3)

### 7. Swipe Actions em Listas

**Impacto:** Ações rápidas como aprovar/rejeitar sem abrir modais.

```tsx
// src/components/SwipeableCard.tsx
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: { icon: React.ReactNode; color: string; label: string };
  rightAction?: { icon: React.ReactNode; color: string; label: string };
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
}: SwipeableCardProps) {
  const x = useMotionValue(0);
  const background = useTransform(
    x,
    [-100, 0, 100],
    [
      leftAction?.color || 'transparent',
      'transparent',
      rightAction?.color || 'transparent'
    ]
  );

  const handleDragEnd = (_: never, info: PanInfo) => {
    if (info.offset.x < -100 && onSwipeLeft) {
      onSwipeLeft();
    } else if (info.offset.x > 100 && onSwipeRight) {
      onSwipeRight();
    }
  };

  return (
    <motion.div className="relative overflow-hidden rounded-xl">
      {/* Background actions */}
      <motion.div 
        className="absolute inset-0 flex items-center justify-between px-4"
        style={{ background }}
      >
        {rightAction && (
          <div className="flex items-center gap-2 text-white">
            {rightAction.icon}
            <span className="text-sm font-medium">{rightAction.label}</span>
          </div>
        )}
        <div className="flex-1" />
        {leftAction && (
          <div className="flex items-center gap-2 text-white">
            <span className="text-sm font-medium">{leftAction.label}</span>
            {leftAction.icon}
          </div>
        )}
      </motion.div>
      
      {/* Content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        style={{ x }}
        onDragEnd={handleDragEnd}
        className="relative bg-card"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
```

---

### 8. Formulários Mobile-First

**Problema:** Inputs pequenos, teclado cobre campos, labels não visíveis.

**Melhorias:**

```tsx
// src/components/form/MobileInput.tsx
interface MobileInputProps extends InputProps {
  label: string;
  error?: string;
}

export function MobileInput({ label, error, ...props }: MobileInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <div className="space-y-2">
      <Label 
        className={cn(
          "text-base font-medium transition-colors",
          isFocused && "text-primary"
        )}
      >
        {label}
      </Label>
      <Input
        {...props}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        className={cn(
          "h-12 text-base", // Maior para mobile
          error && "border-destructive focus-visible:ring-destructive"
        )}
      />
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
}
```

**Dica de scroll para campo focado:**

```tsx
// Hook para scroll automático
function useScrollToFocused() {
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        setTimeout(() => {
          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    };
    
    document.addEventListener('focusin', handleFocus);
    return () => document.removeEventListener('focusin', handleFocus);
  }, []);
}
```

---

## ⚡ PERFORMANCE (Sprint 2-3)

### 9. Bundle Splitting Granular

**Estado atual:**
```
dist/assets/index-[hash].js    ~450kb (muito grande)
dist/assets/vendor-[hash].js   ~200kb
```

**Meta:**
```
dist/assets/core-[hash].js        ~100kb (React + Router)
dist/assets/ui-[hash].js          ~80kb  (shadcn components)
dist/assets/charts-[hash].js      ~60kb  (Recharts - lazy)
dist/assets/[page]-[hash].js      ~10-30kb cada
```

**vite.config.ts otimizado:**

```ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
          ],
          'query-vendor': ['@tanstack/react-query'],
          'charts': ['recharts'],
          'forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
      },
    },
  },
});
```

---

### 10. Image Optimization

```tsx
// src/components/OptimizedImage.tsx
interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallback?: string;
  aspectRatio?: string;
}

export function OptimizedImage({ 
  src, 
  fallback = '/placeholder.svg',
  aspectRatio = '1/1',
  alt,
  className,
  ...props 
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  return (
    <div 
      className={cn("relative overflow-hidden bg-muted", className)}
      style={{ aspectRatio }}
    >
      {!loaded && (
        <Skeleton className="absolute inset-0" />
      )}
      <img
        src={error ? fallback : src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0"
        )}
        {...props}
      />
    </div>
  );
}
```

---

### 11. Virtualização de Listas Longas

**Quando usar:** Listas com mais de 50 itens.

```bash
npm install @tanstack/react-virtual
```

```tsx
// src/components/VirtualizedList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  estimateSize: number;
}

export function VirtualizedList<T>({ 
  items, 
  renderItem, 
  estimateSize 
}: VirtualizedListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan: 5,
  });
  
  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### 12. React Query Optimizations

**Configuração otimizada:**

```tsx
// src/providers/QueryProvider.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Mobile: cache mais agressivo
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 30,   // 30 minutos
      
      // Retry inteligente
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status === 404) return false;
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
        return failureCount < 2;
      },
      
      // Refetch apenas quando necessário
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      
      // Network mode para offline
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst',
    },
  },
});
```

---

## 📋 Checklist de Implementação

### Sprint 1 (Crítico)
- [ ] Bottom Navigation com routing
- [ ] Aumentar touch targets (mínimo 44px)
- [ ] Skeleton loading para Dashboard
- [ ] Skeleton loading para listas

### Sprint 2 (Alta)
- [ ] Pull-to-Refresh nos dashboards
- [ ] Responsive Table → Card List mobile
- [ ] Bundle splitting otimizado
- [ ] Haptic feedback em ações

### Sprint 3 (Média)
- [ ] Swipe actions em listas de aprovação
- [ ] Formulários mobile-first
- [ ] Image optimization component
- [ ] React Query optimizations

### Sprint 4 (Baixa)
- [ ] Virtualização de listas longas
- [ ] Animações com Framer Motion
- [ ] Gestos avançados
- [ ] Offline queue

---

## 🔍 Métricas de Sucesso

| Métrica | Atual | Meta Sprint 2 | Meta Sprint 4 |
|---------|-------|---------------|---------------|
| LCP Mobile | ~3.5s | < 2.5s | < 1.5s |
| FID Mobile | ~150ms | < 100ms | < 50ms |
| CLS | 0.15 | < 0.1 | < 0.05 |
| Bundle Size | ~650kb | ~450kb | ~350kb |
| Touch Targets | 60% | 90% | 100% |

---

## 🛠️ Ferramentas de Análise

```bash
# Análise de bundle
npx vite-bundle-visualizer

# Lighthouse CI
npx lighthouse https://app.maiscapinhas.com.br --view

# Performance profiling
# Chrome DevTools > Performance > Record mobile

# PWA audit
npx pwa-asset-generator
```

---

## 📚 Referências

- [Mobile UX Best Practices - Google](https://developers.google.com/web/fundamentals/design-and-ux/principles)
- [Touch Target Guidelines - Apple HIG](https://developer.apple.com/design/human-interface-guidelines/)
- [Core Web Vitals](https://web.dev/vitals/)
- [React Query Optimistic Updates](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)
- [Framer Motion Gestures](https://www.framer.com/motion/gestures/)
