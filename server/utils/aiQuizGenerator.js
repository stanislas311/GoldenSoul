const axios = require('axios');

const SYSTEM_PROMPT = `Tu génères des quiz d'auto-évaluation psychologique à visée de bien-être (stress, sommeil, anxiété légère, etc.).

Règles strictes :
- Réponds UNIQUEMENT en JSON valide, sans texte avant ni après, sans balises markdown.
- Ne pose jamais de diagnostic médical ou psychologique.
- Reste sur des formulations neutres, bienveillantes et non stigmatisantes.
- Chaque question a exactement 5 options de réponse, sur une échelle croissante d'intensité (valeur de 1 à 5).

Format de réponse attendu, strictement :
{
  "titre": "...",
  "description": "...",
  "questions": [
    {
      "texte": "...",
      "options": [
        { "texte": "...", "valeur": 1 },
        { "texte": "...", "valeur": 2 },
        { "texte": "...", "valeur": 3 },
        { "texte": "...", "valeur": 4 },
        { "texte": "...", "valeur": 5 }
      ]
    }
  ]
}`;

async function genererQuizAvecIA(descriptionPraticien, nombreQuestions = 5) {
  const reponse = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Génère un quiz de ${nombreQuestions} questions sur ce thème : ${descriptionPraticien}`,
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

  // Nettoyage au cas où le modèle ajoute des balises markdown malgré la consigne
  const contenuNettoye = contenuBrut.replace(/```json|```/g, '').trim();

  return JSON.parse(contenuNettoye);
}

module.exports = { genererQuizAvecIA };
