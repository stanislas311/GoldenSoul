import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

function tempsEcoule(dateString) {
  const secondes = Math.floor((new Date() - new Date(dateString)) / 1000);
  if (secondes < 60) return "à l'instant";
  const minutes = Math.floor(secondes / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const heures = Math.floor(minutes / 60);
  if (heures < 24) return `il y a ${heures}h`;
  const jours = Math.floor(heures / 24);
  return `il y a ${jours}j`;
}

function NotificationBell() {
  const navigate = useNavigate();
  const [ouvert, setOuvert] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [nombreNonLues, setNombreNonLues] = useState(0);
  const ref = useRef(null);

  async function charger() {
    try {
      const reponse = await api.get('/notifications');
      setNotifications(reponse.data.notifications);
      setNombreNonLues(reponse.data.nombreNonLues);
    } catch {
      // silencieux
    }
  }

  useEffect(() => {
    charger();
    const intervalle = setInterval(charger, 30000); // rafraîchit toutes les 30s
    return () => clearInterval(intervalle);
  }, []);

  useEffect(() => {
    function handleClickExterieur(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOuvert(false);
      }
    }
    document.addEventListener('mousedown', handleClickExterieur);
    return () => document.removeEventListener('mousedown', handleClickExterieur);
  }, []);

  async function handleOuvrir() {
    setOuvert(!ouvert);
    if (!ouvert && nombreNonLues > 0) {
      try {
        await api.put('/notifications/marquer-lues');
        setNombreNonLues(0);
      } catch {
        // silencieux
      }
    }
  }

  async function handleClicNotification(notification) {
    // Marquer comme lue
    if (!notification.lue) {
      try {
        await api.put(`/notifications/${notification.id}/lire`);
        setNombreNonLues(Math.max(0, nombreNonLues - 1));
        await charger();
      } catch {
        // silencieux
      }
    }

    // Naviguer selon le type de notification
    setOuvert(false);
    if (notification.type === 'SESSION_CONFIRMEE' && notification.sessionId) {
      navigate('/mes-seances');
    } else if (notification.type === 'SESSION_ANNULEE' && notification.sessionId) {
      navigate('/mes-seances');
    } else if (notification.type === 'RAPPEL_SESSION' && notification.sessionId) {
      navigate('/mes-seances');
    } else if (notification.type === 'NOUVEAU_RDV' && notification.sessionId) {
      navigate('/rendez-vous');
    } else if (notification.type === 'AVIS_PATIENT' && notification.patientId) {
      navigate(`/patients/${notification.patientId}`);
    } else if (notification.type === 'NOUVEAU_MESSAGE' && notification.conversationId) {
      // Vérifier le rôle de l'utilisateur pour naviguer vers la bonne page
      const userRole = localStorage.getItem('userRole');
      if (userRole === 'PRATICIEN') {
        navigate(`/conversations/${notification.conversationId}`);
      } else {
        navigate(`/messagerie/${notification.conversationId}`);
      }
    }
  }

  async function handleSupprimerNotification(e, notificationId) {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${notificationId}`);
      await charger();
    } catch {
      // silencieux
    }
  }

  function voirToutesNotifications() {
    navigate('/notifications');
    setOuvert(false);
  }

  const [pos, setPos] = useState({ top: 0, left: 0 });
  const bellRef = useRef(null);

  function calculerPosition() {
    if (bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right - 8,
      });
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        ref={bellRef}
        onClick={() => { calculerPosition(); handleOuvrir(); }}
        className="relative p-2 rounded-lg hover:bg-white/5 text-ivory/70 hover:text-gold transition-colors flex items-center justify-center"
        title="Notifications"
      >
        <Bell size={20} />
        {nombreNonLues > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-gold text-ink text-[10px] font-bold rounded-full flex items-center justify-center">
            {nombreNonLues > 9 ? '9+' : nombreNonLues}
          </span>
        )}
      </button>

      <AnimatePresence>
        {ouvert && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="fixed w-80 bg-jade border border-ivory/10 rounded-xl shadow-2xl shadow-black/60 max-h-96 overflow-y-auto z-[9999]"
            style={{ top: pos.top, right: pos.right }}
          >
            {notifications.length === 0 ? (
              <p className="text-ivory/40 text-sm text-center py-8">Aucune notification.</p>
            ) : (
              <>
                {notifications.slice(0, 5).map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleClicNotification(notif)}
                    className={`px-4 py-3 border-b border-ivory/5 last:border-0 cursor-pointer hover:bg-ivory/5 transition-colors ${
                      !notif.lue ? 'bg-gold/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!notif.lue && <div className="w-1.5 h-1.5 bg-gold rounded-full mt-1.5 flex-shrink-0" />}
                      <div className="flex-1">
                        <p className="text-sm text-ivory/80">{notif.contenu}</p>
                        <p className="text-xs text-ivory/40 mt-1">{tempsEcoule(notif.createdAt)}</p>
                      </div>
                      <button
                        onClick={(e) => handleSupprimerNotification(e, notif.id)}
                        className="p-1 hover:text-red-400 text-ivory/40 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {notifications.length > 5 && (
                  <button
                    onClick={voirToutesNotifications}
                    className="w-full px-4 py-3 text-sm text-gold hover:bg-gold/5 transition-colors text-center"
                  >
                    Voir toutes les notifications ({notifications.length})
                  </button>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default NotificationBell;
