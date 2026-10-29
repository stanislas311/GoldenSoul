const prisma = require('../prisma/lib/prismaClient');
const { creerNotification } = require('../utils/notifications');

// Récupère (ou crée) la conversation du patient connecté
async function obtenirOuCreerConversation(patientId) {
  let conversation = await prisma.conversation.findUnique({ where: { patientId } });

  if (!conversation) {
    conversation = await prisma.conversation.create({ data: { patientId } });
  }

  return conversation;
}

// Patient : récupère sa conversation avec ses messages
async function maConversation(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const conversation = await obtenirOuCreerConversation(req.user.id);

    const totalMessages = await prisma.message.count({ where: { conversationId: conversation.id } });

    const messages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const praticien = await prisma.user.findFirst({
      where: { role: 'PRATICIEN' },
      select: { id: true, nom: true, photoUrl: true }
    });

    res.status(200).json({ 
      conversationId: conversation.id, 
      messages: messages.reverse(), 
      praticien,
      meta: { page, limit, total: totalMessages }
    });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

// Patient : envoyer un message
async function envoyerMessagePatient(req, res) {
  try {
    const { contenu, type, fichierUrl, fichierNom, fichierTaille, dureeVocal, messageIdReponse } = req.body;

    const estMultimedia = type && type !== 'TEXTE';

    if (!estMultimedia && (!contenu || !contenu.trim())) {
      return res.status(400).json({ message: "Message vide." });
    }

    if (estMultimedia && !fichierUrl) {
      return res.status(400).json({ message: "Fichier manquant." });
    }

    const conversation = await obtenirOuCreerConversation(req.user.id);

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        expediteurId: req.user.id,
        contenu: contenu ? contenu.trim() : null,
        type: type || 'TEXTE',
        fichierUrl: fichierUrl || null,
        fichierNom: fichierNom || null,
        fichierTaille: fichierTaille || null,
        dureeVocal: dureeVocal || null,
        messageIdReponse: messageIdReponse || null,
      },
    });

    const praticien = await prisma.user.findFirst({ where: { role: 'PRATICIEN' } });
    if (praticien) {
      const apercu = estMultimedia
        ? (type === 'VOCAL' ? 'Message vocal' : type === 'IMAGE' ? 'Image' : 'Fichier')
        : contenu.trim();

      creerNotification(
        praticien.id,
        'NOUVEAU_MESSAGE',
        `${req.user.nom}: ${apercu}`,
        { conversationId: conversation.id, patientId: req.user.id }
      ).catch(console.error);
    }

    res.status(201).json({ message });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

