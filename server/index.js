const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const availabilityRoutes = require('./routes/availabilityRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const auditRoutes = require('./routes/auditRoutes');
const patientRoutes = require('./routes/patientRoutes');
const statsRoutes = require('./routes/statsRoutes');
const quizRoutes = require('./routes/quizRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const twoFactorRoutes = require('./routes/twoFactorRoutes');
const messageRoutes = require('./routes/messageRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const { demarrerCronJobs } = require('./utils/cronJobs');
const { initialiserSignalisation } = require('./utils/webrtcSignaling');

const app = express();
const server = http.createServer(app);

// ─── CORS restrictif : uniquement le frontend autorisé ────────────────────────
const originesAutorisees = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
];

const corsOptions = {
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (ex: Postman, mobile natif)
    if (!origin || originesAutorisees.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS : origine non autorisée : ${origin}`));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: originesAutorisees,
    credentials: true,
  },
});

// ─── Servir les fichiers uploadés ─────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Route de santé ───────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'GoldenSoul API en ligne', timestamp: new Date().toISOString() });
});

// ─── Routes métier ────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/availability', availabilityRoutes);
app.use('/sessions', sessionRoutes);
app.use('/payments', paymentRoutes);
app.use('/patients', patientRoutes);
app.use('/audit', auditRoutes);
app.use('/stats', statsRoutes);
app.use('/quiz', quizRoutes);
app.use('/notifications', notificationRoutes);
app.use('/2fa', twoFactorRoutes);
app.use('/messages', messageRoutes);
app.use('/upload', uploadRoutes);

// ─── WebRTC Signaling ─────────────────────────────────────────────────────────
initialiserSignalisation(io);

// ─── 404 : route API inconnue ─────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    message: `Route introuvable : ${req.method} ${req.originalUrl}`,
    code: 'ROUTE_NOT_FOUND',
  });
});

// ─── Middleware d'erreur global ───────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[Erreur globale]', err);

  // Erreur CORS
  if (err.message && err.message.startsWith('CORS')) {
    return res.status(403).json({ message: err.message, code: 'CORS_ERROR' });
  }

  // Erreur JSON malformé
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Corps de requête JSON invalide.', code: 'INVALID_JSON' });
  }

  // Erreur générique
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    message: process.env.NODE_ENV === 'production'
      ? 'Une erreur interne est survenue.'
      : err.message || 'Erreur serveur.',
    code: 'INTERNAL_ERROR',
  });
});

// ─── Démarrage ────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
});

demarrerCronJobs();

