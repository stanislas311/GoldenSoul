import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Printer, CheckCircle2 } from 'lucide-react';
import api from '../utils/api';
import { formaterDate, formaterHeure } from '../utils/dates';

function Recu() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [recu, setRecu] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    async function charger() {
      try {
        const reponse = await api.get(`/payments/${sessionId}/recu`);
        setRecu(reponse.data.recu);
      } catch (err) {
        setErreur(err.response?.data?.message || "Impossible de charger le reçu.");
      } finally {
        setChargement(false);
      }
    }
    charger();
  }, [sessionId]);

  if (chargement) {
    return <div className="min-h-screen bg-ink flex items-center justify-center"><p className="text-ivory/50">Chargement...</p></div>;
  }

  if (erreur || !recu) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center text-center px-6">
        <div>
          <p className="text-red-400 mb-4">{erreur}</p>
          <button onClick={() => navigate(-1)} className="text-gold hover:underline text-sm">Retour</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-ink text-ivory">
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-ink/70 border-b border-ivory/10 print:hidden">
        <div className="max-w-md mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-ivory/70 hover:text-gold transition-colors">
            <ArrowLeft size={20} />
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 text-gold hover:underline text-sm"
          >
            <Printer size={16} /> Télécharger / Imprimer
          </button>
        </div>
      </header>

      <section className="pt-32 pb-24 px-6 max-w-md mx-auto print:pt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-jade/30 border border-ivory/10 rounded-2xl p-8 print:bg-white print:text-black print:border-black/20"
        >
          <div className="text-center mb-8">
            <p className="font-display text-2xl text-gold print:text-black">GoldenSoul</p>
            <p className="text-ivory/40 text-sm print:text-black/60 mt-1">Reçu de paiement</p>
          </div>

          <div className="flex items-center justify-center gap-2 mb-8 text-sage print:text-green-700">
            <CheckCircle2 size={18} />
            <span className="text-sm font-medium">Paiement confirmé</span>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between border-b border-ivory/10 print:border-black/10 pb-3">
              <span className="text-ivory/50 print:text-black/50">N° de reçu</span>
              <span className="font-mono">{recu.numeroRecu}</span>
            </div>
            <div className="flex justify-between border-b border-ivory/10 print:border-black/10 pb-3">
              <span className="text-ivory/50 print:text-black/50">Patient</span>
              <span>{recu.nomPatient}</span>
            </div>
            <div className="flex justify-between border-b border-ivory/10 print:border-black/10 pb-3">
              <span className="text-ivory/50 print:text-black/50">Praticien</span>
              <span>{recu.nomPraticien}</span>
            </div>
            <div className="flex justify-between border-b border-ivory/10 print:border-black/10 pb-3">
              <span className="text-ivory/50 print:text-black/50">Séance du</span>
              <span className="capitalize">{formaterDate(recu.dateSeance)} à {formaterHeure(recu.dateSeance)}</span>
            </div>
            <div className="flex justify-between border-b border-ivory/10 print:border-black/10 pb-3">
              <span className="text-ivory/50 print:text-black/50">Référence transaction</span>
              <span className="font-mono">{recu.codeReference}</span>
            </div>
            {recu.optionSecurite && (
              <div className="flex justify-between border-b border-ivory/10 print:border-black/10 pb-3">
                <span className="text-ivory/50 print:text-black/50">Option de sécurité</span>
                <span>Incluse</span>
              </div>
            )}
            <div className="flex justify-between pt-2">
              <span className="text-ivory/50 print:text-black/50 font-medium">Montant total</span>
              <span className="font-display text-xl text-gold print:text-black">{recu.montant.toLocaleString()} F</span>
            </div>
          </div>

          <p className="text-center text-ivory/30 print:text-black/40 text-xs mt-10">
            Document généré automatiquement — GoldenSoul
          </p>
        </motion.div>
      </section>
    </div>
  );
}

export default Recu;
