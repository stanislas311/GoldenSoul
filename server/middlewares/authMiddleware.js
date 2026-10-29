const jwt = require('jsonwebtoken');
const prisma = require('../prisma/lib/prismaClient');

// Cache simple pour éviter les requêtes répétées à la base de données
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Nettoyage périodique du cache pour éviter les fuites mémoire
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of userCache.entries()) {
    if (now - value.timestamp >= CACHE_TTL) {
      userCache.delete(key);
    }
  }
}, CACHE_TTL);

async function verifierToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Accès refusé, token manquant." });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Vérifier le cache d'abord
    const cachedUser = userCache.get(decoded.id);
    const now = Date.now();
    
    if (cachedUser && (now - cachedUser.timestamp) < CACHE_TTL) {
      req.user = cachedUser.data;
      next();
      return;
    }
    
    // Récupérer l'utilisateur complet depuis la base de données
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, nom: true, email: true, role: true }
    });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    // Mettre en cache
    userCache.set(decoded.id, {
      data: user,
      timestamp: now
    });

    req.user = user;
    next();
  } catch (erreur) {
    return res.status(401).json({ message: "Token invalide ou expiré." });
  }
}

module.exports = { verifierToken };
