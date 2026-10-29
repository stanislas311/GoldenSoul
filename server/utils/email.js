const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const EXPEDITEUR = 'GoldenSoul <onboarding@resend.dev>';

async function envoyerEmailResetPassword(destinataire, nom, lien) {
  await resend.emails.send({
    from: EXPEDITEUR,
    to: destinataire,
    subject: 'Réinitialisation de votre mot de passe',
    html: `
      <p>Bonjour ${nom},</p>
      <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous :</p>
      <p><a href="${lien}">${lien}</a></p>
      <p>Ce lien expire dans 20 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
    `,
  });
}

async function envoyerEmailBienvenue(destinataire, nom) {
  await resend.emails.send({
    from: EXPEDITEUR,
    to: destinataire,
    subject: 'Bienvenue sur GoldenSoul',
    html: `
      <p>Bonjour ${nom},</p>
      <p>Votre compte a bien été créé. Vous pouvez dès à présent réserver votre première séance.</p>
    `,
  });
}

async function envoyerEmailConfirmationRdv(destinataire, nom, dateHeure) {
  await resend.emails.send({
    from: EXPEDITEUR,
    to: destinataire,
    subject: 'Rendez-vous confirmé',
    html: `
      <p>Bonjour ${nom},</p>
      <p>Votre rendez-vous du ${dateHeure} est confirmé.</p>
      <p>Vous pourrez rejoindre la séance depuis votre espace, 10 minutes avant l'heure prévue.</p>
    `,
  });
}

async function envoyerEmailRefusRdv(destinataire, nom, dateHeure) {
  await resend.emails.send({
    from: EXPEDITEUR,
    to: destinataire,
    subject: 'Rendez-vous non confirmé',
    html: `
      <p>Bonjour ${nom},</p>
      <p>Votre demande de rendez-vous du ${dateHeure} n'a malheureusement pas pu être confirmée.</p>
      <p>Un remboursement est en cours de traitement, sous 24h.</p>
    `,
  });
}

async function envoyerEmailRemboursement(destinataire, nom) {
  await resend.emails.send({
    from: EXPEDITEUR,
    to: destinataire,
    subject: 'Remboursement en cours',
    html: `
      <p>Bonjour ${nom},</p>
      <p>Votre demande de remboursement a bien été prise en compte et sera traitée sous 24h.</p>
    `,
  });
}

async function envoyerEmailRappelSeance(destinataire, nom, dateHeure) {
  await resend.emails.send({
    from: EXPEDITEUR,
    to: destinataire,
    subject: 'Rappel de rendez-vous',
    html: `
      <p>Bonjour ${nom},</p>
      <p>Rappel : vous avez rendez-vous le ${dateHeure}.</p>
    `,
  });
}

module.exports = {
  envoyerEmailResetPassword,
  envoyerEmailBienvenue,
  envoyerEmailConfirmationRdv,
  envoyerEmailRefusRdv,
  envoyerEmailRemboursement,
  envoyerEmailRappelSeance,
};
