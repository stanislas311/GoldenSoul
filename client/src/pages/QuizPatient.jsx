import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, ClipboardList, Trash2, Sparkles, Clock, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../utils/api';
import AnimatedBackground from '../components/AnimatedBackground';
import { useAuth } from '../context/AuthContext';
import ConfirmationDialog from '../components/ConfirmationDialog';

function QuizPatient() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [dialogConfig, setDialogConfig] = useState({ isOpen: false, onConfirm: null, title: '', message: '' });

  useEffect(() => {
    async function charger() {
      try {
        const reponse = await api.get('/quiz/actifs');
        setQuizzes(reponse.data.quizzes);
      } catch {
        // silencieux
      } finally {
        setChargement(false);
      }
    }
    charger();
  }, []);

  const genererBilan = async () => {
    try {
      setChargement(true);
      const reponse = await api.post('/quiz/generate-daily');
      const newQuiz = reponse.data.quiz;
      setQuizzes((prev) => [newQuiz, ...prev]);
    } catch (erreur) {
      console.error(erreur);
    } finally {
      setChargement(false);
    }
  };

  async function supprimerQuiz(id, e) {
    e.stopPropagation();
    setDialogConfig({
      isOpen: true,
      title: "Supprimer le bilan",
      message: "Voulez-vous vraiment supprimer ce bilan ? Cette action est irréversible.",
      onConfirm: async () => {
        try {
          await api.delete(`/quiz/${id}`);
          setQuizzes(quizzes.filter(q => q.id !== id));
        } catch {
          // silencieux
        }
        setDialogConfig({ isOpen: false, onConfirm: null, title: '', message: '' });
      }
    });
  }

  const bilansCompletes = quizzes.filter(q => q.completed);
  const bilansAFaire = quizzes.filter(q => !q.completed);

  return (
    <div className="relative min-h-screen bg-ink text-ivory overflow-hidden">
      <AnimatedBackground />

      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-ink/80 border-b border-ivory/10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="text-ivory/70 hover:text-gold transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="font-display text-2xl text-gold">Mes Bilans</h1>
              <p className="text-xs text-ivory/50">Faites le point sur votre bien-être</p>
            </div>
          </div>
        </div>
      </header>

      <section className="pt-36 pb-24 px-6 max-w-5xl mx-auto">
        {/* Résumé */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-jade/40 to-jade/20 border border-ivory/10 rounded-2xl p-6 mb-8 flex items-center gap-6 shadow-lg"
        >
          <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center shrink-0 border-2 border-gold/30">
            <ClipboardList className="text-gold" size={28} />
          </div>
          <div className="flex-1">
            <p className="text-ivory/60 text-sm mb-1">Votre suivi</p>
            <p className="text-2xl font-display text-gold">{quizzes.length} bilan{quizzes.length > 1 ? 's' : ''}</p>
            <p className="text-sm text-ivory/50 mt-1">
              Chaque bilan vous aide à mieux comprendre votre état émotionnel.
            </p>
          </div>
        </motion.div>

        {/* Bouton générer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
        >
          <button 
            onClick={genererBilan}
            disabled={chargement}
            className="w-full py-5 rounded-2xl font-display font-medium bg-gradient-to-r from-gold to-amber-400 text-ink flex items-center justify-center gap-3 hover:from-gold/90 hover:to-amber-400/90 transition-all shadow-[0_0_30px_rgba(212,175,55,0.4)] disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {chargement ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Création en cours...</span>
              </>
            ) : (
              <>
                <Sparkles className="group-hover:rotate-12 transition-transform" size={20} />
                <span>Générer mon bilan quotidien</span>
              </>
            )}
          </button>
        </motion.div>

        {/* Liste des bilans */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
              <ClipboardList className="text-gold" size={16} />
            </div>
            <h2 className="font-display text-xl">Mes bilans</h2>
            {quizzes.length > 0 && (
              <span className="bg-gold/20 text-gold text-xs px-2 py-1 rounded-full">
                {quizzes.length}
              </span>
            )}
          </div>
          <p className="text-ivory/60 ml-11">
            Faites le point à votre rythme.
          </p>
        </motion.div>

        {chargement ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-gold mb-4" size={32} />
            <p className="text-ivory/50">Chargement...</p>
          </div>
        ) : quizzes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-jade/20 border border-ivory/5 rounded-2xl p-12 text-center"
          >
            <ClipboardList className="text-ivory/30 mx-auto mb-4" size={48} />
            <p className="text-ivory/50 mb-4">Aucun bilan pour le moment.</p>
            <p className="text-ivory/40 text-sm">Générez votre premier bilan quotidien pour commencer !</p>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {quizzes.map((quiz, index) => (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.08 }}
                className="group relative bg-jade/30 border border-ivory/10 rounded-2xl p-6 hover:border-gold/30 transition-all hover:shadow-lg hover:shadow-gold/5"
              >
                <button
                  onClick={() => navigate(`/quiz/${quiz.id}`)}
                  className="w-full flex items-start gap-4 text-left"
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                    quiz.completed 
                      ? 'bg-sage/20 border-sage/30' 
                      : 'bg-gold/10 border-gold/20 group-hover:bg-gold/20'
                  }`}>
                    {quiz.completed ? (
                      <CheckCircle2 className="text-sage" size={24} />
                    ) : (
                      <ClipboardList className="text-gold" size={24} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-display text-lg text-gold">{quiz.titre}</h3>
                      <ChevronRight
                        size={20}
                        className="text-ivory/30 group-hover:text-gold group-hover:translate-x-1 transition-all shrink-0"
                      />
                    </div>
                    {quiz.description && (
                      <p className="text-ivory/60 text-sm leading-relaxed">{quiz.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-3">
                      {quiz.completed ? (
                        <span className="flex items-center gap-1.5 text-sage text-xs font-medium bg-sage/10 px-2.5 py-1 rounded-full">
                          <CheckCircle2 size={12} />
                          Complété
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-ivory/50 text-xs">
                          <Clock size={12} />
                          À faire
                        </span>
                      )}
                    </div>
                  </div>
                </button>
                <button 
                  onClick={(e) => supprimerQuiz(quiz.id, e)}
                  className="absolute top-4 right-4 p-2 text-ivory/30 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  title="Supprimer le bilan"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <ConfirmationDialog
        isOpen={dialogConfig.isOpen}
        onClose={() => setDialogConfig({ isOpen: false, onConfirm: null, title: '', message: '' })}
        onConfirm={dialogConfig.onConfirm}
        title={dialogConfig.title}
        message={dialogConfig.message}
        type={dialogConfig.type || "danger"}
      />
    </div>
  );
}

export default QuizPatient;
