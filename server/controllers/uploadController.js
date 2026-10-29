const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration du stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtre pour accepter images, fichiers et audio
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'audio/webm',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

// Upload d'un fichier
async function uploadFichier(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier fourni." });
    }

    const fichierUrl = `/uploads/${req.file.filename}`;
    
    res.status(200).json({
      url: fichierUrl,
      nom: req.file.originalname,
      taille: req.file.size,
      type: req.file.mimetype
    });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: "Erreur lors de l'upload." });
  }
}

module.exports = { upload, uploadFichier };
