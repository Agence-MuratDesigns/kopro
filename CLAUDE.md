# KOPRO - Spécifications Techniques Complètes

## Vue d'ensemble

KOPRO est une application SaaS de suivi des dossiers MaPrimeRénov' (MPR) et Certificats d'Économies d'Énergie (CEE) pour les particuliers. Chaque client a un seul dossier, géré par un administrateur unique.

### Stack Technique

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, class-variance-authority
- **Base de données**: SQLite avec Prisma ORM
- **Authentification**: JWT (jose library)
- **Upload fichiers**: API locale + stockage fichiers
- **Real-time**: Server-Sent Events (SSE) ou polling intelligent

---

## Architecture des 8 Étapes

Le parcours client est divisé en **8 étapes séquentielles**. Chaque étape doit être validée avant de passer à la suivante.

---

# ÉTAPE 01 — Création du compte client par l'administrateur

**Code**: `CLIENT_CREATION`
**Acteur**: Admin uniquement
**Catégorie**: `ADMIN_SETUP`

## 1. Contexte et objectif

Le parcours débute **par la création du compte client par un administrateur**.

- Le client **ne crée jamais lui-même son compte**
- Cette étape est **entièrement gérée côté administration**

Objectifs :
- Créer un espace personnel sécurisé pour le client
- Initialiser son dossier administratif
- Transmettre les informations de connexion
- Positionner automatiquement au début du parcours (étape 2)

## 2. Accès côté administrateur

### Bouton d'action
Libellé : **"Ajouter un client"**

- Accessible uniquement aux administrateurs (ADMIN)
- Au clic : ouverture d'un formulaire dédié
- Aucun dossier créé tant que le formulaire n'est pas validé

## 3. Formulaire de création

### Champs requis

#### 1. Prénom
- Type : texte
- Obligatoire
- Longueur : 2-50 caractères
- Caractères autorisés : lettres, accents, apostrophes, espaces, tirets
- **Regex** : `^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,50}$`

#### 2. Nom
- Mêmes règles que le prénom

#### 3. Adresse e-mail
- Type : email
- Obligatoire
- Format email valide
- **Unique dans le système**
- Comparaison insensible à la casse
- Trim des espaces avant validation

#### 4. Mot de passe initial
- Type : password
- Obligatoire
- Généré ou saisi par l'administrateur
- **Contraintes de sécurité** :
  - Minimum 8 caractères
  - Au moins 1 majuscule
  - Au moins 1 minuscule
  - Au moins 1 chiffre
  - Au moins 1 caractère spécial
- **Regex** : `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$`

### États du formulaire

| État | Description |
|------|-------------|
| Initial | Champs vides |
| Validation locale | Vérification des champs avant envoi |
| En cours | Soumission en cours (loader visible) |
| Succès | Compte créé avec succès |
| Erreur | Message explicite selon le cas |

Le bouton de validation :
- Désactivé tant que les champs ne sont pas valides
- Désactivé pendant le traitement

## 4. Traitement après validation

### 4.1 Création du compte utilisateur
- Créer un compte avec : prénom, nom, email, mot de passe hashé
- Associer à un espace personnel sécurisé
- Initialiser l'état comme **nouveau**

### 4.2 Initialisation du dossier administratif

| Champ | Valeur |
|-------|--------|
| Étape actuelle | 2 |
| Statut du dossier | Brouillon |
| Première connexion effectuée | Non |
| Date de création | Date du jour |
| Créé par | ID Administrateur |
| Historique | Entrée "Dossier créé" |

### 4.3 Envoi automatique de l'e-mail

Contenu :
- Confirmation de création du compte
- Rappel de l'adresse e-mail
- Mot de passe initial
- Lien de connexion
- Explication de la suite du parcours

## 5. États finaux (fin étape 1)

### Côté client
- Email reçu avec identifiants
- Peut se connecter
- Positionné à l'étape 2

### Côté administrateur
- Client visible dans la liste des dossiers actifs
- Dossier identifié comme : "En attente des informations MaPrimeRénov'"

