/**
 * Fonction pour générer un quiz statique en fonction du type de module
 * @param {Object} moduleInfo - Informations sur le module
 * @returns {Object} - Quiz généré
 */
export const createStaticQuiz = (moduleInfo) => {
  // Quiz pour les modules de programmation
  const programmingQuiz = {
    id: `quiz_${Date.now()}`,
    title: `Évaluation: ${moduleInfo.title || moduleInfo.titre || 'Module de programmation'}`,
    description: `Quiz pour évaluer vos connaissances sur ${moduleInfo.title || moduleInfo.titre || 'la programmation'}`,
    questions: [
      {
        id: '1',
        question: 'Quel langage est principalement utilisé pour le développement web côté client?',
        options: ['JavaScript', 'Java', 'Python', 'C++'],
        correctAnswer: 0,
        explanation: 'JavaScript est le langage principal pour le développement web côté client.'
      },
      {
        id: '2',
        question: 'Qu\'est-ce que React?',
        options: [
          'Une bibliothèque JavaScript pour construire des interfaces utilisateur',
          'Un langage de programmation',
          'Un système de gestion de base de données',
          'Un serveur web'
        ],
        correctAnswer: 0,
        explanation: 'React est une bibliothèque JavaScript pour construire des interfaces utilisateur.'
      },
      {
        id: '3',
        question: 'Qu\'est-ce que CSS?',
        options: [
          'Un langage de programmation',
          'Un langage de feuilles de style',
          'Un système de gestion de base de données',
          'Un protocole de communication'
        ],
        correctAnswer: 1,
        explanation: 'CSS (Cascading Style Sheets) est un langage de feuilles de style utilisé pour décrire la présentation d\'un document écrit en HTML.'
      },
      {
        id: '4',
        question: 'Quelle est la différence entre let et var en JavaScript?',
        options: [
          'Aucune différence',
          'let a une portée de bloc, var a une portée de fonction',
          'var est plus récent que let',
          'let ne peut pas être réassigné'
        ],
        correctAnswer: 1,
        explanation: 'let a une portée de bloc, tandis que var a une portée de fonction.'
      },
      {
        id: '5',
        question: 'Qu\'est-ce qu\'une API RESTful?',
        options: [
          'Un type de base de données',
          'Un langage de programmation',
          'Une interface de programmation qui utilise HTTP et les principes REST',
          'Un framework JavaScript'
        ],
        correctAnswer: 2,
        explanation: 'Une API RESTful est une interface de programmation qui utilise HTTP et les principes REST pour communiquer entre systèmes.'
      },
      {
        id: '6',
        question: 'Qu\'est-ce que Git?',
        options: [
          'Un langage de programmation',
          'Un système de contrôle de version',
          'Un framework JavaScript',
          'Un système de gestion de base de données'
        ],
        correctAnswer: 1,
        explanation: 'Git est un système de contrôle de version distribué pour suivre les changements dans le code source.'
      },
      {
        id: '7',
        question: 'Qu\'est-ce que Node.js?',
        options: [
          'Un framework frontend',
          'Un environnement d\'exécution JavaScript côté serveur',
          'Une base de données',
          'Un langage de programmation'
        ],
        correctAnswer: 1,
        explanation: 'Node.js est un environnement d\'exécution JavaScript côté serveur qui permet d\'exécuter du code JavaScript en dehors d\'un navigateur.'
      },
      {
        id: '8',
        question: 'Qu\'est-ce que SQL?',
        options: [
          'Un langage de programmation orienté objet',
          'Un langage de requête pour les bases de données relationnelles',
          'Un framework JavaScript',
          'Un protocole de communication'
        ],
        correctAnswer: 1,
        explanation: 'SQL (Structured Query Language) est un langage de requête utilisé pour communiquer avec les bases de données relationnelles.'
      },
      {
        id: '9',
        question: 'Qu\'est-ce que le DOM?',
        options: [
          'Un langage de programmation',
          'Une base de données',
          'Une représentation en mémoire de la structure HTML d\'une page web',
          'Un framework JavaScript'
        ],
        correctAnswer: 2,
        explanation: 'Le DOM (Document Object Model) est une représentation en mémoire de la structure HTML d\'une page web, qui permet aux scripts de modifier le contenu et la structure de la page.'
      },
      {
        id: '10',
        question: 'Qu\'est-ce que HTTPS?',
        options: [
          'Un langage de programmation',
          'Un protocole de communication sécurisé',
          'Un framework JavaScript',
          'Un système de gestion de base de données'
        ],
        correctAnswer: 1,
        explanation: 'HTTPS (HyperText Transfer Protocol Secure) est une version sécurisée du protocole HTTP, qui utilise SSL/TLS pour chiffrer les communications.'
      }
    ],
    timeLimit: 600, // 10 minutes
    passingScore: 70,
    createdAt: new Date().toISOString()
  };
  
  // Quiz pour les modules de design
  const designQuiz = {
    id: `quiz_${Date.now()}`,
    title: `Évaluation: ${moduleInfo.title || moduleInfo.titre || 'Module de design'}`,
    description: `Quiz pour évaluer vos connaissances sur ${moduleInfo.title || moduleInfo.titre || 'le design'}`,
    questions: [
      {
        id: '1',
        question: 'Qu\'est-ce que l\'UX design?',
        options: [
          'User Experience Design - Conception de l\'expérience utilisateur',
          'User Extension Design - Conception d\'extensions utilisateur',
          'User Exit Design - Conception de sorties utilisateur',
          'User Extreme Design - Conception extrême pour l\'utilisateur'
        ],
        correctAnswer: 0,
        explanation: 'L\'UX design (User Experience Design) est le processus de création de produits qui fournissent des expériences significatives et pertinentes aux utilisateurs.'
      },
      {
        id: '2',
        question: 'Quelle est la différence entre UX et UI design?',
        options: [
          'Il n\'y a pas de différence',
          'L\'UX concerne l\'expérience globale, l\'UI concerne l\'interface visuelle',
          'L\'UI est plus important que l\'UX',
          'L\'UX est un sous-ensemble de l\'UI'
        ],
        correctAnswer: 1,
        explanation: 'L\'UX (User Experience) concerne l\'expérience globale de l\'utilisateur, tandis que l\'UI (User Interface) se concentre sur l\'aspect visuel et l\'interaction avec l\'interface.'
      },
      {
        id: '3',
        question: 'Qu\'est-ce que la théorie des couleurs?',
        options: [
          'Une théorie scientifique sur la formation des couleurs dans la nature',
          'Un ensemble de règles pour mélanger les peintures',
          'Un guide pour l\'utilisation des couleurs dans le design',
          'Une théorie sur la perception des couleurs par les animaux'
        ],
        correctAnswer: 2,
        explanation: 'La théorie des couleurs est un ensemble de principes utilisés pour créer des combinaisons de couleurs harmonieuses dans le design.'
      },
      {
        id: '4',
        question: 'Qu\'est-ce que la typographie?',
        options: [
          'L\'art d\'imprimer des livres',
          'L\'art et la technique de disposer les caractères typographiques',
          'L\'art de dessiner des logos',
          'L\'art de créer des polices de caractères'
        ],
        correctAnswer: 1,
        explanation: 'La typographie est l\'art et la technique de disposer les caractères typographiques afin de rendre le texte lisible et visuellement attrayant.'
      },
      {
        id: '5',
        question: 'Qu\'est-ce que le design responsive?',
        options: [
          'Un design qui répond aux commentaires des utilisateurs',
          'Un design qui s\'adapte à différentes tailles d\'écran',
          'Un design qui change de couleur en fonction de l\'heure de la journée',
          'Un design qui répond aux mouvements de la souris'
        ],
        correctAnswer: 1,
        explanation: 'Le design responsive est une approche de conception qui permet aux pages web de s\'adapter à différentes tailles d\'écran et appareils.'
      },
      {
        id: '6',
        question: 'Qu\'est-ce que la grille en design?',
        options: [
          'Un outil pour dessiner des lignes droites',
          'Un système de lignes horizontales et verticales pour organiser le contenu',
          'Un type de papier utilisé par les designers',
          'Un logiciel de design graphique'
        ],
        correctAnswer: 1,
        explanation: 'La grille en design est un système de lignes horizontales et verticales utilisé pour organiser et structurer le contenu de manière cohérente.'
      },
      {
        id: '7',
        question: 'Qu\'est-ce que le contraste en design?',
        options: [
          'La différence entre les éléments de design, comme la couleur, la taille ou la forme',
          'Un réglage sur les écrans d\'ordinateur',
          'Un type de couleur',
          'Un style de design minimaliste'
        ],
        correctAnswer: 0,
        explanation: 'Le contraste en design réfère à la différence entre les éléments, comme la couleur, la taille ou la forme, pour créer de l\'intérêt visuel et améliorer la lisibilité.'
      },
      {
        id: '8',
        question: 'Qu\'est-ce que le design d\'information?',
        options: [
          'La conception de systèmes informatiques',
          'La présentation visuelle d\'informations complexes de manière claire et accessible',
          'La conception de sites web d\'information',
          'La conception de brochures et de flyers'
        ],
        correctAnswer: 1,
        explanation: 'Le design d\'information est la pratique de présenter des informations complexes de manière claire et accessible, souvent à travers des infographies, des diagrammes ou des visualisations de données.'
      },
      {
        id: '9',
        question: 'Qu\'est-ce que l\'accessibilité en design web?',
        options: [
          'La facilité d\'accès à un site web depuis n\'importe quel appareil',
          'La conception de sites web pour qu\'ils soient utilisables par tous, y compris les personnes handicapées',
          'La vitesse de chargement d\'un site web',
          'La facilité de navigation sur un site web'
        ],
        correctAnswer: 1,
        explanation: 'L\'accessibilité en design web est la pratique de concevoir des sites web pour qu\'ils soient utilisables par tous, y compris les personnes ayant des handicaps visuels, auditifs, moteurs ou cognitifs.'
      },
      {
        id: '10',
        question: 'Qu\'est-ce que le design thinking?',
        options: [
          'Une méthode de réflexion sur le design',
          'Une approche de résolution de problèmes centrée sur l\'humain',
          'Un style de design minimaliste',
          'Une technique de dessin'
        ],
        correctAnswer: 1,
        explanation: 'Le design thinking est une approche de résolution de problèmes centrée sur l\'humain qui implique l\'empathie, la définition du problème, l\'idéation, le prototypage et les tests.'
      }
    ],
    timeLimit: 600, // 10 minutes
    passingScore: 70,
    createdAt: new Date().toISOString()
  };
  
  // Quiz général pour tout type de module
  const generalQuiz = {
    id: `quiz_${Date.now()}`,
    title: `Évaluation: ${moduleInfo.title || moduleInfo.titre || 'Module général'}`,
    description: `Quiz pour évaluer vos connaissances sur ${moduleInfo.title || moduleInfo.titre || 'ce module'}`,
    questions: [
      {
        id: '1',
        question: 'Quel est l\'objectif principal de ce module?',
        options: [
          'Acquérir des connaissances théoriques',
          'Développer des compétences pratiques',
          'Préparer à une certification',
          'Toutes les réponses ci-dessus'
        ],
        correctAnswer: 3,
        explanation: 'Ce module vise à fournir des connaissances théoriques, développer des compétences pratiques et préparer à une certification.'
      },
      {
        id: '2',
        question: 'Quelle est la meilleure façon d\'apprendre le contenu de ce module?',
        options: [
          'En mémorisant tout le contenu',
          'En pratiquant régulièrement les concepts appris',
          'En regardant passivement les vidéos',
          'En lisant uniquement les résumés'
        ],
        correctAnswer: 1,
        explanation: 'La pratique régulière est essentielle pour maîtriser les concepts présentés dans ce module.'
      },
      {
        id: '3',
        question: 'Pourquoi est-il important de suivre ce module?',
        options: [
          'Pour obtenir un certificat uniquement',
          'Pour acquérir des compétences essentielles dans ce domaine',
          'Parce que c\'est obligatoire',
          'Pour impressionner les autres'
        ],
        correctAnswer: 1,
        explanation: 'Ce module est conçu pour vous aider à acquérir des compétences essentielles qui vous seront utiles dans votre carrière ou vos études.'
      },
      {
        id: '4',
        question: 'Comment peut-on appliquer les connaissances acquises dans ce module?',
        options: [
          'Uniquement dans un contexte académique',
          'Uniquement dans un contexte professionnel',
          'Dans divers contextes, tant académiques que professionnels',
          'Les connaissances sont purement théoriques et n\'ont pas d\'application pratique'
        ],
        correctAnswer: 2,
        explanation: 'Les connaissances acquises dans ce module peuvent être appliquées dans divers contextes, tant académiques que professionnels.'
      },
      {
        id: '5',
        question: 'Quelle est l\'importance de la pratique dans l\'apprentissage?',
        options: [
          'La pratique n\'est pas importante, seule la théorie compte',
          'La pratique aide à renforcer les concepts théoriques',
          'La pratique est uniquement nécessaire pour les examens',
          'La pratique est moins importante que la mémorisation'
        ],
        correctAnswer: 1,
        explanation: 'La pratique régulière aide à renforcer les concepts théoriques et à développer des compétences pratiques.'
      },
      {
        id: '6',
        question: 'Quel est le rôle des évaluations dans ce module?',
        options: [
          'Uniquement pour attribuer une note',
          'Pour vérifier la mémorisation du contenu',
          'Pour évaluer la compréhension et l\'application des concepts',
          'Les évaluations n\'ont pas d\'importance'
        ],
        correctAnswer: 2,
        explanation: 'Les évaluations sont conçues pour évaluer votre compréhension et votre capacité à appliquer les concepts présentés dans ce module.'
      },
      {
        id: '7',
        question: 'Comment peut-on améliorer ses résultats dans ce module?',
        options: [
          'En étudiant uniquement la veille de l\'examen',
          'En mémorisant sans comprendre',
          'En étudiant régulièrement et en pratiquant les concepts',
          'En copiant le travail des autres'
        ],
        correctAnswer: 2,
        explanation: 'Étudier régulièrement et pratiquer les concepts est la meilleure façon d\'améliorer vos résultats dans ce module.'
      },
      {
        id: '8',
        question: 'Quelle est l\'importance de la collaboration dans l\'apprentissage?',
        options: [
          'La collaboration n\'est pas importante, l\'apprentissage est individuel',
          'La collaboration permet d\'apprendre des autres et de partager des connaissances',
          'La collaboration est uniquement nécessaire pour les projets de groupe',
          'La collaboration est moins importante que l\'apprentissage individuel'
        ],
        correctAnswer: 1,
        explanation: 'La collaboration permet d\'apprendre des autres, de partager des connaissances et de développer des compétences de travail en équipe.'
      },
      {
        id: '9',
        question: 'Comment peut-on maintenir sa motivation tout au long du module?',
        options: [
          'En se fixant des objectifs réalistes et en célébrant les progrès',
          'En étudiant uniquement ce qui est intéressant',
          'En se comparant constamment aux autres',
          'La motivation n\'est pas importante pour réussir'
        ],
        correctAnswer: 0,
        explanation: 'Se fixer des objectifs réalistes et célébrer les progrès peut aider à maintenir la motivation tout au long du module.'
      },
      {
        id: '10',
        question: 'Quel est l\'impact de ce module sur votre développement professionnel?',
        options: [
          'Ce module n\'a aucun impact sur le développement professionnel',
          'Ce module aide à développer des compétences recherchées par les employeurs',
          'Ce module est uniquement important pour obtenir un diplôme',
          'L\'impact de ce module dépend uniquement de la note obtenue'
        ],
        correctAnswer: 1,
        explanation: 'Ce module est conçu pour vous aider à développer des compétences qui sont recherchées par les employeurs et qui peuvent améliorer votre employabilité.'
      }
    ],
    timeLimit: 600, // 10 minutes
    passingScore: 70,
    createdAt: new Date().toISOString()
  };
  
  // Déterminer quel quiz retourner en fonction du titre ou de la description du module
  const title = (moduleInfo.title || moduleInfo.titre || '').toLowerCase();
  const description = (moduleInfo.description || '').toLowerCase();
  
  if (title.includes('program') || title.includes('code') || title.includes('develop') || 
      description.includes('program') || description.includes('code') || description.includes('develop')) {
    return programmingQuiz;
  } else if (title.includes('design') || title.includes('ux') || title.includes('ui') || 
             description.includes('design') || description.includes('ux') || description.includes('ui')) {
    return designQuiz;
  } else {
    return generalQuiz;
  }
};
