# KOPRO - Spécifications Techniques Complètes

## Vue d'ensemble

KOPRO est une application SaaS de suivi des dossiers MaPrimeRénov' (MPR) et Certificats d'Économies d'Énergie (CEE) pour les particuliers accompagnés par un conseiller Mon Accompagnateur Rénov' agréé.

### Stack Technique

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, class-variance-authority
- **Base de données**: SQLite avec Prisma ORM
- **Authentification**: JWT (jose library)
- **Upload fichiers**: API locale + stockage fichiers
- **Real-time**: Server-Sent Events (SSE) ou polling intelligent

---

## Architecture des 8 Étapes

Le parcours client est divisé en **8 étapes séquentielles** où chaque étape doit être validée avant de passer à la suivante.

### Étape 1: Création du compte client (ADMIN)

**Code**: `CLIENT_CREATION`
**Acteur**: Admin/Conseiller uniquement
**Catégorie**: `ADMIN_SETUP`

#### Fonctionnalités
- Formulaire de création avec champs obligatoires:
  - Prénom, Nom
  - Email (validation format)
  - Téléphone (format français)
  - Adresse complète du logement (rue, code postal, ville)
  - Mot de passe temporaire (généré ou saisi)
- Validation des doublons (email unique)
- Envoi email de bienvenue avec identifiants (TODO: implémenter avec Resend)
- Création automatique du dossier associé

#### Flux
1. Admin remplit le formulaire
2. Système valide les données
3. Création User + Dossier en transaction
4. Envoi email de bienvenue
5. Étape 1 marquée VALIDATED automatiquement
6. Étape 2 débloquée (AVAILABLE)

#### API
- `POST /api/admin/clients` - Création client + dossier

---

### Étape 2: Identifiant MaPrimeRénov' (CLIENT + ADMIN)

**Code**: `MPR_IDENTIFIER`
**Acteur**: Client saisit, Admin valide
**Catégorie**: `CLIENT_ACTION`

#### Côté Client
- Formulaire de saisie de l'identifiant MPR
- Format attendu: `MPR-XXXXXX` (regex: `^MPR-\d{4}[A-Z]{2}\d{6}$`)
- Instructions claires pour trouver l'identifiant sur le site officiel
- Lien vers maprimerenov.gouv.fr
- Bouton de soumission

#### Côté Admin
- Liste des dossiers en attente de validation MPR
- Pour chaque dossier:
  - Affichage de l'identifiant saisi
  - Bouton "Valider" (passe étape en VALIDATED)
  - Bouton "Rejeter" avec champ motif (passe en BLOCKED)
- Historique des modifications MPR (table MprHistory)

#### Flux
1. Client se connecte, voit étape 2 disponible
2. Client saisit son identifiant MPR
3. Statut passe en `PENDING_VALIDATION`
4. Admin reçoit notification
5. Admin valide ou rejette
6. Si validé: étape 3 débloquée
7. Si rejeté: client doit corriger (étape reste BLOCKED)

#### API
- `POST /api/dossiers/[id]/mpr-identifier` - Soumission client
- `POST /api/admin/dossiers/[id]/mpr-validate` - Validation admin

---

### Étape 3: Signature du mandat (CLIENT)

**Code**: `MANDATE_SIGNATURE`
**Acteur**: Client signe
**Catégorie**: `CLIENT_ACTION`

#### Fonctionnalités
- Affichage du document de mandat (PDF généré ou template)
- Case à cocher "J'ai lu et j'accepte les termes du mandat"
- Signature électronique simple:
  - Zone de dessin tactile/souris
  - Ou upload d'une image de signature
- Horodatage de la signature
- Génération PDF final avec signature intégrée

#### Flux
1. Client visualise le mandat complet
2. Client coche la case d'acceptation
3. Client signe (dessin ou upload)
4. Système génère le PDF signé
5. Document stocké et lié au dossier
6. Étape validée automatiquement
7. Étape 4 débloquée

#### API
- `GET /api/dossiers/[id]/mandate` - Récupérer le template
- `POST /api/dossiers/[id]/mandate/sign` - Soumettre signature

---

### Étape 4: Sélection des travaux (ADMIN)

**Code**: `WORK_SELECTION`
**Acteur**: Admin/Conseiller
**Catégorie**: `ADMIN_ACTION`

#### Fonctionnalités
- Interface de sélection des types de travaux:
  - Isolation (combles, murs, planchers)
  - Chauffage (PAC, chaudière biomasse, poêle)
  - Ventilation (VMC)
  - Menuiseries (fenêtres, portes)
  - Solaire (panneaux, chauffe-eau)
- Estimation automatique des aides selon:
  - Type de travaux
  - Revenus du ménage (catégorie MPR)
  - Zone géographique
- Affichage des montants estimés MPR + CEE
- Notes/commentaires pour le client

#### Flux
1. Admin accède au dossier
2. Sélectionne les travaux prévus
3. Système calcule les estimations
4. Admin valide la sélection
5. Client notifié des travaux et estimations
6. Étape 5 débloquée

