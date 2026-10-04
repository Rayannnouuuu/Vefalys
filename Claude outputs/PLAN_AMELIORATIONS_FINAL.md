# Plan d'Amélioration FINAL — App CRM VEFA Urbanys

**Version**: 2.0 (Révisée Oct 2026)  
**Focus**: Garder factures simples + Nouvelles features pratiques  
**Cible**: Améliorer usabilité pour équipe VEFA

---

## 🎯 Changements de Direction

### ❌ Ce Qu'On ENLÈVE du Plan Initial
- **Ultra-développement des factures** (e-invoicing légal, signatures, versioning)
  - Raison : Complexité légale de la facturation électronique en France
  - Simplification : Garder juste la gestion basique (créer, modifier, payer)
- **Templates ultra-complexes** pour factures
  - Garder juste : Logo + footer personnalisables

### ✅ Ce Qu'On GARDE du Plan Initial
- Édition complète des factures/devis (items modifiables)
- Templates de documents (simples)
- PDF generation
- Workflows automatisés
- Commissions tracking (VEFA)
- Sécurité (2FA, RBAC, GDPR)
- Historique d'actions

### 🆕 NOUVELLES PRIORITÉS (Basées Ton Feedback)
1. **Inversion Promoteur/Client** dans les factures
2. **Workflows VEFA avancés** : suivi visuel + alertes intelligentes
3. **Analytics ciblées** : sources prospects + prévisions tendances
4. **Collaboration d'équipe** : commentaires, assignations, historique
5. **Import batch** et calendrier d'équipe

---

## 📋 PLAN RÉVISÉ (4 Phases)

### PHASE 1 : FIXES IMMÉDIATS (3-4 jours)

#### 1.1 [URGENT] Facturation — Inversion Promoteur/Client
**Probième** : Les factures affichent "Client" en première ligne. Chez Urbanys, c'est le **Promoteur** qu'on facture, pas le prospect.

**Solution** :
```
Avant :
┌─────────────────────────────────────┐
│ Facture #2026-001                   │
│ Client: Jean Dupont                 │
│ (prospect pour programme XYZ)       │
└─────────────────────────────────────┘

Après :
┌─────────────────────────────────────┐
│ Facture #2026-001                   │
│ Facturé à: [PROMOTEUR] Bouygues     │
│ Prospect/Projet: Jean Dupont        │
│ Programme: Les Jardins de Belleville│
└─────────────────────────────────────┘
```

**À Faire** :
- [ ] Ajouter champ `promoterId` à la facture (DB)
- [ ] Ajouter relation `promoter` dans Prisma
- [ ] Frontend : Afficher promoteur en premier ligne
- [ ] Optionnel : Permettre de sélectionner le promoteur à la création

**Durée** : 1 jour

#### 1.2 Édition des Factures (Items Modifiables)
Même plan que avant, mais **simplifié** :
- [ ] Ajouter UI pour éditer les items (add/remove/modify)
- [ ] Pas de versioning, pas de historique complexe
- [ ] Juste : modifier + sauvegarder

**Durée** : 1-2 jours

#### 1.3 Édition des Devis
Même approche simple que factures.

**Durée** : 1 jour

**Total Phase 1** : 3-4 jours → App devient 10x plus utile

---

### PHASE 2 : WORKFLOWS VEFA AVANCÉS (1-2 semaines)

#### 2.1 Suivi Visuel Amélioré du Pipeline VEFA

**Actuellement** : Pipeline Kanban générique (prospect → devis → contrat → fermé)

**À Ajouter** : Pipeline spécifique VEFA avec étapes visibles + alertes

**Étapes VEFA** :
1. **Prospection** → Contact initial, programme d'intérêt
2. **Visite Planning** → RDV à planifier
3. **Visite Faite** → Visite effectuée, prospect intéressé
4. **Offre En Attente** → Offre envoyée, en attente réponse
5. **Offre Acceptée** → Prospect accepte l'offre
6. **Demande Financement** → Dossier de financement en cours
7. **Promesse Signée** → Promesse de vente signée (1ère commission due)
8. **Compromis Signé** → Compromis signé (2e commission due)
9. **Acte Signé** → Acte définitif signé (3e commission due)
10. **Fermée - Gagnée** / **Perdue** → Fin du cycle

**À Implémenter** :
- [ ] Créer enum `VEFA_STAGES` avec ces 10 étapes
- [ ] Ajouter field `stage` à Opportunity
- [ ] Frontend : Afficher stage courant + dates clés
- [ ] Colorer par urgence (rouge = bloqué > 14j)
- [ ] Afficher commission estimée à chaque stage

**Exemple Card Pipeline** :
```
┌────────────────────────────────────┐
│ [🔴 ALERTE] Jean Dupont            │
│ Programme: Les Jardins             │
│ Stage: Promesse Signée ✓           │
│ Depuis: 25 sept (8j) ⏱️            │
│ Commission: 3% = 15,000€           │
│ Prochaine: Compromis (2%)          │
│ Vendeur: Alice Martin              │
│ Notes: Attente financement notaire │
└────────────────────────────────────┘
```

