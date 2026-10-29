import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PatientDashboard from './pages/PatientDashboard';
import PraticienDashboard from './pages/PraticienDashboard';
import Parametres from './pages/Parametres';
import Reservation from './pages/Reservation';
import Paiement from './pages/Paiement';
import MesPaiements from './pages/MesPaiements';
import Recu from './pages/Recu';
import ConfirmationAttente from './pages/ConfirmationAttente';
import SessionsEnAttente from './pages/SessionsEnAttente';
import MesSessions from './pages/MesSessions';
import MesSessionsPraticien from './pages/MesSessionsPraticien';
import GestionDisponibilites from './pages/GestionDisponibilites';
import DetailsReservation from './pages/DetailsReservation';
import ListePatients from './pages/ListePatients';
import DossierPatient from './pages/DossierPatient';
import Statistiques from './pages/Statistiques';
import PaiementsPraticien from './pages/PaiementsPraticien';
import QuizPatient from './pages/QuizPatient';
import RepondreQuiz from './pages/RepondreQuiz';
import Messagerie from './pages/Messagerie';
import ConversationsListe from './pages/ConversationsListe';
import ConversationDetail from './pages/ConversationDetail';
import SalleAppel from './pages/SalleAppel';
import LaisserAvis from './pages/LaisserAvis';
import Notifications from './pages/Notifications';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Routes publiques : pas de Layout */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Routes Patient */}
          <Route path="/dashboard" element={<ProtectedRoute roleRequis="PATIENT"><Layout><PatientDashboard /></Layout></ProtectedRoute>} />
          <Route path="/reservation" element={<ProtectedRoute roleRequis="PATIENT"><Layout><Reservation /></Layout></ProtectedRoute>} />
          <Route path="/mes-seances" element={<ProtectedRoute roleRequis="PATIENT"><Layout><MesSessions /></Layout></ProtectedRoute>} />
          <Route path="/paiements" element={<ProtectedRoute roleRequis="PATIENT"><Layout><MesPaiements /></Layout></ProtectedRoute>} />
          <Route path="/messagerie" element={<ProtectedRoute roleRequis="PATIENT"><Layout><Messagerie /></Layout></ProtectedRoute>} />
          <Route path="/messagerie/:conversationId" element={<ProtectedRoute roleRequis="PATIENT"><Layout><Messagerie /></Layout></ProtectedRoute>} />
          <Route path="/paiement/:sessionId" element={<ProtectedRoute roleRequis="PATIENT"><Layout><Paiement /></Layout></ProtectedRoute>} />
          <Route path="/confirmation-attente/:sessionId" element={<ProtectedRoute roleRequis="PATIENT"><Layout><ConfirmationAttente /></Layout></ProtectedRoute>} />
          <Route path="/quiz" element={<ProtectedRoute roleRequis="PATIENT"><Layout><QuizPatient /></Layout></ProtectedRoute>} />
          <Route path="/quiz/:quizId" element={<ProtectedRoute roleRequis="PATIENT"><Layout><RepondreQuiz /></Layout></ProtectedRoute>} />
          <Route path="/avis/:sessionId" element={<ProtectedRoute roleRequis="PATIENT"><Layout><LaisserAvis /></Layout></ProtectedRoute>} />

          {/* Routes Praticien */}
          <Route path="/dashboard-praticien" element={<ProtectedRoute roleRequis="PRATICIEN"><Layout><PraticienDashboard /></Layout></ProtectedRoute>} />
          <Route path="/rendez-vous" element={<ProtectedRoute roleRequis="PRATICIEN"><Layout><SessionsEnAttente /></Layout></ProtectedRoute>} />
          <Route path="/mes-seances-praticien" element={<ProtectedRoute roleRequis="PRATICIEN"><Layout><MesSessionsPraticien /></Layout></ProtectedRoute>} />
          <Route path="/disponibilites" element={<ProtectedRoute roleRequis="PRATICIEN"><Layout><GestionDisponibilites /></Layout></ProtectedRoute>} />
          <Route path="/disponibilites/:availabilityId/details" element={<ProtectedRoute roleRequis="PRATICIEN"><Layout><DetailsReservation /></Layout></ProtectedRoute>} />
          <Route path="/patients" element={<ProtectedRoute roleRequis="PRATICIEN"><Layout><ListePatients /></Layout></ProtectedRoute>} />
          <Route path="/patients/:patientId" element={<ProtectedRoute roleRequis="PRATICIEN"><Layout><DossierPatient /></Layout></ProtectedRoute>} />
          <Route path="/statistiques" element={<ProtectedRoute roleRequis="PRATICIEN"><Layout><Statistiques /></Layout></ProtectedRoute>} />
          <Route path="/conversations" element={<ProtectedRoute roleRequis="PRATICIEN"><Layout><ConversationsListe /></Layout></ProtectedRoute>} />
          <Route path="/conversations/:conversationId" element={<ProtectedRoute roleRequis="PRATICIEN"><Layout><ConversationDetail /></Layout></ProtectedRoute>} />
          <Route path="/paiements-praticien" element={<ProtectedRoute roleRequis="PRATICIEN"><Layout><PaiementsPraticien /></Layout></ProtectedRoute>} />

          {/* Routes partagées */}
          <Route path="/recu/:sessionId" element={<ProtectedRoute><Layout><Recu /></Layout></ProtectedRoute>} />
          <Route path="/parametres" element={<ProtectedRoute><Layout><Parametres /></Layout></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Layout><Notifications /></Layout></ProtectedRoute>} />

          {/* SalleAppel : plein écran sans Layout */}
          <Route path="/appel/:roomId" element={<ProtectedRoute><SalleAppel /></ProtectedRoute>} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
