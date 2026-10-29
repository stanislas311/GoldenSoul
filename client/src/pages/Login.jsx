import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import AnimatedBackground from '../components/AnimatedBackground';
import BackButton from '../components/BackButton';

function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [code2FA, setCode2FA] = useState('');
  const [deuxFARequis, setDeuxFARequis] = useState(false);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur('');
    setChargement(true);

    try {
      const reponse = await api.post('/auth/login', {
        email,
        motDePasse,
        code2FA: deuxFARequis ? code2FA : undefined,
      });

      if (reponse.data.deuxFARequis) {
        setDeuxFARequis(true);
        setChargement(false);
        return;
      }

      login(reponse.data.token, reponse.data.user);

      if (reponse.data.user.role === 'PRATICIEN') {
        navigate('/dashboard-praticien');
      } else {
        navigate('/dashboard');
      }
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
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <AnimatePresence mode="wait">
            {!deuxFARequis ? (
              <motion.div key="identifiants" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <BackButton to="/" />
                <h1 className="font-display text-4xl mb-2">{t('login.titre')}</h1>
                <p className="text-ivory/60 mb-10">{t('login.sousTitre')}</p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm text-ivory/70 mb-2">{t('login.email')}</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-ivory/40" size={18} />
                      <input
                        type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                        className="w-full bg-jade/50 border border-ivory/10 rounded-xl py-3 pl-12 pr-4 text-ivory placeholder:text-ivory/30 focus:outline-none focus:border-gold transition-colors"
                        placeholder="vous@exemple.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-ivory/70 mb-2">{t('login.motDePasse')}</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-ivory/40" size={18} />
                      <input
                        type="password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} required
                        className="w-full bg-jade/50 border border-ivory/10 rounded-xl py-3 pl-12 pr-4 text-ivory placeholder:text-ivory/30 focus:outline-none focus:border-gold transition-colors"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  {erreur && (
                    <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
                      {erreur}
                    </p>
                  )}

                  <div className="text-right">
                    <Link to="/forgot-password" className="text-sm text-ivory/50 hover:text-gold transition-colors">
                      {t('login.motDePasseOublie')}
                    </Link>
                  </div>

                  <button
                    type="submit" disabled={chargement}
                    className="w-full flex items-center justify-center gap-2 bg-gold text-ink rounded-xl py-3.5 font-semibold hover:bg-gold/90 transition-colors disabled:opacity-50"
                  >
                    {chargement ? t('login.boutonChargement') : t('login.bouton')}
                    {!chargement && <ArrowRight size={18} />}
                  </button>
                </form>

                <p className="text-center text-ivory/50 mt-8">
                  {t('login.pasDeCompte')}{' '}
                  <Link to="/register" className="text-gold hover:underline">{t('login.creerCompte')}</Link>
                </p>
              </motion.div>
            ) : (
              <motion.div key="2fa" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ShieldCheck className="text-gold mb-4" size={32} />
                <h1 className="font-display text-3xl mb-2">Vérification</h1>
                <p className="text-ivory/60 mb-8">
                  Saisissez le code généré par votre application d'authentification.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <input
                    type="text"
                    value={code2FA}
                    onChange={(e) => setCode2FA(e.target.value)}
                    placeholder="Code à 6 chiffres"
                    maxLength={6}
                    autoFocus
                    className="w-full bg-jade/50 border border-ivory/10 rounded-xl py-3 px-4 text-ivory placeholder:text-ivory/30 focus:outline-none focus:border-gold transition-colors text-center text-lg tracking-widest"
                  />

                  {erreur && (
                    <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
                      {erreur}
                    </p>
                  )}

                  <button
                    type="submit" disabled={chargement || code2FA.length !== 6}
                    className="w-full flex items-center justify-center gap-2 bg-gold text-ink rounded-xl py-3.5 font-semibold hover:bg-gold/90 transition-colors disabled:opacity-50"
                  >
                    {chargement ? "Vérification..." : "Vérifier"}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>
    </div>
  );
}

export default Login;
