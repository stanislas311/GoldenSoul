import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Receipt, CheckCircle2, Clock, XCircle, Search, X, Trash2 } from 'lucide-react';
import api from '../utils/api';
import { formaterDate, formaterHeure } from '../utils/dates';
import AnimatedBackground from '../components/AnimatedBackground';

const STATUT_PAIEMENT = {
  EN_ATTENTE: { label: 'En attente', icon: Clock, couleur: 'text-ivory/50' },
  PAYE: { label: 'Payé', icon: CheckCircle2, couleur: 'text-sage' },
  ECHOUE: { label: 'Échoué', icon: XCircle, couleur: 'text-red-400' },
  REMBOURSE: { label: 'Remboursé', icon: CheckCircle2, couleur: 'text-gold' },
  REMBOURSEMENT_EN_COURS: { label: 'Remboursement en cours', icon: Clock, couleur: 'text-gold' },
};

function MesPaiements() {
  const navigate = useNavigate();
  const [paiements, setPaiements] = useState([]);
  const [paiementsFiltres, setPaiementsFiltres] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState('');

  async function supprimerPaiement(id) {
    if (!window.confirm("Voulez-vous vraiment supprimer cet historique de paiement ?")) return;
    try {
      await api.delete(`/payments/${id}`);
      const updated = paiements.filter(p => p.id !== id);
      setPaiements(updated);
      setPaiementsFiltres(updated);
    } catch {
      alert("Impossible de supprimer ce paiement.");
    }
  }

  useEffect(() => {
    async function charger() {
      try {
        const reponse = await api.get('/payments/mes-paiements');
        setPaiements(reponse.data.paiements);
        setPaiementsFiltres(reponse.data.paiements);
      } catch {
        // silencieux
      } finally {
        setChargement(false);
      }
    }
    charger();
  }, []);

  // Fonction de recherche intelligente
  useEffect(() => {
    if (!recherche.trim()) {
      setPaiementsFiltres(paiements);
      return;
    }

    const terme = recherche.toLowerCase().trim();
    const aujourdHui = new Date();
    aujourdHui.setHours(0, 0, 0, 0);

    const hier = new Date(aujourdHui);
    hier.setDate(hier.getDate() - 1);

    const demain = new Date(aujourdHui);
    demain.setDate(demain.getDate() + 1);

    const filtres = paiements.filter((p) => {
      const dateSession = new Date(p.dateSession);
      dateSession.setHours(0, 0, 0, 0);

      // Recherche par mots-clés relatifs
      if (terme === 'aujourd\'hui' || terme === 'today') {
        return dateSession.getTime() === aujourdHui.getTime();
      }
      if (terme === 'hier' || terme === 'yesterday') {
        return dateSession.getTime() === hier.getTime();
      }
      if (terme === 'demain' || terme === 'tomorrow') {
        return dateSession.getTime() === demain.getTime();
      }

      // Recherche par mois
      if (terme === 'ce mois' || terme === 'this month') {
        return dateSession.getMonth() === aujourdHui.getMonth() && 
               dateSession.getFullYear() === aujourdHui.getFullYear();
      }
      if (terme === 'mois dernier' || terme === 'last month') {
        const moisDernier = new Date(aujourdHui);
        moisDernier.setMonth(moisDernier.getMonth() - 1);
        return dateSession.getMonth() === moisDernier.getMonth() && 
               dateSession.getFullYear() === moisDernier.getFullYear();
      }

      // Recherche par format de date (DD/MM/YYYY, DD-MM-YYYY, etc.)
      const regexDate = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/;
      const matchDate = terme.match(regexDate);
      if (matchDate) {
        const [, jour, mois, annee] = matchDate;
        const dateRecherchee = new Date(annee, mois - 1, jour);
        return dateSession.getTime() === dateRecherchee.getTime();
      }

      // Recherche par jour de la semaine
      const joursSemaine = {
        'lundi': 1, 'monday': 1,
        'mardi': 2, 'tuesday': 2,
        'mercredi': 3, 'wednesday': 3,
        'jeudi': 4, 'thursday': 4,
        'vendredi': 5, 'friday': 5,
        'samedi': 6, 'saturday': 6,
        'dimanche': 0, 'sunday': 0,
      };
      if (joursSemaine[terme] !== undefined) {
        return dateSession.getDay() === joursSemaine[terme];
      }

      // Recherche par référence de paiement
      if (p.codeReference.toLowerCase().includes(terme)) {
        return true;
      }

      // Recherche par montant
      if (terme.match(/^\d+$/)) {
        return p.montant === parseInt(terme);
      }

      return false;
    });

    setPaiementsFiltres(filtres);
  }, [recherche, paiements]);

  return (
    <div className="relative min-h-screen bg-ink text-ivory overflow-hidden">
      <AnimatedBackground />

      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-ink/70 border-b border-ivory/10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-ivory/70 hover:text-gold transition-colors">
            <ArrowLeft size={20} />
          </button>
          <span className="font-display text-xl">Mes paiements</span>
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
              placeholder="Rechercher par date, jour, référence..."
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
        ) : paiements.length === 0 ? (
          <p className="text-ivory/50">Aucun paiement pour le moment.</p>
        ) : paiementsFiltres.length === 0 ? (
          <p className="text-ivory/50">Aucun paiement ne correspond à votre recherche.</p>
        ) : (
          <div>
            {paiementsFiltres.map((p, index) => {
              const infoStatut = STATUT_PAIEMENT[p.statut] || STATUT_PAIEMENT.EN_ATTENTE;
              const StatutIcon = infoStatut.icon;

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                  className="flex items-center gap-4 py-4 border-b border-ivory/5"
                >
                  <span className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                    <Receipt className="text-gold" size={16} />
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium capitalize">
                      Séance du {formaterDate(p.dateSession)} à {formaterHeure(p.dateSession)}
                    </p>
                    <p className="text-ivory/40 text-sm font-mono">Réf. {p.codeReference}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-display text-gold">{p.montant.toLocaleString()} F</p>
                    <p className={`text-xs flex items-center gap-1 justify-end ${infoStatut.couleur}`}>
                      <StatutIcon size={12} /> {infoStatut.label}
                    </p>
                    <div className="flex items-center gap-2 justify-end mt-1">
                      {p.statut === 'PAYE' && (
                        <button
                          onClick={() => navigate(`/recu/${p.sessionId}`)}
                          className="text-xs text-gold hover:underline"
                        >
                          Voir le reçu
                        </button>
                      )}
                      <button
                        onClick={() => supprimerPaiement(p.id)}
                        className="text-ivory/20 hover:text-red-500 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default MesPaiements;
