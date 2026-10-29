function requireRole(roleRequis) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== roleRequis) {
      return res.status(403).json({ message: "Accès réservé, permissions insuffisantes." });
    }
    next();
  };
}

module.exports = { requireRole };
