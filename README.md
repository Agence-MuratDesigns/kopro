# KOPRO - Application de suivi MaPrimeRénov'

Application web sécurisée permettant aux particuliers accompagnés par KOPRO (Mon Accompagnateur Rénov' agréé) de suivre l'avancement de leur dossier administratif MaPrimeRénov' et CEE.

## Fonctionnalités

- **Parcours séquentiel** : 16 étapes structurées de l'éligibilité au versement des aides
- **Sécurité** : Authentification JWT, validation des données, protection des routes
- **Gestion documentaire** : Upload, validation et suivi des documents requis
- **Messagerie intégrée** : Communication directe entre clients et conseillers KOPRO
- **Notifications en temps réel** : Alertes automatiques à chaque étape
- **Tableau de bord admin** : Suivi global des dossiers et validation des étapes

## Technologies

- **Frontend** : Next.js 14 (App Router), React, TypeScript
- **Styling** : Tailwind CSS
- **Base de données** : SQLite (Prisma ORM)
- **Authentification** : JWT (jose)

## Installation

```bash
# Installer les dépendances
npm install

# Générer le client Prisma
npm run db:generate

# Initialiser la base de données
npm run db:push

# Seed des données de démonstration
npm run db:seed

# Lancer le serveur de développement
npm run dev
```

## Comptes de démonstration

- **Client** : client@exemple.fr / client123
- **Admin** : admin@kopro.fr / admin123
- **Conseiller** : conseiller@kopro.fr / admin123

## Structure du projet

```
src/
├── app/
│   ├── (auth)/          # Pages d'authentification
│   ├── (dashboard)/     # Dashboard client
│   ├── (admin)/         # Dashboard admin
│   └── api/             # Routes API
├── components/
│   ├── ui/              # Composants UI réutilisables
│   ├── layout/          # Composants de layout
│   └── dashboard/       # Composants spécifiques dashboard
├── lib/
│   ├── auth.ts          # Logique d'authentification
│   ├── prisma.ts        # Client Prisma
│   ├── dossier-service.ts # Service de gestion des dossiers
│   └── utils.ts         # Utilitaires
└── types/               # Types TypeScript
```

## Les 16 étapes du parcours

1. Vérification éligibilité
2. Documents initiaux
3. Signature du mandat
4. Audit énergétique
5. Collecte des devis
6. Validation des devis
7. Dépôt demande MaPrimeRénov'
8. Accord MaPrimeRénov'
9. Dépôt demande CEE
10. Démarrage des travaux
11. Suivi des travaux
12. Fin des travaux
13. Contrôle de conformité
14. Demande solde MaPrimeRénov'
15. Versement prime CEE
16. Clôture du dossier

## Licence

Propriétaire - KOPRO
