const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/quizController');
const { verifierToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

router.post('/', verifierToken, requireRole('PRATICIEN'), creerQuiz);
router.post('/generer-ia', verifierToken, requireRole('PRATICIEN'), genererQuizIA);
router.post('/generate-daily', verifierToken, genererQuizQuotidien);
router.get('/actifs', verifierToken, listerQuizActifs);
router.get('/tous', verifierToken, requireRole('PRATICIEN'), listerTousLesQuiz);
router.get('/:quizId', verifierToken, voirQuiz);
router.post('/:quizId/repondre', verifierToken, soumettreReponses);
router.post('/:quizId/reponse/:responseId/compris', verifierToken, validerComprisQuiz);
router.get('/:quizId/historique', verifierToken, historiqueReponsesQuiz);
router.put('/:quizId/toggle', verifierToken, requireRole('PRATICIEN'), toggleActifQuiz);
router.delete('/bilan/:responseId', verifierToken, supprimerBilanQuiz);
router.delete('/:quizId', verifierToken, supprimerQuiz);

module.exports = router;
