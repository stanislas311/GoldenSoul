import { Component } from 'react';
import { Home, RefreshCw, AlertTriangle } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { erreur: null, infoErreur: null };
  }

  static getDerivedStateFromError(erreur) {
    return { erreur };
  }

  componentDidCatch(erreur, infoErreur) {
    this.setState({ infoErreur });
    // En production, on enverrait ça à un service de tracking (ex: Sentry)
    console.error('[ErrorBoundary] Erreur React capturée :', erreur, infoErreur);
  }

  handleReload() {
    window.location.reload();
  }

  handleHome() {
    window.location.href = '/';
  }

  render() {
    if (this.state.erreur) {
      return (
        <div className="min-h-screen bg-ink text-ivory flex items-center justify-center p-6 font-body">
          <div className="max-w-[480px] w-full text-center">
            {/* Icône d'alerte */}
            <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-red-400" size={36} />
            </div>

            {/* Titre */}
            <h1 className="text-3xl font-display mb-3 font-semibold">
              Une erreur est survenue
            </h1>

            <p className="text-ivory/50 mb-2 text-[0.95rem]">
              Un problème inattendu a interrompu l'application.
            </p>

            <p className="text-ivory/30 mb-10 text-[0.85rem]">
              Ne vous inquiétez pas — aucune donnée n'a été perdue.
            </p>

            {/* Détails technique (uniquement en développement) */}
            {import.meta.env.DEV && this.state.erreur && (
              <details className="text-left bg-jade/50 border border-ivory/10 rounded-xl p-4 mb-8 text-sm text-ivory/50">
                <summary className="cursor-pointer text-gold mb-2 outline-none">
                  Détails techniques (dev)
                </summary>
                <pre className="whitespace-pre-wrap break-words">
                  {this.state.erreur.toString()}
                  {this.state.infoErreur?.componentStack}
                </pre>
              </details>
            )}

            {/* Boutons d'action */}
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gold text-ink rounded-xl font-semibold hover:bg-gold-light transition-colors w-full"
              >
                <RefreshCw size={18} />
                Recharger la page
              </button>

              <button
                onClick={this.handleHome}
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-transparent text-ivory/60 border border-ivory/15 rounded-xl font-semibold hover:bg-ivory/5 transition-colors w-full"
              >
                <Home size={18} />
                Retour à l'accueil
              </button>
            </div>

            <p className="mt-8 text-ivory/15 text-sm font-display">
              GoldenSoul
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