## 6. Gestion des erreurs

| Erreur | Comportement |
|--------|--------------|
| Email existant | Création bloquée + message "Un compte existe déjà avec cette adresse e-mail." |
| Email invalide | Blocage immédiat + message d'erreur |
| Mot de passe non conforme | Blocage + indication des critères manquants |
| Erreur technique | Aucun compte partiellement créé + message "Une erreur est survenue..." |
| Échec d'envoi email | Compte créé + erreur loguée + possibilité de renvoyer manuellement |

## 7. API

- `POST /api/admin/clients` - Création client + dossier

---

# ÉTAPE 02 — Dépôt et validation de l'identifiant MaPrimeRénov' (MPR)

**Code**: `MPR_IDENTIFIER`
**Acteur**: Client saisit, Admin valide
**Catégorie**: `CLIENT_ACTION`

## 1. Objectif

Permettre au client de renseigner son identifiant MaPrimeRénov' pour que l'équipe administrative puisse :
- Vérifier la validité/cohérence de l'identifiant
- Confirmer que le dossier peut continuer
- Éviter toute erreur avant les étapes engageantes

**Tant que l'identifiant n'est pas validé, le dossier reste bloqué.**

## 2. Écran client

### Éléments affichés
1. **Champ de saisie** : Identifiant MaPrimeRénov'
2. **Texte d'aide** : rappel du format + exemple
3. **Case obligatoire** : "Je certifie que cet identifiant est exact et correspond à mon dossier MaPrimeRénov'."
4. **Bouton principal** : "Enregistrer mon identifiant"
5. **Zone de statut** : "En attente de validation" / "Validé" / "Refusé - à corriger"

### Règles anti-erreur

Le bouton "Enregistrer" activé uniquement si :
- Champ identifiant **non vide**
- Identifiant respecte le format (regex)
- Case "je certifie" **cochée**

Si case non cochée :
> "Veuillez certifier que l'identifiant est correct avant d'enregistrer."

## 3. Validation de format (Regex)

### Format attendu
Exemple : `MPR-2345AB`

- Commence par `MPR-`
- Puis **4 chiffres**
- Puis **2 lettres** (A–Z)
- Pas d'espace
- Insensible à la casse à la saisie (normalisation en majuscules)

### Regex stricte
```
^MPR-\d{4}[A-Z]{2}$
```

### Règles
- Convertir automatiquement en majuscules à l'enregistrement
- Trim des espaces avant/après
- Interdire espaces au milieu

✅ Valide : `MPR-2345AB`
❌ Invalides : `mpr2345ab`, `MPR2345AB`, `MPR-234AB`, `MPR-2345ABC`

## 4. Comportement après enregistrement

### Enregistrement réussi
- Message : "Identifiant enregistré. Votre dossier est en attente de validation."
- Statut : `pending_review`
- Interface verrouille la progression

### Modification ultérieure
Tant que l'admin n'a pas validé, le client peut modifier :
- Afficher l'identifiant actuel
- Bouton : "Modifier mon identifiant"
- Au clic : champ éditable, case obligatoire, nouvel enregistrement
- Relance l'état "en attente de validation"

## 5. Statuts système

| Champ | Description |
|-------|-------------|
| `mpr_id` | Identifiant MPR enregistré |
| `mpr_status` | `draft` / `pending_review` / `approved` / `rejected` |
| `mpr_submitted_at` | Date/heure de soumission |
| `mpr_last_updated_at` | Date/heure dernière modification |
| `mpr_reviewed_at` | Date/heure validation admin |
| `mpr_review_message` | Message admin en cas de rejet |

### Transitions
- Première soumission : `mpr_status = pending_review`, `mpr_submitted_at = now`
- Modification client : `mpr_status = pending_review`, `mpr_last_updated_at = now`

## 6. Notifications

### Notification admin (obligatoire)
> "Nouveau dépôt d'identifiant MPR à vérifier – [Nom Prénom]"

