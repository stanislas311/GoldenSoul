const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const prisma = require('../prisma/lib/prismaClient');

// Étape 1 : générer un secret et un QR code (praticien scanne, mais pas encore activé)
async function genererSecret(req, res) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (user.twoFactorActif) {
      return res.status(400).json({ message: "Le 2FA est déjà activé. Désactivez-le avant d'en reconfigurer un nouveau." });
    }

    const secret = speakeasy.generateSecret({
      name: `GoldenSoul (${req.user.id})`,
      length: 20,
    });

    // On stocke le secret temporairement, mais 2FA reste inactif tant que non vérifié
    await prisma.user.update({
      where: { id: req.user.id },
      data: { twoFactorSecret: secret.base32 },
    });

    const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url);

    res.status(200).json({ qrCode: qrCodeDataUrl, secret: secret.base32 });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

// Étape 2 : vérifier le premier code saisi pour activer définitivement le 2FA
async function activer2FA(req, res) {
  try {
    const { code } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user.twoFactorSecret) {
      return res.status(400).json({ message: "Aucun secret généré. Recommencez la configuration." });
    }

    const verifie = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!verifie) {
      return res.status(400).json({ message: "Code incorrect." });
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: { twoFactorActif: true },
    });

    res.status(200).json({ message: "Authentification à deux facteurs activée." });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

// Vérifier un code lors de la connexion (utilisé dans le flux de login)
function verifierCode(secret, code) {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: code,
    window: 1,
  });
}

// Désactiver le 2FA (nécessite le code actuel pour confirmer que c'est bien le propriétaire)
async function desactiver2FA(req, res) {
  try {
    const { code } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user.twoFactorActif) {
      return res.status(400).json({ message: "Le 2FA n'est pas activé." });
    }

    const verifie = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!verifie) {
      return res.status(400).json({ message: "Code incorrect." });
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: { twoFactorActif: false, twoFactorSecret: null },
    });

    res.status(200).json({ message: "Authentification à deux facteurs désactivée." });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

module.exports = { genererSecret, activer2FA, desactiver2FA, verifierCode };
