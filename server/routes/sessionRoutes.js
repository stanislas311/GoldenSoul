const express = require('express');
const router = express.Router();
const {
  reserverCreneau,
  mesSessions,
  toutesSessions,
  simulerPaiementConfirme,
  confirmerSession,
  sessionsEnAttente,
  annulerSession,
  rejoindreVisio,
  terminerSeance,
  demarrerSession,
  terminerSession,
  laisserAvis,
  supprimerSessionPasse,
} = require('../controllers/sessionController');
const { verifierToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

router.post('/reserver', verifierToken, reserverCreneau);
router.get('/mes-sessions', verifierToken, mesSessions);
router.get('/toutes-sessions', verifierToken, requireRole('PRATICIEN'), toutesSessions);
router.post('/:sessionId/simuler-paiement', verifierToken, simulerPaiementConfirme);
router.get('/en-attente', verifierToken, requireRole('PRATICIEN'), sessionsEnAttente);
router.put('/:sessionId/confirmer', verifierToken, requireRole('PRATICIEN'), confirmerSession);
router.put('/:sessionId/annuler', verifierToken, annulerSession);
router.put('/:sessionId/terminer', verifierToken, terminerSeance);
router.get('/:sessionId/rejoindre-visio', verifierToken, rejoindreVisio);
router.post('/:sessionId/demarrer', verifierToken, demarrerSession);
router.post('/:sessionId/terminer-session', verifierToken, terminerSession);
router.post('/:sessionId/avis', verifierToken, laisserAvis);
router.delete('/:sessionId', verifierToken, supprimerSessionPasse);

module.exports = router;