Contenu : nom/prénom, email, identifiant MPR, date/heure, lien direct

### Email client (obligatoire)
Objet : "Votre identifiant MaPrimeRénov' a bien été reçu"
Corps : remerciement, rappel identifiant, explication vérification en cours

## 7. Interface admin

### Liste des dossiers
- Dossiers `pending_review` en tête de liste
- Badge "À vérifier"
- Filtre : "À valider (MPR)"

### Actions possibles
- ✅ **Valider** : "Identifiant valide"
- ❌ **Refuser** : "Identifiant incorrect" + commentaire obligatoire

### Conséquences

**Si validé** :
- `mpr_status = approved`
- Passage à l'étape 3
- Notification client

**Si refusé** :
- `mpr_status = rejected`
- Dossier reste étape 2
- Affichage côté client : statut "Refusé", message admin, bouton "Modifier"
- Email client : "Votre identifiant nécessite une correction"

## 8. API

- `POST /api/dossiers/[id]/mpr-identifier` - Soumission client
- `POST /api/admin/dossiers/[id]/mpr-validate` - Validation admin

---

# ÉTAPE 03 — Signature et dépôt du mandat administratif

**Code**: `MANDATE_SIGNATURE`
**Acteur**: Client signe
**Catégorie**: `CLIENT_ACTION`

## 1. Déclenchement

L'étape 3 devient accessible **uniquement lorsque** l'identifiant MPR (étape 2) est **validé par l'administration**.

Cette validation déclenche :
- Passage à l'étape 3
- Envoi d'un e-mail au client

## 2. Communication automatique

### E-mail envoyé au client
**Objet** : "Votre identifiant MaPrimeRénov' est validé – Signature du mandat requise"

**Contenu** :
- Confirmation de validation de l'identifiant
- Explication du rôle du mandat
- **Mandat prérempli joint en PDF**
- Indication des deux méthodes : signature manuscrite ou électronique

## 3. Écran client

### Objectif
Permettre de transmettre un mandat signé, simplement et de manière sécurisée.

### Deux options exclusives

#### Option A — Signature manuelle
- Téléchargement du mandat (PDF prérempli)
- Signature manuscrite
- Upload du document signé

#### Option B — Signature électronique
- Bouton "Signer électroniquement"
- Redirection vers le processus de signature
- Retour automatique une fois complété

## 4. Comportement selon le mode

### Cas A — Dépôt manuel

**Côté client** :
- Upload PDF uniquement
- Taille maximale définie
- Bouton : "Envoyer mon mandat signé"

**Après dépôt** :
- Message : "Mandat reçu. Vérification en cours."
- Statut : `mandat_status = pending_review`
- Blocage accès étape suivante

### Cas B — Signature électronique

**Côté client** :
- Signature complétée en ligne
- Retour automatique dans l'interface

**Après signature** :
- Message : "Votre mandat signé a bien été reçu."
- Statut : `mandat_status = approved`
- **Passage automatique** à l'étape suivante (aucune validation admin requise)

## 5. Notifications

### Admin
- À chaque dépôt manuel : "Mandat signé à vérifier – [Nom Prénom]"

### Client
- Confirmation de réception (message différent selon mode)

## 6. Interface admin

### Actions possibles
- Consulter le mandat déposé
- Valider le mandat
- Refuser avec commentaire

### Décisions

**Mandat validé** :
- Statut : `approved`
- Passage à l'étape 4
- Notification client

**Mandat refusé** :
- Statut : `rejected`
- Retour à l'étape 3
- Message explicatif visible côté client
- E-mail de demande de correction

## 7. API

- `GET /api/dossiers/[id]/mandate` - Récupérer le template
- `POST /api/dossiers/[id]/mandate/sign` - Soumettre signature
- `POST /api/admin/dossiers/[id]/mandate/validate` - Validation admin

---

# ÉTAPE 04 — Sélection des travaux éligibles

**Code**: `WORK_SELECTION`
**Acteur**: Client
**Catégorie**: `CLIENT_ACTION`

