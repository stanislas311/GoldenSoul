const express = require('express');
const router = express.Router();
const {
  maConversation,
  envoyerMessagePatient,
  listerConversations,
  voirConversation,
  envoyerMessagePraticien,
  modifierMessage,
  supprimerMessage,
} = require('../controllers/messageController');
const { verifierToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

// Patient
router.get('/ma-conversation', verifierToken, maConversation);
router.post('/ma-conversation', verifierToken, envoyerMessagePatient);

// Praticien
router.get('/conversations', verifierToken, requireRole('PRATICIEN'), listerConversations);
router.get('/conversations/:conversationId', verifierToken, requireRole('PRATICIEN'), voirConversation);
router.post('/conversations/:conversationId', verifierToken, requireRole('PRATICIEN'), envoyerMessagePraticien);

// Modification et suppression (tous les utilisateurs)
router.put('/:messageId', verifierToken, modifierMessage);
router.delete('/:messageId', verifierToken, supprimerMessage);

module.exports = router;
