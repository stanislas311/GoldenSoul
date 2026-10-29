const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SYSTEM_PROMPT = `Tu es une IA (Grok) experte en psychologie et bien-être. Tu génères des quiz d'auto-évaluation interactifs.

Règles strictes :
- Réponds UNIQUEMENT en JSON valide, sans texte avant ni après, sans balises markdown.
- Ne pose jamais de diagnostic médical.
- Reste bienveillant et positif.
- Chaque question a exactement 4 options de réponse (1 à 4), 1 étant le plus négatif, 4 étant le plus positif.

Format attendu :
{
  "titre": "Titre inspirant du quiz",
  "description": "Courte phrase d'encouragement",
  "questions": [
    {
      "texte": "Texte de la question",
      "options": [
        { "texte": "Pas du tout", "valeur": 1 },
        { "texte": "Un peu", "valeur": 2 },
        { "texte": "Souvent", "valeur": 3 },
        { "texte": "Toujours", "valeur": 4 }
      ]
    }
  ]
}`;

async function genererQuizQuotidienGrok(patientId) {
  // Optionnel : on pourrait aller chercher le profil du patient pour personnaliser le prompt
  const patient = await prisma.user.findUnique({ where: { id: patientId } });
  const theme = "Bien-être émotionnel quotidien et gestion du stress";

  // Note: L'utilisateur a mentionné "Grok" mais la clé dispo est GROQ. 
  // On garde l'API Groq (qui est ultra rapide) avec Llama-3 pour simuler l'expérience intelligente.
  const reponse = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Génère un quiz ludique de 4 questions pour un patient nommé ${patient?.nom || 'ce patient'} sur le thème : ${theme}`,
        },
      ],
      temperature: 0.7,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const contenuBrut = reponse.data.choices[0].message.content;
  const contenuNettoye = contenuBrut.replace(/```json|```/g, '').trim();
  const quizData = JSON.parse(contenuNettoye);

  // Sauvegarde automatique du Quiz en base de données
  const nouveauQuiz = await prisma.quiz.create({
    data: {
      titre: quizData.titre,
      description: quizData.description,
      grokGenerated: true,
      xpReward: 50,
      createdById: patientId,
      questions: {
        create: quizData.questions.map((q, index) => ({
          texte: q.texte,
          ordre: index,
          options: {
            create: q.options.map(o => ({
              texte: o.texte,
              valeur: o.valeur
            }))
          }
        }))
      }
    }
  });

  return nouveauQuiz;
}

async function analyserReponsesQuiz(questionsEtReponses) {
  const SYSTEM_PROMPT_ANALYSE = `Tu es une IA experte en psychologie et bien-être.
On te donne les réponses d'un patient à un quiz.
Fais une analyse bienveillante, concise (2-3 phrases maximum) de son état actuel, et donne-lui un petit conseil ou un encouragement.
Tu dois t'adresser directement au patient en le tutoyant ou vouvoyant avec douceur. 
Ne pose aucun diagnostic médical.
Réponds uniquement le texte de l'analyse, sans balises, sans guillemets, juste le texte.`;

  const contenuUser = questionsEtReponses.map(
    (qr, i) => `Question ${i + 1}: ${qr.question} -> Réponse du patient: ${qr.reponse}`
  ).join('\n');

  try {
    const reponse = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT_ANALYSE },
          { role: 'user', content: contenuUser },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return reponse.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Erreur Groq Analyse:", error);
    return "Merci d'avoir complété ce bilan. Continuez à prendre soin de vous et n'hésitez pas à en parler lors de votre prochaine séance.";
  }
}

module.exports = { genererQuizQuotidienGrok, analyserReponsesQuiz };
