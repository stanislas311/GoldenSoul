import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, X, Clock, Trash2, XCircle, Calendar, User, CreditCard, Loader2, CalendarDays, History, AlertCircle } from 'lucide-react';
import api from '../utils/api';
import { formaterDate, formaterHeure } from '../utils/dates';
import AnimatedBackground from '../components/AnimatedBackground';
import CompteARebours from '../components/CompteARebours';
import ConfirmationDialog from '../components/ConfirmationDialog';

function SessionsEnAttente() {
  const navigate = useNavigate();
  const [enAttente, setEnAttente] = useState([]);
  const [confirmees, setConfirmees] = useState([]);
  const [passees, setPassees] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [traitementId, setTraitementId] = useState(null);
  const [suppressionId, setSuppressionId] = useState(null);
  const [imageAgrandie, setImageAgrandie] = useState(null);
  const [dialogConfig, setDialogConfig] = useState({ isOpen: false, onConfirm: null, title: '', message: '' });

  async function chargerToutesLesSessions() {
    try {
      const [reponseAttente, reponseToutes] = await Promise.all([
        api.get('/sessions/en-attente'),
        api.get('/availability/toutes'),
      ]);

      setEnAttente(reponseAttente.data.sessions);

      // On extrait les sessions depuis les disponibilités
      const maintenant = new Date();
      const toutesSessions = reponseToutes.data.disponibilites
        .flatMap((d) => d.sessions.map((s) => ({ ...s, availability: d })));

      // Sessions confirmées à venir (y compris EN_COURS)
      const sessionsConfirmees = toutesSessions
        .filter((s) => ['CONFIRMEE', 'EN_COURS'].includes(s.statut) && new Date(s.availability.dateFin) > maintenant)
        .sort((a, b) => new Date(a.availability.dateDebut) - new Date(b.availability.dateDebut))
        .filter((session, index, self) => index === self.findIndex((s) => s.id === session.id));

      // Sessions passées (terminées, annulées, absence, ou confirmées mais passées)
      const sessionsPassees = toutesSessions
        .filter((s) => 
          ['TERMINEE', 'ANNULEE', 'ABSENCE'].includes(s.statut) || 
          (['CONFIRMEE', 'EN_COURS'].includes(s.statut) && new Date(s.availability.dateFin) <= maintenant)
        )
        .sort((a, b) => new Date(b.availability.dateDebut) - new Date(a.availability.dateDebut));

      setConfirmees(sessionsConfirmees);
      setPassees(sessionsPassees);
    } catch {
      // silencieux
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    chargerToutesLesSessions();
  }, []);

  async function handleDecision(sessionId, accepter) {
    setTraitementId(sessionId);
    try {
      await api.put(`/sessions/${sessionId}/confirmer`, { accepter });
      chargerToutesLesSessions();
    } catch {
      // silencieux
    } finally {
      setTraitementId(null);
    }
  }

  async function handleSuppression(sessionId) {
    setDialogConfig({
      isOpen: true,
      title: "Supprimer la séance",
      message: "Êtes-vous sûr de vouloir supprimer cette séance passée ? Cette action est irréversible.",
      onConfirm: async () => {
        setSuppressionId(sessionId);
        try {
          await api.delete(`/sessions/${sessionId}`);
          chargerToutesLesSessions();
          setDialogConfig({ isOpen: false, onConfirm: null, title: '', message: '' });
        } catch (err) {
          setDialogConfig({
            isOpen: true,
            title: "Erreur",
            message: err.response?.data?.message || "Erreur lors de la suppression",
            onConfirm: () => setDialogConfig({ isOpen: false, onConfirm: null, title: '', message: '' }),
            type: "warning"
          });
        } finally {
          setSuppressionId(null);
        }
      }
    });
  }

  return (
    <div className="relative min-h-screen bg-ink text-ivory overflow-hidden">
      <AnimatedBackground />

      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-ink/80 border-b border-ivory/10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard-praticien')} className="text-ivory/70 hover:text-gold transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="font-display text-2xl text-gold">Rendez-vous</h1>
              <p className="text-xs text-ivory/50">Gérez vos demandes de séances</p>
            </div>
          </div>
        </div>
      </header>

      <section className="pt-36 pb-24 px-6 max-w-5xl mx-auto">
        {chargement ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-gold mb-4" size={32} />
            <p className="text-ivory/50">Chargement...</p>
          </div>
        ) : (
          <>
            {/* Statistiques */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-jade/30 border border-ivory/10 rounded-2xl p-4 text-center"
              >
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-2">
                  <AlertCircle className="text-amber-500" size={18} />
                </div>
                <p className="text-2xl font-display text-gold">{enAttente.length}</p>
                <p className="text-xs text-ivory/50">En attente</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-jade/30 border border-ivory/10 rounded-2xl p-4 text-center"
              >
                <div className="w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center mx-auto mb-2">
                  <CalendarDays className="text-sage" size={18} />
                </div>
                <p className="text-2xl font-display text-gold">{confirmees.length}</p>
                <p className="text-xs text-ivory/50">À venir</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-jade/30 border border-ivory/10 rounded-2xl p-4 text-center"
              >
                <div className="w-10 h-10 rounded-full bg-ivory/10 flex items-center justify-center mx-auto mb-2">
                  <History className="text-ivory/60" size={18} />
                </div>
                <p className="text-2xl font-display text-gold">{passees.length}</p>
                <p className="text-xs text-ivory/50">Passées</p>
              </motion.div>
            </div>

            {/* Demandes en attente de confirmation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <AlertCircle className="text-amber-500" size={16} />
                </div>
                <h2 className="font-display text-xl">Demandes en attente</h2>
                {enAttente.length > 0 && (
                  <span className="bg-amber-500/20 text-amber-500 text-xs px-2 py-1 rounded-full">
                    {enAttente.length}
                  </span>
                )}
              </div>
              {enAttente.length === 0 ? (
                <div className="bg-jade/20 border border-ivory/5 rounded-2xl p-8 text-center">
                  <AlertCircle className="text-ivory/30 mx-auto mb-3" size={32} />
                  <p className="text-ivory/50">Aucune demande en attente pour le moment.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {enAttente.map((session) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-jade/40 border border-ivory/10 rounded-2xl p-6 hover:border-gold/20 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-6">
                          <div className="flex-1">
                            {/* Patient info */}
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
                                <User className="text-gold" size={20} />
                              </div>
                              <div>
                                <p className="font-medium text-lg">{session.patient?.nom}</p>
                                <p className="text-ivory/50 text-sm">{session.patient?.email}</p>
                              </div>
                            </div>

                            {/* Date et heure */}
                            <div className="flex items-center gap-2 text-ivory/60 mb-4">
                              <Calendar size={16} />
                              <span className="capitalize">
                                {formaterDate(session.availability.dateDebut)} à {formaterHeure(session.availability.dateDebut)}
                              </span>
                            </div>

                            {/* Paiement */}
                            {session.paiement && (
                              <div className="bg-ink/30 rounded-xl p-4 border border-ivory/10">
                                <div className="flex items-center gap-2 mb-3">
                                  <CreditCard className="text-gold" size={16} />
                                  <span className="text-sm font-medium text-gold">Détails du paiement</span>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-ivory/50 text-sm">Montant</span>
                                    <span className="font-display text-gold">{session.paiement.montant.toLocaleString()} F</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-ivory/50 text-sm">Référence</span>
                                    <span className="font-mono text-sm">{session.paiement.codeReference}</span>
                                  </div>
                                  {session.paiement.preuveUrl && (
                                    <div className="pt-3 mt-3 border-t border-ivory/10">
                                      <button
                                        onClick={() => setImageAgrandie(`http://localhost:5000${session.paiement.preuveUrl}`)}
                                        className="group relative"
                                      >
                                        <img
                                          src={`http://localhost:5000${session.paiement.preuveUrl}`}
                                          alt="Preuve de paiement"
                                          className="w-20 h-20 object-cover rounded-lg border border-ivory/10 group-hover:border-gold/40 transition-all"
                                        />
                                        <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                          <span className="text-xs text-white">Agrandir</span>
                                        </div>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Boutons d'action */}
                          <div className="flex flex-col gap-2 shrink-0">
                            <button
                              onClick={() => handleDecision(session.id, true)}
                              disabled={traitementId === session.id}
                              className="flex items-center gap-2 bg-gold text-ink rounded-xl px-4 py-3 font-medium hover:bg-gold/90 transition-all disabled:opacity-40 shadow-lg shadow-gold/20"
                            >
                              {traitementId === session.id ? (
                                <Loader2 className="animate-spin" size={16} />
                              ) : (
                                <Check size={16} />
                              )}
                              Accepter
                            </button>
                            <button
                              onClick={() => handleDecision(session.id, false)}
                              disabled={traitementId === session.id}
                              className="flex items-center gap-2 border border-red-400/30 text-red-400 rounded-xl px-4 py-3 font-medium hover:bg-red-400/10 transition-all disabled:opacity-40"
                            >
                              {traitementId === session.id ? (
                                <Loader2 className="animate-spin" size={16} />
                              ) : (
                                <X size={16} />
                              )}
                              Refuser
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>

            {/* Séances confirmées à venir */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-10"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-sage/20 flex items-center justify-center">
                  <CalendarDays className="text-sage" size={16} />
                </div>
                <h2 className="font-display text-xl">Séances à venir</h2>
                {confirmees.length > 0 && (
                  <span className="bg-sage/20 text-sage text-xs px-2 py-1 rounded-full">
                    {confirmees.length}
                  </span>
                )}
              </div>
              {confirmees.length === 0 ? (
                <div className="bg-jade/20 border border-ivory/5 rounded-2xl p-8 text-center">
                  <CalendarDays className="text-ivory/30 mx-auto mb-3" size={32} />
                  <p className="text-ivory/50">Aucune séance confirmée à venir.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {confirmees.map((session) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-jade/30 border border-ivory/10 rounded-xl p-5 hover:border-gold/20 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <CompteARebours session={session} dateDebut={session.availability.dateDebut} />
                          <div className="mt-3 flex items-center gap-2">
                            <Calendar size={14} className="text-ivory/50" />
                            <p className="capitalize text-ivory/70">
                              {formaterDate(session.availability.dateDebut)} à {formaterHeure(session.availability.dateDebut)}
                            </p>
                          </div>
                          {session.patient?.nom && (
                            <div className="flex items-center gap-2 mt-1">
                              <User size={14} className="text-ivory/50" />
                              <p className="text-sm text-ivory/50">{session.patient.nom}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Sessions passées */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-ivory/10 flex items-center justify-center">
                  <History className="text-ivory/60" size={16} />
                </div>
                <h2 className="font-display text-xl">Sessions passées</h2>
                {passees.length > 0 && (
                  <span className="bg-ivory/10 text-ivory/60 text-xs px-2 py-1 rounded-full">
                    {passees.length}
                  </span>
                )}
              </div>
              {passees.length === 0 ? (
                <div className="bg-jade/20 border border-ivory/5 rounded-2xl p-8 text-center">
                  <History className="text-ivory/30 mx-auto mb-3" size={32} />
                  <p className="text-ivory/50">Aucune session passée.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {passees.map((session) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-ivory/5 border border-ivory/10 rounded-xl p-5 opacity-60 hover:opacity-80 transition-opacity"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar size={14} className="text-ivory/50" />
                            <p className="capitalize text-ivory/70">
                              {formaterDate(session.availability.dateDebut)} à {formaterHeure(session.availability.dateDebut)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-ivory/50" />
                            <p className="text-sm text-ivory/50">{session.patient?.nom}</p>
                          </div>
                          <div className="mt-1">
                            <span className="text-xs px-2 py-1 rounded-full bg-ivory/10 text-ivory/50">
                              {session.statut.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleSuppression(session.id)}
                          disabled={suppressionId === session.id}
                          className="flex items-center gap-2 bg-red-400/20 text-red-400 rounded-xl px-4 py-2 text-sm hover:bg-red-400/30 transition-colors disabled:opacity-50 shrink-0"
                        >
                          {suppressionId === session.id ? (
                            <Loader2 className="animate-spin" size={14} />
                          ) : (
                            <Trash2 size={14} />
                          )}
                          Supprimer
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </section>

      {imageAgrandie && (
        <div className="fixed inset-0 z-[70] bg-ink/95 backdrop-blur-sm flex flex-col items-center justify-center px-6">
          <button
            onClick={() => setImageAgrandie(null)}
            className="absolute top-6 right-6 text-ivory/70 hover:text-gold transition-colors"
          >
            <XCircle size={32} />
          </button>
          <img
            src={imageAgrandie}
            alt="Preuve de paiement agrandie"
            className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}

      <ConfirmationDialog
        isOpen={dialogConfig.isOpen}
        onClose={() => setDialogConfig({ isOpen: false, onConfirm: null, title: '', message: '' })}
        onConfirm={dialogConfig.onConfirm}
        title={dialogConfig.title}
        message={dialogConfig.message}
        type={dialogConfig.type || "danger"}
      />
    </div>
  );
}

export default SessionsEnAttente;
