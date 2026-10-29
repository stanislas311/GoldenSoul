const express = require('express');
const router = express.Router();
const { listerPatients, voirDossierPatient, modifierNoteClinique } = require('../controllers/patientController');
const { verifierToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

router.get('/', verifierToken, requireRole('PRATICIEN'), listerPatients);
router.get('/:patientId', verifierToken, requireRole('PRATICIEN'), voirDossierPatient);
router.put('/sessions/:sessionId/note', verifierToken, requireRole('PRATICIEN'), modifierNoteClinique);

module.exports = router;
