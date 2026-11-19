# TV Digital Signage (Frontend) — Recuperação e Referência

Este módulo integra o **Painel Administrativo de TVs (`/admin/tv`, `/config/tv`)** e o **Player Público Standalone (`/tv/:slug`, `/tv`)** ao ERP Mais Capinhas.

## Origem Forense dos Arquivos Recuperados (`2026-11-19`)

Os **9 arquivos de implementação** abaixo foram recuperados **integralmente e sem engenharia reversa** a partir dos source maps ocultos (`sourcemap: 'hidden'` -> `assets/*.js.map`) do build ativo de produção (`15/08/2026`, entry `assets/index-BAS5EoBj.js`):

- `src/pages/admin/tv/TvAdsManager.tsx` (de `TvAdsManager-xGnUr_CR.js.map`)
- `src/pages/admin/tv/TvDesignStudio.tsx` (de `TvAdsManager-xGnUr_CR.js.map`)
- `src/pages/admin/tv/TvStoreAnalytics.tsx` (de `TvAdsManager-xGnUr_CR.js.map`)
- `src/lib/upload/chunkedUpload.ts` (de `TvAdsManager-xGnUr_CR.js.map`)
- `src/pages/tv/TvPlayer.tsx` (de `TvPlayer-BaDDonLb.js.map`)
- `src/services/tvCacheEngine.ts` (de `TvPlayer-BaDDonLb.js.map`)
- `src/pages/tv/widgets/TvOverlayWidgets.tsx` (de `TvOverlayWidgets-T1nWZZ1Q.js.map`)
- `src/services/tv.service.ts` (de `TvOverlayWidgets-T1nWZZ1Q.js.map`)
- `src/hooks/api/use-tv-ads.ts` (de `TvOverlayWidgets-T1nWZZ1Q.js.map`)

### Arquivo Reconstruído (Declarações Puras de Tipos TypeScript)
- `src/types/tv.types.ts` — arquivos contendo apenas `interface`/`type` são removidos pelo SWC antes da emissão dos source maps; as definições foram reconstruídas a partir de todos os usos nos 9 arquivos recuperados e cruzadas com o contrato real do backend (`TvAdController` e `TvRuntimeController`).

### Integrações e Correção Mínima Aplicada
- `src/App.tsx`: rotas públicas `/tv/:slug`, `/tv` e rotas protegidas `/admin/tv`, `/config/tv`.
- `src/lib/config/menuConfig.ts`: seção `TVs & Anúncios` e bypass `isSuperAdmin`.
- `src/contexts/AuthContext.tsx` e `src/services/auth.service.ts`: alinhamento de `isSuperAdmin` (`roles.includes('super_admin')`) e merge de `permissions` do `/me`.
- `index.html`: recuperação das diretivas CSP de produção (`media-src`, `frame-src`, `connect-src` Ably, `font-src data:`).
- `src/services/tv.service.ts` (commit separado `fix(tv-signage)`): correção de tipos não importados e de `uploadLogo()` (que referenciava `API_BASE_URL` e `getAuthToken` não declarados em produção), migrado para `apiUpload('/admin/tv/design/upload-logo', file)`.

## Documentação Completa (Backend)

A especificação completa da API (19 endpoints), banco de dados, runtime do player, auditoria de segurança, runbooks de deploy/rollback e backlog P0–P4 está versionada no repositório `maiscapinhas-erp-api` em `docs/tv-signage/`.

## Aviso Importante de Ambiente Local

O arquivo `vite.config.ts` configura proxy `/api/v1` para `https://api.maiscapinhas.com.br` e `.env.production` aponta para produção. Para desenvolvimento ou build local isolado, crie `.env.local` e `.env.production.local` (ignorados pelo Git via `*.local`) com `VITE_API_URL=/api/v1` ou a URL local de staging.
