import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Home, 
  Calendar, 
  Video, 
  CreditCard, 
  ClipboardList, 
  Settings, 
  LogOut, 
  MessageSquare,
  Users,
  BarChart,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedBackground from './AnimatedBackground';
import NotificationBell from './NotificationBell';

function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const navLinks = user?.role === 'PRATICIEN' ? [
    { name: 'Accueil', path: '/dashboard-praticien', icon: Home },
    { name: 'Rendez-vous', path: '/rendez-vous', icon: Calendar },
    { name: 'Patients', path: '/patients', icon: Users },
    { name: 'Paiements', path: '/paiements-praticien', icon: CreditCard },
    { name: 'Messages', path: '/conversations', icon: MessageSquare },
    { name: 'Consultations', path: '/mes-seances-praticien', icon: Video },
    { name: 'Disponibilités', path: '/disponibilites', icon: Clock },
    { name: 'Statistiques', path: '/statistiques', icon: BarChart },
  ] : [
    { name: 'Accueil', path: '/dashboard', icon: Home },
    { name: 'Réserver', path: '/reservation', icon: Calendar },
    { name: 'Mes Séances', path: '/mes-seances', icon: Video },
    { name: 'Messages', path: '/messagerie', icon: MessageSquare },
    { name: 'Bilans', path: '/quiz', icon: ClipboardList },
    { name: 'Paiements', path: '/paiements', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-ink text-ivory flex">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <AnimatedBackground />
      </div>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 fixed h-full z-40 bg-ink/85 backdrop-blur-md border-r border-ivory/10">
        <div className="p-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gold flex items-center justify-center font-bold text-ink text-lg">G</div>
          <span className="font-display text-2xl text-gold tracking-wide">GoldenSoul</span>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            const Icon = link.icon;
            return (
              <button
                key={link.name}
                onClick={() => navigate(link.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative ${isActive ? 'bg-gold/10 text-gold border border-gold/20' : 'text-ivory/70 border border-transparent'}`}
              >
                <Icon size={20} />
                <span className="font-medium text-sm">{link.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-ivory/10">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-ivory bg-gold/20">
              {user?.nom?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <span className="text-xs text-ivory/70 truncate max-w-[120px]">{user?.nom}</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 relative z-10 w-full md:ml-64 pb-24 md:pb-0 min-h-screen">
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-ink/90 backdrop-blur-md border-b border-ivory/10">
          <span className="font-display text-xl text-gold">GoldenSoul</span>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <button onClick={() => navigate('/parametres')} className="text-ivory/70">
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* Desktop header */}
        <header className="hidden md:flex sticky top-0 z-30 items-center justify-between px-6 py-4 bg-ink/90 backdrop-blur-md border-b border-ivory/10">
          <span className="font-display text-xl text-gold">GoldenSoul</span>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <button onClick={() => navigate('/parametres')} className="p-2 rounded-lg hover:bg-white/5 text-ivory/70 hover:text-gold transition-colors flex items-center justify-center">
              <Settings size={20} />
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="w-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-ink/95 backdrop-blur-xl border-t border-gold/10">
        <div className="flex items-center h-16 px-2">
          {navLinks.slice(0, 5).map((link) => {
            const isActive = location.pathname === link.path;
            const Icon = link.icon;
            return (
              <button
                key={link.name}
                onClick={() => navigate(link.path)}
                className="flex-1 flex flex-col items-center justify-center h-full gap-0.5 transition-all duration-200"
              >
                <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-gold/15' : 'bg-transparent'}`}>
                  <Icon size={22} className={isActive ? 'text-gold' : 'text-ivory/50'} />
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'text-gold' : 'text-ivory/50'}`}>
                  {link.name}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default Layout;
