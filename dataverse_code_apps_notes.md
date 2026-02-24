# Notes - Power Apps Code Apps + Dataverse

## Prérequis
- Power Apps code apps SDK: @microsoft/power-apps (npm)
- PAC CLI v1.46+
- Environnement avec Dataverse activé
- Connecté via PAC CLI

## Étapes pour connecter Dataverse
1. Se connecter à l'environnement via PAC CLI
2. Utiliser `pac code add-data-source -a dataverse -t <table-logical-name>` pour chaque table
3. Cela génère automatiquement dans `/generated/services/`:
   - `{Table}Model.ts` - Modèle de données
   - `{Table}Service.ts` - Méthodes CRUD

## API générée (exemple Accounts)
```typescript
import { AccountsService } from './generated/services/AccountsService';
import type { Accounts } from './generated/models/AccountsModel';

// CREATE
const result = await AccountsService.create(newAccount);

// READ single
const result = await AccountsService.get(accountId);

// READ multiple with options
const result = await AccountsService.getAll({
  select: ['name', 'accountnumber'],
  filter: "address1_country eq 'USA'",
  orderBy: ['name asc'],
  top: 50
});

// UPDATE
await AccountsService.update(accountId, { name: "Updated Name" });

// DELETE
await AccountsService.delete(accountId);
```

## Structure projet Code Apps
- Template officiel: `npx degit github:microsoft/PowerAppsCodeApps/templates/vite my-app`
- Init: `pac code init --displayName "App Name"`
- Dev: `npm run dev | pac code run`
- Build + Deploy: `npm run build` puis `pac code push`

## Workflow de migration
1. Créer un nouveau projet Code Apps depuis le template Vite officiel
2. Copier les composants React du CRM existant
3. Pour chaque table Dataverse, exécuter `pac code add-data-source -a dataverse -t <table>`
4. Remplacer les appels tRPC par les services générés
5. Build et push

## Tables à connecter (noms logiques Dataverse)
Les tables créées en Phase 2 doivent être connectées via pac code add-data-source.
Il faut connaître les noms logiques exacts (avec préfixe éditeur, ex: cr3e1_lot).
