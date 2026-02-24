# Guide Phase 3 — Migration du CRM E2MT² vers Power Apps Code Apps

**Auteur :** Manus AI — Février 2026
**Projet :** CRM E2MT² — DIT Grand Sud — Lot 4.1 Occitanie
**Environnement cible :** [SNCF][COMMUN][DEFAUT] (Org: `org3e0b02f8.crm4.dynamics.com`)

---

## 1. Contexte et stratégie de migration

Le CRM E2MT² actuel repose sur une architecture **React + Express + tRPC + MySQL (Drizzle ORM)** hébergée sur la plateforme Manus. L'objectif est de migrer cette application vers **Power Apps Code Apps**, une fonctionnalité récemment rendue disponible en GA (General Availability) par Microsoft, qui permet de déployer des applications web complètes construites avec React directement dans l'écosystème Power Platform [1].

La stratégie retenue consiste à **conserver le frontend React** (composants UI, pages, styles Tailwind CSS, composants shadcn/ui) tout en remplaçant l'intégralité de la couche backend par l'**API Dataverse** générée automatiquement par le SDK Power Apps. Concrètement, les appels `trpc.*` seront remplacés par des appels aux services Dataverse typés (`InterventionService.getAll()`, `BatimentService.create()`, etc.), et l'authentification sera gérée nativement par Microsoft 365 sans aucune configuration manuelle [2].

Le tableau suivant résume les changements architecturaux :

| Composant | Stack actuel (Manus) | Stack cible (Power Apps) |
|---|---|---|
| **Frontend** | React 19 + Tailwind 4 + shadcn/ui + wouter | React + Tailwind + shadcn/ui + wouter (conservé) |
| **Appels API** | tRPC (hooks `trpc.*.useQuery/useMutation`) | Services Dataverse générés (`*Service.getAll/create/update/delete`) |
| **Backend** | Express + tRPC + Drizzle ORM | Aucun — appels directs Dataverse Web API via SDK |
| **Base de données** | MySQL (TiDB) | Microsoft Dataverse (7 tables créées en Phase 2) |
| **Authentification** | OAuth Manus + cookies de session | Microsoft 365 / Azure AD (automatique) |
| **Hébergement** | Manus Cloud | Power Platform (pac code push) |
| **Assistant IA** | LLM via Manus Forge API | À adapter (Azure OpenAI ou Copilot Studio) |

---

## 2. Étape 3.1 — Créer le projet Code Apps depuis le template officiel

Le point de départ est le **template Vite officiel** fourni par Microsoft dans le dépôt GitHub `microsoft/PowerAppsCodeApps` [3]. Ce template inclut déjà la configuration nécessaire pour le SDK Power Apps, le fichier `power.config.json`, et un build Vite compatible avec `pac code push`.

Exécutez les commandes suivantes dans votre terminal Mac :

```bash
cd ~/crm-e2mt2-powerapp

# Télécharger le template Vite officiel Microsoft
npx degit github:microsoft/PowerAppsCodeApps/templates/vite code-app
cd code-app

# Installer les dépendances du template
npm install

# Initialiser le Code App avec le nom d'affichage
pac code init --displayname "CRM E2MT² - Suivi des Travaux"
```

Après `pac code init`, un fichier `power.config.json` est créé ou mis à jour dans le répertoire du projet. Ce fichier contient la configuration de l'application pour Power Platform, notamment l'identifiant de l'environnement et les data sources connectées.

> **Vérification :** Après cette étape, vous devriez pouvoir lancer `npm run dev` et voir une page d'accueil basique dans votre navigateur. Ouvrez l'URL "Local Play" dans le **même profil de navigateur** que celui connecté à votre tenant SNCF Microsoft 365.

---

## 3. Étape 3.2 — Connecter les 7 tables Dataverse

