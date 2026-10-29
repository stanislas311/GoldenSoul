import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Bell, Check, Trash2, Calendar, User, Video, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import AnimatedBackground from '../components/AnimatedBackground';

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

function formaterDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
}

function formaterHeure(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

function Notifications() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [nombreNonLues, setNombreNonLues] = useState(0);
  const [notificationSelectionnee, setNotificationSelectionnee] = useState(null);

  async function chargerNotifications() {
    try {
      const reponse = await api.get('/notifications');
      setNotifications(reponse.data.notifications);
      setNombreNonLues(reponse.data.nombreNonLues);
    } catch {
      setNotifications([]);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    chargerNotifications();
  }, []);

  async function marquerCommeLue(notificationId) {
    try {
      await api.put(`/notifications/${notificationId}/lire`);
      await chargerNotifications();
    } catch {
      // silencieux
    }
  }

  async function marquerToutesLues() {
    try {
      await api.put('/notifications/marquer-lues');
      await chargerNotifications();
    } catch {
      // silencieux
    }
  }

  async function supprimerNotification(notificationId) {
    try {
      await api.delete(`/notifications/${notificationId}`);
      await chargerNotifications();
    } catch {
      // silencieux
    }
  }

  async function handleClicNotification(notification) {
    // Marquer comme lue
    if (!notification.lue) {
      await marquerCommeLue(notification.id);
    }

    // Naviguer selon le type de notification
    if (notification.type === 'SESSION_CONFIRMEE' && notification.sessionId) {
      navigate(`/mes-seances`);
    } else if (notification.type === 'SESSION_ANNULEE' && notification.sessionId) {
      navigate(`/mes-seances`);
    } else if (notification.type === 'RAPPEL_SESSION' && notification.sessionId) {
      navigate(`/mes-seances`);
    } else if (notification.type === 'NOUVEAU_RDV' && notification.sessionId) {
      navigate(`/rendez-vous`);
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

  function getIconeType(type) {
    switch (type) {
      case 'SESSION_CONFIRMEE':
        return <CheckCircle2 className="text-sage" size={20} />;
      case 'SESSION_ANNULEE':
        return <Trash2 className="text-red-400" size={20} />;
      case 'RAPPEL_SESSION':
        return <Calendar className="text-gold" size={20} />;
      case 'NOUVEAU_RDV':
        return <Video className="text-jade" size={20} />;
      case 'AVIS_PATIENT':
        return <User className="text-gold" size={20} />;
      default:
        return <Bell className="text-ivory/60" size={20} />;
    }
  }

  function getCouleurType(type) {
    switch (type) {
      case 'SESSION_CONFIRMEE':
        return 'bg-sage/10 border-sage/20';
      case 'SESSION_ANNULEE':
        return 'bg-red-400/10 border-red-400/20';
      case 'RAPPEL_SESSION':
        return 'bg-gold/10 border-gold/20';
      case 'NOUVEAU_RDV':
        return 'bg-jade/10 border-jade/20';
      case 'AVIS_PATIENT':
        return 'bg-gold/10 border-gold/20';
      default:
        return 'bg-ivory/5 border-ivory/10';
    }
  }

  return (
    <div className="relative min-h-screen bg-ink text-ivory overflow-hidden">
      <AnimatedBackground />

      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-ink/70 border-b border-ivory/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="text-ivory/70 hover:text-gold transition-colors">
              <ArrowLeft size={20} />
            </button>
            <span className="font-display text-xl">Notifications</span>
            {nombreNonLues > 0 && (
              <span className="bg-gold text-ink text-xs font-bold px-2 py-1 rounded-full">
                {nombreNonLues}
              </span>
            )}
          </div>
          {nombreNonLues > 0 && (
            <button
              onClick={marquerToutesLues}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-ivory/20 text-ivory/70 hover:bg-ivory/10 transition-colors text-sm"
            >
              <Check size={16} />
              Tout marquer comme lu
            </button>
          )}
        </div>
      </header>

      <section className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
        {chargement ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-ivory/50">Chargement...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Bell className="text-ivory/20 mb-4" size={48} />
            <p className="text-ivory/50">Aucune notification</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onClick={() => handleClicNotification(notification)}
                  className={`relative border rounded-2xl p-5 hover:border-ivory/20 transition-all cursor-pointer ${
                    notification.lue ? 'bg-ivory/5 opacity-70' : 'bg-jade/30'
                  } ${getCouleurType(notification.type)}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-xl bg-ink/50">
                      {getIconeType(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm text-ivory/80">{notification.contenu}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-ivory/40">
                            <span>{tempsEcoule(notification.createdAt)}</span>
                            <span>•</span>
                            <span>{formaterDate(notification.createdAt)}</span>
                            <span>•</span>
                            <span>{formaterHeure(notification.createdAt)}</span>
                          </div>
                        </div>
                        {!notification.lue && (
                          <div className="w-2 h-2 bg-gold rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        supprimerNotification(notification.id);
                      }}
                      className="p-2 rounded-lg hover:bg-red-400/10 text-ivory/40 hover:text-red-400 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
}

export default Notifications;
