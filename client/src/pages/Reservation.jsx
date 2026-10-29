import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { formaterDate, formaterHeure } from '../utils/dates';
import AnimatedBackground from '../components/AnimatedBackground';

function Reservation() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [creneaux, setCreneaux] = useState([]);
  const [creneauSelectionne, setCreneauSelectionne] = useState(null);
  const [optionSecurite, setOptionSecurite] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    async function chargerCreneaux() {
      try {
        const reponse = await api.get('/availability/toutes-patient');
        setCreneaux(reponse.data.disponibilites);
      } catch {
        setErreur(t('reservation.aucuneDisponibilite'));
      } finally {
        setChargement(false);
      }
    }
    chargerCreneaux();
  }, []);

  async function handleReserver() {
    if (!creneauSelectionne) return;
    setEnvoi(true);
    setErreur('');

    try {
      const reponse = await api.post('/sessions/reserver', {
        availabilityId: creneauSelectionne.id,
        optionSecurite,
      });

      const sessionId = reponse.data.session.id;
      navigate(`/paiement/${sessionId}`);
    } catch (err) {
      setErreur(err.response?.data?.message || t('commun.erreurGenerique'));
      setEnvoi(false);
      // Rafraîchir la liste des créneaux en cas d'erreur (ex: créneau déjà réservé)
      try {
        const reponse = await api.get('/availability/toutes-patient');
        setCreneaux(reponse.data.disponibilites);
      } catch {
        // Si le rafraîchissement échoue aussi, on reste silencieux
      }
    }
  }

  return (
    <div className="relative min-h-screen bg-ink text-ivory overflow-hidden">
      <AnimatedBackground />

      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-ink/70 border-b border-ivory/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-ivory/70 hover:text-gold transition-colors">
            <ArrowLeft size={20} />
          </button>
          <span className="font-display text-xl">{t('reservation.titre')}</span>
        </div>
      </header>

      <section className="pt-32 pb-24 px-6 max-w-6xl mx-auto">
        {chargement ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-ivory/50">{t('reservation.chargement')}</p>
          </div>
        ) : creneaux.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-ivory/50">{t('reservation.aucuneDisponibilite')}</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_340px] gap-8">
            {/* Liste des créneaux */}
            <div>
              <h1 className="font-display text-4xl mb-2">{t('reservation.choisirCreneau')}</h1>
              <p className="text-ivory/60 mb-8">{t('reservation.seanceInfo')}</p>

              <div className="grid sm:grid-cols-2 gap-4">
                {creneaux.map((creneau, index) => (
                  <motion.button
                    key={creneau.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                    onClick={() => !creneau.reserve && setCreneauSelectionne(creneau)}
                    disabled={creneau.reserve}
                    className={`text-left p-6 rounded-2xl border transition-all ${
                      creneau.reserve
                        ? 'bg-ivory/5 border-ivory/10 opacity-40 cursor-not-allowed'
                        : creneauSelectionne?.id === creneau.id
                        ? 'bg-gold/10 border-gold shadow-lg shadow-gold/10 scale-[1.02]'
                        : 'bg-jade/30 border-ivory/10 hover:border-ivory/30 hover:bg-jade/40'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <Calendar className={creneau.reserve ? 'text-ivory/30' : 'text-gold'} size={20} />
                      <div className="flex-1">
                        <p className={`capitalize font-display text-lg ${creneau.reserve ? 'text-ivory/40' : ''}`}>
                          {formaterDate(creneau.dateDebut)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock size={14} className={creneau.reserve ? 'text-ivory/30' : 'text-ivory/60'} />
                      <span className={creneau.reserve ? 'text-ivory/40' : 'text-ivory/60'}>
                        {formaterHeure(creneau.dateDebut)}
                      </span>
                    </div>
                    {creneau.reserve && (
                      <div className="mt-3 pt-3 border-t border-ivory/10">
                    <span className="text-xs px-2 py-1 rounded-full bg-red-400/10 text-red-400 flex items-center gap-1.5 w-fit">
                          <XCircle size={12} /> {t('reservation.occupe')}
                        </span>
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Sidebar résumé */}
            {creneauSelectionne && (
              <motion.aside
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:sticky lg:top-32 lg:self-start"
              >
                <div className="bg-jade/30 border border-ivory/10 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4 pb-4 border-b border-ivory/10">
                    <Calendar className="text-gold" size={20} />
                    <span className="font-display text-lg">{t('reservation.creneauSelectionne')}</span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <p className="font-display text-2xl">{formaterDate(creneauSelectionne.dateDebut)}</p>
                    <p className="text-ivory/60 flex items-center gap-2">
                      <Clock size={16} /> {formaterHeure(creneauSelectionne.dateDebut)}
                    </p>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer p-4 bg-ivory/5 rounded-xl mb-6 hover:bg-ivory/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={optionSecurite}
                      onChange={(e) => setOptionSecurite(e.target.checked)}
                      className="mt-1 accent-gold"
                    />
                    <div>
                      <p className="flex items-center gap-2 font-medium text-sm">
                        <ShieldCheck size={14} className="text-gold" />
                        {t('reservation.optionSecurite')}
                      </p>
                      <p className="text-ivory/50 text-xs mt-1">
                        {t('reservation.optionSecuriteDesc')}
                      </p>
                    </div>
                  </label>

                  {erreur && (
                    <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3 mb-6">
                      {erreur}
                    </p>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-ivory/60">
                      <span>{t('reservation.seance')}</span>
                      <span>5 000 F</span>
                    </div>
                    {optionSecurite && (
                      <div className="flex items-center justify-between text-sm text-ivory/60">
                        <span>{t('reservation.optionSecurite')}</span>
                        <span>1 500 F</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-3 border-t border-ivory/10 font-display text-xl">
                      <span>{t('reservation.total')}</span>
                      <span className="text-gold">{5000 + (optionSecurite ? 1500 : 0)} F</span>
                    </div>
                  </div>

                  <button
                    onClick={handleReserver}
                    disabled={envoi}
                    className="w-full mt-6 bg-gold text-ink rounded-xl py-4 font-semibold hover:bg-gold/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {envoi ? t('reservation.boutonChargement') : t('reservation.boutonConfirmer')}
                  </button>
                </div>
              </motion.aside>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default Reservation;
