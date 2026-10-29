const express = require('express');
const router = express.Router();
const { upload, uploadFichier } = require('../controllers/uploadController');
const { verifierToken } = require('../middlewares/authMiddleware');

router.post('/fichier', verifierToken, upload.single('fichier'), uploadFichier);

module.exports = router;
