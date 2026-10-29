const prisma = require('../prisma/lib/prismaClient');

async function mesNotifications(req, res) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const nombreNonLues = await prisma.notification.count({
      where: { userId: req.user.id, lu: false },
    });

    res.status(200).json({ notifications, nombreNonLues });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

async function marquerCommeLues(req, res) {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, lu: false },
      data: { lu: true },
    });

    res.status(200).json({ message: "Notifications marquées comme lues." });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

async function marquerCommeLue(req, res) {
  try {
    const { id } = req.params;
    
    // Vérifier que la notification appartient bien à l'utilisateur connecté
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      return res.status(404).json({ message: "Notification introuvable." });
    }
    if (notification.userId !== req.user.id) {
      return res.status(403).json({ message: "Accès refusé." });
    }

    await prisma.notification.update({
      where: { id },
      data: { lu: true },
    });

    res.status(200).json({ message: "Notification marquée comme lue." });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

async function supprimerNotification(req, res) {
  try {
    const { id } = req.params;
    
    // Vérifier que la notification appartient bien à l'utilisateur connecté
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      return res.status(404).json({ message: "Notification introuvable." });
    }
    if (notification.userId !== req.user.id) {
      return res.status(403).json({ message: "Accès refusé." });
    }

    await prisma.notification.delete({
      where: { id },
    });

    res.status(200).json({ message: "Notification supprimée." });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

module.exports = { mesNotifications, marquerCommeLues, marquerCommeLue, supprimerNotification };