La commande `pac code add-data-source` permet d'ajouter une table Dataverse comme source de données. Pour chaque table, le SDK génère automatiquement deux fichiers TypeScript dans le dossier `src/generated/` : un fichier **Model** (types TypeScript) et un fichier **Service** (méthodes CRUD) [2].

Avant d'exécuter les commandes, vous devez connaître le **préfixe éditeur** de vos tables. Ce préfixe a été attribué lors de la création des tables en Phase 2. Pour le retrouver, rendez-vous dans Power Apps (make.powerapps.com) > Solutions > votre solution, et observez le préfixe des noms logiques de vos tables (par exemple `cr3e1_`, `new_`, ou un préfixe personnalisé).

Exécutez ensuite les 7 commandes suivantes en remplaçant `<prefix>` par votre préfixe éditeur réel :

```bash
pac code add-data-source -a dataverse -t <prefix>_lot
pac code add-data-source -a dataverse -t <prefix>_typedetravaux
pac code add-data-source -a dataverse -t <prefix>_batiment
pac code add-data-source -a dataverse -t <prefix>_articlebpu
pac code add-data-source -a dataverse -t <prefix>_intervention
pac code add-data-source -a dataverse -t <prefix>_commentaire
pac code add-data-source -a dataverse -t <prefix>_historiqueintervention
```

Le tableau suivant récapitule les fichiers générés attendus :

| Table Dataverse | Fichier Model généré | Fichier Service généré | Méthodes disponibles |
|---|---|---|---|
| `<prefix>_lot` | `LotModel.ts` | `LotService.ts` | `getAll`, `get`, `create`, `update`, `delete` |
| `<prefix>_typedetravaux` | `TypedetravauxModel.ts` | `TypedetravauxService.ts` | idem |
| `<prefix>_batiment` | `BatimentModel.ts` | `BatimentService.ts` | idem |
| `<prefix>_articlebpu` | `ArticlebpuModel.ts` | `ArticlebpuService.ts` | idem |
| `<prefix>_intervention` | `InterventionModel.ts` | `InterventionService.ts` | idem |
| `<prefix>_commentaire` | `CommentaireModel.ts` | `CommentaireService.ts` | idem |
| `<prefix>_historiqueintervention` | `HistoriqueinterventionModel.ts` | `HistoriqueinterventionService.ts` | idem |

> **Note :** Les noms exacts des fichiers générés dépendent du nom logique de la table. Si le nom logique contient des underscores ou des caractères spéciaux, le SDK les normalise. Vérifiez le contenu du dossier `src/generated/` après chaque commande.

---

## 4. Étape 3.3 — Copier les composants React du CRM existant

Le code source du CRM a été extrait dans `~/crm-e2mt2-powerapp/source/`. Les fichiers frontend à copier sont organisés dans les répertoires suivants :

```bash
cd ~/crm-e2mt2-powerapp/code-app

# Composants UI (shadcn/ui, DashboardLayout, etc.)
cp -r ../source/client/src/components/ src/components/

# Pages de l'application
cp -r ../source/client/src/pages/ src/pages/

# Contextes React (ThemeContext, etc.)
cp -r ../source/client/src/contexts/ src/contexts/

# Hooks personnalisés
cp -r ../source/client/src/hooks/ src/hooks/

# Styles globaux (Tailwind CSS)
cp ../source/client/src/index.css src/index.css

# Types partagés
mkdir -p shared
cp -r ../source/shared/ shared/
```

Après la copie, certains fichiers contiendront des imports vers `@/lib/trpc` ou d'autres modules backend qui n'existent plus. Ces erreurs seront corrigées à l'étape suivante.

---

## 5. Étape 3.4 — Remplacer les appels tRPC par les services Dataverse

C'est l'étape la plus conséquente de la migration. Chaque appel `trpc.*` dans les composants React doit être remplacé par un appel au service Dataverse correspondant. Le SDK Power Apps fournit des méthodes typées pour les opérations CRUD : `getAll()`, `get(id)`, `create(record)`, `update(id, changes)`, `delete(id)` [2].