// Praticien : liste de toutes ses conversations (une par patient), avec dernier message
async function listerConversations(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const totalConversations = await prisma.conversation.count();

    const conversations = await prisma.conversation.findMany({
      skip,
      take: limit,
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    const patientIds = conversations.map((c) => c.patientId);
    const patients = await prisma.user.findMany({
      where: { id: { in: patientIds } },
      select: { id: true, nom: true, email: true, photoUrl: true },
    });

    const conversationIds = conversations.map(c => c.id);

    // FIX N+1 : Récupération groupée
    const unreadCounts = await prisma.message.groupBy({
      by: ['conversationId'],
      where: {
        conversationId: { in: conversationIds },
        lu: false,
        expediteurId: { not: req.user.id },
      },
      _count: {
        id: true,
      },
    });

    const unreadMap = {};
    unreadCounts.forEach(item => {
      unreadMap[item.conversationId] = item._count.id;
    });

    const conversationsAvecInfos = conversations.map((c) => ({
      ...c,
      patient: patients.find((p) => p.id === c.patientId),
      nombreNonLus: unreadMap[c.id] || 0,
    }));

    conversationsAvecInfos.sort((a, b) => {
      const dateA = a.messages[0]?.createdAt || a.createdAt;
      const dateB = b.messages[0]?.createdAt || b.createdAt;
      return new Date(dateB) - new Date(dateA);
    });

    res.status(200).json({ 
      conversations: conversationsAvecInfos,
      meta: { page, limit, total: totalConversations } 
    });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

// Praticien : voir une conversation précise avec ses messages
async function voirConversation(req, res) {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation introuvable." });
    }

    const patient = await prisma.user.findUnique({
      where: { id: conversation.patientId },
      select: { id: true, nom: true, email: true, photoUrl: true },
    });

    const totalMessages = await prisma.message.count({ where: { conversationId } });

    await prisma.message.updateMany({
      where: {
        conversationId,
        lu: false,
        expediteurId: { not: req.user.id },
      },
      data: { lu: true, luLe: new Date() },
    });

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    res.status(200).json({ 
      patient, 
      messages: messages.reverse(),
      meta: { page, limit, total: totalMessages } 
    });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

// Praticien : envoyer un message dans une conversation précise
async function envoyerMessagePraticien(req, res) {
  try {
    const { conversationId } = req.params;
    const { contenu, type, fichierUrl, fichierNom, fichierTaille, dureeVocal, messageIdReponse } = req.body;

    if (!contenu && !fichierUrl) {
      return res.status(400).json({ message: "Message vide." });
    }

    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) {
      return res.status(404).json({ message: "Conversation introuvable." });
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        expediteurId: req.user.id,
        contenu: contenu?.trim() || null,
        type: type || 'TEXTE',
        fichierUrl,
        fichierNom,
        fichierTaille,
        dureeVocal,
        messageIdReponse,
      },
    });

    if (type === 'TEXTE') {
      creerNotification(conversation.patientId, 'NOUVEAU_MESSAGE', `Votre praticien: ${contenu.trim()}`, { conversationId: conversation.id }).catch(console.error);
    } else if (type === 'VOCAL') {
      creerNotification(conversation.patientId, 'NOUVEAU_MESSAGE', `Votre praticien vous a envoyé un message vocal.`, { conversationId: conversation.id }).catch(console.error);
    } else if (type === 'IMAGE') {
      creerNotification(conversation.patientId, 'NOUVEAU_MESSAGE', `Votre praticien vous a envoyé une image.`, { conversationId: conversation.id }).catch(console.error);
    } else if (type === 'FICHIER') {
      creerNotification(conversation.patientId, 'NOUVEAU_MESSAGE', `Votre praticien vous a envoyé un fichier.`, { conversationId: conversation.id }).catch(console.error);
    }

    res.status(201).json({ message });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

// Modifier un message
async function modifierMessage(req, res) {
  try {
    const { messageId } = req.params;
    const { contenu } = req.body;

    if (!contenu || !contenu.trim()) {
      return res.status(400).json({ message: "Message vide." });
    }

    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) {
      return res.status(404).json({ message: "Message introuvable." });
    }

    if (message.expediteurId !== req.user.id) {
      return res.status(403).json({ message: "Vous ne pouvez modifier que vos propres messages." });
    }

    if (message.supprime) {
      return res.status(400).json({ message: "Impossible de modifier un message supprimé." });
    }

    const messageModifie = await prisma.message.update({
      where: { id: messageId },
      data: {
        contenu: contenu.trim(),
        modifie: true,
        modifieLe: new Date(),
      },
    });

    res.status(200).json({ message: messageModifie });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

// Supprimer un message
async function supprimerMessage(req, res) {
  try {
    const { messageId } = req.params;

    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) {
      return res.status(404).json({ message: "Message introuvable." });
    }

    if (message.expediteurId !== req.user.id) {
      return res.status(403).json({ message: "Vous ne pouvez supprimer que vos propres messages." });
    }

    const messageSupprime = await prisma.message.update({
      where: { id: messageId },
      data: {
        supprime: true,
        supprimeLe: new Date(),
        contenu: null, // Effacer le contenu
        fichierUrl: null,
      },
    });

    res.status(200).json({ message: messageSupprime });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

module.exports = {
  maConversation,
  envoyerMessagePatient,
  listerConversations,
  voirConversation,
  envoyerMessagePraticien,
  modifierMessage,
  supprimerMessage,
};
