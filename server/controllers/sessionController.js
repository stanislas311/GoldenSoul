const prisma = require('../prisma/lib/prismaClient');
const crypto = require('crypto');
const { envoyerEmailConfirmationRdv, envoyerEmailRefusRdv, envoyerEmailRemboursement, envoyerEmailRappelSeance } = require('../utils/email');
const { creerNotification } = require('../utils/notifications');

function genererCodeReference() {
  const nombre = Math.floor(1000 + Math.random() * 9000);
  return `GC-${nombre}`;
}

async function reserverCreneau(req, res) {
  try {
    const { availabilityId, optionSecurite } = req.body;
    const patientId = req.user.id;

    if (!availabilityId) {
      return res.status(400).json({ message: "Créneau requis." });
    }

    // Règle : une seule réservation active à la fois par patient
    const reservationActive = await prisma.session.findFirst({
      where: {
        patientId,
        statut: { in: ['EN_ATTENTE_PAIEMENT', 'EN_ATTENTE_CONFIRMATION', 'CONFIRMEE'] },
      },
    });

    if (reservationActive) {
      return res.status(409).json({
        message: "Vous avez déjà une réservation en cours. Attendez qu'elle soit traitée avant d'en faire une nouvelle.",
      });
    }

    // Transaction avec verrou : lecture + écriture atomiques
    const nouvelleSession = await prisma.$transaction(async (tx) => {
      // Verrou pessimiste sur la ligne du créneau (SELECT FOR UPDATE)
      const creneau = await tx.$queryRaw`
        SELECT * FROM availabilities WHERE id = ${availabilityId} FOR UPDATE
      `;

      if (!creneau || creneau.length === 0) {
        throw new Error("CRENEAU_INTROUVABLE");
      }

      if (creneau[0].reserve) {
        throw new Error("CRENEAU_DEJA_RESERVE");
      }

      // Marquer le créneau comme réservé
      await tx.availability.update({
        where: { id: availabilityId },
        data: { reserve: true },
      });

      // Créer la session, expire dans 10 minutes si non payée
      const session = await tx.session.create({
        data: {
          patientId,
          availabilityId,
          statut: 'EN_ATTENTE_PAIEMENT',
          optionSecurite: !!optionSecurite,
          expireLe: new Date(Date.now() + 10 * 60 * 1000),
        },
      });

      // Créer le paiement avec code de référence unique
      const montant = 5000 + (optionSecurite ? 1500 : 0);
      let codeReference;
      let dejaUtilise = true;

      while (dejaUtilise) {
        codeReference = genererCodeReference();
        const existant = await tx.payment.findUnique({ where: { codeReference } });
        dejaUtilise = !!existant;
      }

      await tx.payment.create({
        data: {
          sessionId: session.id,
          montant,
          statut: 'EN_ATTENTE',
          codeReference,
        },
      });

      return session;
    });

    res.status(201).json({ message: "Créneau réservé, en attente de paiement.", session: nouvelleSession });
  } catch (erreur) {
    if (erreur.message === 'CRENEAU_DEJA_RESERVE') {
      return res.status(409).json({ message: "Ce créneau vient d'être réservé, merci d'en choisir un autre." });
    }
    if (erreur.message === 'CRENEAU_INTROUVABLE') {
      return res.status(404).json({ message: "Créneau introuvable." });
    }
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

async function annulerReservationsExpirees() {
  const maintenant = new Date();

  const sessionsExpirees = await prisma.session.findMany({
    where: {
      statut: 'EN_ATTENTE_PAIEMENT',
      expireLe: { lt: maintenant },
    },
  });

  if (sessionsExpirees.length === 0) return 0;

  const sessionIds = sessionsExpirees.map(s => s.id);
  const availabilityIds = sessionsExpirees.map(s => s.availabilityId);

  await prisma.$transaction([
    prisma.session.updateMany({
      where: { id: { in: sessionIds } },
      data: { statut: 'ANNULEE' },
    }),
    prisma.availability.updateMany({
      where: { id: { in: availabilityIds } },
      data: { reserve: false },
    }),
  ]);

  return sessionsExpirees.length;
}

async function mesSessions(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const totalSessions = await prisma.session.count({ where: { patientId: req.user.id } });

    const sessions = await prisma.session.findMany({
      where: { patientId: req.user.id },
      include: { availability: true, paiement: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    res.status(200).json({ sessions, meta: { page, limit, total: totalSessions } });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

// Simule la confirmation de paiement (en attendant la vraie intégration CinetPay)
async function simulerPaiementConfirme(req, res) {
  try {
    const { sessionId } = req.params;

    const session = await prisma.session.findUnique({ where: { id: sessionId } });

    if (!session) {
      return res.status(404).json({ message: "Session introuvable." });
    }

    if (session.patientId !== req.user.id) {
      return res.status(403).json({ message: "Accès refusé." });
    }

    if (session.statut !== 'EN_ATTENTE_PAIEMENT') {
      return res.status(400).json({ message: "Cette session n'est pas en attente de paiement." });
    }

    const sessionMiseAJour = await prisma.session.update({
      where: { id: sessionId },
      data: {
        statut: 'EN_ATTENTE_CONFIRMATION',
        paiementConfirmeLe: new Date(),
      },
    });

    res.status(200).json({ message: "Paiement confirmé, en attente de validation du praticien.", session: sessionMiseAJour });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

// Le praticien confirme ou refuse un rendez-vous en attente
async function confirmerSession(req, res) {
  try {
    const { sessionId } = req.params;
    const { accepter } = req.body;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { patient: true, availability: true, paiement: true },
    });

    if (!session) {
      return res.status(404).json({ message: "Session introuvable." });
    }

    if (session.statut !== 'EN_ATTENTE_CONFIRMATION') {
      return res.status(400).json({ message: "Cette session n'est pas en attente de confirmation." });
    }

    const dateHeure = new Date(session.availability.dateDebut).toLocaleString('fr-FR', {
      dateStyle: 'long',
      timeStyle: 'short',
    });

    if (accepter) {
      const roomId = crypto.randomUUID();

      const sessionConfirmee = await prisma.session.update({
        where: { id: sessionId },
        data: {
          statut: 'CONFIRMEE',
          confirmeLe: new Date(),
          lienVisio: roomId,
        },
      });

      // Le praticien a vérifié la preuve, on marque le paiement comme réellement payé
      await prisma.payment.update({
        where: { sessionId },
        data: { statut: 'PAYE' },
      });

      envoyerEmailConfirmationRdv(session.patient.email, session.patient.nom, dateHeure).catch(console.error);
      creerNotification(session.patientId, 'RDV_CONFIRME', `Votre rendez-vous du ${dateHeure} est confirmé.`, { sessionId: session.id }).catch(console.error);

      return res.status(200).json({ message: "Rendez-vous confirmé.", session: sessionConfirmee });
    } else {
      await prisma.$transaction([
        prisma.session.update({
          where: { id: sessionId },
          data: { statut: 'ANNULEE' },
        }),
        prisma.availability.update({
          where: { id: session.availabilityId },
          data: { reserve: false },
        }),
        prisma.payment.update({
          where: { sessionId },
          data: { statut: 'ECHOUE' },
        }),
      ]);

      envoyerEmailRefusRdv(session.patient.email, session.patient.nom, dateHeure).catch(console.error);
      creerNotification(session.patientId, 'RDV_REFUSE', `Votre rendez-vous du ${dateHeure} n'a pas pu être confirmé.`, { sessionId: session.id }).catch(console.error);

      return res.status(200).json({ message: "Rendez-vous refusé, remboursement à traiter." });
    }
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

// Sessions en attente de confirmation, pour le praticien
async function sessionsEnAttente(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const totalSessions = await prisma.session.count({ where: { statut: 'EN_ATTENTE_CONFIRMATION' } });

    const sessions = await prisma.session.findMany({
      where: { statut: 'EN_ATTENTE_CONFIRMATION' },
      include: {
        availability: true,
        patient: { select: { nom: true, email: true } },
        paiement: true,
      },
      orderBy: { paiementConfirmeLe: 'asc' },
      skip,
      take: limit,
    });

    res.status(200).json({ sessions, meta: { page, limit, total: totalSessions } });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

// Vérifie si le délai de 2h est dépassé, et rembourse/libère automatiquement
async function verifierDelaisConfirmation() {
  const deuxHeuresAvant = new Date(Date.now() - 2 * 60 * 60 * 1000);

  const sessionsExpirees = await prisma.session.findMany({
    where: {
      statut: 'EN_ATTENTE_CONFIRMATION',
      paiementConfirmeLe: { lt: deuxHeuresAvant },
    },
  });

  if (sessionsExpirees.length === 0) return 0;

  const sessionIds = sessionsExpirees.map(s => s.id);
  const availabilityIds = sessionsExpirees.map(s => s.availabilityId);

  await prisma.$transaction([
    prisma.session.updateMany({
      where: { id: { in: sessionIds } },
      data: { statut: 'ANNULEE' },
    }),
    prisma.availability.updateMany({
      where: { id: { in: availabilityIds } },
      data: { reserve: false },
    }),
  ]);
  // TODO : déclencher le vrai remboursement quand le paiement sera branché

  return sessionsExpirees.length;
}

async function annulerSession(req, res) {
  try {
    const { sessionId } = req.params;
    const { action, nouvelleAvailabilityId } = req.body; // action: 'remboursement' | 'report'

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { availability: true, patient: true },
    });

    if (!session) {
      return res.status(404).json({ message: "Session introuvable." });
    }

    if (session.patientId !== req.user.id) {
      return res.status(403).json({ message: "Accès refusé." });
    }

    if (!['CONFIRMEE', 'EN_ATTENTE_CONFIRMATION'].includes(session.statut)) {
      return res.status(400).json({ message: "Cette session ne peut pas être annulée dans son état actuel." });
    }

    // Règle 1 : sans option de sécurité, aucune annulation possible
    if (!session.optionSecurite) {
      return res.status(403).json({
        message: "Annulation impossible : vous n'avez pas souscrit l'option de sécurité pour ce rendez-vous.",
      });
    }

    // Règle 2 : délai minimum de 1h avant la séance
    const uneHeureAvant = new Date(session.availability.dateDebut.getTime() - 60 * 60 * 1000);
    if (new Date() > uneHeureAvant) {
      return res.status(403).json({
        message: "Annulation impossible : le délai d'1h avant la séance est dépassé.",
      });
    }

    if (action === 'remboursement') {
      await prisma.$transaction([
        prisma.session.update({
          where: { id: sessionId },
          data: { statut: 'ANNULEE' },
        }),
        prisma.availability.update({
          where: { id: session.availabilityId },
          data: { reserve: false },
        }),
        prisma.payment.update({
          where: { sessionId },
          data: { statut: 'REMBOURSEMENT_EN_COURS' },
        }),
      ]);

      envoyerEmailRemboursement(session.patient.email, session.patient.nom).catch(console.error);
      creerNotification(session.patientId, 'REMBOURSEMENT', `Votre remboursement est en cours de traitement.`, { sessionId: session.id }).catch(console.error);

      return res.status(200).json({ message: "Annulation confirmée, remboursement en cours (sous 24h)." });
    }

    if (action === 'report') {
      if (!nouvelleAvailabilityId) {
        return res.status(400).json({ message: "Nouveau créneau requis pour un report." });
      }

      const resultat = await prisma.$transaction(async (tx) => {
        const nouveauCreneau = await tx.$queryRaw`
          SELECT * FROM availabilities WHERE id = ${nouvelleAvailabilityId} FOR UPDATE
        `;

        if (!nouveauCreneau || nouveauCreneau.length === 0) {
          throw new Error('CRENEAU_INTROUVABLE');
        }
        if (nouveauCreneau[0].reserve) {
          throw new Error('CRENEAU_DEJA_RESERVE');
        }

        // Libère l'ancien créneau
        await tx.availability.update({
          where: { id: session.availabilityId },
          data: { reserve: false },
        });

        // Réserve le nouveau
        await tx.availability.update({
          where: { id: nouvelleAvailabilityId },
          data: { reserve: true },
        });

        // Déplace la session sur le nouveau créneau
        return tx.session.update({
          where: { id: sessionId },
          data: { availabilityId: nouvelleAvailabilityId },
        });
      });

      return res.status(200).json({ message: "Rendez-vous reporté avec succès.", session: resultat });
    }

    return res.status(400).json({ message: "Action invalide, attendu 'remboursement' ou 'report'." });
  } catch (erreur) {
    if (erreur.message === 'CRENEAU_DEJA_RESERVE') {
      return res.status(409).json({ message: "Ce créneau vient d'être réservé, merci d'en choisir un autre." });
    }
    if (erreur.message === 'CRENEAU_INTROUVABLE') {
      return res.status(404).json({ message: "Créneau introuvable." });
    }
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

async function rejoindreVisio(req, res) {
  try {
    const { sessionId } = req.params;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { availability: true },
    });

    if (!session) {
      return res.status(404).json({ message: "Session introuvable." });
    }

    const estLePatient = session.patientId === req.user.id;
    const estLePraticien = req.user.role === 'PRATICIEN';

    if (!estLePatient && !estLePraticien) {
      return res.status(403).json({ message: "Accès refusé." });
    }

    if (!['CONFIRMEE', 'EN_COURS'].includes(session.statut)) {
      return res.status(400).json({ message: "Cette séance n'est pas accessible." });
    }

    const maintenant = new Date();
    const ouvertureAcces = new Date(session.availability.dateDebut.getTime() - 10 * 60 * 1000);
    const fermetureAcces = session.availability.dateFin;

    // Marquer la session comme EN_COURS si c'est le premier participant ET qu'on est dans la fenêtre d'accès
    if (session.statut === 'CONFIRMEE' && maintenant >= ouvertureAcces && maintenant <= fermetureAcces) {
      await prisma.session.update({
        where: { id: sessionId },
        data: { statut: 'EN_COURS' },
      });
    }

    if (maintenant < ouvertureAcces) {
      return res.status(403).json({
        message: "L'accès à la séance n'est pas encore ouvert. Il ouvre 10 minutes avant l'heure prévue.",
      });
    }

    if (maintenant > fermetureAcces) {
      return res.status(403).json({ message: "Cette séance est terminée." });
    }

    res.status(200).json({ lien: `/appel/${session.lienVisio}` });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

async function terminerSeance(req, res) {
  try {
    const { sessionId } = req.params;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { availability: true },
    });

    if (!session) {
      return res.status(404).json({ message: "Session introuvable." });
    }

    const estLePatient = session.patientId === req.user.id;
    const estLePraticien = req.user.role === 'PRATICIEN';

    if (!estLePatient && !estLePraticien) {
      return res.status(403).json({ message: "Accès refusé." });
    }

    if (!['EN_COURS'].includes(session.statut)) {
      return res.status(400).json({ message: "Cette séance n'est pas en cours." });
    }

    await prisma.session.update({
      where: { id: sessionId },
      data: { statut: 'TERMINEE' },
    });

    res.status(200).json({ message: "Séance terminée avec succès." });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

async function envoyerRappelsSeances() {
  const dansUneHeure = new Date(Date.now() + 60 * 60 * 1000);
  const dansUneHeureCinq = new Date(Date.now() + 65 * 60 * 1000);

  const sessionsAAppeler = await prisma.session.findMany({
    where: {
      statut: 'CONFIRMEE',
      rappelEnvoye: false,
      availability: {
        dateDebut: { gte: dansUneHeure, lt: dansUneHeureCinq },
      },
    },
    include: { patient: true, availability: true },
  });

  if (sessionsAAppeler.length === 0) return 0;

  const praticien = await prisma.user.findFirst({ where: { role: 'PRATICIEN' } });

  // Exécution parallèle par lots (Promise.all) pour ne pas bloquer
  const promesses = sessionsAAppeler.map(async (session) => {
    const dateHeure = new Date(session.availability.dateDebut).toLocaleString('fr-FR', {
      dateStyle: 'long',
      timeStyle: 'short',
    });

    const promisesParSession = [
      envoyerEmailRappelSeance(session.patient.email, session.patient.nom, dateHeure).catch(console.error),
      creerNotification(session.patientId, 'RAPPEL_SEANCE', `Rappel : rendez-vous le ${dateHeure}.`, { sessionId: session.id }).catch(console.error)
    ];

    if (praticien) {
      promisesParSession.push(
        envoyerEmailRappelSeance(praticien.email, praticien.nom, dateHeure).catch(console.error),
        creerNotification(praticien.id, 'RAPPEL_SEANCE', `Rappel : séance avec ${session.patient.nom} le ${dateHeure}.`, { sessionId: session.id, patientId: session.patientId }).catch(console.error)
      );
    }
    
    await Promise.all(promisesParSession);
  });

  await Promise.all(promesses);

  await prisma.session.updateMany({
    where: { id: { in: sessionsAAppeler.map(s => s.id) } },
    data: { rappelEnvoye: true },
  });

  return sessionsAAppeler.length;
}

async function supprimerSessionPasse(req, res) {
  try {
    const { sessionId } = req.params;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { availability: true },
    });

    if (!session) {
      return res.status(404).json({ message: "Session introuvable." });
    }

    // Vérifier que l'utilisateur est le patient ou le praticien
    const estLePatient = session.patientId === req.user.id;
    const estLePraticien = req.user.role === 'PRATICIEN';

    if (!estLePatient && !estLePraticien) {
      return res.status(403).json({ message: "Accès refusé." });
    }

    // Vérifier que la session est passée (TERMINEE, ABSENCE, ANNULEE)
    if (!['TERMINEE', 'ABSENCE', 'ANNULEE'].includes(session.statut)) {
      return res.status(400).json({ message: "Cette session n'est pas encore passée. Utilisez l'annulation pour les sessions à venir." });
    }

    // Supprimer la session et ses dépendances (paiement, avis)
    await prisma.$transaction([
      prisma.payment.deleteMany({ where: { sessionId } }),
      prisma.avis.deleteMany({ where: { sessionId } }),
      prisma.session.delete({ where: { id: sessionId } }),
    ]);

    res.status(200).json({ message: "Session supprimée avec succès." });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

async function toutesSessions(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const totalSessions = await prisma.session.count();

    const sessions = await prisma.session.findMany({
      include: { availability: true, patient: { select: { nom: true, email: true } }, paiement: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    res.status(200).json({ sessions, meta: { page, limit, total: totalSessions } });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

// Appelé quand un participant rejoint effectivement l'appel
async function demarrerSession(req, res) {
  try {
    const { sessionId } = req.params;

    // Chercher la session par ID ou par lienVisio (pour supporter les deux cas)
    const session = await prisma.session.findFirst({
      where: {
        OR: [
          { id: sessionId },
          { lienVisio: sessionId }
        ]
      }
    });

    if (!session) {
      return res.status(404).json({ message: "Session introuvable." });
    }

    if (session.statut === 'TERMINEE') {
      return res.status(400).json({ message: "Cette séance est terminée." });
    }

    if (session.statut === 'ANNULEE') {
      return res.status(400).json({ message: "Cette séance a été annulée." });
    }

    if (session.statut === 'CONFIRMEE') {
      await prisma.session.update({
        where: { id: session.id },
        data: { statut: 'EN_COURS' },
      });
    }

    // Si déjà EN_COURS, on ne fait rien de plus : la reconnexion est simplement autorisée
    res.status(200).json({ message: "Séance en cours." });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

// Appelé quand l'appel se termine réellement (les deux ont raccroché)
async function terminerSession(req, res) {
  try {
    const { sessionId } = req.params;

    const session = await prisma.session.findUnique({ where: { id: sessionId }, include: { patient: true } });

    if (!session) {
      return res.status(404).json({ message: "Session introuvable." });
    }

    if (session.statut === 'EN_COURS') {
      await prisma.session.update({
        where: { id: sessionId },
        data: { statut: 'TERMINEE' },
      });
    }

    res.status(200).json({ message: "Séance terminée." });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

async function laisserAvis(req, res) {
  try {
    const { sessionId } = req.params;
    const { note } = req.body;

    if (!note || note < 1 || note > 5) {
      return res.status(400).json({ message: "Note invalide (1 à 5)." });
    }

    const session = await prisma.session.findUnique({ where: { id: sessionId } });

    if (!session) {
      return res.status(404).json({ message: "Session introuvable." });
    }

    if (session.patientId !== req.user.id) {
      return res.status(403).json({ message: "Accès refusé." });
    }

    const avisExistant = await prisma.avis.findUnique({ where: { sessionId } });
    if (avisExistant) {
      return res.status(409).json({ message: "Vous avez déjà laissé un avis pour cette séance." });
    }

    await prisma.avis.create({ data: { sessionId, note } });

    const praticien = await prisma.user.findFirst({ where: { role: 'PRATICIEN' } });
    if (praticien) {
      creerNotification(praticien.id, 'NOUVEL_AVIS', `Un patient a laissé un avis (${note}/5) sur sa séance.`, { sessionId, patientId: session.patientId }).catch(console.error);
    }

    res.status(200).json({ message: "Merci pour votre avis." });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

async function cloturerSeancesPassees() {
  const maintenant = new Date();

  // Séances confirmées ou en cours dont l'heure de fin est dépassée -> TERMINEE
  const sessionsATerminer = await prisma.session.findMany({
    where: {
      statut: { in: ['CONFIRMEE', 'EN_COURS'] },
      availability: { dateFin: { lt: maintenant } },
    },
  });

  if (sessionsATerminer.length > 0) {
    await prisma.session.updateMany({
      where: { id: { in: sessionsATerminer.map(s => s.id) } },
      data: { statut: 'TERMINEE' },
    });
  }

  // Sécurité complémentaire : tout créneau marqué "reserve" dont la/les sessions
  // liées sont TOUTES dans un état final (TERMINEE, ANNULEE, ABSENCE) et passé,
  // doit être libéré s'il n'y a plus aucune session active dessus.
  const creneauxReserves = await prisma.availability.findMany({
    where: { reserve: true, dateFin: { lt: maintenant } },
    include: { sessions: true },
  });

  const creneauxALiberer = [];

  for (const creneau of creneauxReserves) {
    const aUneSessionActive = creneau.sessions.some((s) =>
      ['EN_ATTENTE_PAIEMENT', 'EN_ATTENTE_CONFIRMATION', 'CONFIRMEE'].includes(s.statut)
    );

    if (!aUneSessionActive) {
      creneauxALiberer.push(creneau.id);
    }
  }

  if (creneauxALiberer.length > 0) {
    await prisma.availability.updateMany({
      where: { id: { in: creneauxALiberer } },
      data: { reserve: true }, // reste vrai historiquement, mais visible=false le masquera si le praticien le souhaite
    });
  }

  return sessionsATerminer.length;
}

module.exports = {
  reserverCreneau,
  annulerReservationsExpirees,
  mesSessions,
  toutesSessions,
  simulerPaiementConfirme,
  confirmerSession,
  sessionsEnAttente,
  verifierDelaisConfirmation,
  annulerSession,
  rejoindreVisio,
  terminerSeance,
  demarrerSession,
  terminerSession,
  laisserAvis,
  envoyerRappelsSeances,
  supprimerSessionPasse,
  cloturerSeancesPassees,
};