## 1. Objectif

Permettre au client d'indiquer les types de travaux envisagés pour structurer la suite du dossier.

**Aucune validation administrative requise.**

## 2. Écran client

### Travaux proposés (cases à cocher)

Le client peut sélectionner **un ou plusieurs** postes :
- ☐ Isolation / Menuiseries
- ☐ Chauffage performant
- ☐ Eau chaude sanitaire
- ☐ Ventilation

Sélection libre, aucun minimum ni maximum imposé.

### Validation

Bouton : **"Valider les travaux sélectionnés"**

Conditions d'activation :
- Au moins **une case cochée**

## 3. Comportement après validation

### Côté client
- Message de confirmation
- Information : "À l'étape suivante, vous devrez déposer les devis correspondant aux travaux sélectionnés."

### Notifications
- Notification admin informative : "Travaux sélectionnés – [Nom Prénom]"
- E-mail client de confirmation (facultatif)

### Système
- Passage automatique à l'étape 5
- Enregistrement des types de travaux sélectionnés

## 4. API

- `POST /api/dossiers/[id]/works` - Enregistrer sélection
- `GET /api/dossiers/[id]/works` - Récupérer travaux sélectionnés

---

# ÉTAPE 05 — Dépôt des devis

**Code**: `QUOTE_DEPOSIT`
**Acteur**: Client upload, Admin valide
**Catégorie**: `CLIENT_ACTION`

## 1. Objectif

Collecter l'ensemble des devis nécessaires, en fonction des travaux sélectionnés à l'étape 4.

**Validation administrative obligatoire.**

## 2. Écran client

### Structure dynamique

Pour chaque type de travaux sélectionné :
- Une **zone de dépôt dédiée**
- Possibilité de déposer **un ou plusieurs fichiers PDF**

Exemple :
- Isolation / Menuiserie → zone dédiée
- Chauffage performant → zone dédiée

### Contraintes de dépôt
- Format PDF uniquement
- Nombre de fichiers libre
- Taille maximale par fichier : 10 Mo

## 3. Validation du dépôt

### Actions obligatoires
1. Dépôt de fichiers dans chaque zone correspondante
2. Case obligatoire : "Je confirme avoir déposé l'ensemble des devis nécessaires."
3. Bouton : **"Valider le dépôt des devis"**

## 4. Comportement après validation

### Côté client
- Message : "Vos devis ont bien été transmis. Ils sont en cours de vérification."
- Statut : `devis_status = pending_review`
- Accès bloqué à l'étape suivante

### Notifications

**Admin** :
- Notification prioritaire : "Devis à vérifier – [Nom Prénom]"
- Dossier mis en avant dans la liste

**Client** :
- E-mail de confirmation de dépôt
- Rappel que la validation est en cours

## 5. Interface admin

### Actions possibles
- Consulter chaque devis
- Vérifier conformité réglementaire
- Valider l'ensemble
- Refuser (globalement ou partiellement)

### Décisions

**Devis validés** :
- Passage à l'étape 6
- Notification client

**Devis refusés** :
- Retour à l'étape 5
- Message détaillé (ex : devis manquant, non conforme)
- Client invité à corriger et redéposer

## 6. API

- `POST /api/dossiers/[id]/quotes/upload` - Upload devis
- `GET /api/dossiers/[id]/quotes` - Liste devis
- `DELETE /api/dossiers/[id]/quotes/[docId]` - Supprimer
- `POST /api/admin/dossiers/[id]/quotes/validate` - Valider devis

---

# ÉTAPE 06 — Autorisation de démarrage des travaux

**Code**: `WORK_AUTHORIZATION`
**Acteur**: Admin autorise, Client notifie démarrage
**Catégorie**: `ADMIN_ACTION` puis `CLIENT_ACTION`

## 1. Déclenchement

L'étape 6 devient accessible lorsque :
- L'ensemble des devis (étape 5) a été **validé par l'administration**
- Les notifications de validation ont été envoyées

À ce stade, le dossier est **administrativement conforme** pour le démarrage.

