import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Check, Upload, Loader2 } from 'lucide-react';
import api from '../utils/api';
import AnimatedBackground from '../components/AnimatedBackground';

function Paiement() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [infosPraticien, setInfosPraticien] = useState(null);
  const [codeReference, setCodeReference] = useState('');
  const [montant, setMontant] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [copie, setCopie] = useState(false);

  const [fichier, setFichier] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    async function charger() {
      try {
        const [reponseInfos, reponseSession] = await Promise.all([
          api.get('/payments/infos-praticien'),
          api.get('/sessions/mes-sessions'),
        ]);

        setInfosPraticien(reponseInfos.data);

        const session = reponseSession.data.sessions.find((s) => s.id === sessionId);
        if (session?.paiement) {
          setCodeReference(session.paiement.codeReference);
          setMontant(session.paiement.montant);
        }
      } catch {
        setErreur("Impossible de charger les informations de paiement.");
      } finally {
        setChargement(false);
      }
    }
    charger();
  }, [sessionId]);

  function copierCode() {
    navigator.clipboard.writeText(codeReference);
    setCopie(true);
    setTimeout(() => setCopie(false), 2000);
  }

  function handleSelectionFichier(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFichier(f);
    setPreviewUrl(URL.createObjectURL(f));
  }

  async function handleEnvoyer() {
    if (!fichier) {
      setErreur("Ajoutez une preuve de paiement (capture d'écran).");
      return;
    }

    setEnvoi(true);
    setErreur('');

    try {
      const formData = new FormData();
      formData.append('fichier', fichier);

      const reponseUpload = await api.post('/upload/fichier', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await api.post(`/payments/${sessionId}/declarer`, {
        preuveUrl: reponseUpload.data.url,
      });

      navigate(`/confirmation-attente/${sessionId}`);
    } catch (err) {
      setErreur(err.response?.data?.message || "Une erreur est survenue.");
    } finally {
      setEnvoi(false);
    }
  }

  if (chargement) {
    return <div className="min-h-screen bg-ink flex items-center justify-center"><p className="text-ivory/50">Chargement...</p></div>;
  }

  return (
    <div className="relative min-h-screen bg-ink text-ivory overflow-hidden">
      <AnimatedBackground />

      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-ink/70 border-b border-ivory/10">
        <div className="max-w-md mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-ivory/70 hover:text-gold transition-colors">
            <ArrowLeft size={20} />
          </button>
          <span className="font-display text-xl">Paiement</span>
        </div>
      </header>

      <section className="pt-32 pb-24 px-6 max-w-md mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="font-display text-2xl mb-2">Effectuez votre paiement</h1>
          <p className="text-ivory/60 text-sm mb-8">
            Envoyez le montant exact via Mobile Money, puis revenez ici confirmer.
          </p>

          <div className="bg-jade/50 border border-ivory/10 rounded-2xl p-6 mb-6 space-y-4">
            <div>
              <p className="text-xs text-ivory/40 uppercase tracking-wide mb-1">Montant</p>
              <p className="font-display text-3xl text-gold">{montant?.toLocaleString()} F</p>
            </div>

            <div>
              <p className="text-xs text-ivory/40 uppercase tracking-wide mb-1">Numéro à créditer</p>
              <p className="text-lg font-medium">{infosPraticien?.numeroPaiement || "Non renseigné"}</p>
            </div>

            <div>
              <p className="text-xs text-ivory/40 uppercase tracking-wide mb-1">
                Code de référence — à indiquer dans le motif du transfert
              </p>
              <div className="flex items-center gap-3">
                <p className="text-lg font-mono font-bold text-gold">{codeReference}</p>
                <button onClick={copierCode} className="text-ivory/50 hover:text-gold transition-colors">
                  {copie ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm text-ivory/70 mb-2">
              Preuve de paiement (capture d'écran)
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={handleSelectionFichier}
              id="preuve-input"
              className="hidden"
            />

            {previewUrl ? (
              <label htmlFor="preuve-input" className="block cursor-pointer">
                <img src={previewUrl} alt="Aperçu preuve" className="rounded-xl w-full max-h-64 object-contain bg-ink/50 border border-ivory/10" />
              </label>
            ) : (
              <label
                htmlFor="preuve-input"
                className="flex flex-col items-center justify-center gap-2 border border-dashed border-ivory/20 rounded-xl py-10 cursor-pointer hover:border-gold/40 transition-colors"
              >
                <Upload className="text-ivory/40" size={24} />
                <span className="text-sm text-ivory/40">Ajouter une capture d'écran</span>
              </label>
            )}
          </div>

          {erreur && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3 mb-6">
              {erreur}
            </p>
          )}

          <button
            onClick={handleEnvoyer}
            disabled={envoi || !fichier}
            className="w-full bg-gold text-ink rounded-xl py-4 font-semibold hover:bg-gold/90 transition-colors disabled:opacity-40"
          >
            {envoi ? "Envoi..." : "J'ai effectué le paiement"}
          </button>
        </motion.div>
      </section>
    </div>
  );
}

export default Paiement;
