const express = require('express');
const router = express.Router();
const { genererSecret, activer2FA, desactiver2FA } = require('../controllers/twoFactorController');
const { verifierToken } = require('../middlewares/authMiddleware');

router.post('/generer', verifierToken, genererSecret);
router.post('/activer', verifierToken, activer2FA);
router.post('/desactiver', verifierToken, desactiver2FA);

module.exports = router;