## 2. Communication après validation des devis

### Message client (e-mail + interface)

- Confirmation que les devis sont conformes
- Autorisation officielle de démarrer les travaux
- Rappel : "Vous pouvez désormais démarrer les travaux avec les entreprises sélectionnées."

## 3. Écran client

### Contenu informatif
- Message de confirmation de conformité
- Rappel des obligations :
  - Conserver toutes les factures
  - Conserver les attestations de fin de travaux
  - Ne pas perdre les documents originaux

### Action client

Bouton : **"Notifier le début des travaux"**

Règles :
- Cliquable une seule fois
- Confirmation demandée : "Confirmez-vous que les travaux ont bien démarré ?"

## 4. Comportement après notification

### Côté client
- Message : "Merci. Le début des travaux a bien été signalé."
- Statut : `travaux_status = in_progress`
- Accès à l'étape suivante

### Côté admin
- Notification : "Travaux démarrés – [Nom Prénom]"
- Mise à jour du statut : "Travaux en cours"

## 5. Suivi pendant les travaux

### Côté système
- Aucune action obligatoire du client
- Dossier reste en état "Travaux en cours"

### Côté admin
Possibilité d'envoyer :
- Rappels
- Messages d'information
- Notifications programmées

### Communication recommandée
Dans les semaines suivant le démarrage :
- Confirmation d'éligibilité au versement des aides
- Rappel des documents à fournir à la fin

## 6. API

- `POST /api/dossiers/[id]/work-started` - Client notifie début travaux
- `GET /api/dossiers/[id]/work-status` - Statut des travaux

---

# ÉTAPE 07 — Fin des travaux et dépôt des factures finales

**Code**: `INVOICE_DEPOSIT`
**Acteur**: Client upload, Admin valide
**Catégorie**: `CLIENT_ACTION`

## 1. Objectif

Permettre au client de :
- Déclarer la fin des travaux
- Déposer l'ensemble des **factures finales**
- Transmettre les documents nécessaires à la clôture

**Étape obligatoire pour finaliser le dossier.**

## 2. Écran client

### Structure
- Zones de dépôt similaires à l'étape devis
- Organisation par entreprise ou par type de travaux
- Acceptation de **plusieurs fichiers PDF**

### Contraintes
- Format PDF uniquement
- Taille maximale définie
- Possibilité de supprimer/remplacer avant validation

## 3. Validation du dépôt

### Actions obligatoires
1. Dépôt des factures dans les zones prévues
2. Case obligatoire : "Je confirme avoir déposé l'ensemble des factures finales correspondant aux travaux réalisés."
3. Bouton : **"Valider le dépôt des factures"**

## 4. Comportement après validation

### Côté client
- Message : "Vos factures ont bien été transmises. Elles sont en cours de vérification."
- Statut : `factures_status = pending_review`
- Modification impossible sans retour admin

### Notifications

**Admin** :
- Notification prioritaire : "Factures finales déposées – [Nom Prénom]"
- Accès direct aux documents

**Client** :
- E-mail de confirmation de dépôt

## 5. Interface admin

### Actions possibles
- Consultation de chaque facture
- Vérification :
  - Conformité avec les devis validés
  - Cohérence des montants
  - Présence des mentions obligatoires

### Décisions

**Factures conformes** :
- Statut : `factures_status = approved`
- Passage à l'étape finale
- Notification client

**Factures non conformes** :
- Statut : `factures_status = rejected`
- Message détaillé côté client
- Possibilité de redéposer

## 6. API

- `POST /api/dossiers/[id]/invoices/upload` - Upload facture
- `GET /api/dossiers/[id]/invoices` - Liste factures
- `DELETE /api/dossiers/[id]/invoices/[docId]` - Supprimer
- `POST /api/admin/dossiers/[id]/invoices/validate` - Valider factures

---

# ÉTAPE 08 — Récapitulatif final et clôture

**Code**: `FINAL_RECAP`
**Acteur**: Admin finalise, Client consulte
**Catégorie**: `FINAL`