#### API
- `GET /api/works/types` - Liste des types de travaux
- `POST /api/admin/dossiers/[id]/works` - Enregistrer sélection
- `GET /api/dossiers/[id]/estimates` - Calculer estimations

---

### Étape 5: Dépôt du devis (CLIENT + ADMIN)

**Code**: `QUOTE_DEPOSIT`
**Acteur**: Client upload, Admin valide
**Catégorie**: `CLIENT_ACTION`

#### Côté Client
- Zone d'upload drag & drop
- Formats acceptés: PDF, JPG, PNG
- Taille max: 10 Mo par fichier
- Liste des devis uploadés avec statut
- Possibilité de supprimer avant validation

#### Côté Admin
- Visualisation des devis uploadés
- Pour chaque devis:
  - Prévisualisation inline (PDF viewer)
  - Validation / Rejet avec motif
- Saisie des montants réels:
  - Montant HT
  - Montant TTC
  - Détail par type de travaux

#### Flux
1. Client upload un ou plusieurs devis
2. Statut: `PENDING_VALIDATION`
3. Admin reçoit notification
4. Admin examine et valide/rejette
5. Si rejet: client doit renvoyer
6. Si validation: étape 6 débloquée

#### API
- `POST /api/dossiers/[id]/documents/upload` - Upload fichier
- `GET /api/dossiers/[id]/documents` - Liste documents
- `DELETE /api/dossiers/[id]/documents/[docId]` - Supprimer
- `POST /api/admin/dossiers/[id]/quote/validate` - Valider devis

---

### Étape 6: Autorisation de début des travaux (ADMIN)

**Code**: `WORK_AUTHORIZATION`
**Acteur**: Admin uniquement
**Catégorie**: `ADMIN_ACTION`

#### Fonctionnalités
- Checklist admin avant autorisation:
  - [ ] Devis validé
  - [ ] Montants corrects
  - [ ] Entreprise RGE vérifiée
  - [ ] Délais respectés
- Bouton "Autoriser le démarrage des travaux"
- Notification automatique au client
- Date d'autorisation enregistrée

#### Flux
1. Admin vérifie tous les prérequis
2. Coche les items de la checklist
3. Valide l'autorisation
4. Client reçoit notification "Vous pouvez démarrer vos travaux"
5. Étape 7 débloquée

#### API
- `POST /api/admin/dossiers/[id]/authorize-work`

---

### Étape 7: Dépôt de la facture (CLIENT + ADMIN)

**Code**: `INVOICE_DEPOSIT`
**Acteur**: Client upload, Admin valide
**Catégorie**: `CLIENT_ACTION`

#### Côté Client
- Zone d'upload similaire aux devis
- Champs obligatoires:
  - Facture PDF
  - Date des travaux (début/fin)
  - Photos avant/après (optionnel mais recommandé)
- Attestation sur l'honneur de fin de travaux

#### Côté Admin
- Vérification facture:
  - Montants conformes au devis
  - Mentions légales présentes
  - Qualification RGE de l'entreprise
- Validation ou demande de correction

#### Flux
1. Client upload facture + attestation
2. Statut: `PENDING_VALIDATION`
3. Admin vérifie la conformité
4. Validation ou rejet avec motif
5. Si validé: étape 8 débloquée

#### API
- `POST /api/dossiers/[id]/invoice/upload`
- `POST /api/admin/dossiers/[id]/invoice/validate`

---

### Étape 8: Récapitulatif et clôture (ADMIN + CLIENT)

**Code**: `FINAL_RECAP`
**Acteur**: Admin finalise, Client consulte
**Catégorie**: `FINAL`

#### Fonctionnalités
- Récapitulatif complet du dossier:
  - Timeline des étapes avec dates
  - Documents générés
  - Montants finaux MPR + CEE
  - Statut de versement des aides
- Génération du rapport final PDF
- Bouton de clôture admin
- Archivage du dossier

#### Côté Client
- Vue récapitulative read-only
- Téléchargement de tous les documents
- Statut des versements

#### Côté Admin
- Saisie des montants réellement versés
- Date de versement MPR
- Date de versement CEE
- Clôture définitive du dossier

#### API
- `GET /api/dossiers/[id]/recap`
- `POST /api/admin/dossiers/[id]/finalize`
- `GET /api/dossiers/[id]/documents/download-all`

---

## Fonctionnalités Transverses Client

### Messagerie

#### Bulle de chat flottante (style Intercom)
- Icône flottante en bas à droite
- Badge avec nombre de messages non lus
- Click = ouverture panneau latéral
- Conversation en temps réel avec le conseiller
- Indicateur "conseiller en train d'écrire..."
- Horodatage des messages
- Pièces jointes possibles

#### Page Messages complète
- Historique complet des conversations
- Recherche dans les messages
- Filtres par date, par statut
- Export de la conversation

### Documents

#### Bibliothèque documentaire
- Liste de tous les documents du dossier
- Filtres par catégorie, statut, date
- Prévisualisation inline
- Téléchargement individuel ou groupé
- Indicateur de document manquant

