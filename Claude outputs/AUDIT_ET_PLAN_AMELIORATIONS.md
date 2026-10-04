# Audit & Plan d'Amélioration — App CRM VEFA

**Date**: 04 Octobre 2026  
**Statut**: App en fonctionnement, première phase de test  
**Prochaine étape**: Rendre TOUT éditable + nouvelles fonctionnalités

---

## 🔍 État Actuel de l'Application

### ✅ Ce Qui Marche Bien
1. **Backend complèt** : Tous les endpoints CRUD existent (GET, POST, PATCH, DELETE)
2. **Architecture solide** : Node.js + React TypeScript, Prisma ORM, auth JWT
3. **Audit logging** : Chaque action est tracée (qui a modifié quoi, quand)
4. **Multi-utilisateurs** : Support d'équipes avec authentification
5. **CRM fonctionnel** : Contacts, pipeline Kanban, relances, interactions
6. **Comptabilité de base** : Factures, devis, paiements, dépenses
7. **Dashboard** : Vue d'ensemble commerciale et financière

### ⚠️ Les Limitations Actuelles

#### 1. **Frontend ne cible pas tous les endpoints backend**
- **Factures** : Peut créer, voir, ajouter des paiements → **NE PEUT PAS éditer les items**
- **Devis** : Même limitation
- **Backend a déjà** : `PATCH /factures/:id` avec support de modification des items (ligne 114-130 de factures.routes.ts)
- **Frontend manque** : Interface pour éditer les lignes après création

#### 2. **Architecture d'édition non-uniforme**
- Contacts → modifiables (bon)
- Tâches → modifiables (bon)
- Factures/Devis → read-only après création (problème)
- Opportunités → À vérifier (probablement read-only aussi)

#### 3. **Fonctionnalités manquantes pour la professionnalité**
- Aucun template de facture personnalisable
- Pas de génération PDF directe depuis l'app
- Pas de signature électronique sur les documents
- Pas de mémorisation des préférences utilisateur (templates, prix standards)
- Pas de workflows automatisés (ex: "quand facture payée, envoyer email")
- Manque d'intégration Calendly visible dans le front (existe en back)
- Pas de historique de versions des documents

---

## 📋 Plan d'Amélioration (3 Phases)

### PHASE 1 : RENDRE TOUT ÉDITABLE (Priorité Absolue)

#### 1.1 Factures — Édition Complète
**Objectif** : Pouvoir modifier TOUTES les informations d'une facture

**À Implémenter (Frontend)** :
- [ ] Ajouter bouton "Éditer" sur la page de détail facture
- [ ] Créer un modal/form complet pour l'édition :
  - Référence personnalisée
  - Date d'émission
  - Date d'échéance
  - Notes
  - **Items (articles)** :
    - Ajouter de nouvelles lignes
    - Modifier description, quantité, prix unitaire, taux TVA
    - Supprimer des lignes
  - Calcul automatique des totaux HT/TTC
- [ ] Ajouter bouton "Annuler" pour revenir sans sauvegarder
- [ ] Afficher confirmation avant de sauvegarder
- [ ] Support du re-calcul des items liés aux paiements (reconversion si changement du total)

**Backend** : Rien à faire (endpoints existent déjà)

**Fichiers à modifier** :
- `client/src/pages/FactureDetailPage.tsx` : Ajouter section éditable
- `client/src/components/FactureForm.tsx` : Créer component réutilisable

#### 1.2 Devis — Édition Complète
Même approche que les factures :
- [ ] Créer modal d'édition avec tous les champs
- [ ] Items modifiables (ajouter, éditer, supprimer)
- [ ] Calcul automatique des totaux
- [ ] Possibilité de convertir en facture après édition

