import { AnalyseDevis, DevisInput } from "./devis-analyzer";

/**
 * Génère un rapport Markdown complet d'analyse de devis
 * Prêt à être converti en PDF
 */
export function genererRapportDevis(input: DevisInput, analyse: AnalyseDevis): string {
  const dateGeneration = new Date().toLocaleDateString("fr-FR");
  
  return `# 📋 ANALYSE DE DEVIS - IMMO 104 + PPT 2026

**Date d'analyse :** ${dateGeneration}  
**N° Devis :** ${input.numeroDevis}  
**Montant HT :** ${input.montantHT.toLocaleString("fr-FR")}€  
**Montant TTC :** ${input.montantTTC.toLocaleString("fr-FR")}€

---

## 🏢 INFORMATIONS GÉNÉRALES

| Élément | Valeur |
|---------|--------|
| **UT Code** | ${input.utCode} |
| **Bâtiment** | ${input.batimentNumero}${input.batimentNom ? ` (${input.batimentNom})` : ""} |
| **Ville** | ${input.ville || "Non renseignée"} |
| **Type Convention** | ${input.typeConvention} |
| **SA Propriétaire** | ${input.saPropietaire} |
| **SA Occupante** | ${input.saOccupante || "Non renseignée"} |
| **Statut Bien** | ${input.estVacant ? "🔴 VACANT" : "🟢 Occupé"}${input.estLocatif ? " (Locatif)" : ""} |

---

## 📌 NATURE DES TRAVAUX

**Types :** ${input.typesTravaux.join(", ")}

**Description :** ${input.description}

**Classification :**
${input.estDesamiantage ? "- ✓ Désamiantage" : ""}
${input.estMiseEnConformite ? "- ✓ Mise en conformité réglementaire" : ""}
${input.estMaintenanceContractuelle ? "- ✓ Maintenance contractuelle" : ""}
${input.estVisiteReglementaire ? "- ✓ Visite réglementaire" : ""}
${input.estDiagnostic ? "- ✓ Diagnostic" : ""}

---

## 🔍 ANALYSE IMMO 104 - CHARGE LOCATAIRE OU PROPRIÉTAIRE

### Résultat : **${analyse.chargeImmo104.toUpperCase()}**

**Justification :**  
${analyse.justificationImmo104}

${analyse.alertes.length > 0 ? `

### ⚠️ Alertes

${analyse.alertes.map(a => `- ${a}`).join("\n")}
` : ""}

---

## 💰 VENTILATION DES MONTANTS

| Type | Montant HT | % |
|------|-----------|---|
| **Charge Propriétaire** | ${analyse.montantPropietaire.toLocaleString("fr-FR")}€ | ${((analyse.montantPropietaire / input.montantHT) * 100).toFixed(1)}% |
| **Charge Locataire** | ${analyse.montantLocataire.toLocaleString("fr-FR")}€ | ${((analyse.montantLocataire / input.montantHT) * 100).toFixed(1)}% |
| **TOTAL** | **${input.montantHT.toLocaleString("fr-FR")}€** | **100%** |

---

## 📊 MODÈLE DE GESTION PPT 2026

### Famille Budgétaire : **${analyse.familleButgetaire}**

| Paramètre | Valeur |
|-----------|--------|
| **Code Famille** | ${analyse.familleButgetaire} |
| **Sous-type Immosis** | ${analyse.sousType} |
| **Caractère Budgétaire** | ${analyse.caractereBudgetaire} |

**Caractérisation :**
- **Non négociable** = Obligatoire, ne peut pas être coupée en cas de restrictions budgétaires
- **Négociable** = Peut être réduite ou supprimée en cas de restrictions
- **Mixte** = Partiellement négociable selon contexte

---

## 📝 NOMMAGE DE L'AT (AUTORISATION DE TRAVAUX)

### Intitulé proposé

\`\`\`
${analyse.intituleAT}
\`\`\`

**Règle appliquée :** Intitulé explicite et compréhensible par quelqu'un d'extérieur au projet.

**Description complète :**  
${analyse.descriptionAT}

---

## 📋 TRAME IMMOSIS

**À copier-coller dans Immosis :**

\`\`\`
UT Code : ${analyse.immosisData.utCode}
Bâtiment : ${analyse.immosisData.batimentNumero}
Sous-type : ${analyse.immosisData.sousType}
Montant : ${analyse.immosisData.montant.toLocaleString("fr-FR")}€ HT
Description : ${analyse.immosisData.description}
\`\`\`

### Détails Immosis

| Champ | Valeur |
|-------|--------|
| **UT** | ${analyse.immosisData.utCode} |
| **Bâtiment** | ${analyse.immosisData.batimentNumero} |
| **Sous-type** | ${analyse.immosisData.sousType} |
| **Montant HT** | ${analyse.immosisData.montant.toLocaleString("fr-FR")}€ |
| **Description** | ${analyse.immosisData.description} |

---

## 🔗 TRAME CONNECT'IMMO

**À copier-coller dans Connect'Immo :**

\`\`\`
Intitulé du projet : ${analyse.connectImmoData.intitule}
Sous-type : ${analyse.connectImmoData.sousType}
UT-BAT : ${analyse.connectImmoData.utCode} - ${analyse.connectImmoData.batimentNumero}
Montant HT : ${analyse.connectImmoData.montantHT.toLocaleString("fr-FR")}€
Montant TTC : ${analyse.connectImmoData.montantTTC.toLocaleString("fr-FR")}€
\`\`\`

### Détails Connect'Immo

| Champ | Valeur |
|-------|--------|
| **Intitulé** | ${analyse.connectImmoData.intitule} |
| **Sous-type** | ${analyse.connectImmoData.sousType} |
| **UT** | ${analyse.connectImmoData.utCode} |
| **Bâtiment** | ${analyse.connectImmoData.batimentNumero} |
| **Montant HT** | ${analyse.connectImmoData.montantHT.toLocaleString("fr-FR")}€ |
| **Montant TTC** | ${analyse.connectImmoData.montantTTC.toLocaleString("fr-FR")}€ |

---

## 📚 RÉFÉRENCES APPLIQUÉES

### IMMO 104 V3
- **Référence :** IMO00104 - Version 03 du 8 Mars 2023 (AG2A)
- **Sections appliquées :**
  - § 9.1 : Charges incombant au propriétaire
  - § 9.2 : Charges refacturées à l'occupant
  - § 9.3 : Charges incombant à l'occupant

### PPT 2026
- **Référence :** Mode d'Emploi Propriétaire et locatif PPT 2026
- **Familles budgétaires :** 8 familles (GER, MEC, CME, PTP, ML, TL, VR, DIAG)
- **Seuils appliqués :**
  - 3 500€ : Seuil GER/TL vs PTP
  - 15 000€ : Exception remplacement > 1/3 corps d'état

---

## ✅ CHECKLIST SAISIE IMMOSIS

- [ ] Intitulé explicite et compréhensible
- [ ] Famille budgétaire correcte (${analyse.familleButgetaire})
- [ ] Sous-type Immosis approprié (${analyse.sousType})
- [ ] Montant cohérent avec seuils
- [ ] UT et Bâtiment renseignés
- [ ] Description complète
- [ ] Axes locaux générés et documentés
- [ ] Donneur d'ordre renseigné
- [ ] Reventilation B/D correcte selon SA

---

## ✅ CHECKLIST SAISIE CONNECT'IMMO

- [ ] Intitulé du projet explicite
- [ ] Sous-type correct
- [ ] UT-BAT identifiés
- [ ] Montants HT et TTC renseignés
- [ ] Gérant de Programme valide
- [ ] Fournisseur identifié (ABE/Interne/TIERS)
- [ ] Axes locaux générés
- [ ] Donneur d'ordre renseigné
- [ ] Statut du projet défini

---

## 📞 SUPPORT

**Questions sur IMMO 104 ?** Consultez le référentiel SNCF Immobilier (IMO00104 V3)  
**Questions sur PPT 2026 ?** Consultez le Mode d'Emploi Propriétaire et locatif PPT 2026  
**Questions sur E2MT² ?** Consultez le Guide du Pilote E2MT² v3

---

*Rapport généré automatiquement par l'Assistant IA CRM E2MT²*  
*Date : ${dateGeneration}*
`;
}
