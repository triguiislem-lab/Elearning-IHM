# Plateforme E-Learning

Cette application est une plateforme d'apprentissage en ligne développée avec React, Vite et Firebase, conçue pour offrir une expérience d'apprentissage fluide aux étudiants, formateurs et administrateurs.

## 🌟 Fonctionnalités

### Pour les Étudiants
- Parcourir et s'inscrire aux cours par spécialités et disciplines
- Accéder aux matériels de cours incluant vidéos, PDFs et autres ressources
- Passer des évaluations et suivre sa progression
- Communiquer avec les formateurs via messagerie
- Tableau de bord personnalisé avec les cours inscrits

### Pour les Formateurs
- Créer et gérer des cours avec structure modulaire
- Télécharger différents types de ressources d'apprentissage
- Créer des évaluations et des tests
- Suivre la progression et l'engagement des étudiants
- Communiquer avec les étudiants

### Pour les Administrateurs
- Gérer les utilisateurs, rôles et permissions
- Organiser les cours par spécialités et disciplines
- Surveiller l'utilisation et les performances de la plateforme
- Outils de standardisation et maintenance de la base de données

## 🚀 Technologies Utilisées

- **Frontend**: React 18, React Router v7, Tailwind CSS
- **Outil de Build**: Vite
- **Backend**: Firebase (Authentification, Base de données Realtime)
- **Gestion d'État**: React Hooks
- **Composants UI**: Composants personnalisés avec Tailwind CSS
- **Média**: React Player, React PDF
- **Animations**: Framer Motion
- **Déploiement**: Netlify

## 📋 Prérequis

- Node.js (v16 ou supérieur)
- npm ou yarn
- Compte Firebase

## 🔧 Installation

1. Cloner le dépôt:
   ```bash
   git clone https://github.com/triguiislem-lab/Elearning-IHM/tree/master
   
   ```

2. Installer les dépendances:
   ```bash
   npm install
   ```

3. Démarrer le serveur de développement:
   ```bash
   npm run dev
   ```

4. Construire pour la production:
   ```bash
   npm run build
   ```

## 🔥 Configuration Firebase

Pour améliorer les performances de l'application, des index Firebase ont été configurés. Veuillez consulter le fichier [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) pour les instructions de déploiement des règles et index.

1. Installer Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Se connecter à Firebase:
   ```bash
   firebase login
   ```

3. Initialiser Firebase dans votre projet:
   ```bash
   firebase init
   ```
   - Sélectionner "Database"
   - Choisir votre projet Firebase
   - Accepter les valeurs par défaut pour les autres questions

   ```



Pour plus de détails sur les optimisations effectuées, consultez les fichiers :
- [PERFORMANCE_OPTIMIZATIONS.md](./PERFORMANCE_OPTIMIZATIONS.md)
- [LOADING_OPTIMIZATION.md](./LOADING_OPTIMIZATION.md)
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

## 📁 Structure du projet

```
plateforme-e-learning/
├── public/                  # Fichiers statiques
├── src/
│   ├── components/          # Composants réutilisables
│   │   ├── Admin/           # Composants spécifiques à l'admin
│   │   ├── Auth/            # Composants d'authentification
│   │   ├── Common/          # Composants partagés
│   │   ├── Courses/         # Composants liés aux cours
│   │   ├── Layout/          # Composants de mise en page
│   │   └── ...
│   ├── hooks/               # Hooks React personnalisés
│   ├── pages/               # Composants de pages
│   │   ├── Admin/           # Pages d'administration
│   │   ├── Auth/            # Pages d'authentification
│   │   ├── Dashboard/       # Pages de tableau de bord
│   │   ├── Instructor/      # Pages de formateur
│   │   └── ...
│   ├── utils/               # Fonctions utilitaires
│   ├── App.jsx              # Composant principal de l'application
│   ├── main.jsx             # Point d'entrée
│   └── ...
├── docs/                    # Documentation
├── firebase.json            # Configuration Firebase
├── database.rules.json      # Règles de base de données Firebase
├── vite.config.js           # Configuration Vite
├── tailwind.config.js       # Configuration Tailwind CSS
└── package.json             # Dépendances du projet
```
## inspiration
https://github.com/dilshad-ahmed/e-tutor

https://github.com/codewithsadee/eduweb



