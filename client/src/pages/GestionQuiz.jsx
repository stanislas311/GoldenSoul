import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Eye, EyeOff, ChevronRight } from 'lucide-react';
import api from '../utils/api';
import AnimatedBackground from '../components/AnimatedBackground';

function GestionQuiz() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [chargement, setChargement] = useState(true);

  async function charger() {
    try {
      const reponse = await api.get('/quiz/tous');
      setQuizzes(reponse.data.quizzes);
    } catch {
      // silencieux
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    charger();
  }, []);

  async function handleToggle(quizId) {
    try {
      await api.put(`/quiz/${quizId}/toggle`);
      charger();
    } catch {
      // silencieux
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
          <span className="font-display text-xl">Mes quiz</span>
        </div>
      </header>

      <section className="pt-32 pb-24 px-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl">Quiz</h1>
          <button
            onClick={() => navigate('/creation-quiz')}
            className="flex items-center gap-2 bg-gold text-ink rounded-full px-5 py-2.5 font-medium hover:bg-gold/90 transition-colors"
          >
            <Plus size={16} /> Nouveau quiz
          </button>
        </div>

        {chargement ? (
          <p className="text-ivory/50">Chargement...</p>
        ) : quizzes.length === 0 ? (
          <p className="text-ivory/50">Aucun quiz créé pour le moment.</p>
        ) : (
          <div>
            {quizzes.map((quiz, index) => (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
                className="flex items-center gap-4 py-5 border-b border-ivory/5"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{quiz.titre}</p>
                  {quiz.description && (
                    <p className="text-ivory/40 text-sm truncate">{quiz.description}</p>
                  )}
                  <p className="text-ivory/30 text-xs mt-1">
                    {quiz.questions?.length || 0} question{quiz.questions?.length > 1 ? 's' : ''}
                  </p>
                </div>

                <button
                  onClick={() => handleToggle(quiz.id)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors shrink-0 ${
                    quiz.actif
                      ? 'bg-sage/10 text-sage hover:bg-sage/20'
                      : 'bg-ivory/5 text-ivory/40 hover:bg-ivory/10'
                  }`}
                >
                  {quiz.actif ? <Eye size={12} /> : <EyeOff size={12} />}
                  {quiz.actif ? 'Visible' : 'Masqué'}
                </button>

                <ChevronRight size={16} className="text-ivory/20 shrink-0" />
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default GestionQuiz;
