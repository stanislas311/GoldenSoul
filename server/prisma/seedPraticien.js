require('dotenv').config();
const prisma = require('./lib/prismaClient');
const { hashMotDePasse } = require('../utils/hash');

async function creerPraticien() {
  const email = process.env.PRATICIEN_EMAIL;
  const motDePasse = process.env.PRATICIEN_PASSWORD;

  if (!email || !motDePasse) {
    console.error("PRATICIEN_EMAIL ou PRATICIEN_PASSWORD manquant dans .env");
    process.exit(1);
  }

  const existant = await prisma.user.findUnique({ where: { email } });

  if (existant) {
    console.log("Un compte praticien existe déjà avec cet email :", email);
    process.exit(0);
  }

  const motDePasseHash = await hashMotDePasse(motDePasse);

  const praticien = await prisma.user.create({
    data: {
      nom: "Praticien GoldenSoul",
      email,
      motDePasse: motDePasseHash,
      role: "PRATICIEN",
      dateNaissance: new Date("1990-01-01"),
      consentementAccepte: true,
      consentementDate: new Date(),
      consentementVersion: "v1.0",
      emailVerifie: true,
    },
  });

  console.log("Compte praticien créé avec succès :", praticien.email);
  process.exit(0);
}

creerPraticien().catch((erreur) => {
  console.error("Erreur lors de la création du praticien :", erreur);
  process.exit(1);
});
