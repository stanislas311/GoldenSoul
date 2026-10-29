import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AnimatedBackground from '../components/AnimatedBackground';

function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  function handleRetour() {
    if (user?.role === 'PRATICIEN') {
      navigate('/dashboard-praticien');
    } else if (user?.role === 'PATIENT') {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  }

  return (
    <div className="relative min-h-screen bg-ink text-ivory overflow-hidden flex items-center justify-center">
      <AnimatedBackground />

      <div className="relative z-10 text-center px-6 max-w-lg mx-auto">
        {/* Grand "404" animé */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative mb-8"
        >
          <span
            className="block font-display text-[10rem] leading-none font-bold select-none"
            style={{
              background: 'linear-gradient(135deg, var(--color-gold) 0%, var(--color-burnt) 50%, var(--color-gold) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 40px var(--color-gold-20))',
            }}
          >
            404
          </span>

          {/* Icône flottante */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <Compass className="text-gold/20" size={80} />
          </motion.div>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h1 className="font-display text-3xl mb-3">Page introuvable</h1>
          <p className="text-ivory/50 mb-2">
            La page{' '}
            <code className="text-gold/70 bg-jade/50 px-2 py-0.5 rounded text-sm">
              {location.pathname}
            </code>{' '}
            n'existe pas.
          </p>
          <p className="text-ivory/40 text-sm mb-10">
            Elle a peut-être été déplacée, supprimée, ou l'URL est incorrecte.
          </p>
        </motion.div>

        {/* Boutons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-ivory/20 text-ivory/70 hover:border-gold/40 hover:text-gold transition-all duration-200"
          >
            <ArrowLeft size={18} />
            Page précédente
          </button>

          <button
            onClick={handleRetour}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gold text-ink font-semibold hover:bg-gold/90 transition-all duration-200"
          >
            <Home size={18} />
            Retour à l'accueil
          </button>
        </motion.div>

        {/* Branding discret */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-ivory/20 text-sm font-display"
        >
          GoldenSoul
        </motion.p>
      </div>
    </div>
  );
}

export default NotFound;
