const express = require('express');
const router = express.Router();
const { initierPaiementSession, notifyCinetPay, declarerPaiementManuel, obtenirInfosPaiement, mesPaiements, genererRecu, paiementsPraticien, supprimerPaiement } = require('../controllers/paymentController');
const { verifierToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

router.post('/:sessionId/initier', verifierToken, initierPaiementSession);
router.post('/:sessionId/declarer', verifierToken, declarerPaiementManuel);
router.get('/infos-praticien', verifierToken, obtenirInfosPaiement);
router.get('/mes-paiements', verifierToken, mesPaiements);
router.get('/praticien', verifierToken, requireRole('PRATICIEN'), paiementsPraticien);
router.get('/:sessionId/recu', verifierToken, genererRecu);
router.delete('/:paymentId', verifierToken, supprimerPaiement);
router.post('/notify', notifyCinetPay);

module.exports = router;
