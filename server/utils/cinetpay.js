const axios = require('axios');
const crypto = require('crypto');

async function initierPaiement({ transactionId, montant, patient }) {
  const payload = {
    apikey: process.env.CINETPAY_APIKEY,
    site_id: process.env.CINETPAY_SITE_ID,
    transaction_id: transactionId,
    amount: montant,
    currency: 'XOF',
    description: 'Séance GoldenSoul',
    customer_id: patient.id,
    customer_name: patient.nom,
    customer_surname: '.',
    customer_email: patient.email,
    customer_phone_number: patient.telephone || '0000000000',
    customer_address: 'Abidjan',
    customer_city: 'Abidjan',
    customer_country: 'CI',
    customer_state: 'CI',
    customer_zip_code: '00000',
    notify_url: `${process.env.APP_URL}/payments/notify`,
    return_url: `${process.env.FRONTEND_URL}/paiement-retour`,
    channels: 'ALL',
    lang: 'FR',
  };

  const reponse = await axios.post('https://api-checkout.cinetpay.com/v2/payment', payload);
  return reponse.data;
}

async function verifierTransaction(transactionId) {
  const payload = {
    apikey: process.env.CINETPAY_APIKEY,
    site_id: process.env.CINETPAY_SITE_ID,
    transaction_id: transactionId,
  };

  const reponse = await axios.post('https://api-checkout.cinetpay.com/v2/payment/check', payload);
  return reponse.data;
}

// Vérifie le token HMAC envoyé par CinetPay dans le header x-token
function verifierSignatureHmac(headerToken, body) {
  const donnees = [
    body.cpm_site_id,
    body.cpm_trans_id,
    body.cpm_trans_date,
    body.cpm_amount,
    body.cpm_currency,
    body.signature,
    body.payment_method,
    body.cel_phone_num,
    body.cpm_phone_prefixe,
    body.cpm_language,
    body.cpm_version,
    body.cpm_payment_config,
    body.cpm_page_action,
    body.cpm_custom,
    body.cpm_designation,
    body.cpm_error_message,
  ].join('');

  const tokenCalcule = crypto
    .createHmac('sha256', process.env.CINETPAY_SECRET_KEY)
    .update(donnees)
    .digest('hex');

  return tokenCalcule === headerToken;
}

module.exports = { initierPaiement, verifierTransaction, verifierSignatureHmac };
