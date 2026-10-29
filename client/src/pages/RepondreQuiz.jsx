import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react';
import api from '../utils/api';
import AnimatedBackground from '../components/AnimatedBackground';

function RepondreQuiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [reponses, setReponses] = useState({});
  const [envoi, setEnvoi] = useState(false);
  const [termine, setTermine] = useState(false);
  const [analyseIA, setAnalyseIA] = useState(null);

  useEffect(() => {
    async function charger() {
      try {
        const reponse = await api.get(`/quiz/${quizId}`);
        setQuiz(reponse.data.quiz);
      } catch {
        // silencieux
      } finally {
        setChargement(false);
      }
    }
    charger();
  }, [quizId]);

  function choisirOption(questionId, optionId, valeur) {
    setReponses({ ...reponses, [questionId]: { optionId, valeur } });
  }

  async function handleSubmit() {
    setEnvoi(true);
    try {
      const payload = Object.entries(reponses).map(([questionId, { valeur }]) => ({
        questionId,
        valeurChoisie: valeur,
      }));

      const reponse = await api.post(`/quiz/${quizId}/repondre`, { reponses: payload });
      setAnalyseIA(reponse.data.analyseIA);
      setTermine(true);
    } catch {
      // silencieux
    } finally {
      setEnvoi(false);
    }
  }

  if (chargement) {
    return <div className="min-h-screen bg-ink flex items-center justify-center"><p className="text-ivory/50">Chargement...</p></div>;
  }
  if (!quiz) {
    return <div className="min-h-screen bg-ink flex items-center justify-center"><p className="text-ivory/50">Bilan introuvable.</p></div>;
  }

  const toutesRepondues = quiz.questions.every((q) => reponses[q.id]);

  return (
    <div className="relative min-h-screen bg-ink text-ivory overflow-hidden">
      <AnimatedBackground />

      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-ink/70 border-b border-ivory/10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-ivory/70 hover:text-gold transition-colors">
            <ArrowLeft size={20} />
          </button>
          <span className="font-display text-xl">{quiz.titre}</span>
        </div>
      </header>

      <section className="pt-32 pb-24 px-6 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {termine ? (
            <motion.div
              key="termine"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <CheckCircle2 className="text-sage mx-auto mb-4" size={48} />
              <h2 className="font-display text-3xl mb-3">Bilan terminé</h2>
              <p className="text-ivory/60 mb-8">Merci d'avoir pris le temps de faire le point.</p>
              
              {analyseIA && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-ivory/5 border border-ivory/10 p-6 rounded-xl text-left mb-8 max-w-lg mx-auto"
                >
                  <h3 className="text-gold font-display text-lg mb-3 flex items-center gap-2">
                    <Sparkles size={18} className="text-gold" />
                    Analyse de GoldenSoul
                  </h3>
                  <p className="text-ivory/80 leading-relaxed text-sm">{analyseIA}</p>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <button
                  onClick={() => navigate('/quiz')}
                  className="px-8 py-3 rounded-xl font-semibold border-2 border-gold text-gold hover:bg-gold hover:text-ink transition-colors shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                >
                  Retour aux bilans
                </button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div key="questions" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="space-y-10">
                {quiz.questions.map((question, index) => (
                  <div key={question.id}>
                    <p className="font-medium mb-4">
                      <span className="text-gold/60 text-sm mr-2">{index + 1}.</span>
                      {question.texte}
                    </p>
                    <div className="space-y-2 pl-6">
                      {question.options.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => choisirOption(question.id, option.id, option.valeur)}
                          className={`w-full text-left px-4 py-2.5 rounded-lg border transition-colors ${
                            reponses[question.id]?.optionId === option.id
                              ? 'bg-gold/10 border-gold text-gold'
                              : 'border-ivory/10 text-ivory/70 hover:border-ivory/30'
                          }`}
                        >
                          {option.texte}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSubmit}
                disabled={!toutesRepondues || envoi}
                className="w-full bg-gold text-ink rounded-xl py-4 font-semibold hover:bg-gold/90 transition-colors disabled:opacity-40 mt-12"
              >
                {envoi ? "Analyse en cours..." : "Valider mes réponses"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}

export default RepondreQuiz;