**Fichiers à modifier** :
- `client/src/pages/DevisDetailPage.tsx` (à créer si n'existe pas)
- `client/src/components/DevisForm.tsx` (à créer)

#### 1.3 Tâches & Rendez-vous — Édition Complète
- [ ] Vérifier état actuel
- [ ] Ajouter inline editing si possible
- [ ] Modal complet pour edits complexes

#### 1.4 Opportunités — Édition Complète
- [ ] Vérifier état actuel
- [ ] Permettre modification du montant, probabilité, et description
- [ ] Support du drag-and-drop (déjà implémenté?) + édition

#### 1.5 Dépenses — Édition Complète
- [ ] Vérifier état actuel
- [ ] Édition des montants, catégories, dates

**Durée estimée** : 3-4 jours (pour tout faire)

---

### PHASE 2 : NOUVELLES FONCTIONNALITÉS PROFESSIONNELLES

#### 2.1 Templates & Personnalisation
- [ ] **Templates de facture** : Permettre à l'admin de définir :
  - Logo entreprise
  - Conditions de paiement standard
  - Modèles de TVA (par défaut : 20%, option 5.5%, 2.1%, 0%)
  - Texte de pied de page (infos légales, coordonnées)
  - Couleurs/branding
- [ ] **Templates d'items** : Sauvegarder des articles récurrents pour réutilisation rapide
- [ ] **Templates de relance** : Modèles d'emails pré-écrits pour chaque situation

**Fichiers** :
- `client/src/pages/SettingsPage.tsx` : Ajouter section templates
- `server/src/routes/templates.routes.ts` : CRUD templates

#### 2.2 Génération PDF Directe
- [ ] Backend : Ajouter endpoint `GET /factures/:id/pdf` avec **pdfkit** ou **puppeteer**
- [ ] Frontend : Bouton "Télécharger en PDF" sur chaque facture/devis
- [ ] PDF inclut logo, branding, mentions légales

**Packages à ajouter** : `pdfkit` ou `puppeteer`

#### 2.3 Workflows Automatisés
- [ ] **Quand facture créée** → Possibilité d'envoyer email auto au client
- [ ] **Quand facture payée** → Notifier le vendeur, marquer opportunité comme fermée (optionnel)
- [ ] **Quand facture dépassée** → Envoyer alerte interne
- [ ] **Quand devis > X jours** → Relancer automatiquement

**Architecture** :
- `server/src/services/automationEngine.ts` : Gestion des workflows
- DB : table `Workflow` pour stocker les règles par entreprise

#### 2.4 Historique & Versioning des Documents
- [ ] Chaque modification de facture/devis crée une version
- [ ] Timeline affichant qui a modifié quoi, quand
- [ ] Possibilité de revenir à une version précédente (soft restore)

**Architecture** :
- `server/src/models/DocumentVersion.ts` : Suivi des versions
- `server/src/routes/versions.routes.ts` : API pour historique

#### 2.5 Signatures Électroniques
- [ ] Intégration **Docusign** ou **HelloSign** pour factures/contrats
- [ ] Support de mandats VEFA signés électroniquement
- [ ] Preuve légale conservée

**Packages** : `docusign-esign-node` ou équivalent

#### 2.6 Commissions Automatiques (Spécifique VEFA)
- [ ] Dashboard affichant commissions dues par programme
- [ ] Auto-génération de factures de commission
- [ ] Suivi des commissions reçues vs dues
- [ ] Alertes sur les retards de paiement commission

#### 2.7 Rapports Avancés & Export
- [ ] Rapport client détaillé (CA, factures, paiements)
- [ ] Rapport par programme immobilier
- [ ] Rapport de trésorerie (cash flow)
- [ ] Export Excel/CSV pour comptabilité
- [ ] Analyse saisonnière (meilleurs mois, tendances)

#### 2.8 Notifications Intelligentes
- [ ] Push notifications sur dashboard
- [ ] Notifications email (digest quotidien ou hebdo)
- [ ] SMS pour alertes critiques (gros impayé, relance importante)
- [ ] Webhooks pour intégrations externes

**Durée estimée** : 2-3 semaines (pour tout, par ordre de priorité)

---

### PHASE 3 : SÉCURITÉ & DURCISSEMENT

#### 3.1 Authentification & Autorisations
- [ ] **Rate limiting** : Protection contre brute-force sur login
- [ ] **2FA** : Authentification 2-facteurs (email ou authenticator)
- [ ] **RBAC avancé** : 
  - Rôles : Admin, Manager, Vendeur, Comptable
  - Permissions granulaires (qui peut voir/modifier quoi)
  - Audit des accès
- [ ] **SSO** : Support OAuth2 (Google, Microsoft)

#### 3.2 Protection des Données
- [ ] **Chiffrement des données sensibles** : Montants, coordonnées bancaires
- [ ] **HTTPS/TLS** : Certificat valide (Let's Encrypt)
- [ ] **GDPR compliance** :
  - Droit à l'oubli (suppression données)
  - Export de données
  - Consentement aux cookies
- [ ] **Backup automatique** : Quotidiens, testés, restaurables

#### 3.3 API Security
- [ ] **CORS** : Configuration restrictive
- [ ] **API Rate Limiting** : Par utilisateur, par endpoint
- [ ] **Input validation** : Zod sur TOUTES les entrées
- [ ] **SQL Injection protection** : Utiliser Prisma ORM (déjà fait)
- [ ] **CSRF protection** : Tokens CSRF sur mutations
- [ ] **Versioning API** : `/api/v1/...`

#### 3.4 Infrastructure
- [ ] **WAF** : Web Application Firewall (Cloudflare)
- [ ] **DDoS protection** : Rate limiting, géo-blocking si besoin
- [ ] **Monitoring** : Logs centralisés (Sentry, LogRocket)
- [ ] **CI/CD sécurisé** : Secrets management, code signing
- [ ] **Conteneurisation** : Docker + orchestration (Docker Compose, Kubernetes)

#### 3.5 Tests & Audits
- [ ] **Tests de sécurité** : OWASP Top 10 checklist
- [ ] **Penetration testing** : Faire faire un audit externe
- [ ] **Code scanning** : GitHub Advanced Security ou Snyk
- [ ] **Dépendances sécurisées** : Regular npm/pip audit

**Durée estimée** : 1-2 semaines (audit + fixes)

---

## 🎯 Priorité Immédiate : Les 3 Améliorations Essentielles (Cette Semaine)

1. **Édition des factures (items modifiables)** — 1-2 jours
   - Impact maximal : Les utilisateurs vont ADORER pouvoir modifier
   - Relativement simple : Backend existe, juste ajouter UI

2. **Édition des devis** — 1 jour (copier factures)

3. **Templates de documents** — 1 jour
   - Logo + footer personnalisables
   - Impact très visible

**Total semaine 1** : ~3-4 jours de travail → App devient BEAUCOUP plus utile

---

## 📊 Tableau Récapitulatif : Avant vs Après

| Fonctionnalité | Avant | Après | Effort |
|---|---|---|---|
| Modifier factures | ❌ | ✅ | 1-2j |
| Modifier devis | ❌ | ✅ | 1j |
| Modifier items | ❌ | ✅ | Inclus ci-dessus |
| Templates facture | ❌ | ✅ | 1j |
| PDF generation | ❌ | ✅ | 1-2j |
| Historique docs | ❌ | ✅ | 2-3j |
| Workflows auto | ❌ | ✅ | 3-4j |
| Commissions auto | ❌ | ✅ | 2-3j |
| 2FA | ❌ | ✅ | 2j |
| GDPR compliance | ⚠️ | ✅ | 3j |

---

## 🚀 Prochaines Actions

1. **Lire ce document** et valider les priorités
2. **Confirmer l'ordre** des améliorations
3. **Lancer Phase 1** (édition de tout)
4. **Test avec Urbanys** pendant Phase 2-3
5. **Audit sécurité** avant production

---

## Notes Técnicas

### Backend qui Fonctionne Déjà
```
✅ GET    /factures              → Liste
✅ GET    /factures/:id          → Détail
✅ POST   /factures              → Créer
✅ PATCH  /factures/:id          → Éditer (items + champs)
✅ DELETE /factures/:id          → Supprimer
✅ POST   /factures/:id/paiements → Ajouter paiement

Même pour /devis, /tâches, /opportunités, /depenses
```

### Frontend à Faire (Phase 1)
```
Créer des components réutilisables :
- <FactureForm /> : Form pour créer/éditer + items
- <DevisForm /> : Form pour créer/éditer + items
- <ItemsEditor /> : Component pour gérer liste d'items (add/edit/delete)
- <FormModal /> : Wrapper modal générique pour forms

Ajouter aux pages detail :
- Bouton "Éditer"
- Modal avec form
- Gestion d'erreurs
- Invalidation du cache (React Query)
```

---

**Ce plan est réaliste, prioritaire et directement applicable à votre codebase existante.**
