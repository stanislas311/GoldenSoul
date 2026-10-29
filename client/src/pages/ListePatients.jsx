import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import AnimatedBackground from '../components/AnimatedBackground';

function initiales(nom) {
  return nom.split(' ').map((m) => m[0]).slice(0, 2).join('').toUpperCase();
}

function ListePatients() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState('');

  useEffect(() => {
    async function charger() {
      try {
        const reponse = await api.get('/patients');
        setPatients(reponse.data.patients);
      } catch {
        // silencieux
      } finally {
        setChargement(false);
      }
    }
    charger();
  }, []);

  const patientsFiltres = patients.filter((p) =>
    p.nom.toLowerCase().includes(recherche.toLowerCase()) ||
    p.email.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div className="relative min-h-screen bg-ink text-ivory overflow-hidden">
      <AnimatedBackground />

      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-ink/70 border-b border-ivory/10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-ivory/70 hover:text-gold transition-colors">
            <ArrowLeft size={20} />
          </button>
          <span className="font-display text-xl">{t('listePatients.mesPatients')}</span>
        </div>
      </header>

      <section className="pt-32 pb-24 px-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl">{t('listePatients.titre')}</h1>
          <span className="text-ivory/40 text-sm">{patients.length} {t('listePatients.total')}</span>
        </div>

        <input
          type="text"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder={t('listePatients.rechercher')}
          className="w-full bg-transparent border-b border-ivory/15 focus:border-gold py-3 text-ivory placeholder:text-ivory/30 focus:outline-none transition-colors mb-2"
        />

        {chargement ? (
          <p className="text-ivory/50 mt-8">{t('listePatients.chargement')}</p>
        ) : patientsFiltres.length === 0 ? (
          <p className="text-ivory/50 mt-8">{t('listePatients.aucunTrouve')}</p>
        ) : (
          <div>
            {patientsFiltres.map((patient, index) => (
              <motion.button
                key={patient.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                onClick={() => navigate(`/patients/${patient.id}`)}
                className="w-full flex items-center gap-4 py-4 border-b border-ivory/5 hover:bg-ivory/[0.02] transition-colors text-left group"
              >
                <span className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                  <span className="font-display text-sm text-gold">{initiales(patient.nom)}</span>
                </span>

                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{patient.nom}</p>
                  <p className="text-ivory/40 text-sm truncate">{patient.email}</p>
                </div>

                {patient.telephone && (
                  <span className="text-ivory/40 text-sm hidden sm:block shrink-0">
                    {patient.telephone}
                  </span>
                )}

                <ChevronRight
                  size={16}
                  className="text-ivory/20 group-hover:text-gold group-hover:translate-x-0.5 transition-all shrink-0"
                />
              </motion.button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default ListePatients;
