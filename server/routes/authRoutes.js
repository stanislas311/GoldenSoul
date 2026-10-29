const express = require('express');
const router = express.Router();
const { register, login, logout, moi, forgotPassword, resetPassword, updateProfil, changerMotDePasse } = require('../controllers/authController');
const { verifierToken } = require('../middlewares/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', verifierToken, logout);
router.get('/moi', verifierToken, moi);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/profil', verifierToken, updateProfil);
router.put('/changer-mot-de-passe', verifierToken, changerMotDePasse);

module.exports = router;
