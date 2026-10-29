const express = require('express');
const router = express.Router();
const { enregistrerAudit, getAuditLogsPatient } = require('../controllers/auditController');
const { verifierToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

router.post('/', verifierToken, requireRole('PRATICIEN'), enregistrerAudit);
router.get('/patient/:patientId', verifierToken, requireRole('PRATICIEN'), getAuditLogsPatient);

module.exports = router;
