# E-Learning Platform Database Schema (Révision)

Ce document définit la structure de base de données standardisée pour la plateforme E-Learning, alignée avec le diagramme de classe fourni.

## Directives Générales

1. **Convention de Nommage**: Tous les chemins et noms de champs utilisent l'anglais.
2. **Structure des Chemins**: Toutes les données sont stockées sous le chemin racine `/elearning`.
3. **IDs**: Utiliser des IDs générés par Firebase (push IDs) pour toutes les collections.
4. **Horodatages**: Tous les champs d'horodatage utilisent le format ISO (YYYY-MM-DDTHH:mm:ss.sssZ).
5. **Références**: Les références à d'autres entités utilisent leurs IDs.

## Structure de la Base de Données

```
/elearning
  /users                     # Tous les comptes utilisateurs
    /{userId}                # Données utilisateur individuelles
      - id                   # ID utilisateur (identique à l'UID Firebase Auth)
      - firstName            # Prénom de l'utilisateur
      - lastName             # Nom de famille de l'utilisateur
      - email                # Adresse email de l'utilisateur
      - role                 # Rôle utilisateur: "student", "instructor", ou "admin"
      - progress             # Progression globale (pourcentage)
      - enrollments          # Tableau des IDs de cours auxquels l'utilisateur est inscrit
      - bio                  # Biographie (pour les instructeurs)
      - expertise            # Domaines d'expertise (pour les instructeurs)
      - courses              # Tableau des IDs de cours enseignés (pour les instructeurs)
      - permissions          # Permissions (pour les administrateurs)
      - createdAt            # Horodatage de création du compte
      - updatedAt            # Horodatage de dernière mise à jour
      - avatar               # URL vers l'image d'avatar de l'utilisateur
      
  /courses                   # Tous les cours
    /{courseId}              # Cours individuel
      - id                   # ID du cours
      - title                # Titre du cours
      - description          # Description du cours
      - content              # Aperçu du contenu du cours
      - duration             # Durée du cours en heures
      - image                # URL vers l'image du cours
      - instructorId         # Référence à l'ID de l'instructeur
      - specialiteId         # Référence à la spécialité du cours
      - level                # Niveau du cours: "beginner", "intermediate", "advanced"
      - price                # Prix du cours
      - rating               # Note moyenne du cours
      - totalRatings         # Nombre de notes
      - createdAt            # Horodatage de création
      - updatedAt            # Horodatage de dernière mise à jour
      - modules              # Objet contenant les références aux modules
        /{moduleId}          # Référence au module (valeur booléenne)
      
  /modules                   # Tous les modules
    /{moduleId}              # Module individuel
      - id                   # ID du module
      - courseId             # Référence au cours parent
      - title                # Titre du module
      - description          # Description du module
      - order                # Ordre dans le cours
      - content              # Contenu du module
      - duration             # Durée du module en minutes
      - resources            # Tableau d'objets ressource
        - title              # Titre de la ressource
        - type               # Type de ressource: "video", "pdf", "link"
        - url                # URL de la ressource
      - createdAt            # Horodatage de création
      - updatedAt            # Horodatage de dernière mise à jour
      
  /evaluations               # Toutes les évaluations
    /{evaluationId}          # Évaluation individuelle
      - id                   # ID de l'évaluation
      - moduleId             # Référence au module parent
      - title                # Titre de l'évaluation
      - type                 # Type d'évaluation: "quiz", "assignment"
      - description          # Description de l'évaluation
      - maxScore             # Score maximum possible
      - passingScore         # Score minimum pour réussir
      - createdAt            # Horodatage de création
      - updatedAt            # Horodatage de dernière mise à jour
      
  /questions                 # Toutes les questions
    /{questionId}            # Question individuelle
      - id                   # ID de la question
      - evaluationId         # Référence à l'évaluation parente
      - text                 # Texte de la question
      - options              # Tableau d'options de réponse
      - correctAnswer        # Réponse correcte
      - points               # Points attribués à cette question
  
  /enrollments               # Inscriptions aux cours
    /{enrollmentId}          # Inscription individuelle
      - userId               # Référence à l'utilisateur inscrit
      - courseId             # Référence au cours
      - enrolledAt           # Horodatage d'inscription
      - status               # Statut d'inscription: "active", "completed", "paused"
          
  /progress                  # Suivi de progression utilisateur
    /{progressId}            # ID de progression
      - courseId             # Référence au cours
      - userId               # Référence à l'utilisateur
      - startDate            # Date de début du cours par l'utilisateur
      - progress             # Pourcentage de progression globale
      - completed            # Si le cours est terminé
      - lastUpdated          # Horodatage de dernière mise à jour
      - moduleProgress       # Objet contenant la progression par module
        /{moduleId}          # Progression du module
          - moduleId         # Référence au module
          - completed        # Si le module est terminé
          - score            # Score de l'utilisateur pour ce module
          - lastUpdated      # Horodatage de dernière mise à jour
          
  /feedback                  # Commentaires des utilisateurs sur les cours
    /{feedbackId}            # Commentaire individuel
      - id                   # ID du commentaire
      - userId               # Utilisateur ayant fourni le commentaire
      - courseId             # Cours concerné par le commentaire
      - rating               # Note numérique (1-5)
      - comment              # Commentaire textuel
      - createdAt            # Horodatage de création
      
  /specialites               # Spécialités de cours
    /{specialiteId}          # Spécialité individuelle
      - id                   # ID de la spécialité
      - name                 # Nom de la spécialité
      - description          # Description de la spécialité
      - disciplines          # Tableau des IDs de disciplines dans cette spécialité
      
  /disciplines               # Disciplines
    /{disciplineId}          # Discipline individuelle
      - id                   # ID de la discipline
      - name                 # Nom de la discipline
      - description          # Description de la discipline
      - specialiteId         # Référence à la spécialité parente
      
  /settings                  # Paramètres de l'application
    - siteTitle              # Titre du site
    - siteDescription        # Description du site
    - contactEmail           # Email de contact
    - featuredCourses        # Tableau des IDs de cours en vedette
```

