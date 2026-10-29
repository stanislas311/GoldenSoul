import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, Phone, Cake, Heart, Check, Eye, EyeOff, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { formaterDate, formaterHeure } from '../utils/dates';
import AnimatedBackground from '../components/AnimatedBackground';
import ConfirmationDialog from '../components/ConfirmationDialog';

const GENRE_LABELS = { HOMME: 'Homme', FEMME: 'Femme', AUTRE: 'Autre' };
const SITUATION_LABELS = {
  CELIBATAIRE: 'Célibataire', MARIE: 'Marié(e)', DIVORCE: 'Divorcé(e)', VEUF: 'Veuf/Veuve',
};
const STATUT_LABELS = {
  EN_ATTENTE_PAIEMENT: 'En attente de paiement',
  EN_ATTENTE_CONFIRMATION: 'En attente de confirmation',
  CONFIRMEE: 'Confirmée',
  TERMINEE: 'Terminée',
  ANNULEE: 'Annulée',
  ABSENCE: 'Absence',
};

function initiales(nom) {
  return nom.split(' ').map((m) => m[0]).slice(0, 2).join('').toUpperCase();
}

function DossierPatient() {
  const { t } = useTranslation();
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [quizResponses, setQuizResponses] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [notes, setNotes] = useState({});
  const [noteOuverte, setNoteOuverte] = useState(null);
  const [enregistrement, setEnregistrement] = useState(null);
  const [sauvegarde, setSauvegarde] = useState(null);
  const [bilanOuvert, setBilanOuvert] = useState(null);
  const [dialogConfig, setDialogConfig] = useState({ isOpen: false, onConfirm: null, title: '', message: '' });

  useEffect(() => {
    async function charger() {
      try {
        const reponse = await api.get(`/patients/${patientId}`);
        setPatient(reponse.data.patient);
        setSessions(reponse.data.sessions);
        setQuizResponses(reponse.data.quizResponses || []);
        const notesInitiales = {};
        reponse.data.sessions.forEach((s) => { notesInitiales[s.id] = s.noteClinique || ''; });
        setNotes(notesInitiales);
      } catch {
        // silencieux
      } finally {
        setChargement(false);
      }
    }
    charger();
  }, [patientId]);

  async function handleSauvegarderNote(sessionId) {
    setEnregistrement(sessionId);
    try {
      await api.put(`/patients/sessions/${sessionId}/note`, { note: notes[sessionId] });
      setSauvegarde(sessionId);
      setTimeout(() => setSauvegarde(null), 1500);
    } catch {
      // silencieux
    } finally {
      setEnregistrement(null);
    }
  }

  async function supprimerBilan(responseId) {
    setDialogConfig({
      isOpen: true,
      title: "Supprimer le bilan",
      message: "Voulez-vous vraiment supprimer ce bilan ? Cette action est irréversible.",
      onConfirm: async () => {
        try {
          await api.delete(`/quiz/bilan/${responseId}`);
          setQuizResponses(quizResponses.filter(qr => qr.id !== responseId));
          if (bilanOuvert === responseId) setBilanOuvert(null);
        } catch {
          // silencieux
        }
        setDialogConfig({ isOpen: false, onConfirm: null, title: '', message: '' });
      }
    });
  }

  if (chargement) {
    return <div className="min-h-screen bg-ink flex items-center justify-center"><p className="text-ivory/50">{t('dossierPatient.chargement')}</p></div>;
  }
  if (!patient) {
    return <div className="min-h-screen bg-ink flex items-center justify-center"><p className="text-ivory/50">{t('dossierPatient.introuvable')}</p></div>;
  }

  return (
    <div className="relative min-h-screen bg-ink text-ivory overflow-hidden">
      <AnimatedBackground />

      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-ink/70 border-b border-ivory/10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-ivory/70 hover:text-gold transition-colors">
            <ArrowLeft size={20} />
          </button>
          <span className="font-display text-xl">{t('dossierPatient.titre')}</span>
        </div>
      </header>

      <section className="pt-32 pb-24 px-6 max-w-5xl mx-auto grid md:grid-cols-[280px_1fr] gap-12">
        {/* Colonne identité */}
        <motion.aside
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="md:sticky md:top-32 md:self-start"
        >
          <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mb-4">
            <span className="font-display text-xl text-gold">{initiales(patient.nom)}</span>
          </div>

          <h1 className="font-display text-2xl mb-6">{patient.nom}</h1>

          <div className="space-y-3 text-sm text-ivory/60">
            <p className="flex items-center gap-2">
              <Mail size={14} className="text-gold/70 shrink-0" /> {patient.email}
            </p>
            {patient.telephone && (
              <p className="flex items-center gap-2">
                <Phone size={14} className="text-gold/70 shrink-0" /> {patient.telephone}
              </p>
            )}
            {patient.dateNaissance && (
              <p className="flex items-center gap-2">
                <Cake size={14} className="text-gold/70 shrink-0" /> {formaterDate(patient.dateNaissance)}
              </p>
            )}
            {patient.situationMatrimoniale && (
              <p className="flex items-center gap-2">
                <Heart size={14} className="text-gold/70 shrink-0" /> {t(`dossierPatient.situation.${patient.situationMatrimoniale}`)}
              </p>
            )}
            {patient.genre && (
              <p className="text-ivory/40">{t(`dossierPatient.genre.${patient.genre}`)}</p>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-ivory/10">
            <p className="text-xs uppercase tracking-wide text-ivory/40 mb-1">{t('dossierPatient.seances')}</p>
            <p className="font-display text-3xl text-gold">{sessions.length}</p>
          </div>
        </motion.aside>

        {/* Timeline + Bilans */}
        <div>
          <h2 className="font-display text-2xl mb-8">{t('dossierPatient.historique')}</h2>

          {sessions.length === 0 ? (
            <p className="text-ivory/50">{t('dossierPatient.aucuneSeance')}</p>
          ) : (
            <div className="relative pl-8 border-l border-ivory/10 space-y-10">
              {sessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="relative"
                >
                  <span className="absolute -left-[calc(2rem+5px)] top-1.5 w-2.5 h-2.5 rounded-full bg-gold" />

                  <div className="flex items-center justify-between gap-4 mb-2">
                    <p className="capitalize font-medium">
                      {formaterDate(session.availability.dateDebut)}
                      <span className="text-ivory/40 font-normal"> · {formaterHeure(session.availability.dateDebut)}</span>
                    </p>
                    <span className="text-xs text-ivory/40 uppercase tracking-wide shrink-0">
                      {t(`dossierPatient.statut.${session.statut}`)}
                    </span>
                  </div>

                  {noteOuverte === session.id ? (
                    <div className="mt-3">
                      <textarea
                        value={notes[session.id] || ''}
                        onChange={(e) => setNotes({ ...notes, [session.id]: e.target.value })}
                        rows={3}
                        autoFocus
                        placeholder={t('dossierPatient.notePlaceholder')}
                        className="w-full bg-transparent border-b border-ivory/20 focus:border-gold text-sm text-ivory/80 focus:outline-none transition-colors resize-none py-2"
                      />
                      <div className="flex items-center gap-4 mt-2">
                        <button
                          onClick={() => { handleSauvegarderNote(session.id); setNoteOuverte(null); }}
                          disabled={enregistrement === session.id}
                          className="text-xs text-gold hover:underline disabled:opacity-50"
                        >
                          {enregistrement === session.id ? t('dossierPatient.enregistrement') : t('dossierPatient.enregistrer')}
                        </button>
                        <button
                          onClick={() => setNoteOuverte(null)}
                          className="text-xs text-ivory/40 hover:text-ivory/70"
                        >
                          {t('dossierPatient.fermer')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setNoteOuverte(session.id)}
                      className="text-sm text-ivory/50 hover:text-gold transition-colors text-left"
                    >
                      {notes[session.id]
                        ? notes[session.id].slice(0, 80) + (notes[session.id].length > 80 ? '…' : '')
                        : t('dossierPatient.ajouterNote')}
                    </button>
                  )}

                  {sauvegarde === session.id && (
                    <p className="text-xs text-sage flex items-center gap-1 mt-2">
                      <Check size={12} /> {t('dossierPatient.enregistre')}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* SECTION BILANS (QUIZ) */}
          <h2 className="font-display text-2xl mt-16 mb-8">Bilans du patient</h2>
          
          {quizResponses.length === 0 ? (
            <p className="text-ivory/50">Aucun bilan effectué par ce patient.</p>
          ) : (
            <div className="space-y-4">
              {quizResponses.map((qr, index) => (
                <motion.div
                  key={qr.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-ivory/5 border border-ivory/10 rounded-xl p-5"
                >
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <p className="font-medium text-gold">
                      {qr.quiz?.titre || 'Bilan Quotidien'}
                    </p>
                    <span className="text-sm font-bold bg-gold/10 text-gold px-2 py-1 rounded-md">
                      Score: {qr.scoreTotal}
                    </span>
                  </div>

                  <p className="text-sm text-ivory/40 mb-4">
                    Réalisé le {formaterDate(qr.createdAt)} à {formaterHeure(qr.createdAt)}
                  </p>

                  <div className="flex items-center gap-3">
                    {qr.analyseIA && (
                      <button
                        onClick={() => setBilanOuvert(bilanOuvert === qr.id ? null : qr.id)}
                        className="text-sm px-4 py-2 rounded-lg bg-gold/10 text-gold hover:bg-gold hover:text-ink transition-colors flex items-center gap-2"
                      >
                        {bilanOuvert === qr.id ? <EyeOff size={16} /> : <Eye size={16} />}
                        {bilanOuvert === qr.id ? 'Masquer le bilan' : 'Voir le bilan'}
                      </button>
                    )}
                    <button
                      onClick={() => supprimerBilan(qr.id)}
                      className="text-sm p-2 rounded-lg text-ivory/30 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      title="Supprimer ce bilan"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <AnimatePresence>
                    {bilanOuvert === qr.id && qr.analyseIA && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 bg-ink/50 border border-gold/10 p-4 rounded-xl">
                          <p className="text-xs font-display text-gold mb-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse"></span>
                            Analyse GoldenSoul
                          </p>
                          <p className="text-sm text-ivory/80 leading-relaxed">
                            {qr.analyseIA}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

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

export default DossierPatient;
