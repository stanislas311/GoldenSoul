import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Lock, Globe, CheckCircle2, Camera, LogOut, Moon, Sun, Monitor } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AnimatedBackground from '../components/AnimatedBackground';
import Configuration2FA from '../components/Configuration2FA';

function Parametres() {
  const { t } = useTranslation();
  const { i18n } = useTranslation();
  const { user, login, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const [nom, setNom] = useState(user?.nom || '');
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl || null);
  const [langue, setLangue] = useState(user?.languePreferee || 'FR');
  const [numeroPaiement, setNumeroPaiement] = useState(user?.numeroPaiement || '');
  const [messageProfil, setMessageProfil] = useState('');
  const [chargementProfil, setChargementProfil] = useState(false);
  const fileInputRef = useRef(null);

  const [ancienMotDePasse, setAncienMotDePasse] = useState('');
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [messageMotDePasse, setMessageMotDePasse] = useState('');
  const [erreurMotDePasse, setErreurMotDePasse] = useState('');
  const [chargementMotDePasse, setChargementMotDePasse] = useState(false);

  async function handleProfilSubmit(e) {
    e.preventDefault();
    setChargementProfil(true);
    setMessageProfil('');

    try {
      const reponse = await api.put('/auth/profil', { nom, languePreferee: langue, numeroPaiement, photoUrl });
      login(localStorage.getItem('token'), reponse.data.user);
      i18n.changeLanguage(langue.toLowerCase());
      setMessageProfil(t('parametres.profilMisAJour'));
    } catch (err) {
      setMessageProfil(err.response?.data?.message || t('commun.erreurGenerique'));
    } finally {
      setChargementProfil(false);
    }
  }

  async function handleMotDePasseSubmit(e) {
    e.preventDefault();
    setErreurMotDePasse('');
    setMessageMotDePasse('');
    setChargementMotDePasse(true);

    try {
      await api.put('/auth/changer-mot-de-passe', { ancienMotDePasse, nouveauMotDePasse });
      setMessageMotDePasse(t('parametres.motDePasseMisAJour'));
      setAncienMotDePasse('');
      setNouveauMotDePasse('');
    } catch (err) {
      setErreurMotDePasse(err.response?.data?.message || t('commun.erreurGenerique'));
    } finally {
      setChargementMotDePasse(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-ink text-ivory overflow-hidden">
      <AnimatedBackground />

      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-ink/70 border-b border-ivory/10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-ivory/70 hover:text-gold transition-colors">
            <ArrowLeft size={20} />
          </button>
          <span className="font-display text-xl">{t('parametres.titre')}</span>
        </div>
      </header>

      <section className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Bloc Profil */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-jade/30 border border-ivory/5 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-5">
              <User className="text-gold" size={20} />
              <h2 className="font-display text-xl">{t('parametres.profil')}</h2>
            </div>

            <div className="space-y-5">
              <div className="flex flex-col items-center mb-6">
                <div 
                  className="relative w-24 h-24 rounded-full overflow-hidden bg-ivory/10 cursor-pointer group flex items-center justify-center"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {photoUrl ? (
                    <img src={`http://localhost:5000${photoUrl}`} alt="Avatar" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
                  ) : (
                    <span className="text-3xl font-display text-gold group-hover:opacity-50 transition-opacity">
                      {nom ? nom.charAt(0).toUpperCase() : '?'}
                    </span>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <Camera className="text-white drop-shadow-md" size={24} />
                  </div>
                </div>
                <p className="text-xs text-ivory/50 mt-2">Cliquez pour modifier (Max 10Mo)</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  hidden 
                  accept="image/jpeg, image/png, image/webp"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append('fichier', file);
                    try {
                      const res = await api.post('/upload/fichier', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                      });
                      setPhotoUrl(res.data.url);
                    } catch (err) {
                      console.error("Erreur d'upload", err);
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-xs text-ivory/50 mb-1.5 uppercase tracking-wider">{t('parametres.nom')}</label>
                <input
                  type="text" value={nom} onChange={(e) => setNom(e.target.value)}
                  className="w-full bg-transparent border-b border-ivory/10 focus:border-gold py-2 text-ivory placeholder:text-ivory/30 focus:outline-none transition-colors"
                />
              </div>

              {user?.role === 'PRATICIEN' && (
                <div>
                  <label className="block text-sm text-ivory/70 mb-2">Numéro Mobile Money (pour recevoir les paiements)</label>
                  <input
                    type="tel"
                    id="numeroPaiement"
                    name="numeroPaiement"
                    autoComplete="off"
                    value={numeroPaiement}
                    onChange={(e) => setNumeroPaiement(e.target.value)}
                    placeholder="Ex: 07 07 07 07 07"
                    className="w-full bg-ink/50 border border-ivory/10 rounded-xl py-3 px-4 focus:outline-none focus:border-gold transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-ivory/50 mb-1.5 uppercase tracking-wider flex items-center gap-2">
                  <Globe size={12} /> {t('parametres.langue')}
                </label>
                <select
                  value={langue} onChange={(e) => setLangue(e.target.value)}
                  className="w-full bg-transparent border-b border-ivory/10 py-2 text-ivory focus:outline-none focus:border-gold transition-colors"
                >
                  <option value="FR">Français</option>
                  <option value="EN">English</option>
                </select>
              </div>

              {messageProfil && (
                <p className="text-sm text-sage flex items-center gap-2">
                  <CheckCircle2 size={14} /> {messageProfil}
                </p>
              )}

              <button
                onClick={handleProfilSubmit}
                disabled={chargementProfil}
                className="w-full bg-gold/10 text-gold border border-gold/20 rounded-lg py-2.5 text-sm font-medium hover:bg-gold/20 transition-colors disabled:opacity-40"
              >
                {chargementProfil ? "..." : t('parametres.mettreAJour')}
              </button>
            </div>
          </motion.div>

          {/* Bloc Mot de passe */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-jade/30 border border-ivory/5 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-5">
              <Lock className="text-gold" size={20} />
              <h2 className="font-display text-xl">{t('parametres.securite')}</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs text-ivory/50 mb-1.5 uppercase tracking-wider">{t('parametres.motDePasseActuel')}</label>
                <input
                  type="password" value={ancienMotDePasse} onChange={(e) => setAncienMotDePasse(e.target.value)}
                  className="w-full bg-transparent border-b border-ivory/10 focus:border-gold py-2 text-ivory placeholder:text-ivory/30 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs text-ivory/50 mb-1.5 uppercase tracking-wider">{t('parametres.nouveauMotDePasse')}</label>
                <input
                  type="password" value={nouveauMotDePasse} onChange={(e) => setNouveauMotDePasse(e.target.value)} minLength={8}
                  className="w-full bg-transparent border-b border-ivory/10 focus:border-gold py-2 text-ivory placeholder:text-ivory/30 focus:outline-none transition-colors"
                />
              </div>

              {erreurMotDePasse && (
                <p className="text-xs text-red-400 bg-red-400/5 border border-red-400/10 rounded-lg px-3 py-2">
                  {erreurMotDePasse}
                </p>
              )}
              {messageMotDePasse && (
                <p className="text-sm text-sage flex items-center gap-2">
                  <CheckCircle2 size={14} /> {messageMotDePasse}
                </p>
              )}

              <button
                onClick={handleMotDePasseSubmit}
                disabled={chargementMotDePasse}
                className="w-full bg-gold/10 text-gold border border-gold/20 rounded-lg py-2.5 text-sm font-medium hover:bg-gold/20 transition-colors disabled:opacity-40"
              >
                {chargementMotDePasse ? "..." : t('parametres.changer')}
              </button>
            </div>
          </motion.div>
        </div>

        {/* Bloc Apparence */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-6 bg-jade/30 border border-ivory/5 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <Monitor className="text-gold" size={20} />
            <h2 className="font-display text-xl">Apparence</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ivory/80">Thème de l'application</p>
              <p className="text-xs text-ivory/50 mt-1">Choisissez entre le thème sombre ou clair (beige).</p>
            </div>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-2 bg-ink/50 border border-ivory/10 rounded-xl text-sm font-medium hover:bg-gold/10 hover:border-gold/30 hover:text-gold transition-colors"
            >
              {theme === 'dark' ? (
                <>
                  <Sun size={16} /> Mode Clair
                </>
              ) : (
                <>
                  <Moon size={16} /> Mode Sombre
                </>
              )}
            </button>
          </div>
        </motion.div>

        {user?.role === 'PRATICIEN' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6"
          >
            <Configuration2FA />
          </motion.div>
        )}

        {/* Bloc Déconnexion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6"
        >
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 bg-red-400/10 text-red-400 border border-red-400/20 rounded-2xl py-4 font-medium hover:bg-red-400/20 transition-colors"
          >
            <LogOut size={20} />
            {t('commun.deconnexion')}
          </button>
        </motion.div>
      </section>
    </div>
  );
}

export default Parametres;
