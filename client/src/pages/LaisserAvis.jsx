import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, CheckCircle2 } from 'lucide-react';
import api from '../utils/api';
import AnimatedBackground from '../components/AnimatedBackground';

function LaisserAvis() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(0);
  const [survol, setSurvol] = useState(0);
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState(false);

  async function handleEnvoyer() {
    if (note === 0) return;
    setEnvoi(true);
    try {
      await api.post(`/sessions/${sessionId}/avis`, { note });
      setEnvoye(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch {
      setEnvoye(true); // même en cas de doublon, on ferme proprement
      setTimeout(() => navigate('/dashboard'), 2000);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-ink text-ivory overflow-hidden flex items-center justify-center">
      <AnimatedBackground />

      <section className="px-6 max-w-sm mx-auto text-center">
        {envoye ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <CheckCircle2 className="text-gold mx-auto mb-4" size={40} />
            <h1 className="font-display text-2xl">Merci pour votre avis</h1>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-2xl mb-2">Comment s'est passée votre séance ?</h1>
            <p className="text-ivory/50 text-sm mb-8">Votre avis reste anonyme pour les autres patients.</p>

            <div className="flex justify-center gap-2 mb-10">
              {[1, 2, 3, 4, 5].map((valeur) => (
                <button
                  key={valeur}
                  onClick={() => setNote(valeur)}
                  onMouseEnter={() => setSurvol(valeur)}
                  onMouseLeave={() => setSurvol(0)}
                >
                  <Star
                    size={32}
                    className={
                      valeur <= (survol || note)
                        ? 'text-gold fill-gold'
                        : 'text-ivory/20'
                    }
                  />
                </button>
              ))}
            </div>

            <button
              onClick={handleEnvoyer}
              disabled={note === 0 || envoi}
              className="w-full bg-gold text-ink rounded-xl py-3.5 font-semibold hover:bg-gold/90 transition-colors disabled:opacity-40"
            >
              {envoi ? "Envoi..." : "Envoyer mon avis"}
            </button>
          </motion.div>
        )}
      </section>
    </div>
  );
}

export default LaisserAvis;
