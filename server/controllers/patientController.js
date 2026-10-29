const prisma = require('../prisma/lib/prismaClient');

// Liste de tous les patients (praticien)
async function listerPatients(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const totalPatients = await prisma.user.count({ where: { role: 'PATIENT' } });

    const patients = await prisma.user.findMany({
      where: { role: 'PATIENT' },
      select: {
        id: true, nom: true, email: true, telephone: true,
        genre: true, dateNaissance: true, situationMatrimoniale: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    res.status(200).json({ patients, meta: { page, limit, total: totalPatients } });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

// Dossier complet d'un patient (praticien) — avec journal d'audit
async function voirDossierPatient(req, res) {
  try {
    const { patientId } = req.params;

    const patient = await prisma.user.findUnique({
      where: { id: patientId, role: 'PATIENT' },
      select: {
        id: true, nom: true, email: true, telephone: true,
        genre: true, dateNaissance: true, situationMatrimoniale: true,
        createdAt: true,
      },
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient introuvable." });
    }

    const sessions = await prisma.session.findMany({
      where: { patientId },
      include: { availability: true, avis: true },
      orderBy: { createdAt: 'desc' },
    });

    const quizResponses = await prisma.quizResponse.findMany({
      where: { patientId },
      include: { quiz: true },
      orderBy: { createdAt: 'desc' },
    });

    // Traçabilité : on enregistre CETTE consultation du dossier
    await prisma.auditLog.create({
      data: {
        praticienId: req.user.id,
        patientId,
        action: 'CONSULTATION_DOSSIER',
      },
    });

    res.status(200).json({ patient, sessions, quizResponses });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

// Ajouter/modifier une note clinique sur une session (praticien)
async function modifierNoteClinique(req, res) {
  try {
    const { sessionId } = req.params;
    const { note } = req.body;

    const session = await prisma.session.update({
      where: { id: sessionId },
      data: { noteClinique: note },
    });

    await prisma.auditLog.create({
      data: {
        praticienId: req.user.id,
        patientId: session.patientId,
        action: 'MODIFICATION_NOTE_CLINIQUE',
      },
    });

    res.status(200).json({ message: "Note enregistrée.", session });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

module.exports = { listerPatients, voirDossierPatient, modifierNoteClinique };
