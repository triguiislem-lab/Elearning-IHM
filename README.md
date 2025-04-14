# Plateforme E-Learning

Cette application est une plateforme d'apprentissage en ligne développée avec React, Vite et Firebase.

## Installation

```bash
npm install
npm run dev
```

## Configuration Firebase

Pour améliorer les performances de l'application, des index Firebase ont été configurés. Veuillez consulter le fichier [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) pour les instructions de déploiement des règles et index.

## Optimisations de performance

Plusieurs optimisations ont été implémentées pour améliorer les performances de l'application :

1. **Suppression des appels à console** : 477 appels à console ont été supprimés pour améliorer les performances.
2. **Unification des animations de chargement** : Toutes les animations de chargement ont été unifiées pour une expérience cohérente et de meilleures performances.
3. **Mise en cache des données Firebase** : Les données fréquemment utilisées sont mises en cache pour réduire le nombre d'appels à Firebase.
4. **Chargement différé des composants** : Les composants sont chargés uniquement lorsqu'ils sont nécessaires.
5. **Optimisation des images** : Les images sont chargées de manière différée pour améliorer les temps de chargement.
6. **Index Firebase** : Des index ont été configurés pour accélérer les requêtes Firebase.

Pour plus de détails sur les optimisations effectuées, consultez les fichiers :
- [PERFORMANCE_OPTIMIZATIONS.md](./PERFORMANCE_OPTIMIZATIONS.md)
- [LOADING_OPTIMIZATION.md](./LOADING_OPTIMIZATION.md)
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

## Structure du projet

- `src/` : Code source de l'application
  - `components/` : Composants réutilisables
  - `pages/` : Pages de l'application
  - `utils/` : Utilitaires et fonctions d'aide
  - `hooks/` : Hooks personnalisés
- `public/` : Fichiers statiques
- `database.rules.json` : Règles et index Firebase
