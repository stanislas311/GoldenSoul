const jwt = require('jsonwebtoken');
const prisma = require('../prisma/lib/prismaClient');

const connexionsActives = new Map(); // userId -> nombre de sockets actifs

function initialiserSignalisation(io) {
  // Authentification du socket via le token JWT (comme pour les routes HTTP)
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentification requise."));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch {
      next(new Error("Token invalide."));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`Socket connecté : ${socket.user.id}`);

    // ====================================================================
    // ENREGISTREMENT SYNCHRONE DES LISTENERS AVANT TOUT APPEL ASYNCHRONE !
    // Si on fait un "await" avant ça, on rate les premiers messages du client.
    // ====================================================================

    // Rejoindre une "room" correspondant à l'id de session (visio)
    socket.on('rejoindre-room', (roomId) => {
      // Stocker le roomId sur le socket pour le retrouver en cas de déconnexion
      socket.roomId = roomId;
      socket.join(roomId);
      console.log(`[WebRTC] 🚪 ${socket.user.id} a rejoint la room ${roomId}.`);
      
      // Prévenir les autres que quelqu'un a rejoint pour qu'ils puissent démarrer la négociation s'ils sont "impolite"
      socket.to(roomId).emit('utilisateur-rejoint', { userId: socket.user.id, socketId: socket.id });
    });

    // Relais universel pour la négociation WebRTC (Perfect Negotiation)
    socket.on('webrtc-signaling', ({ roomId, data }) => {
      // data peut contenir { description } (offre/réponse) ou { candidate }
      socket.to(roomId).emit('webrtc-signaling', { data, de: socket.user.id, deSocketId: socket.id });
    });

    socket.on('quitter-room', (roomId) => {
      console.log(`[WebRTC] 🚶 ${socket.user.id} quitte room ${roomId}`);
      socket.leave(roomId);
      socket.to(roomId).emit('utilisateur-parti', { userId: socket.user.id });
    });

    // Relayer les messages chat entre participants
    socket.on('chat-message', ({ roomId, message }) => {
      socket.to(roomId).emit('chat-message', { 
        message, 
        envoyePar: socket.user.nom || 'Utilisateur' 
      });
    });

    // Indicateur "en train d'écrire..."
    socket.on('typing', ({ conversationId }) => {
      socket.to(conversationId).emit('typing', { 
        userId: socket.user.id,
        nom: socket.user.nom 
      });
    });

    socket.on('stop-typing', ({ conversationId }) => {
      socket.to(conversationId).emit('stop-typing', { 
        userId: socket.user.id 
      });
    });

    // Marquer un message comme reçu
    socket.on('message-recu', async ({ messageId }) => {
      try {
        await prisma.message.update({
          where: { id: messageId },
          data: { recu: true, recuLe: new Date() }
        });
        socket.emit('message-recu-ack', { messageId });
      } catch (erreur) {
        console.error('Erreur marquer message reçu:', erreur);
      }
    });

    // Marquer un message comme lu
    socket.on('message-lu', async ({ messageId }) => {
      try {
        await prisma.message.update({
          where: { id: messageId },
          data: { lu: true, luLe: new Date() }
        });
        socket.emit('message-lu-ack', { messageId });
      } catch (erreur) {
        console.error('Erreur marquer message lu:', erreur);
      }
    });

    // ====================================================================
    // LOGIQUE ASYNCHRONE DE CONNEXION (Statut en ligne / hors ligne)
    // ====================================================================

    const compteurActuel = connexionsActives.get(socket.user.id) || 0;
    connexionsActives.set(socket.user.id, compteurActuel + 1);

    // On ne met à jour la base ET on n'émet l'événement que si c'est la PREMIÈRE connexion de cet utilisateur
    if (compteurActuel === 0) {
      try {
        await prisma.user.update({
          where: { id: socket.user.id },
          data: { enLigne: true, derniereActivite: new Date() }
        });
        io.emit('utilisateur-en-ligne', { userId: socket.user.id });
      } catch (erreur) {
        console.error('Erreur mise à jour état en ligne:', erreur);
      }
    }



    socket.on('disconnect', async () => {
      console.log(`Socket déconnecté : ${socket.user.id}`);

      const nouveauCompteur = (connexionsActives.get(socket.user.id) || 1) - 1;

      if (nouveauCompteur <= 0) {
        connexionsActives.delete(socket.user.id);

        // On ne marque VRAIMENT hors ligne que si c'était sa DERNIÈRE connexion active
        try {
          await prisma.user.update({
            where: { id: socket.user.id },
            data: { enLigne: false, derniereActivite: new Date() }
          });
          io.emit('utilisateur-hors-ligne', { userId: socket.user.id });
        } catch (erreur) {
          console.error('Erreur mise à jour état hors ligne:', erreur);
        }
      } else {
        connexionsActives.set(socket.user.id, nouveauCompteur);
      }
    });
  });
}

module.exports = { initialiserSignalisation };
