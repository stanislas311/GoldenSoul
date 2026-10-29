const prisma = require('../prisma/lib/prismaClient');
const { initierPaiement, verifierTransaction, verifierSignatureHmac } = require('../utils/cinetpay');
const { creerNotification } = require('../utils/notifications');

// Le patient déclenche le paiement pour sa session réservée
async function initierPaiementSession(req, res) {
  try {
    const { sessionId } = req.params;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { patient: true },
    });

    if (!session) {
      return res.status(404).json({ message: "Session introuvable." });
    }

    if (session.patientId !== req.user.id) {
      return res.status(403).json({ message: "Accès refusé." });
    }

    if (session.statut !== 'EN_ATTENTE_PAIEMENT') {
      return res.status(400).json({ message: "Cette session n'est pas en attente de paiement." });
    }

    const montant = 5000 + (session.optionSecurite ? 1500 : 0);

    // Enregistre le paiement en attente, s'il n'existe pas déjà
    const paiementExistant = await prisma.payment.findUnique({ where: { sessionId } });
    if (!paiementExistant) {
      await prisma.payment.create({
        data: { sessionId, montant, statut: 'EN_ATTENTE' },
      });
    }

    const resultat = await initierPaiement({
      transactionId: sessionId, // on réutilise l'id de session comme identifiant de transaction
      montant,
      patient: session.patient,
    });

    if (resultat.code !== '201') {
      return res.status(400).json({ message: "Impossible d'initier le paiement.", details: resultat });
    }

    res.status(200).json({ paymentUrl: resultat.data.payment_url });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

// Webhook appelé par CinetPay (PAS de middleware d'authentification ici, c'est CinetPay qui appelle)
async function notifyCinetPay(req, res) {
  try {
    const transactionId = req.body.cpm_trans_id;

    if (!transactionId) {
      return res.status(400).send('cpm_trans_id manquant');
    }

    // Vérification HMAC (couche de confiance supplémentaire, pas suffisante seule)
    const tokenHeader = req.headers['x-token'];
    if (tokenHeader && !verifierSignatureHmac(tokenHeader, req.body)) {
      console.warn('Signature HMAC invalide pour', transactionId);
      return res.status(401).send('Signature invalide');
    }

    // La session a le même id que la transaction
    const session = await prisma.session.findUnique({ where: { id: transactionId } });

    if (!session) {
      return res.status(404).send('Session introuvable');
    }

    // Idempotence : si déjà traité, on ne refait rien
    const paiement = await prisma.payment.findUnique({ where: { sessionId: transactionId } });
    if (paiement && paiement.statut === 'PAYE') {
      return res.status(200).send('OK - déjà traité');
    }

    // Seule source de vérité : on redemande le vrai statut à CinetPay
    const verification = await verifierTransaction(transactionId);

    if (verification.data && verification.data.status === 'ACCEPTED') {
      await prisma.$transaction([
        prisma.payment.update({
          where: { sessionId: transactionId },
          data: { statut: 'PAYE', referenceExterne: verification.data.payment_method || null },
        }),
        prisma.session.update({
          where: { id: transactionId },
          data: { statut: 'EN_ATTENTE_CONFIRMATION', paiementConfirmeLe: new Date() },
        }),
      ]);
    } else {
      await prisma.payment.update({
        where: { sessionId: transactionId },
        data: { statut: 'ECHOUE' },
      });
    }

    res.status(200).send('OK');
  } catch (erreur) {
    console.error(erreur);
    res.status(500).send('Erreur serveur');
  }
}

