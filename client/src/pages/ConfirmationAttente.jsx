import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, ArrowLeft } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';

function ConfirmationAttente() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-ink text-ivory overflow-hidden">
      <AnimatedBackground />

      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-ink/70 border-b border-ivory/10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-ivory/70 hover:text-gold transition-colors">
            <ArrowLeft size={20} />
          </button>
          <span className="font-display text-xl">Réservation</span>
        </div>
      </header>

      <section className="pt-40 pb-24 px-6 max-w-md mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Clock className="text-gold mx-auto mb-6" size={40} />
          <h1 className="font-display text-3xl mb-3">Paiement confirmé</h1>
          <p className="text-ivory/60 mb-10">
            Votre rendez-vous est en attente de validation par votre praticien.
            Vous serez notifié dès sa confirmation.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gold hover:underline"
          >
            Retour au tableau de bord
          </button>
        </motion.div>
      </section>
    </div>
  );
}

export default ConfirmationAttente;
