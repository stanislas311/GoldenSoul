import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Sparkles, Loader2, AlertTriangle } from 'lucide-react';
import api from '../utils/api';
import AnimatedBackground from '../components/AnimatedBackground';

function nouvelleQuestion() {
  return {
    id: crypto.randomUUID(),
    texte: '',
    options: [
      { id: crypto.randomUUID(), texte: '', valeur: 1 },
      { id: crypto.randomUUID(), texte: '', valeur: 2 },
    ],
  };
}

function CreationQuiz() {
  const navigate = useNavigate();
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([nouvelleQuestion()]);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  // Génération IA
  const [descriptionIA, setDescriptionIA] = useState('');
  const [genererEnCours, setGenererEnCours] = useState(false);
  const [erreurIA, setErreurIA] = useState('');

  async function handleGenererIA() {
    if (!descriptionIA.trim()) return;
    setGenererEnCours(true);
    setErreurIA('');

    try {
      const reponse = await api.post('/quiz/generer-ia', { description: descriptionIA, nombreQuestions: 5 });
      const propose = reponse.data.quizPropose;

      setTitre(propose.titre || '');
      setDescription(propose.description || '');
      setQuestions(
        propose.questions.map((q) => ({
          id: crypto.randomUUID(),
          texte: q.texte,
          options: q.options.map((o) => ({ id: crypto.randomUUID(), texte: o.texte, valeur: o.valeur })),
        }))
      );
    } catch {
      setErreurIA("La génération a échoué. Vous pouvez réessayer ou créer le quiz manuellement ci-dessous.");
    } finally {
      setGenererEnCours(false);
    }
  }

  function ajouterQuestion() {
    setQuestions([...questions, nouvelleQuestion()]);
  }

  function supprimerQuestion(id) {
    setQuestions(questions.filter((q) => q.id !== id));
  }

  function modifierQuestion(id, texte) {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, texte } : q)));
  }

  function ajouterOption(questionId) {
    setQuestions(questions.map((q) =>
      q.id === questionId
        ? { ...q, options: [...q.options, { id: crypto.randomUUID(), texte: '', valeur: q.options.length + 1 }] }
        : q
    ));
  }

  function supprimerOption(questionId, optionId) {
    setQuestions(questions.map((q) =>
      q.id === questionId
        ? { ...q, options: q.options.filter((o) => o.id !== optionId) }
        : q
    ));
  }

  function modifierOption(questionId, optionId, texte) {
    setQuestions(questions.map((q) =>
      q.id === questionId
        ? { ...q, options: q.options.map((o) => (o.id === optionId ? { ...o, texte } : o)) }
        : q
    ));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur('');

    if (!titre.trim()) {
      setErreur("Le titre est requis.");
      return;
    }
    if (questions.some((q) => !q.texte.trim() || q.options.some((o) => !o.texte.trim()))) {
      setErreur("Toutes les questions et options doivent être remplies.");
      return;
    }

    setEnvoi(true);
    try {
      await api.post('/quiz', {
        titre,
        description,
        questions: questions.map((q) => ({
          texte: q.texte,
          options: q.options.map((o) => ({ texte: o.texte, valeur: o.valeur })),
        })),
      });
      navigate('/gestion-quiz');
    } catch (err) {
      setErreur(err.response?.data?.message || "Une erreur est survenue.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-ink text-ivory overflow-hidden">
      <AnimatedBackground />

      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-ink/70 border-b border-ivory/10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-ivory/70 hover:text-gold transition-colors">
            <ArrowLeft size={20} />
          </button>
          <span className="font-display text-xl">Nouveau quiz</span>
        </div>
      </header>

      <section className="pt-32 pb-24 px-6 max-w-2xl mx-auto">
        {/* Bloc génération IA */}
        <div className="bg-gold/5 border border-gold/20 rounded-2xl p-6 mb-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="text-gold" size={18} />
            <h2 className="font-display text-lg">Génération assistée</h2>
          </div>
          <p className="text-ivory/50 text-xs mb-4 flex items-start gap-1.5">
            <AlertTriangle size={13} className="shrink-0 mt-0.5" />
            Décrivez uniquement le thème du quiz, jamais d'informations sur un patient précis.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={descriptionIA}
              onChange={(e) => setDescriptionIA(e.target.value)}
              placeholder="Ex : quiz sur la gestion du stress au travail"
              className="flex-1 bg-ink/50 border border-ivory/10 rounded-xl py-2.5 px-4 text-sm text-ivory placeholder:text-ivory/30 focus:outline-none focus:border-gold transition-colors"
            />
            <button
              type="button"
              onClick={handleGenererIA}
              disabled={genererEnCours || !descriptionIA.trim()}
              className="flex items-center gap-2 bg-gold text-ink rounded-xl px-4 text-sm font-medium hover:bg-gold/90 transition-colors disabled:opacity-40 shrink-0"
            >
              {genererEnCours ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
              Générer
            </button>
          </div>
          {erreurIA && <p className="text-xs text-red-400 mt-3">{erreurIA}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-sm text-ivory/70 mb-2">Titre du quiz</label>
            <input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex : Auto-évaluation du stress"
              className="w-full bg-transparent border-b border-ivory/15 focus:border-gold py-2 text-ivory placeholder:text-ivory/30 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-ivory/70 mb-2">Description (optionnelle)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Une brève description du quiz"
              className="w-full bg-transparent border-b border-ivory/15 focus:border-gold py-2 text-ivory placeholder:text-ivory/30 focus:outline-none transition-colors"
            />
          </div>

          <div className="pt-4 border-t border-ivory/10">
            <h2 className="font-display text-xl mb-6">Questions</h2>

            <AnimatePresence>
              {questions.map((question, qIndex) => (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-8 pb-8 border-b border-ivory/5 last:border-0"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="text"
                      value={question.texte}
                      onChange={(e) => modifierQuestion(question.id, e.target.value)}
                      placeholder={`Question ${qIndex + 1}`}
                      className="flex-1 bg-transparent border-b border-ivory/15 focus:border-gold py-1.5 text-ivory placeholder:text-ivory/30 focus:outline-none transition-colors"
                    />
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => supprimerQuestion(question.id)}
                        className="text-ivory/30 hover:text-red-400 transition-colors shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="pl-4 space-y-2">
                    {question.options.map((option, oIndex) => (
                      <div key={option.id} className="flex items-center gap-2">
                        <span className="text-xs text-ivory/30 w-5">{oIndex + 1}</span>
                        <input
                          type="text"
                          value={option.texte}
                          onChange={(e) => modifierOption(question.id, option.id, e.target.value)}
                          placeholder="Réponse possible"
                          className="flex-1 bg-transparent border-b border-ivory/10 focus:border-gold/60 py-1 text-sm text-ivory/80 placeholder:text-ivory/25 focus:outline-none transition-colors"
                        />
                        {question.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => supprimerOption(question.id, option.id)}
                            className="text-ivory/20 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => ajouterOption(question.id)}
                      className="text-xs text-gold/70 hover:text-gold flex items-center gap-1 mt-2"
                    >
                      <Plus size={12} /> Ajouter une option
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <button
              type="button"
              onClick={ajouterQuestion}
              className="flex items-center gap-2 text-gold hover:underline text-sm"
            >
              <Plus size={16} /> Ajouter une question
            </button>
          </div>

          {erreur && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
              {erreur}
            </p>
          )}

          <button
            type="submit"
            disabled={envoi}
            className="w-full bg-gold text-ink rounded-xl py-4 font-semibold hover:bg-gold/90 transition-colors disabled:opacity-50"
          >
            {envoi ? "Création..." : "Publier le quiz"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default CreationQuiz;
