const express = require('express');
const router = express.Router();
const { statistiquesGlobales } = require('../controllers/statsController');
const { verifierToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

router.get('/', verifierToken, requireRole('PRATICIEN'), statistiquesGlobales);

module.exports = router;
