# Analyse Phase 3 - Migration Code Source

## Build Config (package.json)
- Script dev: `NODE_ENV=development tsx watch server/_core/index.ts`
- Script build: `vite build && esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist`
- Le build produit: `dist/public/` (frontend Vite) + `dist/` (backend esbuild)

## Vite Config
- Output: `dist/public/`
- Root: `client/`
- Plugins: react, tailwindcss, jsxLocPlugin, vitePluginManusRuntime, vitePluginManusDebugCollector
- Aliases: `@` → `client/src`, `@shared` → `shared/`, `@assets` → `attached_assets/`

## App.tsx Structure
- Router: wouter (Switch/Route)
- Layout: DashboardLayout (sidebar)
- Pages: Home, Batiments, Interventions, InterventionDetail, NewIntervention, Alertes, ExportPage, BpuPage, DevisPage, AssistantPage

## Stratégie de migration
Pour Power Apps Code Apps, on a besoin d'un build frontend statique (HTML/JS/CSS).
- Supprimer les dépendances serveur (tRPC, Express, Drizzle, MySQL)
- Remplacer les appels tRPC par des appels Dataverse Web API (fetch)
- Simplifier vite.config.ts (retirer plugins Manus-spécifiques)
- Adapter l'authentification pour utiliser le token Azure AD fourni par Power Apps
