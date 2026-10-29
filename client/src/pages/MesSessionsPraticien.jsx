import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Video, Clock, CheckCircle2, XCircle, Loader2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { formaterDate, formaterHeure } from '../utils/dates';
import AnimatedBackground from '../components/AnimatedBackground';

const STATUTS = {
  EN_ATTENTE_PAIEMENT: { label: "mesSessions.statutEnAttentePaiement", icon: Clock, couleur: "text-ivory/50" },
  EN_ATTENTE_CONFIRMATION: { label: "mesSessions.statutEnAttenteConfirmation", icon: Clock, couleur: "text-gold" },
  CONFIRMEE: { label: "mesSessions.statutConfirmee", icon: CheckCircle2, couleur: "text-sage" },
  EN_COURS: { label: "mesSessions.statutEnCours", icon: CheckCircle2, couleur: "text-gold" },
  TERMINEE: { label: "mesSessions.statutTerminee", icon: CheckCircle2, couleur: "text-ivory/50" },
  ANNULEE: { label: "mesSessions.statutAnnulee", icon: XCircle, couleur: "text-red-400" },
  ABSENCE: { label: "mesSessions.statutAbsence", icon: XCircle, couleur: "text-red-400" },
};

function MesSessionsPraticien() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [visioEnCours, setVisioEnCours] = useState(null);
  const [erreurVisio, setErreurVisio] = useState('');
  const [sessionASupprimer, setSessionASupprimer] = useState(null);
  const [envoiSuppression, setEnvoiSuppression] = useState(false);

  async function chargerSessions() {
    try {
      const reponse = await api.get('/sessions/toutes-sessions');
      setSessions(reponse.data.sessions);
    } catch {
      setSessions([]);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    chargerSessions();
  }, []);

  async function handleRejoindre(sessionId) {
    setVisioEnCours(sessionId);
    setErreurVisio('');

    try {
      const reponse = await api.get(`/sessions/${sessionId}/rejoindre-visio`);
      window.open(reponse.data.lien, '_blank');
    } catch (err) {
      setErreurVisio(err.response?.data?.message || t('mesSessions.erreurRejoindre'));
    } finally {
      setVisioEnCours(null);
    }
  }

  async function handleSupprimer() {
    setEnvoiSuppression(true);
    try {
      await api.delete(`/sessions/${sessionASupprimer.id}`);
      chargerSessions();
      setSessionASupprimer(null);
    } catch (err) {
      alert(err.response?.data?.message || t('commun.erreurGenerique'));
    } finally {
      setEnvoiSuppression(false);
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
          <span className="font-display text-xl">{t('mesSessions.titre')}</span>
        </div>
      </header>

      <section className="pt-32 pb-24 px-6 max-w-6xl mx-auto">
        {chargement ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-ivory/50">{t('mesSessions.chargement')}</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-ivory/50">{t('mesSessions.aucuneSeance')}</p>
          </div>
        ) : (
          <>
            {erreurVisio && (
              <div className="mb-6 p-4 bg-red-400/10 border border-red-400/20 rounded-xl">
                <p className="text-sm text-red-400">{erreurVisio}</p>
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.map((session, index) => {
                const infoStatut = STATUTS[session.statut] || STATUTS.EN_ATTENTE_PAIEMENT;
                const StatutIcon = infoStatut.icon;
                const peutSupprimer = ['TERMINEE', 'ABSENCE', 'ANNULEE'].includes(session.statut);

                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.04 }}
                    className="bg-jade/30 border border-ivory/10 rounded-2xl p-6 hover:border-ivory/20 transition-colors"
                  >
                    <div className="mb-4">
                      <p className="font-display text-2xl mb-1">{formaterDate(session.availability.dateDebut)}</p>
                      <p className="text-ivory/60 flex items-center gap-2">
                        <Clock size={16} /> {formaterHeure(session.availability.dateDebut)}
                      </p>
                    </div>

                    <div className="mb-4 pb-4 border-b border-ivory/10">
                      <p className="text-ivory/60 text-sm">{session.patient?.nom}</p>
                      <p className="text-ivory/40 text-xs">{session.patient?.email}</p>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <StatutIcon size={16} className={infoStatut.couleur} />
                      <span className={`text-sm ${infoStatut.couleur}`}>{t(infoStatut.label)}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {(session.statut === 'CONFIRMEE' || session.statut === 'EN_COURS') && (
                        <button
                          onClick={() => handleRejoindre(session.id)}
                          disabled={visioEnCours === session.id}
                          className="flex-1 flex items-center justify-center gap-2 bg-gold text-ink rounded-xl py-3 font-medium hover:bg-gold/90 transition-colors disabled:opacity-50"
                        >
                          {visioEnCours === session.id ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : (
                            <Video size={16} />
                          )}
                          {t('mesSessions.rejoindre')}
                        </button>
                      )}

                      {peutSupprimer && (
                        <button
                          onClick={() => setSessionASupprimer(session)}
                          className="text-sm text-ivory/50 hover:text-red-400 transition-colors px-3 py-2 flex items-center gap-1"
                        >
                          <Trash2 size={14} /> {t('mesSessions.supprimer')}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Panneau de suppression */}
            <AnimatePresence>
              {sessionASupprimer && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-ink/80 backdrop-blur-sm"
                >
                  <motion.div
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    className="bg-jade/50 border border-ivory/10 rounded-2xl p-8 max-w-md w-full"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-display text-2xl">{t('mesSessions.supprimerTitre')}</h3>
                      <button
                        onClick={() => setSessionASupprimer(null)}
                        className="text-ivory/50 hover:text-ivory transition-colors"
                      >
                        <XCircle size={24} />
                      </button>
                    </div>

                    <div className="mb-6 pb-6 border-b border-ivory/10">
                      <p className="font-display text-xl mb-2">{formaterDate(sessionASupprimer.availability.dateDebut)}</p>
                      <p className="text-ivory/60 flex items-center gap-2">
                        <Clock size={16} /> {formaterHeure(sessionASupprimer.availability.dateDebut)}
                      </p>
                    </div>

                    <p className="text-ivory/70 text-sm mb-6">
                      {t('mesSessions.supprimerTexte')}
                    </p>

                    <div className="flex gap-3">
                      <button
                        onClick={handleSupprimer}
                        disabled={envoiSuppression}
                        className="flex-1 bg-red-400/10 text-red-400 border border-red-400/30 rounded-xl py-3 font-medium hover:bg-red-400/20 transition-colors disabled:opacity-50"
                      >
                        {envoiSuppression ? <Loader2 className="animate-spin mx-auto" size={16} /> : t('mesSessions.confirmerSuppression')}
                      </button>
                      <button
                        onClick={() => setSessionASupprimer(null)}
                        className="flex-1 text-sm text-ivory/50 hover:text-ivory py-3"
                      >
                        {t('mesSessions.annuler')}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </section>
    </div>
  );
}

export default MesSessionsPraticien;
