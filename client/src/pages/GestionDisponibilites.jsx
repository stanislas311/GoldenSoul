import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Calendar, Clock, CheckCircle2, XCircle, Eye, EyeOff, User, Trash2, Edit2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { formaterDate, formaterHeure } from '../utils/dates';
import AnimatedBackground from '../components/AnimatedBackground';
import DatePicker from '../components/DatePicker';
import TimePicker from '../components/TimePicker';

function GestionDisponibilites() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [disponibilites, setDisponibilites] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [dateChoisie, setDateChoisie] = useState('');
  const [heureChoisie, setHeureChoisie] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');
  const [afficherListe, setAfficherListe] = useState(true);
  const [alerteConflit, setAlerteConflit] = useState(null);
  const [modeModification, setModeModification] = useState(null);
  const [dateModification, setDateModification] = useState('');
  const [heureModification, setHeureModification] = useState('');
  const [alerteSuppression, setAlerteSuppression] = useState(null);

  async function chargerDisponibilites() {
    try {
      const reponse = await api.get('/availability/toutes');
      setDisponibilites(reponse.data.disponibilites || reponse.data);
    } catch {
      setDisponibilites([]);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    chargerDisponibilites();
  }, []);

  async function handleCreer(e) {
    e.preventDefault();
    setErreur('');
    setSucces('');
    setAlerteConflit(null);

    if (!dateChoisie || !heureChoisie) return;

    setEnvoi(true);
    try {
      const dateDebut = new Date(`${dateChoisie}T${heureChoisie}:00`).toISOString();
      const reponse = await api.post('/availability', { dateDebut });
      
      setSucces(t('gestionDisponibilites.succesCreation'));
      setDateChoisie('');
      setHeureChoisie('');
      await chargerDisponibilites();
    } catch (err) {
      const data = err.response?.data;
      
      if (data?.conflit === 'exact') {
        setErreur(t('gestionDisponibilites.erreurConflitExact'));
        setAlerteConflit({
          type: 'exact',
          message: data.message,
          creneau: data.creneauExistant,
        });
      } else if (data?.conflit === 'proche') {
        setAlerteConflit({
          type: 'proche',
          message: data.message,
          creneaux: data.creneauxProches,
        });
      } else {
        setErreur(data?.message || t('gestionDisponibilites.erreurGenerique'));
      }
    } finally {
      setEnvoi(false);
    }
  }

  async function confirmerCreationMalgreConflit() {
    setEnvoi(true);
    setAlerteConflit(null);
    
    try {
      const dateDebut = new Date(`${dateChoisie}T${heureChoisie}:00`).toISOString();
      const reponse = await api.post('/availability', { dateDebut, forcer: true });
      
      setSucces(t('gestionDisponibilites.succesCreation'));
      setDateChoisie('');
      setHeureChoisie('');
      await chargerDisponibilites();
    } catch (err) {
      setErreur(err.response?.data?.message || t('gestionDisponibilites.erreurGenerique'));
    } finally {
      setEnvoi(false);
    }
  }

  async function handleSupprimer(availabilityId) {
    setAlerteSuppression(availabilityId);
  }

  async function confirmerSuppression() {
    if (!alerteSuppression) return;

    try {
      await api.delete(`/availability/${alerteSuppression}`);
      setSucces(t('gestionDisponibilites.succesSuppression'));
      setAlerteSuppression(null);
      await chargerDisponibilites();
    } catch (err) {
      setErreur(err.response?.data?.message || t('gestionDisponibilites.erreurSuppression'));
      setAlerteSuppression(null);
    }
  }

  function annulerSuppression() {
    setAlerteSuppression(null);
  }

  function handleDemanderModification(creneau) {
    setModeModification(creneau.id);
    setDateModification(creneau.dateDebut.split('T')[0]);
    const heure = new Date(creneau.dateDebut).toLocaleTimeString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    setHeureModification(heure);
    setErreur('');
    setSucces('');
  }

  async function handleModifier() {
    if (!dateModification || !heureModification) {
      setErreur(t('gestionDisponibilites.erreurChamps'));
      return;
    }

    setEnvoi(true);
    try {
      const dateDebut = new Date(`${dateModification}T${heureModification}:00`).toISOString();
      await api.put(`/availability/${modeModification}`, { dateDebut });
      
      setSucces(t('gestionDisponibilites.succesModification'));
      setModeModification(null);
      setDateModification('');
      setHeureModification('');
      await chargerDisponibilites();
    } catch (err) {
      setErreur(err.response?.data?.message || t('gestionDisponibilites.erreurModification'));
    } finally {
      setEnvoi(false);
    }
  }

  function annulerModification() {
    setModeModification(null);
    setDateModification('');
    setHeureModification('');
    setErreur('');
  }

  const aujourdHui = new Date().toISOString().split('T')[0];

  // Vérifier si un créneau est passé
  const estPasse = (dateDebut) => {
    return new Date(dateDebut) < new Date();
  };

  return (
    <div className="relative min-h-screen bg-ink text-ivory overflow-hidden">
      <AnimatedBackground />

      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-ink/70 border-b border-ivory/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-ivory/70 hover:text-gold transition-colors">
            <ArrowLeft size={20} />
          </button>
          <span className="font-display text-xl">{t('gestionDisponibilites.titre')}</span>
        </div>
      </header>

      <section className="pt-32 pb-24 px-6 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[320px_1fr] gap-8">
          {/* Sidebar - Formulaire de création */}
          <aside className="lg:sticky lg:top-32 lg:self-start">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-jade/30 border border-ivory/10 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <Plus className="text-gold" size={22} />
                <h2 className="font-display text-xl">{t('gestionDisponibilites.nouveauCreneau')}</h2>
              </div>

              <form onSubmit={handleCreer} className="space-y-4">
                <div>
                  <label className="block text-sm text-ivory/70 mb-2">{t('gestionDisponibilites.date')}</label>
                  <DatePicker
                    value={dateChoisie}
                    onChange={setDateChoisie}
                    placeholder={t('gestionDisponibilites.choisirDate')}
                  />
                </div>

                <div>
                  <label className="block text-sm text-ivory/70 mb-2">{t('gestionDisponibilites.heure')}</label>
                  <TimePicker
                    value={heureChoisie}
                    onChange={setHeureChoisie}
                    placeholder={t('gestionDisponibilites.choisirHeure')}
                  />
                </div>

                <button
                  type="submit"
                  disabled={envoi}
                  className="w-full bg-gold text-ink rounded-xl px-6 py-3 font-semibold hover:bg-gold/90 transition-colors disabled:opacity-50"
                >
                  {envoi ? t('gestionDisponibilites.creation') : t('gestionDisponibilites.creer')}
                </button>
              </form>

              {erreur && (
                <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3 mt-4">
                  {erreur}
                </p>
              )}
              {succes && (
                <p className="text-sm text-sage flex items-center gap-2 mt-4">
                  <CheckCircle2 size={16} /> {succes}
                </p>
              )}

              {alerteConflit && (
                <div className="mt-4 bg-red-400/10 border border-red-400/20 rounded-xl p-4">
                  <p className="text-sm text-red-400 font-medium mb-3">{alerteConflit.message}</p>
                  
                  {alerteConflit.type === 'exact' && alerteConflit.creneau && (
                    <div className="bg-ivory/5 rounded-lg p-3 mb-3">
                      <p className="text-xs text-ivory/50 mb-2">{t('gestionDisponibilites.creneauExistant')}</p>
                      <p className="text-sm">{formaterDate(alerteConflit.creneau.dateDebut)}</p>
                      <p className="text-sm text-ivory/60">{formaterHeure(alerteConflit.creneau.dateDebut)}</p>
                    </div>
                  )}

                  {alerteConflit.type === 'proche' && alerteConflit.creneaux && (
                    <div className="space-y-2 mb-3">
                      <p className="text-xs text-ivory/50 mb-2">{t('gestionDisponibilites.creneauxProches')}</p>
                      {alerteConflit.creneaux.map((creneau, idx) => (
                        <div key={creneau.id} className="bg-ivory/5 rounded-lg p-2">
                          <p className="text-sm">{formaterDate(creneau.dateDebut)}</p>
                          <p className="text-sm text-ivory/60">{formaterHeure(creneau.dateDebut)}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {alerteConflit.type === 'proche' && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setAlerteConflit(null)}
                        className="flex-1 px-4 py-2 rounded-lg border border-ivory/20 text-ivory/70 hover:bg-ivory/10 transition-colors text-sm"
                      >
                        {t('gestionDisponibilites.annuler')}
                      </button>
                      <button
                        type="button"
                        onClick={confirmerCreationMalgreConflit}
                        disabled={envoi}
                        className="flex-1 px-4 py-2 rounded-lg bg-gold text-ink font-medium hover:bg-gold/90 transition-colors disabled:opacity-50 text-sm"
                      >
                        {envoi ? t('gestionDisponibilites.creation') : t('gestionDisponibilites.creerQuandMeme')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </aside>

          {/* Main content - Liste des créneaux */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl">{t('gestionDisponibilites.tousCreneaux')}</h2>
              <button
                type="button"
                onClick={() => setAfficherListe(!afficherListe)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-ivory/20 text-ivory/70 hover:bg-ivory/10 transition-colors text-sm"
              >
                {afficherListe ? <EyeOff size={16} /> : <Eye size={16} />}
                {afficherListe ? t('gestionDisponibilites.masquer') : t('gestionDisponibilites.afficher')}
              </button>
            </div>

            {afficherListe ? (
              <>
                {chargement ? (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-ivory/50">{t('gestionDisponibilites.chargement')}</p>
                  </div>
                ) : disponibilites.length === 0 ? (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-ivory/50">{t('gestionDisponibilites.aucunCreneau')}</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                      {disponibilites.map((creneau, index) => (
                        <motion.div
                          key={creneau.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.04 }}
                          className={`bg-jade/30 border border-ivory/10 rounded-2xl p-5 hover:border-ivory/20 transition-colors ${
                            creneau.reserve ? 'cursor-pointer hover:border-gold/50' : ''
                          }`}
                          onClick={() => creneau.reserve && navigate(`/disponibilites/${creneau.id}/details`)}
                        >
                          {modeModification === creneau.id ? (
                            <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                              <DatePicker
                                value={dateModification}
                                onChange={setDateModification}
                                placeholder={t('gestionDisponibilites.nouvelleDate')}
                              />
                              <TimePicker
                                value={heureModification}
                                onChange={setHeureModification}
                                placeholder={t('gestionDisponibilites.nouvelleHeure')}
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={annulerModification}
                                  className="flex-1 px-3 py-2 rounded-lg border border-ivory/20 text-ivory/70 hover:bg-ivory/10 transition-colors text-sm"
                                >
                                  {t('gestionDisponibilites.annuler')}
                                </button>
                                <button
                                  type="button"
                                  onClick={handleModifier}
                                  disabled={envoi}
                                  className="flex-1 px-3 py-2 rounded-lg bg-gold text-ink font-medium hover:bg-gold/90 transition-colors disabled:opacity-50 text-sm"
                                >
                                  {envoi ? t('gestionDisponibilites.modification') : t('gestionDisponibilites.modifier')}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-3 mb-3">
                                <Calendar className="text-gold" size={18} />
                                <p className="font-display text-lg">{formaterDate(creneau.dateDebut)}</p>
                              </div>
                              
                              <p className="text-ivory/60 text-sm flex items-center gap-2 mb-4">
                                <Clock size={14} /> {formaterHeure(creneau.dateDebut)}
                              </p>

                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
                                    creneau.reserve
                                      ? 'bg-gold/10 text-gold'
                                      : 'bg-sage/10 text-sage'
                                  }`}
                                >
                                  {creneau.reserve ? <User size={12} /> : <CheckCircle2 size={12} />}
                                  {creneau.reserve ? t('gestionDisponibilites.reserve') : t('gestionDisponibilites.libre')}
                                </span>

                                <div className="flex gap-1">
                                  {!creneau.reserve && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDemanderModification(creneau);
                                        }}
                                        className="p-2 rounded-lg hover:bg-ivory/10 text-ivory/60 hover:text-gold transition-colors"
                                        title="Modifier"
                                      >
                                        <Edit2 size={14} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSupprimer(creneau.id);
                                        }}
                                        className="p-2 rounded-lg hover:bg-red-400/10 text-ivory/60 hover:text-red-400 transition-colors"
                                        title="Supprimer"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </>
                                  )}
                                  {creneau.reserve && estPasse(creneau.dateDebut) && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSupprimer(creneau.id);
                                      }}
                                      className="p-2 rounded-lg hover:bg-red-400/10 text-ivory/60 hover:text-red-400 transition-colors"
                                      title="Supprimer"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-ivory/50">{t('gestionDisponibilites.listeMasquee')}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Modale de confirmation de suppression */}
      <AnimatePresence>
        {alerteSuppression && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-jade border border-ivory/10 rounded-2xl p-6 max-w-md w-full"
            >
              <h3 className="font-display text-xl mb-2">{t('gestionDisponibilites.confirmerSuppression')}</h3>
              <p className="text-ivory/70 mb-6">
                {t('gestionDisponibilites.supprimerTexte')}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={annulerSuppression}
                  className="flex-1 px-4 py-3 rounded-xl border border-ivory/20 text-ivory/70 hover:bg-ivory/10 transition-colors font-medium"
                >
                  {t('gestionDisponibilites.annuler')}
                </button>
                <button
                  type="button"
                  onClick={confirmerSuppression}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-400 text-ink font-medium hover:bg-red-400/90 transition-colors"
                >
                  {t('gestionDisponibilites.supprimer')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default GestionDisponibilites;