### 5.1 Patron de remplacement général

Le code tRPC utilise des hooks React Query (`useQuery`, `useMutation`) qui gèrent automatiquement le cache, le chargement et les erreurs. Avec les services Dataverse, vous devez gérer ces états manuellement avec `useState` et `useEffect`, ou bien créer des hooks personnalisés qui encapsulent les appels Dataverse.

**Exemple — Lecture d'une liste (avant/après) :**

```typescript
// ═══ AVANT (tRPC) ═══
import { trpc } from '@/lib/trpc';

function InterventionsPage() {
  const { data: interventions, isLoading } = trpc.interventions.list.useQuery();
  // ...
}

// ═══ APRÈS (Dataverse Service) ═══
import { InterventionService } from '../generated/services/InterventionService';
import type { Intervention } from '../generated/models/InterventionModel';

function InterventionsPage() {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    InterventionService.getAll({
      select: ['title', 'status', 'priority', 'plannedstartdate', 'actualenddate'],
      orderBy: ['createdon desc'],
      top: 200
    }).then(result => {
      if (result.data) setInterventions(result.data);
    }).finally(() => setIsLoading(false));
  }, []);
  // ...
}
```

**Exemple — Création d'un enregistrement (avant/après) :**

```typescript
// ═══ AVANT (tRPC) ═══
const createMutation = trpc.interventions.create.useMutation({
  onSuccess: () => utils.interventions.list.invalidate()
});
await createMutation.mutateAsync(formData);

// ═══ APRÈS (Dataverse Service) ═══
const handleCreate = async (formData: Partial<Intervention>) => {
  try {
    const result = await InterventionService.create(formData);
    if (result.data) {
      setInterventions(prev => [...prev, result.data]);
      toast.success('Intervention créée avec succès');
    }
  } catch (err) {
    toast.error('Erreur lors de la création');
    console.error(err);
  }
};
```

**Exemple — Filtrage avec OData (indicateurs vert/rouge) :**

```typescript
// Récupérer les interventions en retard (indicateur rouge)
const lateInterventions = await InterventionService.getAll({
  filter: "actualenddate gt plannedenddate",
  select: ['title', 'plannedenddate', 'actualenddate', 'status']
});

// Récupérer les interventions dans les temps (indicateur vert)
const onTimeInterventions = await InterventionService.getAll({
  filter: "actualenddate le plannedenddate and status eq 'completed'",
  select: ['title', 'plannedenddate', 'actualenddate']
});
```

### 5.2 Liste des fichiers à modifier

Le tableau suivant détaille les modifications nécessaires pour chaque fichier :

| Fichier | Action | Détail |
|---|---|---|
| `lib/trpc.ts` | **Supprimer** | Ce fichier n'est plus nécessaire |
| `pages/Home.tsx` | Modifier | Remplacer `trpc.dashboard.*` par des appels `InterventionService.getAll()` avec agrégation côté client pour les KPI |
| `pages/Interventions.tsx` | Modifier | Remplacer `trpc.interventions.list` par `InterventionService.getAll()` |
| `pages/InterventionDetail.tsx` | Modifier | Remplacer `trpc.interventions.getById` par `InterventionService.get(id)` |
| `pages/NewIntervention.tsx` | Modifier | Remplacer `trpc.interventions.create` par `InterventionService.create()` |
| `pages/Batiments.tsx` | Modifier | Remplacer par `BatimentService.getAll()` |
| `pages/BpuPage.tsx` | Modifier | Remplacer par `ArticlebpuService.getAll()` |
| `pages/DevisPage.tsx` | Modifier | Adapter les appels devis |
| `pages/Alertes.tsx` | Modifier | Utiliser `InterventionService.getAll()` avec filtre OData |
| `pages/ExportPage.tsx` | Modifier | Adapter l'export côté client (xlsx) |
| `pages/AssistantPage.tsx` | **Retirer temporairement** | L'assistant IA nécessite un backend (Azure OpenAI ou Copilot Studio) — à réintégrer ultérieurement |
| `pages/LogigrammePage.tsx` | Modifier | Adapter les appels checklist |
| `pages/LivrablesPage.tsx` | Modifier | Remplacer par des appels Dataverse (si table livrables créée) |
| `pages/Evolutions2026Page.tsx` | Conserver tel quel | Page statique, pas d'appels API |
| `pages/OutilsMetierPage.tsx` | Conserver tel quel | Page statique |
| `pages/NommageATPage.tsx` | Conserver tel quel | Logique côté client uniquement |
| `components/DashboardLayout.tsx` | Modifier | Supprimer les références à `trpc.auth.me` et `useAuth()` — remplacer par le contexte Power Apps |