## 1. Objectif

L'étape 8 constitue **l'écran de clôture et de synthèse du dossier**.

Buts :
- Récapituler l'ensemble des informations administratives
- Permettre de consulter et télécharger tous les documents
- Informer sur l'état du versement des aides

**Cette étape n'est pas bloquante et reste accessible après clôture.**

## 2. Accès et statut

### Condition d'accès
- Factures finales validées
- Dossier administrativement complet
- Aucune action client requise

### Statut global
- `Statut : Dossier clôturé`
- `Dossier actif : Non`

## 3. Écran client - Structure

### Section 1 — Informations générales

| Élément | Description |
|---------|-------------|
| Numéro de dossier KOPRO | Référence unique interne |
| Identité du client | Nom + prénom |
| Identifiant MaPrimeRénov' | MPR-XXXXXX |
| Date de création | Date |
| Date de clôture | Date |
| Statut global | Clôturé |

### Section 2 — Travaux réalisés

- Liste des travaux effectués :
  - Isolation / Menuiseries
  - Chauffage performant
  - Eau chaude sanitaire
  - Ventilation
- Uniquement les travaux réellement réalisés
- Entreprises intervenantes (si disponibles)
- Dates de réalisation (si disponibles)

### Section 3 — Montants & aides

| Élément | Description |
|---------|-------------|
| Montant total des travaux | Total facturé |
| Montant des aides estimées | MaPrimeRénov' + CEE |
| Statut du versement | En cours / Validé / Versé |
| Date prévisionnelle | Estimation |

⚠️ Mention : "Les délais de versement peuvent varier selon les organismes."

### Section 4 — Documents du dossier

**Catégories** :
1. **Documents administratifs** : Mandat signé, attestations
2. **Documents techniques** : Devis validés, factures finales, attestations fin travaux

**Affichage** :
- Par catégorie
- Chaque document : nom clair, date de dépôt, bouton "Télécharger"
- Documents en lecture seule

### Section 5 — Message de clôture

> "Votre dossier est désormais complet.
> Les démarches liées au versement des aides sont en cours.
> Vous pouvez retrouver l'ensemble des documents ci-dessous."

## 4. Navigation post-clôture

### Retour tableau de bord
Bouton : **"Retour au tableau de bord"**

## 5. Contraintes

- Dossier clôturé :
  - Consultable à tout moment
  - Non modifiable
- Documents accessibles sans limite de durée
- Informations correspondent à l'état réel du dossier

## 6. Notifications finales

### Client
- E-mail de clôture du dossier
- Récapitulatif synthétique
- Information sur les délais de versement

### Admin
- Notification : "Dossier clôturé – prêt pour versement des aides"

## 7. API

- `GET /api/dossiers/[id]/recap` - Récapitulatif complet
- `GET /api/dossiers/[id]/documents/download-all` - Téléchargement groupé
- `POST /api/admin/dossiers/[id]/finalize` - Clôture admin

---

# Types de travaux

```typescript
const WORK_TYPES = [
  { code: 'ISOLATION', label: 'Isolation / Menuiseries' },
  { code: 'HEATING', label: 'Chauffage performant' },
  { code: 'HOT_WATER', label: 'Eau chaude sanitaire' },
  { code: 'VENTILATION', label: 'Ventilation' },
] as const
```

---

# Statuts des Étapes

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

# Comptes de Test

```
Client: client@exemple.fr / client123
Admin: admin@kopro.fr / admin123
```

---

# Interface Client

## Navigation (Sidebar)

L'ordre des éléments de la sidebar côté client :

1. **Accueil** - Tableau de bord principal avec progression et activités récentes
2. **Mon dossier** - Détail du dossier avec formulaires d'étapes (badge de notification si action requise)
3. **Mon profil** - Informations personnelles, modification email/mot de passe
4. **Aide & support** - Contact et FAQ

## Notifications & Sons

