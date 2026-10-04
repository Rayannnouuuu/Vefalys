# Plan d'Amélioration SIMPLIFIÉ — App CRM VEFA

**Version**: 3.0 (Ultra-pragmatique)  
**Focus**: Léger, pratique, zéro complexité légale  
**Réalité**: Rien ne sera généré dans l'app, on archive juste

---

## 🎯 Changement d'Approche RADICAL

### ❌ ON ENLÈVE COMPLETEMENT
- ✂️ Génération de factures (il y a trop de réglementation)
- ✂️ Génération de devis complexes
- ✂️ Checklists compliquées (ID, revenus, etc.)
- ✂️ Versioning de documents
- ✂️ E-invoicing, signatures électroniques
- ✂️ Toute la complexité légale

### ✅ ON GARDE (Simple)
- CRM : contacts, pipeline, relances, commentaires
- Analytics : sources, tendances
- Collaboration : assignations, historique
- Quick wins : import batch, calendrier

### 🆕 ON AJOUTE (Vraiment Utile)
- **Archive documentaire** : Stocker et récupérer les docs
- **Checklist minimaliste** : Juste financement + mandat
- **Tracker de factures** : Uploader celles qu'on génère ailleurs
- **Espace documents par prospect** : Plans, contrats, etc.

---

## 📋 PLAN FINAL (Vraiment Simplifié)

### PHASE 1 : FONDAMENTAUX (1 semaine)

#### 1.1 [URGENT] Inversion Promoteur/Client
- [ ] Afficher Promoteur en first dans factures
- [ ] Afficher Client/Prospect en second (avec programme)

**Durée** : 1 jour

#### 1.2 Édition Items Factures (Simplifié)
- [ ] Permettre modifier items après création
- [ ] Juste éditer/supprimer, pas de complexité
- [ ] Pas de versioning, pas d'historique complexe

**Durée** : 1 jour

#### 1.3 Édition Items Devis
- [ ] Même approche que factures

**Durée** : 1 jour

**Total Phase 1** : 3 jours

---

### PHASE 2 : DOCUMENTS & ARCHIVE (1 semaine)

#### 2.1 Archive Documentaire par Prospect

**Créer section "Documents" sur la page prospect** :

```
┌─────────────────────────────────────────┐
│ Jean Dupont - Prospect                  │
│ Programme: Les Jardins de Belleville    │
│                                         │
│ [DOCUMENTS ARCHIVÉS]                    │
│ ┌───────────────────────────────────┐   │
│ │ 📄 Mandat de Vente                │   │
│ │   Signé le 20/09/2026             │   │
│ │   [Télécharger] [Supprimer]      │   │
│ └───────────────────────────────────┘   │
│ ┌───────────────────────────────────┐   │
│ │ 📋 Plans du Bien (T3, 4e étage)   │   │
│ │   Uploadé le 18/09/2026           │   │
│ │   [Télécharger] [Supprimer]      │   │
│ └───────────────────────────────────┘   │
│ ┌───────────────────────────────────┐   │
│ │ 📄 Attestation Financement        │   │
│ │   Uploadé le 22/09/2026           │   │
│ │   [Télécharger] [Supprimer]      │   │
│ └───────────────────────────────────┘   │
│                                         │
│ [+ Ajouter un document]                 │
└─────────────────────────────────────────┘
```

**À Implémenter** :
- [ ] Créer table DB `ProspectDocument` avec champs :
  - `prospectId` (FK)
  - `name` (Mandat de vente, Plans, etc.)
  - `type` (enum: MANDAT, PLANS, ATTESTATION_FINANCEMENT, AUTRE)
  - `filePath` (chemin du fichier uploadé)
  - `uploadedAt` (date)
  - `uploadedBy` (qui a uploadé)
- [ ] Frontend : Section documents with upload + list + download
- [ ] Drag-and-drop pour uploader facilement

**Durée** : 2-3 jours

#### 2.2 Checklist Minimaliste : Financement + Mandat

**Ajouter section "Checklist" sur prospect** :

```
┌──────────────────────────────────────┐
│ CHECKLIST DOSSIER                    │
│                                      │
│ ☐ Mandat de Vente signé              │
│   📄 [Upload] ou [Archivé]           │
│                                      │
│ ☑️ Preuve de Financement (Accepté)   │
│   Date d'acceptation: 20/09/2026     │
│   📄 [Upload] Attestation banque      │
│                                      │
└──────────────────────────────────────┘
```

**À Implémenter** :
- [ ] Ajouter champs à Prospect/ProspectProgram :
  - `mandatSigned` (boolean + date)
  - `financingProofUploaded` (boolean + date)
- [ ] Checkboxes interactives (click to toggle)
- [ ] Quand checklist complète = notification optionnelle

**Durée** : 1-2 jours

**Total Phase 2** : 1 semaine

---

### PHASE 3 : FACTURATION LIGHT (1 semaine)

#### 3.1 Factures : Mode "Import Externe"

**Simplifier complètement** :

