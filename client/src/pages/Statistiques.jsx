import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import api from '../utils/api';
import AnimatedBackground from '../components/AnimatedBackground';

const STATUT_LABELS = {
  EN_ATTENTE_PAIEMENT: 'En attente de paiement',
  EN_ATTENTE_CONFIRMATION: 'En attente de confirmation',
  CONFIRMEE: 'Confirmées',
  TERMINEE: 'Terminées',
  ANNULEE: 'Annulées',
  ABSENCE: 'Absences',
};

const COULEURS = ['var(--color-gold)', 'var(--color-sage)', 'var(--color-burnt)', '#5A7D78', '#B08D57', '#C0392B'];

function formaterJour(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-jade border border-ivory/10 rounded-lg px-4 py-2 text-sm">
      <p className="text-gold font-medium">{payload[0].value.toLocaleString()} F</p>
    </div>
  );
}

function Statistiques() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    async function charger() {
      try {
        const reponse = await api.get('/stats');
        setStats(reponse.data);
      } catch {
        // silencieux
      } finally {
        setChargement(false);
      }
    }
    charger();
  }, []);

  if (chargement) {
    return <div className="min-h-screen bg-ink flex items-center justify-center"><p className="text-ivory/50">{t('statistiques.chargement')}</p></div>;
  }
  if (!stats) {
    return <div className="min-h-screen bg-ink flex items-center justify-center"><p className="text-ivory/50">{t('statistiques.aucuneDonnee')}</p></div>;
  }

  const donneesRevenu = stats.revenuParJour.map((r) => ({ jour: formaterJour(r.date), montant: r.montant }));
  const donneesStatuts = stats.sessionsParStatut.map((s) => ({
    name: t(`statistiques.statut.${s.statut}`) || s.statut,
    value: s.total,
  }));
  const totalSessions = donneesStatuts.reduce((t, s) => t + s.value, 0);

  return (
    <div className="relative min-h-screen bg-ink text-ivory overflow-hidden">
      <AnimatedBackground />

      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-ink/70 border-b border-ivory/10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-ivory/70 hover:text-gold transition-colors">
            <ArrowLeft size={20} />
          </button>
          <span className="font-display text-xl">{t('statistiques.titre')}</span>
        </div>
      </header>

      <section className="pt-32 pb-24 px-6 max-w-5xl mx-auto">
        {/* Chiffres clés — en ligne, pas en cartes */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap gap-x-12 gap-y-6 mb-16 pb-8 border-b border-ivory/10"
        >
          <div>
            <p className="text-ivory/40 text-sm mb-1">{t('statistiques.revenuTotal')}</p>
            <p className="font-display text-4xl text-gold">{stats.revenuTotal.toLocaleString()} F</p>
          </div>
          <div>
            <p className="text-ivory/40 text-sm mb-1">{t('statistiques.patients')}</p>
            <p className="font-display text-4xl">{stats.totalPatients}</p>
          </div>
          <div>
            <p className="text-ivory/40 text-sm mb-1">{t('statistiques.seancesAVenir')}</p>
            <p className="font-display text-4xl">{stats.prochainesSessions}</p>
          </div>
          <div>
            <p className="text-ivory/40 text-sm mb-1">{t('statistiques.seancesTotal')}</p>
            <p className="font-display text-4xl">{totalSessions}</p>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-[1.4fr_1fr] gap-16">
          {/* Graphique revenu */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h2 className="font-display text-xl mb-6">{t('statistiques.revenu7Jours')}</h2>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={donneesRevenu}>
                <defs>
                  <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-gold)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-gold)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="jour"
                  stroke="var(--color-ivory)"
                  strokeOpacity={0.3}
                  tick={{ fill: 'var(--color-ivory)', fontSize: 12, fillOpacity: 0.6 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="montant"
                  stroke="var(--color-gold)"
                  strokeWidth={2}
                  fill="url(#goldGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Répartition des statuts */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="font-display text-xl mb-6">{t('statistiques.repartitionSeances')}</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={donneesStatuts}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {donneesStatuts.map((_, index) => (
                    <Cell key={index} fill={COULEURS[index % COULEURS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-2 mt-4">
              {donneesStatuts.map((s, index) => (
                <div key={s.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-ivory/60">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: COULEURS[index % COULEURS.length] }}
                    />
                    {s.name}
                  </span>
                  <span className="text-ivory/40">{s.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default Statistiques;
