const prisma = require('../prisma/lib/prismaClient');

async function creerNotification(userId, type, contenu, { sessionId, patientId, conversationId } = {}) {
  try {
    await prisma.notification.create({
      data: { userId, type, contenu, sessionId, patientId, conversationId },
    });
  } catch (erreur) {
    console.error('Erreur création notification:', erreur);
  }
}

module.exports = { creerNotification };
