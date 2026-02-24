# Phase 3 — Adaptation du code source pour Power Apps Code Apps

## Vue d'ensemble

La migration du CRM E2MT² vers Power Apps Code Apps nécessite de **remplacer l'architecture backend** (Express + tRPC + MySQL/Drizzle) par l'**API Dataverse** générée automatiquement par le SDK Power Apps. Le frontend React est conservé et adapté.

L'approche officielle Microsoft repose sur trois piliers :

1. **Créer un nouveau projet Code Apps** à partir du template Vite officiel (`npx degit github:microsoft/PowerAppsCodeApps/templates/vite`)
2. **Connecter les tables Dataverse** via `pac code add-data-source -a dataverse -t <table>`, ce qui génère automatiquement des fichiers TypeScript (Model + Service) dans `/generated/services/`
3. **Copier les composants React** du CRM existant et remplacer les appels `trpc.*` par les services générés (ex: `InterventionService.getAll()`, `InterventionService.create()`, etc.)

---

## Étape 3.1 — Créer le projet Code Apps depuis le template officiel

Puisque vous avez déjà `pac` installé et connecté à l'environnement SNCF, exécutez :

```bash
cd ~/crm-e2mt2-powerapp

# Télécharger le template Vite officiel Microsoft
npx degit github:microsoft/PowerAppsCodeApps/templates/vite code-app
cd code-app

# Installer les dépendances
npm install

# Initialiser le Code App avec le nom d'affichage
pac code init --displayname "CRM E2MT² - Suivi des Travaux"
```

Cela crée un projet Vite + React + TypeScript prêt pour Power Apps, avec le fichier `power.config.json` configuré.

---

## Étape 3.2 — Connecter les 7 tables Dataverse

Pour chaque table créée en Phase 2, exécutez `pac code add-data-source`. Vous devez utiliser les **noms logiques** des tables (avec le préfixe éditeur de votre environnement).

Pour trouver les noms logiques exacts, exécutez d'abord :

```bash
pac code add-data-source -a dataverse -t cr3e1_lot
pac code add-data-source -a dataverse -t cr3e1_typedetravaux
pac code add-data-source -a dataverse -t cr3e1_batiment
pac code add-data-source -a dataverse -t cr3e1_articlebpu
pac code add-data-source -a dataverse -t cr3e1_intervention
pac code add-data-source -a dataverse -t cr3e1_commentaire
pac code add-data-source -a dataverse -t cr3e1_historiqueintervention
```

**Note importante :** Le préfixe `cr3e1_` est un exemple. Votre préfixe éditeur peut être différent. Pour le trouver, allez dans Power Apps > Solutions > votre solution, et regardez le préfixe des tables.

Après chaque commande, des fichiers sont générés automatiquement dans `src/generated/` :

| Table Dataverse | Fichiers générés |
|---|---|
| `cr3e1_lot` | `LotModel.ts` + `LotService.ts` |
| `cr3e1_typedetravaux` | `TypedetravauxModel.ts` + `TypedetravauxService.ts` |
| `cr3e1_batiment` | `BatimentModel.ts` + `BatimentService.ts` |
| `cr3e1_articlebpu` | `ArticlebpuModel.ts` + `ArticlebpuService.ts` |
| `cr3e1_intervention` | `InterventionModel.ts` + `InterventionService.ts` |
| `cr3e1_commentaire` | `CommentaireModel.ts` + `CommentaireService.ts` |
| `cr3e1_historiqueintervention` | `HistoriqueinterventionModel.ts` + `HistoriqueinterventionService.ts` |

---

## Étape 3.3 — Copier les composants React du CRM existant

Copiez les fichiers frontend depuis le code source extrait :

```bash
# Depuis ~/crm-e2mt2-powerapp/code-app/

# Copier les composants UI (shadcn/ui)
cp -r ../source/client/src/components/ src/components/

# Copier les pages
cp -r ../source/client/src/pages/ src/pages/

# Copier les contextes
cp -r ../source/client/src/contexts/ src/contexts/

# Copier les hooks
cp -r ../source/client/src/hooks/ src/hooks/

# Copier les styles
cp ../source/client/src/index.css src/index.css

# Copier les types partagés
cp -r ../source/shared/ shared/
```

---

## Étape 3.4 — Remplacer les appels tRPC par les services Dataverse

C'est l'étape la plus importante. Voici le **mapping des appels** :

### Avant (tRPC) → Après (Dataverse Service)

```typescript
// AVANT (tRPC)
import { trpc } from '@/lib/trpc';
const { data: interventions } = trpc.interventions.list.useQuery();
const createMutation = trpc.interventions.create.useMutation();

// APRÈS (Dataverse Service)
import { InterventionService } from '../generated/services/InterventionService';
import type { Intervention } from '../generated/models/InterventionModel';

// Lecture
const [interventions, setInterventions] = useState<Intervention[]>([]);
useEffect(() => {
  InterventionService.getAll({
    select: ['title', 'status', 'priority', 'plannedstartdate', 'actualenddate'],
    orderBy: ['createdon desc'],
    top: 100
  }).then(result => {
    if (result.data) setInterventions(result.data);
  });
}, []);

// Création
const handleCreate = async (data: Partial<Intervention>) => {
  const result = await InterventionService.create(data);
  if (result.data) {
    setInterventions(prev => [...prev, result.data]);
  }
};

// Mise à jour
await InterventionService.update(interventionId, { status: 'completed' });

// Suppression
await InterventionService.delete(interventionId);
```

