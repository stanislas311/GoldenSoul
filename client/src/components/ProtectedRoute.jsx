import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, roleRequis }) {
  const { user, chargement } = useAuth();

  if (chargement) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <p className="text-ivory/50">Chargement...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roleRequis && user.role !== roleRequis) {
    const bonneDestination = user.role === 'PRATICIEN' ? '/dashboard-praticien' : '/dashboard';
    return <Navigate to={bonneDestination} replace />;
  }

  return children;
}

export default ProtectedRoute;
