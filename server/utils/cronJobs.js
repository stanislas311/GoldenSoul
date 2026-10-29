const cron = require('node-cron');
const {
  annulerReservationsExpirees,
  verifierDelaisConfirmation,
  envoyerRappelsSeances,
  cloturerSeancesPassees,
} = require('../controllers/sessionController');

function demarrerCronJobs() {
  cron.schedule('* * * * *', async () => {
    try {
      const nombreExpirees = await annulerReservationsExpirees();
      if (nombreExpirees > 0) {
        console.log(`${nombreExpirees} réservation(s) expirée(s) libérée(s).`);
      }

      const nombreNonConfirmees = await verifierDelaisConfirmation();
      if (nombreNonConfirmees > 0) {
        console.log(`${nombreNonConfirmees} session(s) non confirmée(s) sous 2h, annulée(s).`);
      }

      const nombreRappels = await envoyerRappelsSeances();
      if (nombreRappels > 0) {
        console.log(`${nombreRappels} rappel(s) de séance envoyé(s).`);
      }

      const nombreCloturees = await cloturerSeancesPassees();
      if (nombreCloturees > 0) {
        console.log(`${nombreCloturees} séance(s) clôturée(s) automatiquement.`);
      }
    } catch (erreur) {
      console.error("[CronJobs] Erreur lors de l'exécution des tâches de fond :", erreur);
    }
  });
}

module.exports = { demarrerCronJobs };
