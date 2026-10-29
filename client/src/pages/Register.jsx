import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Phone, ArrowRight, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import Navbar from '../components/Navbar';
import AnimatedBackground from '../components/AnimatedBackground';
import BackButton from '../components/BackButton';
import DatePicker from '../components/DatePicker';
import SelectDropdown from '../components/SelectDropdown';

const ETAPES = [
  { id: 'identite', titre: 'register.etape1Titre', sousTitre: 'register.etape1SousTitre', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=60' },
  { id: 'connexion', titre: 'register.etape2Titre', sousTitre: 'register.etape2SousTitre', image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop&q=60' },
  { id: 'contact', titre: 'register.etape3Titre', sousTitre: 'register.etape3SousTitre', image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60' },
  { id: 'personnel', titre: 'register.etape4Titre', sousTitre: 'register.etape4SousTitre', image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=60' },
  { id: 'situation', titre: 'register.etape5Titre', sousTitre: 'register.etape5SousTitre', image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=60' },
];

function Register() {
  const { t } = useTranslation();
  const [etape, setEtape] = useState('consentement');
  const [etapeFormulaire, setEtapeFormulaire] = useState(0);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nom: '',
    email: '',
    motDePasse: '',
    telephone: '',
    genre: '',
    dateNaissance: '',
    situationMatrimoniale: '',
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSuivant() {
    const champsEtape = {
      0: ['nom'],
      1: ['email', 'motDePasse'],
      2: ['telephone'],
      3: ['dateNaissance', 'genre'],
      4: ['situationMatrimoniale'],
    };

    const champsRequis = champsEtape[etapeFormulaire];
    const champsVides = champsRequis.filter(champ => !form[champ]);

    if (champsVides.length > 0) {
      setErreur(t('register.erreurChamps'));
      return;
    }

    // Validation de l'âge minimum (18 ans) pour l'étape de la date de naissance
    if (etapeFormulaire === 3 && form.dateNaissance) {
      const dateNaissance = new Date(form.dateNaissance);
      const aujourdHui = new Date();
      const age = aujourdHui.getFullYear() - dateNaissance.getFullYear();
      const differenceMois = aujourdHui.getMonth() - dateNaissance.getMonth();
      
      // Ajuster l'âge si l'anniversaire n'est pas encore passé cette année
      const ageFinal = differenceMois < 0 || (differenceMois === 0 && aujourdHui.getDate() < dateNaissance.getDate()) 
        ? age - 1 
        : age;

      if (ageFinal < 18) {
        setErreur(t('register.erreurAge'));
        return;
      }
    }

    setErreur('');

    if (etapeFormulaire < ETAPES.length - 1) {
      setEtapeFormulaire(etapeFormulaire + 1);
    } else {
      handleSubmit();
    }
  }

  function handlePrecedent() {
    if (etapeFormulaire > 0) {
      setEtapeFormulaire(etapeFormulaire - 1);
      setErreur('');
    }
  }

  async function handleSubmit() {
    setErreur('');
    setChargement(true);

    try {
      const reponse = await axios.post('http://localhost:5000/auth/register', {
        ...form,
        consentementAccepte: true,
      });

      localStorage.setItem('token', reponse.data.token);
      navigate('/dashboard');
    } catch (err) {
      setErreur(err.response?.data?.message || t('commun.erreurGenerique'));
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-ink text-ivory overflow-hidden">
      <AnimatedBackground />
      <Navbar />

      <section className="pt-40 pb-24 px-6 max-w-md mx-auto">
        {etape === 'formulaire' ? (
          <BackButton onClick={() => setEtape('consentement')} label={t('register.retour')} />
        ) : (
          <BackButton to="/" />
        )}

        <AnimatePresence mode="wait">
          {etape === 'consentement' ? (
            <motion.div
              key="consentement"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <ShieldCheck className="text-gold mb-4" size={32} />
              <h1 className="font-display text-3xl mb-4">{t('register.avantContinuer')}</h1>
              <p className="text-ivory/70 leading-relaxed mb-4">
                {t('register.consentement1')}
              </p>
              <p className="text-ivory/70 leading-relaxed mb-4">
                {t('register.consentement2')}
              </p>
              <p className="text-ivory/70 leading-relaxed mb-8">
                {t('register.consentement3')}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 border border-ivory/20 text-ivory rounded-xl py-3.5 font-medium hover:bg-ivory/5 transition-colors"
                >
                  {t('register.refuser')}
                </button>
                <button
                  onClick={() => setEtape('formulaire')}
                  className="flex-1 bg-gold text-ink rounded-xl py-3.5 font-semibold hover:bg-gold/90 transition-colors"
                >
                  {t('register.accepter')}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="formulaire"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {/* Barre de progression */}
              <div className="flex gap-2 mb-6">
                {ETAPES.map((_, index) => (
                  <div
                    key={index}
                    className={`flex-1 h-1 rounded-full transition-colors ${
                      index <= etapeFormulaire ? 'bg-gold' : 'bg-ivory/20'
                    }`}
                  />
                ))}
              </div>

              <AnimatePresence mode="wait">
                {ETAPES.map((etapeInfo, index) => (
                  etapeFormulaire === index && (
                    <motion.div
                      key={etapeInfo.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Image illustrative */}
                      <div className="relative h-32 rounded-2xl overflow-hidden mb-6">
                        <img
                          src={etapeInfo.image}
                          alt={etapeInfo.titre}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
                      </div>

                      <h1 className="font-display text-3xl mb-2">{t(etapeInfo.titre)}</h1>
                      <p className="text-ivory/60 mb-6">{t(etapeInfo.sousTitre)}</p>

                      <div className="space-y-4">
                        {/* Étape 1 : Identité */}
                        {index === 0 && (
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-ivory/40" size={18} />
                            <input
                              type="text" name="nom" value={form.nom} onChange={handleChange} required
                              className="w-full bg-jade/50 border border-ivory/10 rounded-xl py-3 pl-12 pr-4 placeholder:text-ivory/30 focus:outline-none focus:border-gold transition-colors"
                              placeholder={t('register.nomPlaceholder')}
                            />
                          </div>
                        )}

                        {/* Étape 2 : Connexion */}
                        {index === 1 && (
                          <>
                            <div className="relative">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-ivory/40" size={18} />
                              <input
                                type="email" name="email" value={form.email} onChange={handleChange} required
                                className="w-full bg-jade/50 border border-ivory/10 rounded-xl py-3 pl-12 pr-4 placeholder:text-ivory/30 focus:outline-none focus:border-gold transition-colors"
                                placeholder={t('register.emailPlaceholder')}
                              />
                            </div>
                            <div className="relative">
                              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-ivory/40" size={18} />
                              <input
                                type="password" name="motDePasse" value={form.motDePasse} onChange={handleChange} required
                                className="w-full bg-jade/50 border border-ivory/10 rounded-xl py-3 pl-12 pr-4 placeholder:text-ivory/30 focus:outline-none focus:border-gold transition-colors"
                                placeholder={t('register.motDePassePlaceholder')}
                              />
                            </div>
                          </>
                        )}

                        {/* Étape 3 : Contact */}
                        {index === 2 && (
                          <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-ivory/40" size={18} />
                            <input
                              type="tel" name="telephone" value={form.telephone} onChange={handleChange}
                              className="w-full bg-jade/50 border border-ivory/10 rounded-xl py-3 pl-12 pr-4 placeholder:text-ivory/30 focus:outline-none focus:border-gold transition-colors"
                              placeholder={t('register.telephonePlaceholder')}
                            />
                          </div>
                        )}

                        {/* Étape 4 : Personnel */}
                        {index === 3 && (
                          <>
                            <DatePicker
                              value={form.dateNaissance}
                              onChange={(value) => setForm({ ...form, dateNaissance: value })}
                              placeholder={t('register.dateNaissancePlaceholder')}
                            />
                            <SelectDropdown
                              value={form.genre}
                              onChange={(value) => setForm({ ...form, genre: value })}
                              options={[
                                { value: 'HOMME', label: t('register.genreHomme') },
                                { value: 'FEMME', label: t('register.genreFemme') },
                                { value: 'AUTRE', label: t('register.genreAutre') },
                              ]}
                              placeholder={t('register.genrePlaceholder')}
                            />
                          </>
                        )}

                        {/* Étape 5 : Situation */}
                        {index === 4 && (
                          <SelectDropdown
                            value={form.situationMatrimoniale}
                            onChange={(value) => setForm({ ...form, situationMatrimoniale: value })}
                            options={[
                              { value: 'CELIBATAIRE', label: t('register.situationCelibataire') },
                              { value: 'MARIE', label: t('register.situationMarie') },
                              { value: 'DIVORCE', label: t('register.situationDivorce') },
                              { value: 'VEUF', label: t('register.situationVeuf') },
                            ]}
                            placeholder={t('register.situationPlaceholder')}
                          />
                        )}

                        {erreur && (
                          <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
                            {erreur}
                          </p>
                        )}

                        {/* Boutons de navigation */}
                        <div className="flex gap-3 pt-2">
                          {etapeFormulaire > 0 && (
                            <button
                              type="button"
                              onClick={handlePrecedent}
                              className="flex-1 flex items-center justify-center gap-2 border border-ivory/20 text-ivory rounded-xl py-3.5 font-medium hover:bg-ivory/5 transition-colors"
                            >
                              <ArrowLeft size={18} /> {t('register.precedent')}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={handleSuivant}
                            disabled={chargement}
                            className="flex-1 flex items-center justify-center gap-2 bg-gold text-ink rounded-xl py-3.5 font-semibold hover:bg-gold/90 transition-colors disabled:opacity-50"
                          >
                            {chargement ? t('register.creation') : etapeFormulaire === ETAPES.length - 1 ? t('register.creerCompte') : t('register.suivant')}
                            {!chargement && <ArrowRight size={18} />}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )
                ))}
              </AnimatePresence>

              <p className="text-center text-ivory/50 mt-8">
                {t('register.dejaCompte')}{' '}
                <Link to="/login" className="text-gold hover:underline">
                  {t('register.seConnecter')}
                </Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}

export default Register;
