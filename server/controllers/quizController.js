const prisma = require('../prisma/lib/prismaClient');
const { genererQuizAvecIA } = require('../utils/aiQuizGenerator');
const { genererQuizQuotidienGrok, analyserReponsesQuiz } = require('../utils/grokQuizGenerator');

// Créer un quiz manuellement (praticien)
async function creerQuiz(req, res) {
  try {
    const { titre, description, questions } = req.body;

    if (!titre || !questions || questions.length === 0) {
      return res.status(400).json({ message: "Titre et au moins une question requis." });
    }

    const quiz = await prisma.quiz.create({
      data: {
        titre,
        description,
        questions: {
          create: questions.map((q, index) => ({
            texte: q.texte,
            ordre: index,
            options: {
              create: q.options.map((o) => ({ texte: o.texte, valeur: o.valeur })),
            },
          })),
        },
      },
      include: { questions: { include: { options: true } } },
    });

    res.status(201).json({ message: "Quiz créé.", quiz });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

// Liste des quiz actifs (patient) — uniquement ceux créés par CE patient ou les quiz non-grok
async function listerQuizActifs(req, res) {
  try {
    const quizzes = await prisma.quiz.findMany({
      where: {
        actif: true,
        OR: [
          { grokGenerated: false },
          { createdById: req.user.id },
        ],
      },
      select: {
        id: true,
        titre: true,
        description: true,
        createdAt: true,
        reponses: {
          where: { patientId: req.user.id },
          select: { id: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Ajouter un flag "completed" pour chaque quiz
    const quizzesAvecStatut = quizzes.map(q => ({
      id: q.id,
      titre: q.titre,
      description: q.description,
      createdAt: q.createdAt,
      completed: q.reponses.length > 0,
    }));

    res.status(200).json({ quizzes: quizzesAvecStatut });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

// Liste de tous les quiz, actifs ou non (praticien)
async function listerTousLesQuiz(req, res) {
  try {
    const quizzes = await prisma.quiz.findMany({
      include: { questions: { include: { options: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ quizzes });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

// Détail d'un quiz pour le remplir (patient)
async function voirQuiz(req, res) {
  try {
    const { quizId } = req.params;

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId, actif: true },
      include: { questions: { include: { options: true }, orderBy: { ordre: 'asc' } } },
    });

    if (!quiz) {
      return res.status(404).json({ message: "Quiz introuvable." });
    }

    res.status(200).json({ quiz });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

// Soumettre des réponses (patient) — répétable
async function soumettreReponses(req, res) {
  try {
    const { quizId } = req.params;
    const { reponses } = req.body; // [{ questionId, valeurChoisie }]

    if (!reponses || reponses.length === 0) {
      return res.status(400).json({ message: "Réponses requises." });
    }

    const scoreTotal = reponses.reduce((total, r) => total + r.valeurChoisie, 0);

    const quizResponse = await prisma.quizResponse.create({
      data: {
        quizId,
        patientId: req.user.id,
        scoreTotal,
        reponses: {
          create: reponses.map((r) => ({
            questionId: r.questionId,
            valeurChoisie: r.valeurChoisie,
          })),
        },
      },
      include: { reponses: true },
    });

    // Formater les questions/réponses pour Grok
    const quiz = await prisma.quiz.findUnique({ 
      where: { id: quizId },
      include: { questions: { include: { options: true } } }
    });

    const qrForGrok = quiz.questions.map(q => {
      const reponseJoueur = reponses.find(r => r.questionId === q.id);
      const optionChoisie = reponseJoueur 
        ? q.options.find(o => o.valeur === reponseJoueur.valeurChoisie) 
        : null;

      return {
        question: q.texte,
        reponse: optionChoisie ? optionChoisie.texte : "Non répondu"
      };
    });

    // Appel à Grok
    const analyseIA = await analyserReponsesQuiz(qrForGrok);

    // Sauvegarder l'analyse IA dans la QuizResponse
    await prisma.quizResponse.update({
      where: { id: quizResponse.id },
      data: { analyseIA },
    });

    res.status(201).json({ 
      message: "Réponses enregistrées.", 
      quizResponse,
      analyseIA
    });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

async function validerComprisQuiz(req, res) {
  try {
    const { responseId } = req.params;
    
    // On pourrait vérifier que ce quizResponse appartient bien à req.user.id
    const xpGagne = 5; // Le patient gagne 5 XP
    let newXpPoints = (req.user.xpPoints || 0) + xpGagne;
    let newLevel = 1 + Math.floor(newXpPoints / 100);

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        xpPoints: newXpPoints,
        level: newLevel
      }
    });

    res.status(200).json({
      message: "XP attribué.",
      xpGagne,
      newXpPoints,
      newLevel
    });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

// Historique des réponses d'un patient à un quiz (pour suivre l'évolution)
async function historiqueReponsesQuiz(req, res) {
  try {
    const { quizId } = req.params;

    const reponses = await prisma.quizResponse.findMany({
      where: { quizId, patientId: req.user.id },
      orderBy: { createdAt: 'asc' },
      select: { id: true, scoreTotal: true, createdAt: true },
    });

    res.status(200).json({ reponses });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

// Activer/désactiver un quiz (praticien)
async function toggleActifQuiz(req, res) {
  try {
    const { quizId } = req.params;

    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) {
      return res.status(404).json({ message: "Quiz introuvable." });
    }

    const quizMisAJour = await prisma.quiz.update({
      where: { id: quizId },
      data: { actif: !quiz.actif },
    });

    res.status(200).json({ message: "Statut mis à jour.", quiz: quizMisAJour });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

async function genererQuizIA(req, res) {
  try {
    const { description, nombreQuestions } = req.body;

    if (!description || description.trim().length < 5) {
      return res.status(400).json({ message: "Description du quiz requise." });
    }

    const quizPropose = await genererQuizAvecIA(description, nombreQuestions || 5);

    res.status(200).json({ quizPropose });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur lors de la génération du quiz." });
  }
}

async function genererQuizQuotidien(req, res) {
  try {
    const nouveauQuiz = await genererQuizQuotidienGrok(req.user.id);
    res.status(201).json({ message: "Quiz généré avec succès.", quiz: nouveauQuiz });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur lors de la génération du quiz quotidien." });
  }
}

async function supprimerQuiz(req, res) {
  try {
    const { quizId } = req.params;
    
    // Pour permettre la suppression, nous devons vérifier si le quiz existe.
    // L'idéal est de s'assurer que c'est un quiz "grokGenerated" si le patient peut le supprimer.
    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) {
      return res.status(404).json({ message: "Quiz introuvable." });
    }

    // Suppression en cascade: Prisma doit avoir onDelete: Cascade sur QuizResponse, Option, Question
    // Si ce n'est pas le cas, il faut d'abord supprimer manuellement les dépendances ou ajouter cascade
    // Ici nous allons utiliser prisma.quiz.delete pour supprimer le quiz directement.
    await prisma.quiz.delete({ where: { id: quizId } });

    res.status(200).json({ message: "Quiz supprimé avec succès." });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur lors de la suppression." });
  }
}

async function supprimerBilanQuiz(req, res) {
  try {
    const { responseId } = req.params;

    const qr = await prisma.quizResponse.findUnique({ where: { id: responseId } });
    if (!qr) {
      return res.status(404).json({ message: "Bilan introuvable." });
    }

    await prisma.quizResponse.delete({ where: { id: responseId } });

    res.status(200).json({ message: "Bilan supprimé avec succès." });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur lors de la suppression." });
  }
}

module.exports = {
  creerQuiz,
  listerQuizActifs,
  listerTousLesQuiz,
  voirQuiz,
  soumettreReponses,
  historiqueReponsesQuiz,
  toggleActifQuiz,
  genererQuizIA,
  genererQuizQuotidien,
  validerComprisQuiz,
  supprimerQuiz,
  supprimerBilanQuiz,
};
