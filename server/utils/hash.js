const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

async function hashMotDePasse(motDePasse) {
  return bcrypt.hash(motDePasse, SALT_ROUNDS);
}

async function comparerMotDePasse(motDePasse, hash) {
  return bcrypt.compare(motDePasse, hash);
}

module.exports = { hashMotDePasse, comparerMotDePasse };
