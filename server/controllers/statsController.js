const prisma = require('../prisma/lib/prismaClient');

async function statistiquesGlobales(req, res) {
  try {
    const totalPatients = await prisma.user.count({ where: { role: 'PATIENT' } });

    const sessionsParStatut = await prisma.session.groupBy({
      by: ['statut'],
      _count: { statut: true },
    });

    const paiementsReussis = await prisma.payment.findMany({
      where: { statut: 'PAYE' },
      select: { montant: true, createdAt: true },
    });

    const revenuTotal = paiementsReussis.reduce((total, p) => total + p.montant, 0);

    // Revenu des 7 derniers jours, groupé par jour
    const septJoursAvant = new Date();
    septJoursAvant.setDate(septJoursAvant.getDate() - 7);

    const paiementsRecents = paiementsReussis.filter((p) => p.createdAt >= septJoursAvant);

    const revenuParJour = {};
    for (let i = 6; i >= 0; i--) {
      const jour = new Date();
      jour.setDate(jour.getDate() - i);
      const cle = jour.toISOString().split('T')[0];
      revenuParJour[cle] = 0;
    }
    paiementsRecents.forEach((p) => {
      const cle = p.createdAt.toISOString().split('T')[0];
      if (revenuParJour[cle] !== undefined) {
        revenuParJour[cle] += p.montant;
      }
    });

    const prochainesSessions = await prisma.session.count({
      where: {
        statut: 'CONFIRMEE',
        availability: { dateDebut: { gte: new Date() } },
      },
    });

    res.status(200).json({
      totalPatients,
      revenuTotal,
      prochainesSessions,
      sessionsParStatut: sessionsParStatut.map((s) => ({
        statut: s.statut,
        total: s._count.statut,
      })),
      revenuParJour: Object.entries(revenuParJour).map(([date, montant]) => ({ date, montant })),
    });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

module.exports = { statistiquesGlobales };
