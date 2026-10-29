import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import AnimatedBackground from '../components/AnimatedBackground';
import BackButton from '../components/BackButton';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [envoye, setEnvoye] = useState(false);
  const [chargement, setChargement] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setChargement(true);

    try {
      await axios.post('http://localhost:5000/auth/forgot-password', { email });
    } catch {
      // On ignore volontairement l'erreur : la réponse doit rester la même dans tous les cas
    } finally {
      setChargement(false);
      setEnvoye(true);
    }
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
          {!envoye && <BackButton to="/login" label="Retour à la connexion" />}

          {envoye ? (
            <div className="text-center">
              <CheckCircle2 className="text-gold mx-auto mb-4" size={40} />
              <h1 className="font-display text-3xl mb-3">Vérifiez votre boîte mail</h1>
              <p className="text-ivory/60">
                Si un compte existe avec cet email, un lien de réinitialisation vous a été envoyé.
                Le lien expire dans 20 minutes.
              </p>
              <Link to="/login" className="inline-block mt-8 text-gold hover:underline">
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-display text-3xl mb-2">Mot de passe oublié</h1>
              <p className="text-ivory/60 mb-8">
                Indiquez votre email, nous vous enverrons un lien de réinitialisation.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-ivory/40" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-jade/50 border border-ivory/10 rounded-xl py-3 pl-12 pr-4 placeholder:text-ivory/30 focus:outline-none focus:border-gold transition-colors"
                    placeholder="vous@exemple.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={chargement}
                  className="w-full flex items-center justify-center gap-2 bg-gold text-ink rounded-xl py-3.5 font-semibold hover:bg-gold/90 transition-colors disabled:opacity-50"
                >
                  {chargement ? "Envoi..." : "Envoyer le lien"}
                  {!chargement && <ArrowRight size={18} />}
                </button>
              </form>

              <Link to="/login" className="block text-center text-ivory/50 hover:text-gold mt-8 transition-colors">
                Retour à la connexion
              </Link>
            </>
          )}
        </motion.div>
      </section>
    </div>
  );
}

export default ForgotPassword;
