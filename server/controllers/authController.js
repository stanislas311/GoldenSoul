const crypto = require('crypto');
const { envoyerEmailResetPassword, envoyerEmailBienvenue } = require('../utils/email');
const prisma = require('../prisma/lib/prismaClient');
const { hashMotDePasse, comparerMotDePasse } = require('../utils/hash');
const { genererToken } = require('../utils/token');
const { verifierCode } = require('./twoFactorController');

function calculerAge(dateNaissance) {
  const aujourdHui = new Date();
  const naissance = new Date(dateNaissance);
  let age = aujourdHui.getFullYear() - naissance.getFullYear();
  const moisDiff = aujourdHui.getMonth() - naissance.getMonth();
  if (moisDiff < 0 || (moisDiff === 0 && aujourdHui.getDate() < naissance.getDate())) {
    age--;
  }
  return age;
}

async function register(req, res) {
  try {
    const {
      nom, email, motDePasse, telephone, genre,
      dateNaissance, situationMatrimoniale, consentementAccepte,
    } = req.body;

    // Vérification des champs obligatoires
    if (!nom || !email || !motDePasse || !dateNaissance) {
      return res.status(400).json({ message: "Champs obligatoires manquants." });
    }

    // Vérification du consentement (bloquant)
    if (!consentementAccepte) {
      return res.status(403).json({ message: "Le consentement est requis pour créer un compte." });
    }

    // Vérification de l'âge minimum
    const age = calculerAge(dateNaissance);
    if (age < 18) {
      return res.status(403).json({ message: "Ce service est réservé aux personnes majeures." });
    }

    // Vérification unicité de l'email
    const emailExistant = await prisma.user.findUnique({ where: { email } });
    if (emailExistant) {
      return res.status(409).json({ message: "Un compte existe déjà avec cet email." });
    }

    const motDePasseHash = await hashMotDePasse(motDePasse);

    const nouvelUtilisateur = await prisma.user.create({
      data: {
        nom,
        email,
        motDePasse: motDePasseHash,
        telephone,
        genre,
        dateNaissance: new Date(dateNaissance),
        situationMatrimoniale,
        consentementAccepte: true,
        consentementDate: new Date(),
        consentementVersion: "v1.0",
      },
    });

    envoyerEmailBienvenue(nouvelUtilisateur.email, nouvelUtilisateur.nom).catch(console.error);

    const token = genererToken(nouvelUtilisateur);

    res.status(201).json({
      message: "Compte créé avec succès.",
      token,
      user: {
        id: nouvelUtilisateur.id,
        nom: nouvelUtilisateur.nom,
        email: nouvelUtilisateur.email,
        role: nouvelUtilisateur.role,
        photoUrl: nouvelUtilisateur.photoUrl,
        languePreferee: nouvelUtilisateur.languePreferee,
        consentementAccepte: nouvelUtilisateur.consentementAccepte,
        twoFactorActif: nouvelUtilisateur.twoFactorActif,
        bio: nouvelUtilisateur.bio,
        numeroPaiement: nouvelUtilisateur.numeroPaiement,
      },
    });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur lors de l'inscription." });
  }
}

async function login(req, res) {
  try {
    const { email, motDePasse, code2FA } = req.body;

    if (!email || !motDePasse) {
      return res.status(400).json({ message: "Email et mot de passe requis." });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Réponse volontairement identique que l'email existe ou non
    if (!user) {
      return res.status(401).json({ message: "Identifiants incorrects." });
    }

    const motDePasseValide = await comparerMotDePasse(motDePasse, user.motDePasse);

    if (!motDePasseValide) {
      return res.status(401).json({ message: "Identifiants incorrects." });
    }

    // Si le 2FA est actif pour ce compte, on exige le code
    if (user.twoFactorActif) {
      if (!code2FA) {
        return res.status(200).json({ deuxFARequis: true });
      }

      const codeValide = verifierCode(user.twoFactorSecret, code2FA);
      if (!codeValide) {
        return res.status(401).json({ message: "Code de vérification incorrect." });
      }
    }

    const token = genererToken(user);

    // Mettre l'utilisateur en ligne lors de la connexion
    await prisma.user.update({
      where: { id: user.id },
      data: { enLigne: true, derniereActivite: new Date() }
    });

    res.status(200).json({
      message: "Connexion réussie.",
      token,
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        photoUrl: user.photoUrl,
        languePreferee: user.languePreferee,
        consentementAccepte: user.consentementAccepte,
        twoFactorActif: user.twoFactorActif,
        bio: user.bio,
        numeroPaiement: user.numeroPaiement,
      },
    });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur lors de la connexion." });
  }
}

