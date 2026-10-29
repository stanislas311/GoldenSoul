const prisma = require('../prisma/lib/prismaClient');

// Enregistrer un log d'audit
async function logAudit(praticienId, patientId, action) {
  try {
    await prisma.auditLog.create({
      data: {
        praticienId,
        patientId,
        action,
      },
    });
  } catch (erreur) {
    console.error("Erreur lors de l'enregistrement de l'audit:", erreur);
  }
}

// Créer un créneau (praticien uniquement)
async function creerDisponibilite(req, res) {
  try {
    const { dateDebut, forcer } = req.body;

    if (!dateDebut) {
      return res.status(400).json({ message: "Date de début requise." });
    }

    const debut = new Date(dateDebut);
    const fin = new Date(debut.getTime() + 45 * 60 * 1000); // séance de 45 min

    if (debut < new Date()) {
      return res.status(400).json({ message: "Impossible de créer un créneau dans le passé." });
    }

    // Vérifier s'il existe un créneau à la même date/heure
    const memeCreneau = await prisma.availability.findFirst({
      where: {
        dateDebut: debut,
        dateFin: fin,
      },
    });

    if (memeCreneau) {
      return res.status(409).json({ 
        message: "Un créneau existe déjà à cette date et heure.",
        conflit: 'exact',
        creneauExistant: memeCreneau,
      });
    }

    // Vérifier s'il existe des créneaux proches (moins de 30 min d'écart)
    // Sauf si le paramètre forcer est true
    if (!forcer) {
      const toleranceMinutes = 30;
      const toleranceMs = toleranceMinutes * 60 * 1000;
      
      const creneauxProches = await prisma.availability.findMany({
        where: {
          dateDebut: {
            gte: new Date(debut.getTime() - toleranceMs),
            lte: new Date(debut.getTime() + toleranceMs),
          },
          dateFin: {
            gte: new Date(debut.getTime() - toleranceMs),
            lte: new Date(fin.getTime() + toleranceMs),
          },
        },
        orderBy: { dateDebut: 'asc' },
      });

      if (creneauxProches.length > 0) {
        return res.status(409).json({ 
          message: "Un créneau existe déjà à proximité de cette date.",
          conflit: 'proche',
          creneauxProches,
        });
      }
    }

    const disponibilite = await prisma.availability.create({
      data: {
        dateDebut: debut,
        dateFin: fin,
      },
    });

    res.status(201).json({ message: "Créneau créé.", disponibilite });
  } catch (erreur) {
    if (erreur.code === 'P2002') {
      return res.status(409).json({ message: "Un créneau existe déjà à cette heure." });
    }
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

// Voir tous les créneaux (praticien - vue de gestion complète)
async function listerToutesDisponibilites(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const where = { visible: true };
    const total = await prisma.availability.count({ where });

    const disponibilites = await prisma.availability.findMany({
      where,
      orderBy: { dateDebut: 'asc' },
      include: { sessions: true },
      skip,
      take: limit,
    });

    res.status(200).json({ disponibilites, meta: { page, limit, total } });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

// Voir tous les créneaux (patient - pour voir le statut occupé/libre)
async function listerToutesDisponibilitesPatient(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const where = { visible: true, dateDebut: { gte: new Date() } };
    const total = await prisma.availability.count({ where });

    const disponibilites = await prisma.availability.findMany({
      where,
      orderBy: { dateDebut: 'asc' },
      skip,
      take: limit,
    });

    res.status(200).json({ disponibilites, meta: { page, limit, total } });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

// Voir les créneaux libres uniquement (patient - pour réserver)
async function listerDisponibilitesLibres(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const where = { visible: true, reserve: false, dateDebut: { gte: new Date() } };
    const total = await prisma.availability.count({ where });

    const disponibilites = await prisma.availability.findMany({
      where,
      orderBy: { dateDebut: 'asc' },
      skip,
      take: limit,
    });

    res.status(200).json({ disponibilites, meta: { page, limit, total } });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

// Voir les détails d'un créneau réservé (praticien - infos du patient)
async function detailsCreneauReserve(req, res) {
  try {
    const { availabilityId } = req.params;
    const praticienId = req.user.id;

    const availability = await prisma.availability.findUnique({
      where: { id: availabilityId },
      include: {
        sessions: {
          where: {
            statut: { in: ['EN_ATTENTE_PAIEMENT', 'EN_ATTENTE_CONFIRMATION', 'CONFIRMEE'] },
          },
          include: {
            patient: {
              select: {
                id: true,
                nom: true,
                email: true,
                telephone: true,
                genre: true,
                dateNaissance: true,
                situationMatrimoniale: true,
              },
            },
            paiement: true,
          },
        },
      },
    });

    if (!availability) {
      return res.status(404).json({ message: "Créneau introuvable." });
    }

    if (!availability.sessions || availability.sessions.length === 0) {
      return res.status(404).json({ message: "Aucune réservation trouvée pour ce créneau." });
    }

    const session = availability.sessions[0];
    const patientId = session.patient.id;

    // Enregistrer l'audit : consultation du dossier patient
    await logAudit(praticienId, patientId, `Consultation du dossier patient via créneau ${availabilityId}`);

    res.status(200).json({
      availability,
      session,
      patient: session.patient,
      paiement: session.paiement,
    });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

// Supprimer un créneau (praticien uniquement - soft delete)
async function supprimerDisponibilite(req, res) {
  try {
    const { availabilityId } = req.params;
    const availability = await prisma.availability.findUnique({
      where: { id: availabilityId },
      include: { sessions: true },
    });

    if (!availability) {
      return res.status(404).json({ message: "Créneau introuvable." });
    }

    // On bloque uniquement s'il y a une session ACTIVE (pas les historiques)
    const sessionActive = availability.sessions.find((s) =>
      ['EN_ATTENTE_PAIEMENT', 'EN_ATTENTE_CONFIRMATION', 'CONFIRMEE'].includes(s.statut)
    );

    if (sessionActive) {
      return res.status(403).json({
        message: "Impossible de masquer un créneau ayant une réservation active. Attendez qu'elle soit terminée ou annulée.",
      });
    }

    // Soft delete : rien n'est perdu, juste masqué de la liste de gestion
    await prisma.availability.update({
      where: { id: availabilityId },
      data: { visible: false },
    });

    res.status(200).json({ message: "Créneau masqué." });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

// Modifier un créneau (praticien uniquement - seulement si non réservé)
async function modifierDisponibilite(req, res) {
  try {
    const { availabilityId } = req.params;
    const { dateDebut } = req.body;

    if (!dateDebut) {
      return res.status(400).json({ message: "Date de début requise." });
    }

    const availability = await prisma.availability.findUnique({
      where: { id: availabilityId },
      include: { sessions: true },
    });

    if (!availability) {
      return res.status(404).json({ message: "Créneau introuvable." });
    }

    // Vérifier si le créneau a des sessions (actives ou passées)
    // On ne permet pas la modification même pour les créneaux avec sessions passées
    // pour préserver l'historique
    if (availability.sessions && availability.sessions.length > 0) {
      return res.status(403).json({ 
        message: "Impossible de modifier un créneau qui a des sessions liées (actives ou passées)." 
      });
    }

    const debut = new Date(dateDebut);
    const fin = new Date(debut.getTime() + 45 * 60 * 1000);

    if (debut < new Date()) {
      return res.status(400).json({ message: "Impossible de créer un créneau dans le passé." });
    }

    const disponibilite = await prisma.availability.update({
      where: { id: availabilityId },
      data: {
        dateDebut: debut,
        dateFin: fin,
      },
    });

    res.status(200).json({ message: "Créneau modifié.", disponibilite });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

module.exports = { creerDisponibilite, listerToutesDisponibilites, listerToutesDisponibilitesPatient, listerDisponibilitesLibres, detailsCreneauReserve, supprimerDisponibilite, modifierDisponibilite };
