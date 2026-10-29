import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Paperclip, MoreVertical, Edit2, Trash2, Check, CheckCheck, Search, Smile, X, FileText, Reply, Heart } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import AnimatedBackground from '../components/AnimatedBackground';
import { io } from 'socket.io-client';

function formaterHeureMessage(dateString) {
  return new Date(dateString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function Messagerie() {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [praticien, setPraticien] = useState(null);
  const [texte, setTexte] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [messageEnEdition, setMessageEnEdition] = useState(null);
  const [texteEdition, setTexteEdition] = useState('');
  const [reponseA, setReponseA] = useState(null);
  const [menuContextuel, setMenuContextuel] = useState(null); // { messageId, x, y }
  const [typing, setTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [enLigne, setEnLigne] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const [likedMessages, setLikedMessages] = useState(new Set());

  // Aperçu avant envoi de fichier/image
  const [fichierPreview, setFichierPreview] = useState(null); // { file, previewUrl, type }
  const [legende, setLegende] = useState('');
  const [envoiFichier, setEnvoiFichier] = useState(false);

  const finRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);
  const dernierMessageIdRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const lastTapRef = useRef(null);

  async function charger() {
    try {
      const reponse = await api.get('/messages/ma-conversation');
      setMessages(reponse.data.messages);
      if (reponse.data.praticien) {
        setPraticien(reponse.data.praticien);
      }
    } catch {
      // silencieux
    }
  }

  useEffect(() => {
    if (!user) return;

    charger();
    const intervalle = setInterval(charger, 2000);

    const token = localStorage.getItem('token');
    const socket = io('http://localhost:5000', { auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connecté');
    });

    socket.on('typing', ({ userId, nom }) => {
      if (userId !== user.id) {
        setTyping(true);
        setTypingUser(nom);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setTyping(false);
          setTypingUser(null);
        }, 3000);
      }
    });

    socket.on('stop-typing', ({ userId }) => {
      if (userId !== user.id) {
        setTyping(false);
        setTypingUser(null);
      }
    });

    socket.on('utilisateur-en-ligne', ({ userId }) => {
      if (userId !== user.id) setEnLigne(true);
    });

    socket.on('utilisateur-hors-ligne', ({ userId }) => {
      if (userId !== user.id) setEnLigne(false);
    });

    socket.on('message-recu-ack', ({ messageId }) => {
      setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, recu: true } : msg));
    });

    socket.on('message-lu-ack', ({ messageId }) => {
      setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, lu: true } : msg));
    });

    return () => {
      clearInterval(intervalle);
      socket.disconnect();
      clearTimeout(typingTimeoutRef.current);
    };
  }, [conversationId, user]);

  useEffect(() => {
    if (messages.length === 0) return;
    const dernierMessage = messages[messages.length - 1];
    
    if (dernierMessage.id !== dernierMessageIdRef.current) {
      dernierMessageIdRef.current = dernierMessage.id;
      finRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (texte.length > 0) {
      socketRef.current?.emit('typing', { conversationId });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('stop-typing', { conversationId });
      }, 1000);
    } else {
      socketRef.current?.emit('stop-typing', { conversationId });
    }
  }, [texte, conversationId]);

  useEffect(() => {
    if (!user) return;

    messages.forEach(msg => {
      if (msg.expediteurId !== user.id && !msg.recu && socketRef.current) {
        socketRef.current.emit('message-recu', { messageId: msg.id });
      }
    });
  }, [messages, user]);

  async function handleEnvoyer(e) {
    e.preventDefault();
    if (!texte.trim()) return;

    setEnvoi(true);
    try {
      const reponse = await api.post('/messages/ma-conversation', {
        contenu: texte,
        type: 'TEXTE',
        messageIdReponse: reponseA
      });
      setTexte('');
      setReponseA(null);
      setMessages(prev => [...prev, reponse.data.message]);
    } catch {
      // silencieux
    } finally {
      setEnvoi(false);
    }
  }

  // Sélection d'un fichier : on ouvre l'aperçu, on n'envoie RIEN encore
  function handleSelectionFichier(e) {
    const fichier = e.target.files[0];
    if (!fichier) return;

    const type = fichier.type.startsWith('image/') ? 'IMAGE' : 'FICHIER';
    const previewUrl = type === 'IMAGE' ? URL.createObjectURL(fichier) : null;

    setFichierPreview({ file: fichier, previewUrl, type });
    e.target.value = ''; // permet de re-sélectionner le même fichier plus tard
  }

  function annulerEnvoiFichier() {
    if (fichierPreview?.previewUrl) URL.revokeObjectURL(fichierPreview.previewUrl);
    setFichierPreview(null);
    setLegende('');
  }

  // Envoi réel, déclenché uniquement depuis la modale d'aperçu
  async function handleConfirmerEnvoiFichier() {
    if (!fichierPreview) return;
    setEnvoiFichier(true);

    const formData = new FormData();
    formData.append('fichier', fichierPreview.file);

    try {
      const reponse = await api.post('/upload/fichier', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      await api.post('/messages/ma-conversation', {
        contenu: legende.trim() || null,
        type: fichierPreview.type,
        fichierUrl: reponse.data.url,
        fichierNom: reponse.data.nom,
        fichierTaille: reponse.data.taille,
        messageIdReponse: reponseA
      });

      setReponseA(null);
      if (fichierPreview.previewUrl) URL.revokeObjectURL(fichierPreview.previewUrl);
      setFichierPreview(null);
      setLegende('');
      charger();
    } catch {
      // silencieux
    } finally {
      setEnvoiFichier(false);
    }
  }

  async function handleModifierMessage(messageId) {
    if (!texteEdition.trim()) return;
    try {
      const reponse = await api.put(`/messages/${messageId}`, { contenu: texteEdition });
      setMessageEnEdition(null);
      setTexteEdition('');
      setMessages(prev => prev.map(msg => msg.id === messageId ? reponse.data.message : msg));
    } catch {
      // silencieux
    }
  }

  async function handleSupprimerMessage(messageId) {
    try {
      await api.delete(`/messages/${messageId}`);
      fermerMenuContextuel();
      setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, supprime: true, contenu: null, fichierUrl: null } : msg));
    } catch {
      // silencieux
    }
  }

  function handleReponse(message) {
    setReponseA(message.id);
    inputRef.current?.focus();
  }

  function annulerReponse() {
    setReponseA(null);
  }

  function ouvrirMenuContextuel(e, messageId) {
    e.preventDefault();
    const x = e.type === 'contextmenu' ? e.clientX : e.touches?.[0]?.clientX || 0;
    const y = e.type === 'contextmenu' ? e.clientY : e.touches?.[0]?.clientY || 0;
    setMenuContextuel({ messageId, x, y });
  }

  function handleTouchStart(e, messageId) {
    longPressTimerRef.current = setTimeout(() => {
      ouvrirMenuContextuel(e, messageId);
    }, 500);
  }

  function handleTouchEnd() {
    clearTimeout(longPressTimerRef.current);
  }

  function fermerMenuContextuel() {
    setMenuContextuel(null);
  }

  function handleDoubleTap(messageId) {
    const now = Date.now();
    if (lastTapRef.current && now - lastTapRef.current < 300) {
      setLikedMessages(prev => new Set([...prev, messageId]));
      setTimeout(() => {
        setLikedMessages(prev => {
          const newSet = new Set(prev);
          newSet.delete(messageId);
          return newSet;
        });
      }, 2000);
    }
    lastTapRef.current = now;
  }

  async function handleCopier(msg) {
    const texteACopier = msg.contenu || msg.fichierNom || '';
    try {
      await navigator.clipboard.writeText(texteACopier);
    } catch {
      // silencieux
    }
    fermerMenuContextuel();
  }

  return (
    <div className="relative min-h-screen bg-ink text-ivory overflow-hidden flex flex-col">
      <AnimatedBackground />

      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-ink/60 border-b border-ivory/10 shadow-lg shadow-ink/20">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-ivory/70 hover:text-gold transition-colors">
            <ArrowLeft size={20} />
          </button>
          
          <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center overflow-hidden shrink-0">
            {praticien?.photoUrl ? (
              <img src={`http://localhost:5000${praticien.photoUrl}`} alt={praticien.nom || 'Praticien'} className="w-full h-full object-cover" />
            ) : (
              <span className="font-display text-sm text-gold">
                {praticien?.nom ? praticien.nom.charAt(0).toUpperCase() : 'P'}
              </span>
            )}
          </div>

          <div className="flex-1">
            <span className="font-display text-xl">{praticien?.nom || 'Votre praticien'}</span>
            <p className="text-xs text-ivory/40">{enLigne ? 'En ligne' : 'Hors ligne'}</p>
          </div>
        </div>
      </header>

      <section className="flex-1 pt-32 pb-48 md:pb-32 px-6 max-w-2xl mx-auto w-full flex flex-col">
        <div className="flex-1 space-y-3">
          {typing && (
            <div className="text-xs text-ivory/40 italic flex items-center gap-2">
              {typingUser} est en train d'écrire
              <div className="flex gap-1">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  className="w-1.5 h-1.5 bg-gold rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                  className="w-1.5 h-1.5 bg-gold rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                  className="w-1.5 h-1.5 bg-gold rounded-full"
                />
              </div>
            </div>
          )}
          {messages.length === 0 ? (
            <p className="text-ivory/40 text-sm text-center mt-12">
              Aucun message pour le moment. Envoyez votre premier message à votre praticien.
            </p>
          ) : (
            messages.map((msg) => {
              const estMoi = msg.expediteurId === user.id;
              const messageReponse = messages.find(m => m.id === msg.messageIdReponse);

              if (msg.supprime) return null;

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 80 }}
                  dragElastic={0.2}
                  onDrag={(e, info) => {
                    setDragProgress(Math.min(info.offset.x / 50, 1));
                  }}
                  onDragEnd={(e, info) => {
                    setDragProgress(0);
                    if (info.offset.x > 50) handleReponse(msg);
                  }}
                  onDoubleClick={() => handleDoubleTap(msg.id)}
                  className={`flex ${estMoi ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="relative flex flex-col max-w-[75%]">
                    <div
                      style={{ opacity: dragProgress }}
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-8 text-gold transition-opacity duration-300"
                    >
                      <Reply size={20} />
                    </div>
                    {likedMessages.has(msg.id) && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute -right-8 top-1/2 -translate-y-1/2 text-red-500"
                      >
                        <Heart size={20} fill="currentColor" />
                      </motion.div>
                    )}
                    {messageReponse && (
                      <div className={`text-[10px] px-2 py-1 mb-1 rounded ${estMoi ? 'text-ink/50' : 'text-ivory/40'}`}>
                        Réponse à: {messageReponse.contenu || messageReponse.fichierNom}
                      </div>
                    )}
                    <div 
                      className={`rounded-2xl relative overflow-hidden transition-all duration-300 ${
                        msg.type === 'IMAGE' 
                          ? '' 
                          : `px-4 py-2.5 ${estMoi ? 'bg-gold text-ink shadow-lg shadow-gold/20' : 'bg-jade/60 text-ivory shadow-lg shadow-jade/20'}` 
                      }`}
                      onContextMenu={(e) => ouvrirMenuContextuel(e, msg.id)}
                      onTouchStart={(e) => handleTouchStart(e, msg.id)}
                      onTouchEnd={handleTouchEnd}
                      onTouchMove={handleTouchEnd}
                    >
                      {messageEnEdition === msg.id ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={texteEdition}
                            onChange={(e) => setTexteEdition(e.target.value)}
                            className="flex-1 bg-ink/20 rounded px-2 py-1 text-sm focus:outline-none"
                          />
                          <button onClick={() => handleModifierMessage(msg.id)} className="text-xs bg-gold px-2 py-1 rounded">
                            Sauver
                          </button>
                          <button
                            onClick={() => { setMessageEnEdition(null); setTexteEdition(''); }}
                            className="text-xs px-2 py-1"
                          >
                            Annuler
                          </button>
                        </div>
                      ) : (
                        <>
                          {msg.type === 'TEXTE' && <p className="text-sm">{msg.contenu}</p>}
                          {msg.type === 'IMAGE' && (
                            <div>
                              <img
                                src={`http://localhost:5000${msg.fichierUrl}`}
                                alt="Image"
                                className="rounded-lg max-w-full"
                              />
                              {msg.contenu && (
                                <p className={`text-sm px-3 py-2 mt-2 ${estMoi ? 'bg-gold text-ink' : 'bg-jade/60 text-ivory'}`}>
                                  {msg.contenu}
                                </p>
                              )}
                            </div>
                          )}
                          {msg.type === 'FICHIER' && (
                            <a
                              href={`http://localhost:5000${msg.fichierUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm flex items-center gap-2 hover:underline"
                            >
                              <Paperclip size={14} />
                              {msg.fichierNom}
                            </a>
                          )}
                          <div className="flex items-center justify-between mt-1">
                            <p className={`text-[10px] ${estMoi ? 'text-ink/50' : 'text-ivory/40'}`}>
                              {formaterHeureMessage(msg.createdAt)}
                              {msg.modifie && ' (modifié)'}
                            </p>
                            {estMoi && (
                              <div className="flex items-center gap-1">
                                {msg.lu ? (
                                  <CheckCheck size={12} className="text-blue-400" />
                                ) : msg.recu ? (
                                  <CheckCheck size={12} className="text-ink/50" />
                                ) : (
                                  <Check size={12} className="text-ink/50" />
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={finRef} />
        </div>
      </section>

      {reponseA && (() => {
        const messageCible = messages.find(m => m.id === reponseA);
        if (!messageCible) return null;

        const apercu = messageCible.type === 'TEXTE' 
          ? messageCible.contenu 
          : messageCible.type === 'IMAGE' 
          ? (messageCible.contenu ? `Photo · ${messageCible.contenu}` : 'Photo')
          : messageCible.type === 'VOCAL'
          ? 'Message vocal'
          : messageCible.fichierNom || 'Fichier';

        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-32 md:bottom-24 left-0 right-0 bg-jade/90 backdrop-blur-xl border-t border-ivory/10 px-6 py-2 shadow-xl shadow-ink/20"
          >
            <div className="max-w-2xl mx-auto flex items-center gap-3">
              <div className="w-1 self-stretch bg-gold rounded-full shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gold font-medium">Réponse à</p>
                <p className="text-sm text-ivory/70 truncate">{apercu}</p>
              </div>
              <button onClick={annulerReponse} className="text-ivory/50 hover:text-gold text-sm shrink-0 transition-colors duration-300">
                Annuler
              </button>
            </div>
          </motion.div>
        );
      })()}

      <form
        onSubmit={handleEnvoyer}
        className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-ink/95 backdrop-blur-xl border-t border-ivory/10 px-6 py-4 shadow-xl shadow-ink/20"
      >
        <div className="max-w-2xl mx-auto flex gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleSelectionFichier}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="text-ivory/70 hover:text-gold transition-all duration-300 hover:scale-110 active:scale-95">
            <Paperclip size={20} />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            placeholder="Écrire un message..."
            className="flex-1 bg-jade/50 border border-ivory/10 rounded-full py-3 px-5 text-ivory placeholder:text-ivory/30 focus:outline-none focus:border-gold transition-colors"
          />
          <button
            type="submit"
            disabled={envoi || !texte.trim()}
            className="bg-gold text-ink rounded-full w-12 h-12 flex items-center justify-center hover:bg-gold/90 transition-all duration-300 disabled:opacity-40 shrink-0 hover:scale-105 active:scale-95 shadow-lg shadow-gold/20"
          >
            <Send size={18} />
          </button>
        </div>
      </form>

      {/* Modale d'aperçu avant envoi */}
      {fichierPreview && (
        <div className="fixed inset-0 z-[60] bg-ink/95 backdrop-blur-sm flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl">Envoyer</h2>
              <button onClick={annulerEnvoiFichier} className="text-ivory/50 hover:text-ivory">
                <X size={22} />
              </button>
            </div>

            <div className="bg-jade/40 border border-ivory/10 rounded-2xl overflow-hidden mb-4">
              {fichierPreview.type === 'IMAGE' ? (
                <img src={fichierPreview.previewUrl} alt="Aperçu" className="w-full max-h-96 object-contain bg-ink" />
              ) : (
                <div className="flex items-center gap-3 p-5">
                  <FileText className="text-gold shrink-0" size={28} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{fichierPreview.file.name}</p>
                    <p className="text-xs text-ivory/40">
                      {(fichierPreview.file.size / 1024).toFixed(0)} Ko
                    </p>
                  </div>
                </div>
              )}
            </div>

            <input
              type="text"
              value={legende}
              onChange={(e) => setLegende(e.target.value)}
              placeholder="Ajouter une légende (optionnel)..."
              className="w-full bg-jade/50 border border-ivory/10 rounded-full py-3 px-5 text-ivory placeholder:text-ivory/30 focus:outline-none focus:border-gold transition-colors mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={annulerEnvoiFichier}
                className="flex-1 border border-ivory/20 rounded-xl py-3 text-ivory/70 hover:bg-ivory/5 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmerEnvoiFichier}
                disabled={envoiFichier}
                className="flex-1 bg-gold text-ink rounded-xl py-3 font-semibold hover:bg-gold/90 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-105 active:scale-95 shadow-lg shadow-gold/20"
              >
                <Send size={16} /> {envoiFichier ? "Envoi..." : "Envoyer"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {menuContextuel && (
        <>
          <div 
            className="fixed inset-0 z-[70]" 
            onClick={fermerMenuContextuel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-[71] bg-jade/95 backdrop-blur-xl border border-ivory/10 rounded-xl shadow-2xl overflow-hidden"
            style={{ 
              left: Math.min(menuContextuel.x, window.innerWidth - 180), 
              top: Math.min(menuContextuel.y, window.innerHeight - 150) 
            }}
          >
            {(() => {
              const msg = messages.find(m => m.id === menuContextuel.messageId);
              if (!msg) return null;
              const estMoi = msg.expediteurId === user.id;

              return (
                <>
                  {msg.type === 'TEXTE' && (
                    <button
                      onClick={() => handleCopier(msg)}
                      className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-ivory/5 w-full text-left transition-colors duration-200"
                    >
                      Copier
                    </button>
                  )}
                  {estMoi && msg.type === 'TEXTE' && (
                    <button
                      onClick={() => {
                        setMessageEnEdition(msg.id);
                        setTexteEdition(msg.contenu);
                        fermerMenuContextuel();
                      }}
                      className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-ivory/5 w-full text-left transition-colors duration-200"
                    >
                      Modifier
                    </button>
                  )}
                  {estMoi && (
                    <button
                      onClick={() => {
                        handleSupprimerMessage(msg.id);
                        fermerMenuContextuel();
                      }}
                      className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-ivory/5 w-full text-left text-red-400 transition-colors duration-200"
                    >
                      Supprimer
                    </button>
                  )}
                </>
              );
            })()}
          </motion.div>
        </>
      )}
    </div>
  );
}

export default Messagerie;