---

## 6. Étape 3.5 — Adapter l'authentification

Dans Power Apps Code Apps, l'authentification est **entièrement gérée par Microsoft 365**. L'utilisateur est automatiquement authentifié lorsqu'il ouvre l'application dans Power Apps. Il n'y a aucun flux OAuth à configurer, aucun cookie de session à gérer [1].

Pour obtenir les informations de l'utilisateur connecté, le SDK Power Apps fournit une fonction de contexte. Consultez la documentation "Get context data" [4] pour les détails d'implémentation.

Les éléments suivants doivent être **supprimés** du code :

1. Le fichier `lib/trpc.ts` et toutes ses importations
2. Les appels `trpc.auth.me.useQuery()` et `trpc.auth.logout.useMutation()`
3. Le hook `useAuth()` et le contexte d'authentification Manus
4. Les redirections vers la page de login (`getLoginUrl()`)
5. Le composant `DashboardLayoutSkeleton` lié au chargement de l'auth

Dans le `DashboardLayout`, remplacez l'affichage du nom utilisateur par une valeur statique ou par le contexte Power Apps :

```typescript
// Remplacer useAuth() par une valeur contextuelle
const userName = "Pierre Bournet"; // ou via le SDK Power Apps context
```

---

## 7. Étape 3.6 — Adapter le fichier App.tsx

Le fichier `App.tsx` doit être simplifié pour retirer les providers liés à tRPC et à l'authentification Manus. Voici la structure cible :

```typescript
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import Interventions from "./pages/Interventions";
import InterventionDetail from "./pages/InterventionDetail";
import NewIntervention from "./pages/NewIntervention";
import Alertes from "./pages/Alertes";
import ExportPage from "./pages/ExportPage";
import BpuPage from "./pages/BpuPage";
import NommageATPage from "./pages/NommageATPage";
import OutilsMetierPage from "./pages/OutilsMetierPage";
import LogigrammePage from "./pages/LogigrammePage";
import LivrablesPage from "./pages/LivrablesPage";
import Evolutions2026Page from "./pages/Evolutions2026Page";

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
        <Route path="/nommage-at" component={NommageATPage} />
        <Route path="/outils-metier" component={OutilsMetierPage} />
        <Route path="/logigramme" component={LogigrammePage} />
        <Route path="/livrables" component={LivrablesPage} />
        <Route path="/evolutions-2026" component={Evolutions2026Page} />
        <Route>Page non trouvée</Route>
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
```

> **Important :** Le `QueryClientProvider` et le `trpc.Provider` qui enveloppaient l'application dans `main.tsx` doivent être retirés. Si vous souhaitez conserver React Query pour le cache côté client, vous pouvez garder le `QueryClientProvider` seul, mais les hooks `trpc.*` ne fonctionneront plus.

---

## 8. Étape 3.7 — Installer les dépendances frontend

Le projet Code Apps a ses propres dépendances de base. Ajoutez uniquement les packages frontend nécessaires au CRM :

