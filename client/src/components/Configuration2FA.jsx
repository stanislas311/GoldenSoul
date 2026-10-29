import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShieldOff, Loader2 } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

function Configuration2FA() {
  const { user } = useAuth();
  const [etape, setEtape] = useState('chargement'); // chargement | repos | qrcode | active | desactivation
  const [qrCode, setQrCode] = useState('');
  const [code, setCode] = useState('');
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    // On se base sur l'état réel du compte, pas sur une supposition
    setEtape(user?.twoFactorActif ? 'active' : 'repos');
  }, [user]);

  async function handleDemarrer() {
    setChargement(true);
    setErreur('');
    try {
      const reponse = await api.post('/2fa/generer');
      setQrCode(reponse.data.qrCode);
      setEtape('qrcode');
    } catch (err) {
      setErreur(err.response?.data?.message || "Impossible de générer le code.");
    } finally {
      setChargement(false);
    }
  }

  async function handleActiver() {
    setChargement(true);
    setErreur('');
    try {
      await api.post('/2fa/activer', { code });
      setCode('');
      setEtape('active');
    } catch (err) {
      setErreur(err.response?.data?.message || "Code incorrect.");
    } finally {
      setChargement(false);
    }
  }

  async function handleDesactiver() {
    setChargement(true);
    setErreur('');
    try {
      await api.post('/2fa/desactiver', { code });
      setCode('');
      setEtape('repos');
    } catch (err) {
      setErreur(err.response?.data?.message || "Code incorrect.");
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="bg-jade/50 border border-ivory/10 rounded-2xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="text-gold" size={22} />
        <h2 className="font-display text-2xl">Authentification à deux facteurs</h2>
      </div>

      <AnimatePresence mode="wait">
        {etape === 'chargement' && (
          <p className="text-ivory/40 text-sm">Chargement...</p>
        )}

        {etape === 'repos' && (
          <motion.div key="repos" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-ivory/60 text-sm mb-6">
              Protégez votre compte avec une couche de sécurité supplémentaire, via une application
              comme Google Authenticator ou Authy.
            </p>
            <button
              onClick={handleDemarrer}
              disabled={chargement}
              className="bg-gold text-ink rounded-xl px-6 py-3 font-semibold hover:bg-gold/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {chargement && <Loader2 className="animate-spin" size={16} />}
              Activer le 2FA
            </button>
            {erreur && <p className="text-sm text-red-400 mt-4">{erreur}</p>}
          </motion.div>
        )}

        {etape === 'qrcode' && (
          <motion.div key="qrcode" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-ivory/60 text-sm mb-4">
              Scannez ce QR code avec votre application d'authentification, puis saisissez le code à 6 chiffres généré.
            </p>
            <img src={qrCode} alt="QR code 2FA" className="rounded-xl mb-6 w-48 h-48" />

            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Code à 6 chiffres"
              maxLength={6}
              className="w-full max-w-xs bg-ink/50 border border-ivory/10 rounded-xl py-3 px-4 text-ivory placeholder:text-ivory/30 focus:outline-none focus:border-gold transition-colors mb-4"
            />

            {erreur && <p className="text-sm text-red-400 mb-4">{erreur}</p>}

            <button
              onClick={handleActiver}
              disabled={chargement || code.length !== 6}
              className="bg-gold text-ink rounded-xl px-6 py-3 font-semibold hover:bg-gold/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {chargement && <Loader2 className="animate-spin" size={16} />}
              Confirmer
            </button>
          </motion.div>
        )}

        {etape === 'active' && (
          <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-sage flex items-center gap-2 mb-6">
              <ShieldCheck size={16} /> L'authentification à deux facteurs est activée sur votre compte.
            </p>

            <button
              onClick={() => setEtape('desactivation')}
              className="text-sm text-red-400/70 hover:text-red-400 flex items-center gap-2"
            >
              <ShieldOff size={14} /> Désactiver le 2FA
            </button>
          </motion.div>
        )}

        {etape === 'desactivation' && (
          <motion.div key="desactivation" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-ivory/60 text-sm mb-4">
              Saisissez votre code actuel pour confirmer la désactivation.
            </p>

            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Code à 6 chiffres"
              maxLength={6}
              autoFocus
              className="w-full max-w-xs bg-ink/50 border border-ivory/10 rounded-xl py-3 px-4 text-ivory placeholder:text-ivory/30 focus:outline-none focus:border-gold transition-colors mb-4"
            />

            {erreur && <p className="text-sm text-red-400 mb-4">{erreur}</p>}

            <div className="flex gap-3">
              <button
                onClick={handleDesactiver}
                disabled={chargement || code.length !== 6}
                className="bg-red-400/10 text-red-400 border border-red-400/30 rounded-xl px-6 py-3 font-medium hover:bg-red-400/20 transition-colors disabled:opacity-50"
              >
                Confirmer la désactivation
              </button>
              <button
                onClick={() => { setEtape('active'); setErreur(''); setCode(''); }}
                className="text-ivory/40 hover:text-ivory/70 text-sm"
              >
                Annuler
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Configuration2FA;