- **TopBar fixe** en haut à droite de l'écran (visible sur toutes les pages)
- Contient : icône Son (toggle) + icône Cloche (notifications)
- Dropdown notifications avec liste et bouton "Tout marquer comme lu"
- Pas d'onglet notifications séparé

## Chat / Messagerie

- **Bulle flottante** en bas à droite
- S'ouvre/se ferme au clic sur le bouton ou via "Envoyer un message"
- Pas de page messages séparée

## Activités Récentes

Les libellés sont formulés de manière conviviale pour le client :

| Code | Libellé affiché |
|------|-----------------|
| `CLIENT_CREATED` | Bienvenue sur KOPRO |
| `LOGIN` | Connexion à votre espace |
| `MPR_ID_SUBMITTED` | Identifiant MPR enregistré |
| `MPR_ID_VALIDATED` | Identifiant MPR validé |
| `MPR_ID_REJECTED` | Identifiant MPR à corriger |
| `MANDATE_SUBMITTED` | Mandat envoyé |
| `MANDATE_VALIDATED` | Mandat validé |
| `WORKS_SELECTED` | Travaux sélectionnés |
| `QUOTES_SUBMITTED` | Devis envoyés |
| `QUOTES_VALIDATED` | Devis validés |
| `WORK_STARTED` | Début des travaux signalé |
| `INVOICES_SUBMITTED` | Factures envoyées |
| `INVOICES_VALIDATED` | Factures validées |
| `DOSSIER_FINALIZED` | Dossier finalisé |
| `STEP_VALIDATED` | Votre étape a été validée |
| `STEP_REJECTED` | Une correction est nécessaire |
| `DOCUMENT_UPLOAD` | Document ajouté |
| `DOCUMENT_REJECTED` | Document à remplacer |
| `MESSAGE_SENT` | Message envoyé |
| `MESSAGE_RECEIVED` | Nouveau message reçu |
| `PROFILE_UPDATE` | Profil mis à jour |
| `PASSWORD_CHANGED` | Mot de passe modifié |
| `EMAIL_CHANGED` | Adresse email modifiée |

---

# Design System UI/UX

## Palette de Couleurs

### Variables CSS (globals.css)

```css
:root {
  --accent: #7645fb;        /* Violet principal */
  --accent-2: #fba045;      /* Orange accent */
  --light-cream: #fafbfd;   /* Fond clair */
  --dark: #212121;          /* Texte foncé */
  --white: #ffffff;
  --required: #f16161;      /* Rouge erreur/requis */
  --grey: #bcbcbc;          /* Gris secondaire */
  --light-purple: #e6ddff;  /* Violet clair */
  --success: #1cc562;       /* Vert succès */
}
```

### Tailwind Config (couleurs)

```typescript
colors: {
  primary: {
    50: '#f5f2ff',
    100: '#ebe5ff',
    200: '#d9ccff',
    300: '#bea6ff',
    400: '#9f73ff',
    500: '#8347ff',
    600: '#7645fb',  // Couleur principale
    700: '#6225e6',
    800: '#521ec2',
    900: '#451b9e',
    950: '#290d6b',
  },
  accent: {
    DEFAULT: '#7645fb',
    light: '#e6ddff',
    orange: '#fba045',
  },
  kopro: {
    cream: '#fafbfd',
    dark: '#212121',
    required: '#f16161',
    grey: '#bcbcbc',
    purple: '#e6ddff',
    success: '#1cc562',
  },
}
```

## Typographie

- **Police principale** : Poppins (Google Fonts)
- **Poids disponibles** : 300, 400, 500, 600, 700

## Composants de Base

### Boutons (btn-*)

- `btn-primary` : Violet avec ombre, arrondi pill (8em)
- `btn-secondary` : Fond violet clair, texte violet
- `btn-outline` : Bordure violet, fond transparent
- `btn-ghost` : Sans fond, texte foncé
- `btn-danger` : Rouge pour actions destructives

Comportement au survol : scale(0.95) avec transition

### Inputs (input-field)