## Types de Données

### Rôles Utilisateur
- `student`: Apprenant régulier qui s'inscrit aux cours
- `instructor`: Enseignant qui crée et gère des cours
- `admin`: Administrateur avec accès complet au système

### Niveaux de Cours
- `beginner`: Pour débutants sans connaissances préalables
- `intermediate`: Pour utilisateurs avec connaissances de base
- `advanced`: Pour utilisateurs avec connaissances substantielles

### Types de Ressources
- `video`: Contenu vidéo (cours, démonstrations)
- `pdf`: Documents PDF (lectures, fiches de travail)
- `link`: Liens externes vers des ressources supplémentaires

### Types d'Évaluation
- `quiz`: Questions à choix multiples ou à réponses courtes
- `assignment`: Projet ou devoir à soumettre

### Statut d'Inscription
- `active`: Suit actuellement le cours
- `completed`: A terminé le cours
- `paused`: A temporairement arrêté de suivre le cours

## Exemples de Données

### Exemple d'Utilisateur
```json
{
  "id": "user123",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "role": "student",
  "progress": 35.5,
  "enrollments": ["course456", "course789"],
  "createdAt": "2025-03-01T10:30:52.592Z",
  "updatedAt": "2025-03-15T14:22:10.123Z",
  "avatar": "https://example.com/avatars/john.jpg"
}
```

### Exemple de Cours
```json
{
  "id": "course456",
  "title": "Web Development Fundamentals",
  "description": "Learn the basics of web development",
  "content": "HTML, CSS, JavaScript basics",
  "duration": 40,
  "image": "https://example.com/images/webdev.jpg",
  "instructorId": "user789",
  "specialiteId": "spec123",
  "level": "beginner",
  "price": 29.99,
  "rating": 4.8,
  "totalRatings": 24,
  "createdAt": "2025-02-15T08:45:30.000Z",
  "updatedAt": "2025-03-10T11:20:15.000Z",
  "modules": {
    "module1": true,
    "module2": true
  }
}
```

### Exemple de Module
```json
{
  "id": "module1",
  "courseId": "course456",
  "title": "Introduction to HTML",
  "description": "Learn the basics of HTML markup",
  "order": 1,
  "content": "HTML structure, elements, attributes...",
  "duration": 60,
  "resources": [
    {
      "title": "HTML Basics Video",
      "type": "video",
      "url": "https://example.com/videos/html-basics.mp4"
    },
    {
      "title": "HTML Cheatsheet",
      "type": "pdf",
      "url": "https://example.com/pdfs/html-cheatsheet.pdf"
    }
  ],
  "createdAt": "2025-02-16T09:30:00.000Z",
  "updatedAt": "2025-02-16T09:30:00.000Z"
}
```

## Notes de Migration

Lors de la migration de l'ancienne structure vers cette nouvelle structure standardisée:

1. Fusionner les données utilisateur en un seul nœud `/elearning/users` avec des champs basés sur le rôle
2. Remplacer `category` par `specialiteId` dans les cours
3. Structurer les questions comme une collection indépendante
4. Créer les collections `specialites` et `disciplines` pour remplacer `categories`
5. Assurer la cohérence des références entre entités

## Meilleures Pratiques

1. **Validation**: Toujours valider les données par rapport à ce schéma avant d'écrire dans la base de données
2. **Transactions**: Utiliser les transactions Firebase pour les opérations qui mettent à jour plusieurs chemins
3. **Indexation**: Créer des index de base de données appropriés pour les champs fréquemment interrogés
4. **Règles de Sécurité**: Implémenter des règles de sécurité Firebase basées sur ce schéma
5. **Versionnement**: Lors des modifications de schéma, les documenter avec des numéros de version

## Journal des Modifications

- **v2.0.0** (2025-04-06): Révision majeure du schéma basée sur le diagramme de classe
- **v1.0.0** (2025-04-05): Documentation initiale du schéma