**Durée** : 2-3 jours

#### 2.2 Alertes Intelligentes sur Dossiers Bloqués

**À Implémenter** :
- [ ] Alerte si prospect au même stage > 14 jours (configurable)
- [ ] Alerte si facture impayée > date limite
- [ ] Alerte si promesse/compromis non signé > 30j
- [ ] Notification en temps réel (bell icon, email optionnel)

**Engine** :
```typescript
// server/src/services/alertEngine.ts
async function checkBlockedProspects() {
  const prospects = await findProspectsInSameStage(14); // > 14 jours
  for (const p of prospects) {
    createNotification(p.vendeurId, {
      type: 'BLOCKED_PROSPECT',
      message: `${p.contactName} est au stage ${p.stage} depuis 14j`,
      link: `/pipeline/${p.id}`
    })
  }
}
```

**Durée** : 1-2 jours

#### 2.3 Gestion des Pièces du Dossier (Checklist)

**À Implémenter** :
- [ ] Créer table `DossierChecklist` avec items standards
- [ ] Support custom (ajouter propres items)
- [ ] Checklist par stage (ex: promesse = documents X, compromis = documents Y)
- [ ] Rappel auto quand doc manquant depuis 7j

**Exemple Checklist** :
```
Promesse de Vente - Pièces Requises:
☑️ Pièce d'identité client
☑️ Justificatif de revenus (3 derniers bulletins)
☑️ Preuve financement (accord banque ou CDI)
☐ Mandat de vente signé
☐ Photos d'identité
```

**Durée** : 2-3 jours

**Total Phase 2** : 1-2 semaines → Gestion VEFA devient streamlined

---

### PHASE 3 : ANALYTICS & COLLABORATION (2-3 semaines)

#### 3.1 Analytics : Sources de Prospects

**À Ajouter** :
- [ ] Dashboard "Sources de Prospects" affichant :
  - Source par prospect (direct, site web, recommandation, etc.)
  - Taux de conversion par source (% qui arrive à signature)
  - CA généré par source (pour ROI marketing)
  - Délai moyen signature par source

**Exemple Chart** :
```
Source                  Prospects  Conversion  CA Généré  Délai Moyen
─────────────────────────────────────────────────────────────────────
Recommandation            12         75%       450k€      23j
Site Web                  8          50%       200k€      45j
Salon Immo               15          40%       240k€      60j
Email Campaign            5          20%        50k€      90j
Démarchage Direct        10          30%       150k€      35j
```

**Durée** : 2-3 jours

#### 3.2 Analytics : Prévisions & Tendances

**À Ajouter** :
- [ ] Graphique tendance CA (actuel vs objectif ce mois)
- [ ] Pipeline santé (combien en chaque stage)
- [ ] Forecast : "À ce rythme, on atteindra X en fin mois"
- [ ] Alertes : "On est 20% sous objectif, faut relancer"

**Durée** : 2-3 jours

#### 3.3 Collaboration : Commentaires Partagés

**À Implémenter** :
- [ ] Section "Commentaires" sur chaque prospect/opportunité
- [ ] Chaque team member peut commenter
- [ ] Timeline : "Alice - 3h ago: A appelé, en attente réponse"
- [ ] Notifications : Quand quelqu'un me mentionne (@Alice)

**Durée** : 2 jours

#### 3.4 Collaboration : Assignation de Tâches

**À Implémenter** :
- [ ] Sur chaque opportunité, possibilité d'assigner une tâche à un team member
- [ ] Task apparaît dans leur agenda
- [ ] Notification quand assigné
- [ ] Status : à faire / en cours / terminée

**Exemple** :
```
Alice assigne à Bob: "Appeler Jean Dupont pour promesse signature"
→ Bob reçoit notification
→ Task apparaît dans son agenda avec deadline
→ Bob marque comme terminée
→ Alice voit que c'est fait
```

**Durée** : 1-2 jours

#### 3.5 Historique Complet des Actions

**À Implémenter** :
- [ ] Timeline par prospect affichant TOUT :
  - "Alice a créé ce prospect - 15 sept"
  - "Alice a envoyé devis - 17 sept"
  - "Bob a modifié stage en Promesse - 20 sept"
  - "Facture #2026-001 créée - 20 sept"
  - "Paiement 10k€ reçu - 22 sept"
- [ ] Filtrable par type d'action (calls, emails, devis, paiements, etc.)
- [ ] Exportable pour audit

**Note** : Audit logging existe déjà en backend, juste l'exposer mieux en frontend

**Durée** : 1-2 jours

**Total Phase 3** : 2-3 semaines

---