- Pas de bordure visible
- Ombres douces (box-shadow)
- Focus : anneau violet clair
- Erreur : anneau rouge

### Cards (card)

- Fond blanc, coins arrondis (2xl)
- Bordure subtile violet clair
- Ombre au survol

## Layout Dashboard

### Structure

```
┌─────────────────────────────────────────────────┐
│ [TopBar: Son + Notifications]          (fixe)  │
├──────────┬──────────────────────────────────────┤
│          │                                      │
│ Sidebar  │           Main Content               │
│ (fixe)   │                                      │
│          │                                      │
│  Logo    │                                      │
│  Nav     │                                      │
│  ...     │                                      │
│  User    │                                      │
│          │                                      │
└──────────┴──────────────────────────────────────┘
│         [Logo Watermark 5%]           (fond)   │
└─────────────────────────────────────────────────┘
```

### Background

- Gradient : `linear-gradient(180deg, white, hsla(256.15deg, 95.79%, 62.75%, 0.12))`
- Logo watermark en bas à droite (opacity 5%)

### Sidebar

- Largeur : 72 (étendu) / 20 (replié)
- Logo KOPRO : h-10
- Navigation avec icônes dans des carrés arrondis
- Badge notification rouge (`bg-kopro-required`)
- Profil utilisateur en bas avec avatar et badge vérifié

### TopBar (position fixe en haut à droite)

- Icône Son (toggle)
- Icône Cloche (notifications dropdown)
- Visible sur toutes les pages du dashboard

## Timeline de Progression

### Couleurs des étapes

| Status | Couleur cercle | Animation |
|--------|----------------|-----------|
| VALIDATED | `bg-kopro-success` (vert) | - |
| IN_PROGRESS | `bg-accent` (violet) | `animate-pulse-soft` |
| AVAILABLE | `bg-accent` (violet) | `animate-pulse-soft` |
| PENDING_VALIDATION | `bg-accent` (violet) | `animate-pulse-soft` |
| BLOCKED | `bg-kopro-required` (rouge) | - |
| LOCKED | `bg-gray-300` | - |

### Ligne de connexion

- Étapes validées : `bg-kopro-success`
- Autres : `bg-gray-200`

## Sons (Web Audio API)

### Types de sons disponibles

- `click` : Son subtil au clic (boutons, liens)
- `message` : Nouveau message reçu
- `notification` : Notification
- `success` : Action réussie
- `error` : Erreur

### Utilisation

```typescript
import { useSoundToggle, useSound } from '@/hooks/use-sound'

const { soundEnabled } = useSoundToggle()
const { play } = useSound({ enabled: soundEnabled })

// Jouer un son
play('click')
```

### Composants avec sons intégrés

- `<Button>` : Son de clic automatique (désactivable via `playSound={false}`)
- Sidebar : Sons sur les liens de navigation

## Animations CSS

```css
.animate-fade-in     /* Fade + translateY */
.animate-scale-in    /* Scale de 0.95 à 1 */
.animate-slide-up    /* Slide de bas en haut */
.animate-pulse-soft  /* Pulsation douce (opacity) */
.animate-bounce-soft /* Rebond léger */
.animate-float       /* Flottement */
```

## Fichiers Clés UI

| Fichier | Description |
|---------|-------------|
| `src/app/globals.css` | Variables CSS, classes utilitaires |
| `tailwind.config.ts` | Configuration couleurs, fonts, ombres |
| `src/components/ui/button.tsx` | Composant Button avec sons |
| `src/components/ui/input.tsx` | Composant Input stylé |
| `src/components/ui/card.tsx` | Composant Card |
| `src/components/layout/sidebar.tsx` | Sidebar avec navigation |
| `src/components/layout/top-bar.tsx` | Barre supérieure (son + notifications) |
| `src/hooks/use-sound.ts` | Hook pour les sons |
| `src/components/dashboard/horizontal-timeline.tsx` | Timeline horizontale |
| `src/components/dashboard/step-timeline.tsx` | Timeline détaillée verticale |

---

# Commandes Utiles

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
```