```bash
cd ~/crm-e2mt2-powerapp/code-app

# Navigation
npm install wouter

# UI Components (shadcn/ui + Radix)
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-select @radix-ui/react-tooltip
npm install @radix-ui/react-tabs @radix-ui/react-switch
npm install @radix-ui/react-checkbox @radix-ui/react-label
npm install @radix-ui/react-separator @radix-ui/react-scroll-area
npm install class-variance-authority clsx tailwind-merge

# Icônes et notifications
npm install lucide-react sonner

# Utilitaires
npm install date-fns xlsx
```

Les packages suivants du CRM actuel **ne doivent PAS être installés** car ils sont liés au backend supprimé :

| Package à exclure | Raison |
|---|---|
| `@trpc/client`, `@trpc/react-query`, `@trpc/server` | Remplacé par les services Dataverse |
| `@tanstack/react-query` | Optionnel — les services Dataverse gèrent les appels directement |
| `express`, `cors` | Pas de serveur backend |
| `drizzle-orm`, `drizzle-kit`, `mysql2` | Remplacé par Dataverse |
| `tsx`, `esbuild` | Pas de build serveur |
| `superjson` | Spécifique à tRPC |

---

## 9. Étape 3.8 — Build et déploiement

Une fois toutes les modifications effectuées et les erreurs TypeScript corrigées, procédez au build et au déploiement :

```bash
cd ~/crm-e2mt2-powerapp/code-app

# Build de production
npm run build

# Déployer vers Power Apps
pac code push
```

La commande `pac code push` publie une nouvelle version de l'application dans votre environnement Power Platform. En cas de succès, elle retourne une **URL Power Apps** de la forme :

```
https://apps.powerapps.com/play/e/4a7c8238-5799-4b16-9fc6-9ad8fce5a7d9/a/...
```

---

## 10. Étape 3.9 — Vérification et tests

Ouvrez l'URL retournée par `pac code push` dans votre navigateur (même profil que votre compte SNCF). Vérifiez les points suivants :

| Point de vérification | Attendu |
|---|---|
| Connexion automatique | L'utilisateur est authentifié via Microsoft 365 sans page de login |
| Tableau de bord | Les KPI s'affichent (nombre d'interventions, en cours, terminées) |
| Liste des interventions | Les données se chargent depuis Dataverse |
| Création d'intervention | Le formulaire fonctionne et l'enregistrement apparaît dans Dataverse |
| Indicateurs vert/rouge | Les interventions en retard sont marquées en rouge, celles dans les temps en vert |
| Navigation sidebar | Toutes les pages sont accessibles |
| Pages statiques | Nommage AT, Outils Métier, Évolutions 2026 fonctionnent normalement |
| Export Excel | L'export CSV/XLSX fonctionne côté client |

---

## 11. Points d'attention et limitations

**Assistant IA :** La page Assistant utilise actuellement l'API LLM de Manus (invokeLLM). Dans Power Apps, vous pouvez la remplacer par **Azure OpenAI** (si votre tenant SNCF dispose d'un accès) ou par **Copilot Studio** [5]. Cette intégration est à traiter dans une phase ultérieure.

**Performances :** Les appels Dataverse Web API sont plus lents que les appels tRPC directs à MySQL. Pour les listes volumineuses, utilisez systématiquement les paramètres `select` (colonnes nécessaires uniquement), `top` (pagination), et `filter` (filtrage côté serveur) dans les options de `getAll()` [2].

**Lookups :** Les relations entre tables (ex: intervention → bâtiment) sont gérées par des colonnes de type lookup dans Dataverse. Pour associer un bâtiment à une intervention lors de la création, utilisez la syntaxe de navigation property documentée par Microsoft [2].

---

## Références

[1]: https://learn.microsoft.com/en-us/power-apps/developer/code-apps/ "Power Apps code apps documentation"
[2]: https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/connect-to-dataverse "How to: Connect your code app to Dataverse"
[3]: https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/create-an-app-from-scratch "Quickstart: Create a code app from scratch"
[4]: https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/get-context-data "Get context data"
[5]: https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/connect-to-copilot-studio "Connect to Copilot Studio"