async function declarerPaiementManuel(req, res) {
  try {
    const { sessionId } = req.params;
    const { preuveUrl } = req.body;

    if (!preuveUrl) {
      return res.status(400).json({ message: "Preuve de paiement requise." });
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { paiement: true, patient: true },
    });

    if (!session) {
      return res.status(404).json({ message: "Session introuvable." });
    }

    if (session.patientId !== req.user.id) {
      return res.status(403).json({ message: "Accès refusé." });
    }

    if (session.statut !== 'EN_ATTENTE_PAIEMENT') {
      return res.status(400).json({ message: "Cette session n'est pas en attente de paiement." });
    }

    await prisma.payment.update({
      where: { sessionId },
      data: { preuveUrl },
    });

    await prisma.session.update({
      where: { id: sessionId },
      data: { statut: 'EN_ATTENTE_CONFIRMATION', paiementConfirmeLe: new Date() },
    });

    const praticien = await prisma.user.findFirst({ where: { role: 'PRATICIEN' } });
    if (praticien) {
      creerNotification(
        praticien.id,
        'PAIEMENT_DECLARE',
        `${session.patient.nom} déclare avoir payé (réf. ${session.paiement.codeReference}). Vérifiez et confirmez.`
      ).catch(console.error);
    }

    res.status(200).json({ message: "Paiement déclaré, en attente de vérification par le praticien." });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

async function obtenirInfosPaiement(req, res) {
  try {
    const praticien = await prisma.user.findFirst({
      where: { role: 'PRATICIEN' },
      select: { numeroPaiement: true, nom: true },
    });

    res.status(200).json({ numeroPaiement: praticien?.numeroPaiement || null, nomPraticien: praticien?.nom });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

async function mesPaiements(req, res) {
  try {
    const sessions = await prisma.session.findMany({
      where: { patientId: req.user.id },
      include: { paiement: true, availability: true },
      orderBy: { createdAt: 'desc' },
    });

    const paiements = sessions
      .filter((s) => s.paiement)
      .map((s) => ({
        id: s.paiement.id,
        sessionId: s.id,
        montant: s.paiement.montant,
        statut: s.paiement.statut,
        codeReference: s.paiement.codeReference,
        dateSession: s.availability.dateDebut,
        statutSession: s.statut,
        createdAt: s.paiement.createdAt,
      }));

    res.status(200).json({ paiements });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

async function genererRecu(req, res) {
  try {
    const { sessionId } = req.params;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { paiement: true, availability: true, patient: true },
    });

    if (!session || !session.paiement) {
      return res.status(404).json({ message: "Paiement introuvable." });
    }

    if (session.patientId !== req.user.id && req.user.role !== 'PRATICIEN') {
      return res.status(403).json({ message: "Accès refusé." });
    }

    if (session.paiement.statut !== 'PAYE') {
      return res.status(400).json({ message: "Aucun reçu disponible pour ce paiement." });
    }

    const praticien = await prisma.user.findFirst({ where: { role: 'PRATICIEN' } });

    res.status(200).json({
      recu: {
        numeroRecu: `RECU-${session.paiement.codeReference}`,
        nomPatient: session.patient.nom,
        emailPatient: session.patient.email,
        nomPraticien: praticien?.nom || 'GoldenSoul',
        montant: session.paiement.montant,
        codeReference: session.paiement.codeReference,
        dateSeance: session.availability.dateDebut,
        datePaiement: session.paiement.updatedAt,
        optionSecurite: session.optionSecurite,
      },
    });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

async function paiementsPraticien(req, res) {
  try {
    const sessions = await prisma.session.findMany({
      where: {
        paiement: {
          statut: 'PAYE'
        }
      },
      include: {
        paiement: true,
        patient: { select: { id: true, nom: true, email: true, telephone: true } },
        availability: { select: { dateDebut: true, dateFin: true } }
      },
      orderBy: {
        paiement: { updatedAt: 'desc' }
      }
    });

    const paiements = sessions
      .filter(s => s.paiement)
      .map((s) => ({
        id: s.paiement.id,
        sessionId: s.id,
        montant: s.paiement.montant,
        statut: s.paiement.statut,
        codeReference: s.paiement.codeReference,
        preuveUrl: s.paiement.preuveUrl,
        datePaiement: s.paiement.updatedAt,
        dateSession: s.availability.dateDebut,
        patient: s.patient
      }));

    res.status(200).json({ paiements });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des paiements." });
  }
}

async function supprimerPaiement(req, res) {
  try {
    const { paymentId } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { session: true },
    });

    if (!payment) {
      return res.status(404).json({ message: "Paiement introuvable." });
    }

    // Patient peut supprimer ses propres paiements, Praticien peut tout supprimer
    if (req.user.role !== 'PRATICIEN' && payment.session.patientId !== req.user.id) {
      return res.status(403).json({ message: "Accès refusé." });
    }

    await prisma.payment.delete({ where: { id: paymentId } });

    res.status(200).json({ message: "Paiement supprimé avec succès." });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur lors de la suppression." });
  }
}

module.exports = { initierPaiementSession, notifyCinetPay, declarerPaiementManuel, obtenirInfosPaiement, mesPaiements, genererRecu, paiementsPraticien, supprimerPaiement };