```
[PAGE FACTURES]

┌─────────────────────────────────────────┐
│ FACTURES POUR: Jean Dupont              │
│ Prospect: T3, Les Jardins               │
│                                         │
│ ☐ Facture #INV-2026-001                │
│    Date: 20/09/2026                     │
│    Montant: 15,000€                     │
│    Statut: [Envoyée]                    │
│    [Télécharger] [Supprimer]           │
│                                         │
│ [+ Importer une facture externe]        │
│   (Upload PDF généré ailleurs)          │
└─────────────────────────────────────────┘
```

**À Faire** :
- [ ] Simplifier la page Factures
- [ ] Enlever génération de factures
- [ ] Garder juste : liste + upload externe
- [ ] Pour chaque facture : montant, date, statut, lien téléchargement
- [ ] ENLEVER items, TVA, calculs

**C'est tout ?** Oui, c'est tout. Plus simple que ça.

**Durée** : 2-3 jours

**Total Phase 3** : 1 semaine

---

### PHASE 4 : CRM AMÉLIORÉ (2 semaines)

#### 4.1 Pipeline VEFA Amélioré (Stages Visibles)

Les 10 stages VEFA (prospect → signature) affichés clairement.

**Durée** : 2-3 jours

#### 4.2 Alertes Intelligentes

Prospect bloqué > 14j → Notification.

**Durée** : 1-2 jours

#### 4.3 Collaboration : Commentaires + Assignations

Chaque équipe member peut commenter, assigner des tâches.

**Durée** : 2-3 jours

#### 4.4 Analytics : Sources + Tendances

ROI par source, forecast.

**Durée** : 2-3 jours

#### 4.5 Quick Wins

- [ ] Import batch CSV
- [ ] Calendrier d'équipe
- [ ] Duplication prospect

**Durée** : 2-3 jours

**Total Phase 4** : 2 semaines

---

### PHASE 5 : SÉCURITÉ (1 semaine)

- 2FA (optionnel)
- RBAC avancé (Admin/Manager/Vendeur)
- GDPR (export/suppression données)

**Durée** : 1 semaine

---

## 🚀 Timeline Réaliste

| Phase | Focus | Durée |
|-------|-------|-------|
| **1** | Promoteur + édition items | 3j |
| **2** | Documents + checklist | 1 sem |
| **3** | Factures light (import externe) | 1 sem |
| **4** | CRM amélioré (stages, alertes, collab) | 2 sem |
| **5** | Sécurité | 1 sem |
| **TOTAL** | **Tout** | **6 semaines** |

---

## 📝 Architecture Modifiée

### Base de Données (Ajouts Minimaux)
```
ProspectDocument
├── id
├── prospectId (FK)
├── name (string)
├── type (MANDAT, PLANS, ATTESTATION, AUTRE)
├── filePath (string, stocké en /uploads)
├── uploadedAt (date)
└── uploadedBy (userId)

Prospect (modifications)
├── ... champs existants ...
├── mandatSigned (boolean)
├── mandatSignedDate (date nullable)
├── financingProofUploaded (boolean)
└── financingProofDate (date nullable)

Facture (modifications - ENLEVER)
├── Enlever: items, calculatedTotals, vatRate
├── Garder: id, number, contactId, status, date, amount, paiements
└── Ajouter: filePath (upload externe)
```

### Frontend (Nouveaux Components)
```
<DocumentArchive prospectId={id} />
├── Liste des documents
├── Upload dropzone
└── Download/Supprimer

<ChecklistDossier prospectId={id} />
├── Checkbox mandat
├── Checkbox financement
└── Dates

<FacturesPage prospectId={id} />
├── Liste factures
└── Upload externe
```

### Backend (Nouveaux Endpoints)
```
POST   /documents              → Uploader document
GET    /documents/:prospectId  → Liste documents
DELETE /documents/:docId       → Supprimer document
GET    /documents/:docId/download → Télécharger

PATCH  /prospects/:id          → Mettre à jour checklist
```

---

## ✨ Résultat Final

**Une app légère, pratique, ZÉRo complexité légale** :

✅ Manage prospects avec leurs documents (mandat, plans, etc.)  
✅ Checklist simple : financement + mandat  
✅ Factures importées de l'externe (tu les génères ailleurs)  
✅ CRM avec pipeline, alertes, collaboration  
✅ Analytics : sources, tendances  
✅ Zéro generation de documents légaux  

**Ça prend combien de temps ?** 6 semaines pour tout.  
**C'est compliqué ?** Non, très simple et léger.  
**On va perdre de la fonctionnalité ?** Au contraire, on gagne en praticité.

---

## ✅ Validation

**Avant de commencer, confirme juste** :

1. OK pour enlever TOUT ce qui est génération de documents légaux ?
2. OK pour garder juste un tracker de factures (upload externe) ?
3. OK pour la timeline 6 semaines ?
4. Veux-tu que je lance Phase 1 directement (Promoteur + édition) ?

---

**C'est réaliste, pragmatique, et adapté à la vraie réalité légale française.**
