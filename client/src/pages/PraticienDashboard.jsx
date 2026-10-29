import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Users, ClipboardList, BarChart3, MessageSquare, Clock, Video, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

function PraticienDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const sections = [
    { 
      icon: Calendar, 
      titre: t('dashboardPraticien.rdvTitre'), 
      texte: t('dashboardPraticien.rdvTexte'),
      route: '/rendez-vous',
      color: '#D4AF37',
      image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&q=80"
    },
    { 
      icon: Users, 
      titre: t('dashboardPraticien.patientsTitre'), 
      texte: t('dashboardPraticien.patientsTexte'),
      route: '/patients',
      color: '#7C9885',
      image: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&q=80"
    },
    {
      icon: Video,
      titre: 'Consultations',
      texte: 'Vos séances passées et à venir',
      route: '/mes-seances-praticien',
      color: '#D4AF37',
      image: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&q=80"
    },
    { 
      icon: MessageSquare, 
      titre: 'Messages', 
      texte: 'Communiquez avec vos patients',
      route: '/conversations',
      color: '#8A7268',
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80"
    },
    { 
      icon: Clock, 
      titre: 'Disponibilités', 
      texte: 'Gérez vos plages horaires',
      route: '/disponibilites',
      color: '#7C9885',
      image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&q=80"
    },
    { 
      icon: BarChart3, 
      titre: t('dashboardPraticien.statsTitre'), 
      texte: t('dashboardPraticien.statsTexte'),
      route: '/statistiques',
      color: '#D4AF37',
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80"
    },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* En-tête */}
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
        <div>
          <span 
            className="text-xs uppercase tracking-widest font-semibold px-3 py-1 rounded-full inline-block mb-2 bg-gold/15 text-gold border border-gold/25"
          >
            Espace Praticien
          </span>
          <h1 className="font-display text-2xl md:text-4xl">{user?.nom}</h1>
          <p className="text-ivory/50 text-sm mt-1">Gérez votre activité thérapeutique</p>
        </div>
      </motion.div>

      {/* Grille */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((item, index) => (
          <motion.button
            key={item.titre}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.07 }}
            onClick={() => navigate(item.route)}
            className="text-left rounded-2xl overflow-hidden relative group bg-jade/50 border border-ivory/10 min-h-[150px]"
          >
            <img 
              src={item.image} 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover:opacity-60 transition-opacity duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-ink/90 from-30% to-ink/30 to-100%" />
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

export default PraticienDashboard;