#### Catégories de documents
- Administratifs (mandat, attestations)
- Techniques (devis, factures)
- Justificatifs (RGE, photos)
- Générés (récapitulatifs, rapports)

### Profil

- Modification des informations personnelles
- Changement de mot de passe
- Préférences de notification:
  - Email
  - Push (futur)
  - SMS (futur)
- Historique des connexions

### Support / FAQ

- FAQ dynamique par étape
- Questions fréquentes
- Contact support
- Documentation d'aide
- Tutoriels vidéo (liens externes)

---

## Exigences Real-Time

### Notifications

#### Types de notifications
- `STEP_VALIDATED` - Étape validée
- `STEP_BLOCKED` - Étape bloquée avec motif
- `DOCUMENT_REQUIRED` - Document demandé
- `MESSAGE_RECEIVED` - Nouveau message
- `DEADLINE_REMINDER` - Rappel d'échéance

#### Comportement
- Popup toast en temps réel
- Son de notification (désactivable)
- Badge sur l'icône notifications
- Liste dans la page dédiée
- Marquage lu/non lu

### WebSocket / SSE

Utiliser Server-Sent Events pour:
- Mise à jour du statut des étapes
- Nouveaux messages
- Notifications push
- Indicateur de présence conseiller

### Micro-interactions

- Animations de validation (checkmark animé)
- Progress bar animée
- Skeleton loading
- Transitions fluides entre étapes
- Feedback haptique sur mobile (vibration)

---

## Statuts des Étapes

```typescript
enum StepStatus {
  LOCKED = 'LOCKED',           // Étape non accessible
  AVAILABLE = 'AVAILABLE',     // Étape accessible, non commencée
  IN_PROGRESS = 'IN_PROGRESS', // Étape en cours
  PENDING_VALIDATION = 'PENDING_VALIDATION', // En attente validation admin
  BLOCKED = 'BLOCKED',         // Bloquée (rejet ou problème)
  VALIDATED = 'VALIDATED'      // Terminée et validée
}
```

---

## Modèle de données (Prisma)

Les entités principales sont:
- `User` - Utilisateurs (clients et admins)
- `Dossier` - Dossier de rénovation
- `Step` - Instance d'étape pour un dossier
- `StepTemplate` - Définition des étapes
- `Document` - Documents uploadés
- `Message` - Messages de la conversation
- `Notification` - Notifications utilisateur
- `MprHistory` - Historique des modifications MPR

---

## Routes Principales

### Client
- `/dashboard` - Tableau de bord avec timeline
- `/dossier/[id]` - Détail du dossier
- `/dossier/[id]/etape/[code]` - Page d'une étape
- `/messages` - Messagerie complète
- `/documents` - Bibliothèque documentaire
- `/notifications` - Centre de notifications
- `/profil` - Paramètres du compte
- `/aide` - FAQ et support

### Admin
- `/admin` - Dashboard admin
- `/admin/clients` - Liste des clients
- `/admin/clients/new` - Création client
- `/admin/dossiers` - Liste des dossiers
- `/admin/dossiers/[id]` - Gestion d'un dossier
- `/admin/messages` - Messages à traiter

---

## Conventions de Code

### Fichiers
- Components: `PascalCase.tsx`
- Utils/hooks: `camelCase.ts`
- Types: `types/index.ts` ou `types/[domain].ts`

### Structure des composants
```
src/components/
├── ui/           # Composants UI de base (Button, Card, Input...)
├── layout/       # Sidebar, Header, Footer
├── dashboard/    # Composants spécifiques dashboard
├── dossier/      # Composants de gestion dossier
├── admin/        # Composants admin
└── shared/       # Composants partagés
```

### API Routes
```
src/app/api/
├── auth/         # Login, logout, register
├── dossiers/     # CRUD dossiers client
├── admin/        # Routes admin uniquement
├── documents/    # Upload, download
├── messages/     # Messagerie
└── notifications/ # Notifications
```

---

## Sécurité

### Authentification
- JWT stocké en httpOnly cookie
- Expiration: 7 jours
- Refresh token: non implémenté (TODO)

### Autorisation
- Middleware de vérification role
- Isolation des données par clientId
- Admin peut voir tous les dossiers
- Client voit uniquement son dossier

### Validation
- Zod pour validation des inputs
- Sanitization des uploads
- Rate limiting (TODO)

---

## Performance

### Optimisations
- React Server Components par défaut
- Client components uniquement si interactivité
- Images optimisées avec next/image
- Lazy loading des composants lourds

### Caching
- Prisma query caching
- Static generation pour FAQ/aide
- ISR pour listes admin (TODO)

---

## Comptes de Test

```
Client: client@exemple.fr / client123
Admin: admin@kopro.fr / admin123
Conseiller: conseiller@kopro.fr / admin123
```

---

## Commandes Utiles

```bash
# Développement
npm run dev

# Base de données
npm run db:generate  # Générer client Prisma
npm run db:push      # Appliquer schema
npm run db:seed      # Données de test
npm run db:studio    # Interface Prisma Studio

# Build
npm run build
npm run start

# Linting
npm run lint
```
