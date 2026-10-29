import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Video, Clock, Radio } from 'lucide-react';

function CompteARebours({ session, dateDebut }) {
  const navigate = useNavigate();
  const [secondesRestantes, setSecondesRestantes] = useState(null);
  const [fenetreOuverte, setFenetreOuverte] = useState(false);
  const dejaVibreRef = useRef(false);

  const estEnCours = session.statut === 'EN_COURS';

  useEffect(() => {
    if (estEnCours) return; // plus besoin de calculer quoi que ce soit une fois la séance démarrée

    function calculer() {
      const maintenant = new Date();
      const debut = new Date(dateDebut);
      const ouvertureAcces = new Date(debut.getTime() - 10 * 60 * 1000);
      const finAcces = new Date(debut.getTime() + 45 * 60 * 1000);

      const diffOuverture = Math.floor((ouvertureAcces - maintenant) / 1000);

      if (diffOuverture > 0) {
        // Pas encore dans la fenêtre
        setSecondesRestantes(diffOuverture);
        setFenetreOuverte(false);
      } else if (maintenant < finAcces) {
        // Dans la fenêtre d'accès (avant OU après l'heure de début, tant que < 45 min de séance)
        setFenetreOuverte(true);
        setSecondesRestantes(null); // on n'affiche plus de décompte confus ici

        if (!dejaVibreRef.current) {
          dejaVibreRef.current = true;
          if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 300]);
          if (Notification.permission === 'granted') {
            new Notification('GoldenSoul', { body: 'Votre séance va bientôt commencer, rejoignez maintenant.' });
          }
        }
      } else {
        setFenetreOuverte(false);
        setSecondesRestantes(null);
      }
    }

    calculer();
    const intervalle = setInterval(calculer, 1000);
    return () => clearInterval(intervalle);
  }, [dateDebut, estEnCours]);

  function formaterCompte(secondes) {
    const jours = Math.floor(secondes / (24 * 60 * 60));
    const heures = Math.floor((secondes % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((secondes % (60 * 60)) / 60);
    const secondesRest = secondes % 60;

    const parties = [];
    if (jours > 0) parties.push(`${jours}j`);
    if (heures > 0) parties.push(`${heures}h`);
    if (minutes > 0) parties.push(`${minutes}min`);
    parties.push(`${secondesRest}s`);

    return parties.join(' ');
  }

  if (estEnCours) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-3 bg-sage/10 border border-sage/30 rounded-xl p-4 mb-3"
      >
        <Radio className="text-sage animate-pulse" size={18} />
        <p className="text-sm font-medium text-sage">Séance en cours</p>
      </motion.div>
    );
  }

  if (secondesRestantes === null && !fenetreOuverte) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex items-center justify-between gap-4 rounded-xl p-4 mb-3 ${
        fenetreOuverte ? 'bg-gold/10 border border-gold/30' : 'bg-jade/30 border border-ivory/10'
      }`}
    >
      <div className="flex items-center gap-3">
        <Clock className={fenetreOuverte ? 'text-gold' : 'text-ivory/40'} size={18} />
        <div>
          <p className="text-sm font-medium">
            {fenetreOuverte ? 'Vous pouvez rejoindre maintenant' : 'Ouverture dans'}
          </p>
          {!fenetreOuverte && (
            <p className="text-lg font-display text-ivory/60">
              {formaterCompte(secondesRestantes)}
            </p>
          )}
        </div>
      </div>

      {fenetreOuverte && (
        <button
          onClick={() => navigate(`/appel/${session.lienVisio}`)}
          className="flex items-center gap-2 bg-gold text-ink rounded-full px-5 py-2.5 font-medium hover:bg-gold/90 transition-colors animate-pulse"
        >
          <Video size={16} /> Rejoindre
        </button>
      )}
    </motion.div>
  );
}

export default CompteARebours;
