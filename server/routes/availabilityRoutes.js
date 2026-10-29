const express = require('express');
const router = express.Router();
const {
  creerDisponibilite,
  listerToutesDisponibilites,
  listerToutesDisponibilitesPatient,
  listerDisponibilitesLibres,
  detailsCreneauReserve,
  supprimerDisponibilite,
  modifierDisponibilite,
} = require('../controllers/availabilityController');
const { verifierToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

router.post('/', verifierToken, requireRole('PRATICIEN'), creerDisponibilite);
router.get('/toutes', verifierToken, requireRole('PRATICIEN'), listerToutesDisponibilites);
router.get('/toutes-patient', verifierToken, listerToutesDisponibilitesPatient);
router.get('/libres', verifierToken, listerDisponibilitesLibres);
router.get('/:availabilityId/details', verifierToken, requireRole('PRATICIEN'), detailsCreneauReserve);
router.delete('/:availabilityId', verifierToken, requireRole('PRATICIEN'), supprimerDisponibilite);
router.put('/:availabilityId', verifierToken, requireRole('PRATICIEN'), modifierDisponibilite);

module.exports = router;
