import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, ClipboardList, CreditCard, Video, MessageSquare, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

function PatientDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const sections = [
    { 
      icon: Calendar, 
      titre: t('dashboardPatient.rdvTitre'), 
      texte: t('dashboardPatient.rdvTexte'),
      route: '/reservation',
      color: '#D4AF37',
      image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&q=80"
    },
    { 
      icon: Video, 
      titre: t('dashboardPatient.seancesTitre'), 
      texte: t('dashboardPatient.seancesTexte'),
      route: '/mes-seances',
      color: '#7C9885',
      image: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&q=80"
    },
    { 
      icon: ClipboardList, 
      titre: t('dashboardPatient.quizTitre'), 
      texte: t('dashboardPatient.quizTexte'),
      route: '/quiz',
      color: '#8A7268',
      image: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&q=80"
    },
    { 
      icon: CreditCard, 
      titre: t('dashboardPatient.paiementsTitre'), 
      texte: t('dashboardPatient.paiementsTexte'),
      route: '/paiements',
      color: '#D4AF37',
      image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&q=80"
    },
    {
      icon: MessageSquare,
      titre: 'Messagerie',
      texte: 'Communiquez avec votre thérapeute',
      route: '/messagerie',
      color: '#7C9885',
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80"
    },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* En-tête de bienvenue */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-4 mb-8"
      >
        {user?.photoUrl ? (
          <img 
            src={`http://localhost:5000${user.photoUrl}`} 
            alt={user?.nom} 
            className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover shrink-0"
          />
        ) : (
          <div 
            className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-2xl md:text-3xl font-display text-gold shrink-0 bg-gold/10"
          >
            {user?.nom ? user.nom.charAt(0).toUpperCase() : '?'}
          </div>
        )}
        <div className="flex-1">
          <p className="text-gold text-xs font-medium uppercase tracking-widest mb-1">
            {t('dashboardPatient.bonRetour')}
          </p>
          <h1 className="font-display text-2xl md:text-4xl">{user?.nom}</h1>
          <p className="text-ivory/50 text-sm mt-1">Votre espace bien-être personnel</p>
        </div>
      </motion.div>

      {/* Grille de cartes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((item, index) => (
          <motion.button
            key={item.titre}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.07 }}
            onClick={() => navigate(item.route)}
            className="text-left rounded-2xl overflow-hidden relative group bg-jade/50 border border-ivory/10 min-h-[160px]"
          >
            {/* Image de fond */}
            <img 
              src={item.image} 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover:opacity-60 transition-opacity duration-300"
            />
            {/* Overlay dégradé */}
            <div className="absolute inset-0 bg-gradient-to-br from-ink/90 from-30% to-ink/30 to-100%" />
            {/* Contenu */}
            <div className="relative z-10 p-5 md:p-6 flex flex-col h-full justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-gold/20 text-gold">
                  <item.icon size={20} />
                </div>
                <h3 className="font-display text-lg mb-1">{item.titre}</h3>
                <p className="text-ivory/55 text-sm leading-relaxed">{item.texte}</p>
              </div>
              <div className="flex items-center gap-1 mt-4 text-gold">
                <span className="text-xs font-semibold uppercase tracking-wider">Accéder</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export default PatientDashboard;
