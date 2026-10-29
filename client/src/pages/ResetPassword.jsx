import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import AnimatedBackground from '../components/AnimatedBackground';
import BackButton from '../components/BackButton';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState(false);
  const [chargement, setChargement] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur('');
    setChargement(true);

    try {
      await axios.post('http://localhost:5000/auth/reset-password', {
        token,
        nouveauMotDePasse,
      });
      setSucces(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setErreur(err.response?.data?.message || "Une erreur est survenue.");
    } finally {
      setChargement(false);
    }
  }

  if (!token) {
    return (
      <div className="relative min-h-screen bg-ink text-ivory overflow-hidden">
        <AnimatedBackground />
        <Navbar />
        <section className="pt-40 pb-24 px-6 max-w-md mx-auto">
          <BackButton to="/login" label="Retour à la connexion" />
          <div className="text-center">
          <AlertCircle className="text-red-400 mx-auto mb-4" size={40} />
          <h1 className="font-display text-3xl mb-3">Lien invalide</h1>
          <p className="text-ivory/60">Ce lien de réinitialisation est incomplet ou incorrect.</p>
          <Link to="/forgot-password" className="inline-block mt-8 text-gold hover:underline">
            Demander un nouveau lien
          </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-ink text-ivory overflow-hidden">
      <AnimatedBackground />
      <Navbar />

      <section className="pt-40 pb-24 px-6 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {!succes && <BackButton to="/login" label="Retour à la connexion" />}

          {succes ? (
            <div className="text-center">
              <CheckCircle2 className="text-gold mx-auto mb-4" size={40} />
              <h1 className="font-display text-3xl mb-3">Mot de passe mis à jour</h1>
              <p className="text-ivory/60">Redirection vers la connexion...</p>
            </div>
          ) : (
            <>
              <h1 className="font-display text-3xl mb-2">Nouveau mot de passe</h1>
              <p className="text-ivory/60 mb-8">Choisissez un mot de passe sécurisé.</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-ivory/40" size={18} />
                  <input
                    type="password"
                    value={nouveauMotDePasse}
                    onChange={(e) => setNouveauMotDePasse(e.target.value)}
                    required
                    minLength={8}
                    className="w-full bg-jade/50 border border-ivory/10 rounded-xl py-3 pl-12 pr-4 placeholder:text-ivory/30 focus:outline-none focus:border-gold transition-colors"
                    placeholder="Nouveau mot de passe"
                  />
                </div>

                {erreur && (
                  <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
                    {erreur}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={chargement}
                  className="w-full flex items-center justify-center gap-2 bg-gold text-ink rounded-xl py-3.5 font-semibold hover:bg-gold/90 transition-colors disabled:opacity-50"
                >
                  {chargement ? "Mise à jour..." : "Réinitialiser"}
                  {!chargement && <ArrowRight size={18} />}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </section>
    </div>
  );
}

export default ResetPassword;
