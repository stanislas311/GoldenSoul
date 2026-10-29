const express = require('express');
const router = express.Router();
const { mesNotifications, marquerCommeLues, marquerCommeLue, supprimerNotification } = require('../controllers/notificationController');
const { verifierToken } = require('../middlewares/authMiddleware');

router.get('/', verifierToken, mesNotifications);
router.put('/marquer-lues', verifierToken, marquerCommeLues);
router.put('/:id/lire', verifierToken, marquerCommeLue);
router.delete('/:id', verifierToken, supprimerNotification);

module.exports = router;
