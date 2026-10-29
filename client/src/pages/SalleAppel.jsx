import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { io } from 'socket.io-client';
import { 
  Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Loader2, WifiOff,
  MessageSquare, Settings, Volume2, VolumeX, Pause, Monitor,
  X, Send
} from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const STUN_TURN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
  ],
};

function SalleAppel() {
  const { t, i18n } = useTranslation();
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // États de l'appel
  const [statut, setStatut] = useState('connexion'); // connexion | attente | en_appel | erreur
  const [erreur, setErreur] = useState('');
  
  // Contrôles média
  const [micActif, setMicActif] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [sonActif, setSonActif] = useState(true);
  const [partageEcranActif, setPartageEcranActif] = useState(false);

  // UI Drawers
  const [drawerActif, setDrawerActif] = useState(null); // 'chat' | 'settings' | null
  
  // Chat
  const [messagesChat, setMessagesChat] = useState([]);
  const [messageInput, setMessageInput] = useState('');

  // Références
  const videoLocaleRef = useRef(null);
  const videoDistanteRef = useRef(null);
  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const streamLocalRef = useRef(null);
  const screenStreamRef = useRef(null);
  const chatEndRef = useRef(null);

  // Variables pour Perfect Negotiation
  const makingOffer = useRef(false);
  const ignoreOffer = useRef(false);

  // ---------------------------------------------------------
  // INITIALISATION WEBRTC & SOCKET
  // ---------------------------------------------------------
  useEffect(() => {
    let unmounted = false;

    async function initialiserAppel() {
      try {
        // 1. Accès Caméra/Micro
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (unmounted) return;
        
        streamLocalRef.current = stream;
        if (videoLocaleRef.current) {
          videoLocaleRef.current.srcObject = stream;
        }

        // 2. Connexion Socket.IO
        const token = localStorage.getItem('token');
        const socket = io('http://localhost:5000', {
          auth: { token },
          forceNew: true,
        });
        socketRef.current = socket;

        // 3. Création PeerConnection
        const pc = new RTCPeerConnection(STUN_TURN_SERVERS);
        pcRef.current = pc;

        // ---------------------------------------------------------
        // PERFECT NEGOTIATION PATTERN
        // ---------------------------------------------------------
        
        // Auto-négociation quand les pistes sont ajoutées ou modifiées
        pc.onnegotiationneeded = async () => {
          try {
            makingOffer.current = true;
            await pc.setLocalDescription(); // Crée automatiquement l'offre
            socket.emit('webrtc-signaling', { roomId, data: { description: pc.localDescription } });
          } catch (err) {
            console.error('[WebRTC] Erreur negotiation:', err);
          } finally {
            makingOffer.current = false;
          }
        };

        // Ajouter nos pistes au PC
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        // Réception des pistes distantes
        pc.ontrack = (event) => {
          console.log('[WebRTC] Piste distante reçue !');
          if (videoDistanteRef.current) {
            videoDistanteRef.current.srcObject = event.streams[0];
          }
          setStatut('en_appel');
        };

        // Envoi des candidats ICE
        pc.onicecandidate = ({ candidate }) => {
          if (candidate) {
            socket.emit('webrtc-signaling', { roomId, data: { candidate } });
          }
        };

        // Réception du signaling (Descriptions et Candidates)
        socket.on('webrtc-signaling', async ({ data, deSocketId }) => {
          try {
            // Détermination dynamique : on compare les socket IDs pour savoir qui est "poli"
            // Cela empêche le deadlock même si on teste avec deux comptes identiques !
            const isPolite = socketRef.current.id > deSocketId;

            if (data.description) {
              // Vérifier la collision (glare)
              const offerCollision = (data.description.type === 'offer') &&
                                     (makingOffer.current || pc.signalingState !== 'stable');
              
              ignoreOffer.current = !isPolite && offerCollision;
              
              if (ignoreOffer.current) {
                console.log('[WebRTC] Collision ignorée par le pair impoli.');
                return;
              }

              // Si collision et on est poli, rollback implicite géré par setRemoteDescription (SRD)
              await pc.setRemoteDescription(data.description);
              
              if (data.description.type === 'offer') {
                await pc.setLocalDescription();
                socket.emit('webrtc-signaling', { roomId, data: { description: pc.localDescription } });
              }
            } else if (data.candidate) {
              try {
                await pc.addIceCandidate(data.candidate);
              } catch (err) {
                if (!ignoreOffer.current) console.error('[WebRTC] Erreur ajout ICE:', err);
              }
            }
          } catch (err) {
            console.error('[WebRTC] Erreur traitement signal:', err);
          }
        });

        // ---------------------------------------------------------
        // GESTION DES ÉVÉNEMENTS SOCKET GÉNÉRAUX
        // ---------------------------------------------------------
        socket.on('connect', () => {
          console.log('[WebRTC] Connecté au serveur');
          socket.emit('rejoindre-room', roomId);
          setStatut('attente');
        });

        socket.on('utilisateur-rejoint', async ({ socketId }) => {
          const isPoliteLocal = socketRef.current.id > socketId;
          console.log(`[WebRTC] L'autre a rejoint. Je suis poli? ${isPoliteLocal}. Relance...`);
          
          // Si on est le pair impoli et qu'on était déjà là, notre première offre 
          // et nos ICE candidates ont été perdus dans le vide. On DOIT relancer une offre.
          if (!isPoliteLocal) {
            try {
              pc.restartIce();
              makingOffer.current = true;
              await pc.setLocalDescription();
              socket.emit('webrtc-signaling', { roomId, data: { description: pc.localDescription } });
            } catch (err) {
              console.error('[WebRTC] Erreur relance négociation:', err);
            } finally {
              makingOffer.current = false;
            }
          }
        });

        socket.on('utilisateur-parti', () => {
          console.log('[WebRTC] L\'autre participant a quitté.');
          setStatut('attente');
          if (videoDistanteRef.current) videoDistanteRef.current.srcObject = null;
        });

        socket.on('chat-message', ({ message, envoyePar }) => {
          setMessagesChat(prev => [...prev, {
            id: Date.now(),
            text: message,
            envoyeParMoi: false,
            envoyePar,
            time: new Date().toLocaleTimeString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })
          }]);
        });

      } catch (err) {
        console.error(err);
        setErreur(t('salleAppel.erreurCameraMicro'));
        setStatut('erreur');
      }
    }

    initialiserAppel();

    return () => {
      unmounted = true;
      streamLocalRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      pcRef.current?.close();
      socketRef.current?.disconnect();
    };
  }, [roomId]);

  // Scroll auto pour le chat
  useEffect(() => {
    if (drawerActif === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messagesChat, drawerActif]);

  // ---------------------------------------------------------
  // DEBUG ON-SCREEN (Pour diagnostiquer sans la console)
  // ---------------------------------------------------------
  const [debugInfo, setDebugInfo] = useState({ signaling: 'new', ice: 'new', socket: false });
  useEffect(() => {
    const interval = setInterval(() => {
      setDebugInfo({
        signaling: pcRef.current?.signalingState || 'none',
        ice: pcRef.current?.iceConnectionState || 'none',
        socket: socketRef.current?.connected || false,
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ---------------------------------------------------------
  // ACTIONS UTILISATEUR
  // ---------------------------------------------------------
  const toggleMic = () => {
    const track = streamLocalRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setMicActif(track.enabled);
    }
  };

  const toggleVideo = () => {
    const track = streamLocalRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setVideoActive(track.enabled);
    }
  };

  const toggleSon = () => {
    if (videoDistanteRef.current) {
      videoDistanteRef.current.muted = !videoDistanteRef.current.muted;
      setSonActif(!videoDistanteRef.current.muted);
    }
  };

  const togglePartageEcran = async () => {
    if (partageEcranActif) {
      screenStreamRef.current?.getTracks().forEach(track => track.stop());
      // Revenir à la vidéo caméra
      const videoTrack = streamLocalRef.current?.getVideoTracks()[0];
      const sender = pcRef.current?.getSenders().find(s => s.track?.kind === 'video');
      if (sender && videoTrack) sender.replaceTrack(videoTrack);
      setPartageEcranActif(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];
        
        const sender = pcRef.current?.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(screenTrack);

        screenTrack.onended = () => togglePartageEcran();
        setPartageEcranActif(true);
      } catch (err) {
        console.error('Partage écran annulé ou erreur', err);
      }
    }
  };

  const envoyerMessageChat = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    
    setMessagesChat(prev => [...prev, {
      id: Date.now(),
      text: messageInput,
      envoyeParMoi: true,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }]);
    
    socketRef.current?.emit('chat-message', { roomId, message: messageInput });
    setMessageInput('');
  };

  const quitterAppel = () => {
    api.post(`/sessions/${roomId}/terminer`).catch(console.error);
    navigate(user?.role === 'PATIENT' ? `/avis/${roomId}` : '/rendez-vous');
  };

  // ---------------------------------------------------------
  // RENDU UI
  // ---------------------------------------------------------
  return (
    <div className="relative h-[100dvh] w-full bg-ink text-ivory overflow-hidden flex font-sans">
      
      {/* Zone Principale de Vidéo */}
      <div className="relative flex-1 h-full w-full bg-black">
        {/* Vidéo Distante (Plein écran) */}
        <video
          ref={videoDistanteRef}
          autoPlay
          playsInline
          className={`w-full h-full object-cover transition-opacity duration-500 ${statut === 'en_appel' ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Overlay d'état (Attente, Connexion, Erreur) */}
        {statut !== 'en_appel' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink/90 backdrop-blur-md z-10">
            {statut === 'erreur' ? (
              <div className="text-center p-6 bg-red-500/10 border border-red-500/30 rounded-2xl mx-4 max-w-sm">
                <WifiOff className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-400 font-medium mb-4">{erreur}</p>
                <button onClick={() => navigate(-1)} className="px-6 py-2 bg-ivory/10 hover:bg-ivory/20 rounded-full transition">{t('salleAppel.retour')}</button>
              </div>
            ) : (
              <div className="text-center flex flex-col items-center">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3 h-3 bg-gold rounded-full animate-pulse"></div>
                  </div>
                </div>
                <h2 className="mt-6 text-xl font-display text-gold">
                  {statut === 'connexion' ? t('salleAppel.connexionEnCours') : t('salleAppel.attenteCorrespondant')}
                </h2>
                <p className="mt-2 text-ivory/60 max-w-xs mx-auto">
                  {statut === 'attente' ? t('salleAppel.veuillezPatienter') : t('salleAppel.preparationSalle')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Vidéo Locale (PIP - Picture in Picture) */}
        {/* Positionnée en haut à droite sur mobile pour ne pas cacher les contrôles en bas */}
        <div className={`absolute top-4 right-4 md:bottom-28 md:top-auto md:right-8 z-20 transition-all duration-300 ${drawerActif ? 'md:right-[340px]' : ''}`}>
          <div className="w-24 h-36 md:w-48 md:h-32 bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-ivory/10 relative">
            <video
              ref={videoLocaleRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${!videoActive && 'opacity-0'}`}
            />
            {!videoActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-ink">
                <VideoOff className="w-8 h-8 text-ivory/50" />
              </div>
            )}
            {!micActif && (
              <div className="absolute top-2 right-2 p-1 bg-red-500 rounded-full">
                <MicOff className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Barre de contrôles flottante en bas */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-[95%] md:w-auto max-w-lg transition-transform duration-300">
          <div className="flex items-center justify-evenly md:justify-center gap-2 md:gap-4 px-3 py-3 md:px-6 md:py-4 bg-ink/80 backdrop-blur-xl border border-ivory/10 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
            
            <button onClick={toggleMic} className={`p-3 md:p-4 rounded-full transition-all ${micActif ? 'bg-ivory/10 hover:bg-ivory/20' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
              {micActif ? <Mic className="w-5 h-5 md:w-6 md:h-6" /> : <MicOff className="w-5 h-5 md:w-6 md:h-6" />}
            </button>
            
            <button onClick={toggleVideo} className={`p-3 md:p-4 rounded-full transition-all ${videoActive ? 'bg-ivory/10 hover:bg-ivory/20' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
              {videoActive ? <VideoIcon className="w-5 h-5 md:w-6 md:h-6" /> : <VideoOff className="w-5 h-5 md:w-6 md:h-6" />}
            </button>

            <button onClick={toggleSon} className={`hidden md:block p-3 md:p-4 rounded-full transition-all ${sonActif ? 'bg-ivory/10 hover:bg-ivory/20' : 'bg-gold/20 text-gold border border-gold/30'}`}>
              {sonActif ? <Volume2 className="w-5 h-5 md:w-6 md:h-6" /> : <VolumeX className="w-5 h-5 md:w-6 md:h-6" />}
            </button>

            {/* Le partage d'écran (Desktop uniquement) */}
            <button onClick={togglePartageEcran} className={`hidden md:block p-3 md:p-4 rounded-full transition-all ${partageEcranActif ? 'bg-gold text-ink' : 'bg-ivory/10 hover:bg-ivory/20'}`}>
              <Monitor className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            <div className="w-px h-8 bg-ivory/20 mx-1 md:mx-2"></div>

            <button onClick={() => setDrawerActif(prev => prev === 'chat' ? null : 'chat')} className={`p-3 md:p-4 rounded-full transition-all relative ${drawerActif === 'chat' ? 'bg-gold/20 text-gold' : 'bg-ivory/10 hover:bg-ivory/20'}`}>
              <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            <button onClick={quitterAppel} className="p-3 md:p-4 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all transform hover:scale-105 ml-2">
              <PhoneOff className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Drawers (Panneaux coulissants pour Chat / Params) */}
      <div className={`absolute top-0 right-0 h-full w-full md:w-[320px] bg-ink/95 backdrop-blur-3xl border-l border-ivory/10 shadow-2xl transition-transform duration-300 ease-in-out z-40 flex flex-col ${drawerActif ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* En-tête du Drawer */}
        <div className="p-4 border-b border-ivory/10 flex justify-between items-center bg-ink">
          <h3 className="font-display text-lg text-gold">
            {drawerActif === 'chat' ? 'Discussion' : 'Paramètres'}
          </h3>
          <button onClick={() => setDrawerActif(null)} className="p-2 hover:bg-ivory/10 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenu : CHAT */}
        {drawerActif === 'chat' && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesChat.length === 0 ? (
                <div className="h-full flex items-center justify-center text-ivory/40 text-sm text-center px-4">
                  Envoyez le premier message pour commencer la conversation.
                </div>
              ) : (
                messagesChat.map(msg => (
                  <div key={msg.id} className={`flex flex-col ${msg.envoyeParMoi ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] text-ivory/40 mb-1 font-medium">{msg.envoyeParMoi ? 'Vous' : msg.envoyePar}</span>
                    <div className={`px-4 py-2 max-w-[85%] text-sm rounded-2xl shadow-sm ${msg.envoyeParMoi ? 'bg-gold text-ink rounded-br-sm' : 'bg-ivory/10 text-ivory rounded-bl-sm'}`}>
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-ivory/30 mt-1">{msg.time}</span>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
            
            <form onSubmit={envoyerMessageChat} className="p-3 border-t border-ivory/10 bg-ink">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Écrire un message..."
                  className="w-full bg-ivory/5 border border-ivory/20 rounded-full py-3 pl-4 pr-12 text-sm text-ivory focus:outline-none focus:border-gold/50 transition-colors"
                />
                <button type="submit" disabled={!messageInput.trim()} className="absolute right-1.5 p-2 bg-gold text-ink rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gold/90 transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </>
        )}

      </div>
      
    </div>
  );
}

export default SalleAppel;