async function logout(req, res) {
  try {
    // Mettre l'utilisateur hors ligne lors de la déconnexion
    await prisma.user.update({
      where: { id: req.user.id },
      data: { enLigne: false, derniereActivite: new Date() }
    });

    res.status(200).json({ message: "Déconnexion réussie." });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur lors de la déconnexion." });
  }
}

async function moi(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, nom: true, email: true, role: true,
        photoUrl: true, languePreferee: true, consentementAccepte: true,
        twoFactorActif: true, bio: true, numeroPaiement: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    res.status(200).json({ user });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

async function forgotPassword(req, res) {
  const reponseGenerique = { message: "Si un compte existe avec cet email, un lien a été envoyé." };

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(reponseGenerique);
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(200).json(reponseGenerique);
    }

    // Limite anti-spam : max 3 demandes par heure
    const uneHeureAvant = new Date(Date.now() - 60 * 60 * 1000);
    const demandesRecentes = await prisma.passwordResetToken.count({
      where: { userId: user.id, createdAt: { gte: uneHeureAvant } },
    });

    if (demandesRecentes >= 3) {
      return res.status(200).json(reponseGenerique);
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expireLe: new Date(Date.now() + 20 * 60 * 1000),
      },
    });

    const lien = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    await envoyerEmailResetPassword(user.email, user.nom, lien);

    return res.status(200).json(reponseGenerique);
  } catch (erreur) {
    console.error(erreur);
    return res.status(200).json(reponseGenerique); // toujours la même réponse, même en cas d'erreur interne
  }
}

async function resetPassword(req, res) {
  try {
    const { token, nouveauMotDePasse } = req.body;

    if (!token || !nouveauMotDePasse) {
      return res.status(400).json({ message: "Token et nouveau mot de passe requis." });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetEntry = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        utilise: false,
        expireLe: { gte: new Date() },
      },
    });

    if (!resetEntry) {
      return res.status(400).json({ message: "Lien invalide ou expiré." });
    }

    const motDePasseHash = await hashMotDePasse(nouveauMotDePasse);

    await prisma.user.update({
      where: { id: resetEntry.userId },
      data: { motDePasse: motDePasseHash },
    });

    // Invalide tous les tokens actifs de cet utilisateur
    await prisma.passwordResetToken.updateMany({
      where: { userId: resetEntry.userId, utilise: false },
      data: { utilise: true },
    });

    return res.status(200).json({ message: "Mot de passe mis à jour avec succès." });
  } catch (erreur) {
    console.error(erreur);
    return res.status(500).json({ message: "Erreur serveur." });
  }
}

async function updateProfil(req, res) {
  try {
    const { nom, photoUrl, languePreferee, bio, numeroPaiement } = req.body;

    const donneesAMettreAJour = {};
    if (nom !== undefined) donneesAMettreAJour.nom = nom;
    if (photoUrl !== undefined) donneesAMettreAJour.photoUrl = photoUrl;
    if (languePreferee !== undefined) donneesAMettreAJour.languePreferee = languePreferee;
    if (bio !== undefined) donneesAMettreAJour.bio = bio;
    if (numeroPaiement !== undefined) donneesAMettreAJour.numeroPaiement = numeroPaiement;

    const userMisAJour = await prisma.user.update({
      where: { id: req.user.id },
      data: donneesAMettreAJour,
      select: {
        id: true, nom: true, email: true, role: true,
        photoUrl: true, languePreferee: true, bio: true, numeroPaiement: true,
      },
    });

    res.status(200).json({ message: "Profil mis à jour.", user: userMisAJour });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

async function changerMotDePasse(req, res) {
  try {
    const { ancienMotDePasse, nouveauMotDePasse } = req.body;

    if (!ancienMotDePasse || !nouveauMotDePasse) {
      return res.status(400).json({ message: "Ancien et nouveau mot de passe requis." });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    const motDePasseValide = await comparerMotDePasse(ancienMotDePasse, user.motDePasse);

    if (!motDePasseValide) {
      return res.status(401).json({ message: "Ancien mot de passe incorrect." });
    }

    const nouveauHash = await hashMotDePasse(nouveauMotDePasse);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { motDePasse: nouveauHash },
    });

    res.status(200).json({ message: "Mot de passe mis à jour." });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

module.exports = { register, login, logout, moi, forgotPassword, resetPassword, updateProfil, changerMotDePasse };