### Fichiers à modifier

Voici les fichiers principaux à adapter :

| Fichier | Changements |
|---|---|
| `pages/Home.tsx` | Remplacer `trpc.dashboard.*` par appels `InterventionService.getAll()` avec agrégation côté client |
| `pages/Interventions.tsx` | Remplacer `trpc.interventions.list` par `InterventionService.getAll()` |
| `pages/InterventionDetail.tsx` | Remplacer `trpc.interventions.getById` par `InterventionService.get(id)` |
| `pages/NewIntervention.tsx` | Remplacer `trpc.interventions.create` par `InterventionService.create()` |
| `pages/Batiments.tsx` | Remplacer `trpc.batiments.*` par `BatimentService.getAll()` |
| `pages/BpuPage.tsx` | Remplacer `trpc.articles.*` par `ArticlebpuService.getAll()` |
| `pages/DevisPage.tsx` | Adapter les appels devis |
| `pages/Alertes.tsx` | Remplacer par filtre sur `InterventionService.getAll()` avec `filter` |
| `pages/ExportPage.tsx` | Adapter l'export côté client |
| `pages/AssistantPage.tsx` | **Supprimer ou adapter** (l'assistant IA nécessite un backend) |
| `components/DashboardLayout.tsx` | Supprimer les références à `trpc.auth.me` → utiliser le contexte Power Apps |
| `lib/trpc.ts` | **Supprimer entièrement** |

---

## Étape 3.5 — Adapter l'authentification

Dans Power Apps Code Apps, l'authentification est gérée automatiquement par Microsoft 365. Vous n'avez pas besoin de gérer OAuth manuellement.

Pour obtenir les informations de l'utilisateur connecté, utilisez le **contexte Power Apps** :

```typescript
// Le SDK Power Apps fournit le contexte utilisateur
// Voir la documentation "Get context data"
// L'utilisateur est automatiquement authentifié via son compte Microsoft 365
```

Supprimez :
- `client/src/lib/trpc.ts`
- Toute référence à `useAuth()` ou `trpc.auth.me`
- Les redirections de login

---

## Étape 3.6 — Adapter le fichier App.tsx

```typescript
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import Interventions from "./pages/Interventions";
import InterventionDetail from "./pages/InterventionDetail";
import NewIntervention from "./pages/NewIntervention";
import Alertes from "./pages/Alertes";
import ExportPage from "./pages/ExportPage";
import BpuPage from "./pages/BpuPage";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/interventions" component={Interventions} />
        <Route path="/interventions/new" component={NewIntervention} />
        <Route path="/interventions/:id" component={InterventionDetail} />
        <Route path="/alertes" component={Alertes} />
        <Route path="/export" component={ExportPage} />
        <Route path="/bpu" component={BpuPage} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <TooltipProvider>
      <Router />
    </TooltipProvider>
  );
}

export default App;
```

---

## Étape 3.7 — Nettoyer les dépendances

Dans le `package.json` du nouveau projet Code Apps, ajoutez uniquement les dépendances frontend nécessaires :

```bash
cd ~/crm-e2mt2-powerapp/code-app

# Installer les dépendances UI
npm install wouter @tanstack/react-query lucide-react clsx tailwind-merge
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select
npm install @radix-ui/react-tooltip @radix-ui/react-tabs @radix-ui/react-switch
npm install class-variance-authority sonner date-fns xlsx

# NE PAS installer : @trpc/client, @trpc/react-query, express, drizzle-orm, mysql2
```

---

## Étape 3.8 — Builder et déployer

```bash
# Build
npm run build

# Push vers Power Apps
pac code push
```

Si tout se passe bien, la commande retourne une URL Power Apps pour accéder à l'application.

---

## Étape 3.9 — Tester dans Power Apps

1. Ouvrez l'URL retournée par `pac code push`
2. Connectez-vous avec votre compte SNCF (7906971J@commun.ad.sncf.fr)
3. Vérifiez que :
   - Le tableau de bord s'affiche
   - Les interventions se chargent depuis Dataverse
   - La création d'intervention fonctionne
   - Les indicateurs vert/rouge s'affichent correctement
   - La navigation fonctionne

---

## Résumé des commandes

```bash
# 1. Créer le projet
npx degit github:microsoft/PowerAppsCodeApps/templates/vite code-app
cd code-app
npm install
pac code init --displayname "CRM E2MT² - Suivi des Travaux"

# 2. Connecter les tables (adapter le préfixe)
pac code add-data-source -a dataverse -t cr3e1_lot
pac code add-data-source -a dataverse -t cr3e1_typedetravaux
pac code add-data-source -a dataverse -t cr3e1_batiment
pac code add-data-source -a dataverse -t cr3e1_articlebpu
pac code add-data-source -a dataverse -t cr3e1_intervention
pac code add-data-source -a dataverse -t cr3e1_commentaire
pac code add-data-source -a dataverse -t cr3e1_historiqueintervention

# 3. Copier les composants React
# (voir commandes cp ci-dessus)

# 4. Installer les dépendances frontend
npm install wouter lucide-react clsx tailwind-merge sonner date-fns xlsx
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select
npm install @radix-ui/react-tooltip @radix-ui/react-tabs class-variance-authority

# 5. Adapter les imports (remplacer trpc par services Dataverse)
# (modification manuelle des fichiers)

# 6. Build et deploy
npm run build
pac code push
```
