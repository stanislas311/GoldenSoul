import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Mail, Phone, Calendar, Clock, ShieldCheck, CreditCard, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import api from '../utils/api';
import { formaterDate, formaterHeure } from '../utils/dates';
import AnimatedBackground from '../components/AnimatedBackground';

function DetailsReservation() {
  const { availabilityId } = useParams();
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    async function chargerDetails() {
      try {
        const reponse = await api.get(`/availability/${availabilityId}/details`);
        setDetails(reponse.data);
      } catch (err) {
        setErreur(err.response?.data?.message || "Impossible de charger les détails.");
      } finally {
        setChargement(false);
      }
    }
    chargerDetails();
  }, [availabilityId]);

  const statutsSession = {
    EN_ATTENTE_PAIEMENT: { label: "En attente de paiement", couleur: "text-ivory/50", icone: Clock },
    EN_ATTENTE_CONFIRMATION: { label: "En attente de confirmation", couleur: "text-gold", icone: Clock },
    CONFIRMEE: { label: "Confirmée", couleur: "text-sage", icone: CheckCircle2 },
    TERMINEE: { label: "Terminée", couleur: "text-ivory/50", icone: CheckCircle2 },
    ANNULEE: { label: "Annulée", couleur: "text-red-400", icone: XCircle },
    ABSENCE: { label: "Absence", couleur: "text-red-400", icone: XCircle },
  };

  const statutsPaiement = {
    EN_ATTENTE: { label: "En attente", couleur: "text-ivory/50" },
    PAYE: { label: "Payé", couleur: "text-sage" },
    ECHOUE: { label: "Échoué", couleur: "text-red-400" },
    REMBOURSE: { label: "Remboursé", couleur: "text-sage" },
    REMBOURSEMENT_EN_COURS: { label: "Remboursement en cours", couleur: "text-gold" },
  };

  if (chargement) {
    return (
      <div className="relative min-h-screen bg-ink text-ivory overflow-hidden">
        <AnimatedBackground />
        <div className="flex items-center justify-center pt-40">
          <Loader2 className="animate-spin text-gold" size={32} />
        </div>
      </div>
    );
  }

  if (erreur) {
    return (
      <div className="relative min-h-screen bg-ink text-ivory overflow-hidden">
        <AnimatedBackground />
        <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-ink/70 border-b border-ivory/10">
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="text-ivory/70 hover:text-gold transition-colors">
              <ArrowLeft size={20} />
            </button>
            <span className="font-display text-xl">Détails de la réservation</span>
          </div>
        </header>
        <section className="pt-32 pb-24 px-6 max-w-3xl mx-auto">
          <p className="text-red-400">{erreur}</p>
        </section>
      </div>
    );
  }

  const { availability, session, patient, paiement } = details;
  const statutSession = statutsSession[session.statut];
  const statutPaiement = paiement ? statutsPaiement[paiement.statut] : null;
  const StatutIcon = statutSession.icone;

  const calculerAge = (dateNaissance) => {
    const naissance = new Date(dateNaissance);
    const aujourdHui = new Date();
    const age = aujourdHui.getFullYear() - naissance.getFullYear();
    const differenceMois = aujourdHui.getMonth() - naissance.getMonth();
    return differenceMois < 0 || (differenceMois === 0 && aujourdHui.getDate() < naissance.getDate())
      ? age - 1
      : age;
  };

  const genreLabels = {
    HOMME: 'Homme',
    FEMME: 'Femme',
    AUTRE: 'Autre',
  };

  const situationLabels = {
    CELIBATAIRE: 'Célibataire',
    MARIE: 'Marié(e)',
    DIVORCE: 'Divorcé(e)',
    VEUF: 'Veuf/Veuve',
  };

  return (
    <div className="relative min-h-screen bg-ink text-ivory overflow-hidden">
      <AnimatedBackground />

      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-ink/70 border-b border-ivory/10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-ivory/70 hover:text-gold transition-colors">
            <ArrowLeft size={20} />
          </button>
          <span className="font-display text-xl">Détails de la réservation</span>
        </div>
      </header>

      <section className="pt-32 pb-24 px-6 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Informations du créneau */}
          <div className="bg-jade/50 border border-ivory/10 rounded-2xl p-6 mb-6">
            <h2 className="font-display text-xl mb-4 flex items-center gap-2">
              <Calendar className="text-gold" size={20} />
              Créneau réservé
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-ivory/50 text-sm mb-1">Date</p>
                <p className="font-medium capitalize">{formaterDate(availability.dateDebut)}</p>
              </div>
              <div>
                <p className="text-ivory/50 text-sm mb-1">Heure</p>
                <p className="font-medium flex items-center gap-1">
                  <Clock size={14} /> {formaterHeure(availability.dateDebut)}
                </p>
              </div>
            </div>
          </div>

          {/* Informations du patient */}
          <div className="bg-jade/50 border border-ivory/10 rounded-2xl p-6 mb-6">
            <h2 className="font-display text-xl mb-4 flex items-center gap-2">
              <User className="text-gold" size={20} />
              Patient
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-ivory/50 text-sm mb-1">Nom complet</p>
                <p className="font-medium">{patient.nom}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-ivory/50 text-sm mb-1">Email</p>
                  <p className="font-medium flex items-center gap-1">
                    <Mail size={14} /> {patient.email}
                  </p>
                </div>
                <div>
                  <p className="text-ivory/50 text-sm mb-1">Téléphone</p>
                  <p className="font-medium flex items-center gap-1">
                    <Phone size={14} /> {patient.telephone || 'Non renseigné'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-ivory/50 text-sm mb-1">Genre</p>
                  <p className="font-medium">{genreLabels[patient.genre] || 'Non renseigné'}</p>
                </div>
                <div>
                  <p className="text-ivory/50 text-sm mb-1">Âge</p>
                  <p className="font-medium">{patient.dateNaissance ? calculerAge(patient.dateNaissance) : 'N/A'} ans</p>
                </div>
                <div>
                  <p className="text-ivory/50 text-sm mb-1">Situation</p>
                  <p className="font-medium">{situationLabels[patient.situationMatrimoniale] || 'Non renseigné'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Statut de la session */}
          <div className="bg-jade/50 border border-ivory/10 rounded-2xl p-6 mb-6">
            <h2 className="font-display text-xl mb-4 flex items-center gap-2">
              <ShieldCheck className="text-gold" size={20} />
              Statut de la session
            </h2>
            <div className="flex items-center gap-3">
              <StatutIcon size={20} className={statutSession.couleur} />
              <span className={`font-medium ${statutSession.couleur}`}>{statutSession.label}</span>
            </div>
            {session.optionSecurite && (
              <div className="mt-3 flex items-center gap-2 text-sm text-gold">
                <ShieldCheck size={14} />
                Option de sécurité souscrite
              </div>
            )}
          </div>

          {/* Informations de paiement */}
          {paiement && (
            <div className="bg-jade/50 border border-ivory/10 rounded-2xl p-6">
              <h2 className="font-display text-xl mb-4 flex items-center gap-2">
                <CreditCard className="text-gold" size={20} />
                Paiement
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-ivory/50 text-sm mb-1">Montant</p>
                  <p className="font-medium">{paiement.montant} F</p>
                </div>
                <div>
                  <p className="text-ivory/50 text-sm mb-1">Statut</p>
                  <p className={`font-medium ${statutPaiement.couleur}`}>{statutPaiement.label}</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </section>
    </div>
  );
}

export default DetailsReservation;
