const prisma = require('../prisma/lib/prismaClient');

// Enregistrer une action d'audit (consultation de dossier patient)
async function enregistrerAudit(req, res) {
  try {
    const { patientId, action } = req.body;
    const praticienId = req.user.id;

    if (!patientId || !action) {
      return res.status(400).json({ message: "patientId et action sont requis." });
    }

    const auditLog = await prisma.auditLog.create({
      data: {
        praticienId,
        patientId,
        action,
      },
    });

    res.status(201).json({ message: "Audit enregistré.", auditLog });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

// Récupérer les logs d'audit pour un patient (praticien uniquement)
async function getAuditLogsPatient(req, res) {
  try {
    const { patientId } = req.params;

    const auditLogs = await prisma.auditLog.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: {
        praticien: {
          select: {
            id: true,
            nom: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json({ auditLogs });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

module.exports = { enregistrerAudit, getAuditLogsPatient };