### PHASE 4 : QUICK WINS & PRATIQUE (1 semaine)

#### 4.1 Import Batch de Contacts (CSV/Excel)

**À Implémenter** :
- [ ] Bouton "Importer contacts" sur ContactsListPage
- [ ] Support CSV/Excel avec mapping de colonnes
- [ ] Validation avant import
- [ ] Rapport : "50 contacts importés, 2 erreurs"

**Format CSV Attendu** :
```
firstName,lastName,email,phone,company,source,program_id
Jean,Dupont,jean@example.com,+33612345678,Acheteur indiv.,Site Web,prog_001
Marie,Martin,marie@example.com,+33687654321,SARL Tech,Recommandation,prog_002
```

**Durée** : 1-2 jours

#### 4.2 Calendrier d'Équipe (Vue Collaborative)

**À Implémenter** :
- [ ] Page "Calendrier d'Équipe" affichant tous les RDV
- [ ] Codes couleur par vendeur (Alice=bleu, Bob=rouge, etc.)
- [ ] Afficher : qui, avec qui (prospect), quand, où (programme)
- [ ] Possibilité de filtrer par programme ou vendeur

**Durée** : 1-2 jours

#### 4.3 Duplication Rapide de Prospect/Offre

**À Implémenter** :
- [ ] Bouton "Dupliquer" sur prospect
- [ ] Crée copie du prospect (même adresse, téléphone, etc.)
- [ ] Demande : "Quel programme pour cette duplication ?"
- [ ] Duplication de l'offre aussi

**Cas d'usage** : "Jean veut acheter un T2 ET un T3 au même programme" → duplicate offer

**Durée** : 1 jour

**Total Phase 4** : 1 semaine

---

## 📊 Roadmap Synthétique

| Semaine | Phase | Focus | Durée |
|---------|-------|-------|-------|
| **Sem 1** | **Phase 1** | Promoteur/factures + édition items | 3-4j |
| **Sem 2-3** | **Phase 2** | VEFA workflows (stages + alertes + checklist) | 1-2j |
| **Sem 4-6** | **Phase 3** | Analytics + Collaboration (commentaires, tasks, historique) | 2-3j |
| **Sem 7** | **Phase 4** | Quick wins (import, calendrier, duplication) | 1j |
| **Sem 8-9** | **Sécurité** | 2FA, RBAC avancé, GDPR, tests | 1-2j |

**Total estimé** : 8-9 semaines pour TOUT

---

## 🎁 Impact Attendu

### Après Phase 1 (Semaine 1)
✅ Les vendeurs peuvent enfin modifier les factures  
✅ Promoteur affiché en premier (plus de confusion)  
✅ Équipe = "oui, on peut enfin adapter les prix/détails"

### Après Phase 2 (Semaine 3)
✅ Chaque prospect a son parcours VEFA visible  
✅ Alertes automatiques quand ça bloque  
✅ Checklist pour pas oublier de pièces  
✅ Équipe = "c'est notre app, c'est fait pour nous"

### Après Phase 3 (Semaine 6)
✅ Équipe collabore (commentaires, assignations)  
✅ Direction voit le ROI par source (quoi investir?)  
✅ Forecast : "on sera à X€ en fin mois"  
✅ Équipe = "c'est vraiment notre CRM, pas générique"

### Après Phase 4 (Semaine 7)
✅ Import en bulk (pas d'ajout manuel 1 par 1)  
✅ Calendrier partagé (pas de double-booking)  
✅ Duplication rapide (T2 + T3 même client)  
✅ Équipe = "vraiment fluide, c'est fait pour nous"

---

## 🔐 Sécurité (Parallèle)
- 2FA (optionnel mais recommendé)
- RBAC : Admin / Manager / Vendeur (permissions réelles)
- GDPR : Suppression données, export
- Tests sécurité

**À faire après Phase 4 ou en parallèle : 1-2 semaines**

---

## 📝 Notes Importantes

### Backend Capacités
- ✅ Endpoints CRUD pour tout existent déjà
- ✅ Audit logging en place
- ✅ Prisma ORM sécurisé (pas SQL injection)

### Frontend à Faire
- React components réutilisables
- Forms éditables avec validation
- Notifications UI
- Charts pour analytics

### Pas Compliqué
- Pas de signature électronique (trop légal)
- Pas de e-invoicing avancé (trop complexe)
- Pas de IA/ML (simple pour commencer)
- Juste du bon sens + UX solide

---

## ✅ Validation Avant de Commencer

1. **Confirmes-tu l'ordre des phases ?**
2. **Y a-t-il d'autres "quick wins" que je n'ai pas mentionnés ?**
3. **Veux-tu commencer directement Phase 1 ou discuter d'abord des détails ?**
4. **Qui teste (Urbanys) en parallèle du développement ?**

---

**Ce plan est réaliste, adapté à votre besoin VEFA réel, et sans over-engineering.**
