import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, MessageCircle, Search, X } from 'lucide-react';
import api from '../utils/api';
import AnimatedBackground from '../components/AnimatedBackground';

function formaterHeureMessage(dateString) {
  return new Date(dateString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function initiales(nom) {
  return nom.split(' ').map((m) => m[0]).slice(0, 2).join('').toUpperCase();
}

function ConversationsListe() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [conversationsFiltrees, setConversationsFiltrees] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState('');

  useEffect(() => {
    async function charger() {
      try {
        const reponse = await api.get('/messages/conversations');
        setConversations(reponse.data.conversations);
        setConversationsFiltrees(reponse.data.conversations);
      } catch {
        // silencieux
      } finally {
        setChargement(false);
      }
    }
    charger();
  }, []);

  // Filtrer les conversations par recherche
  useEffect(() => {
    if (!recherche.trim()) {
      setConversationsFiltrees(conversations);
      return;
    }

    const terme = recherche.toLowerCase().trim();
    const filtres = conversations.filter((conv) => {
      const nomPatient = conv.patient?.nom?.toLowerCase() || '';
      const dernierMessage = conv.messages?.[0]?.contenu?.toLowerCase() || '';
      
      return nomPatient.includes(terme) || dernierMessage.includes(terme);
    });

    setConversationsFiltrees(filtres);
  }, [recherche, conversations]);

  return (
    <div className="relative min-h-screen bg-ink text-ivory overflow-hidden">
      <AnimatedBackground />

      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-ink/70 border-b border-ivory/10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard-praticien')} className="text-ivory/70 hover:text-gold transition-colors">
            <ArrowLeft size={20} />
          </button>
          <span className="font-display text-xl">Messages</span>
        </div>
      </header>

      <section className="pt-32 pb-24 px-6 max-w-3xl mx-auto">
        {/* Barre de recherche */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ivory/40" size={18} />
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher une conversation..."
              className="w-full bg-jade/30 border border-ivory/10 rounded-xl py-3 pl-12 pr-12 text-ivory placeholder:text-ivory/40 focus:outline-none focus:border-gold/30 transition-colors"
            />
            {recherche && (
              <button
                onClick={() => setRecherche('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-ivory/40 hover:text-ivory/70 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {chargement ? (
          <p className="text-ivory/50">Chargement...</p>
        ) : conversations.length === 0 ? (
          <p className="text-ivory/50">Aucune conversation pour le moment.</p>
        ) : conversationsFiltrees.length === 0 ? (
          <p className="text-ivory/50">Aucune conversation ne correspond à votre recherche.</p>
        ) : (
          <div>
            {conversationsFiltrees.map((conv, index) => {
              const dernierMessage = conv.messages?.[0];
              return (
                <motion.button
                  key={conv.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                  onClick={() => navigate(`/conversations/${conv.id}`)}
                  className="w-full flex items-center gap-4 py-4 border-b border-ivory/5 hover:bg-ivory/[0.02] transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center overflow-hidden shrink-0">
                    {conv.patient?.photoUrl ? (
                      <img src={`http://localhost:5000${conv.patient.photoUrl}`} alt={conv.patient.nom || 'Patient'} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-display text-sm text-gold">
                        {conv.patient ? initiales(conv.patient.nom) : '?'}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{conv.patient?.nom || 'Patient'}</p>
                    <p className="text-ivory/40 text-sm truncate">
                      {dernierMessage ? dernierMessage.contenu : 'Aucun message'}
                    </p>
                  </div>

                  {dernierMessage && (
                    <span className="text-ivory/30 text-xs shrink-0">
                      {formaterHeureMessage(dernierMessage.createdAt)}
                    </span>
                  )}

                  <div className="flex items-center gap-2 shrink-0">
                    {conv.nombreNonLus > 0 && (
                      <span className="w-5 h-5 rounded-full bg-gold text-ink text-[10px] font-bold flex items-center justify-center">
                        {conv.nombreNonLus > 9 ? '9+' : conv.nombreNonLus}
                      </span>
                    )}
                    <ChevronRight size={16} className="text-ivory/20" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default ConversationsListe;
