import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Créer dossiers s'ils n'existent pas
const uploadDir = 'storage/avatars/original';
const tempDir = 'storage/temp';

[uploadDir, tempDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Configuration du stockage
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    // Générer un nom unique : {userId}-{timestamp}.ext
    const ext = path.extname(file.originalname);
    const name = `${req.user.id}-${Date.now()}${ext}`;
    cb(null, name);
  }
});

/**
 * Filtrer les types de fichiers
 */
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/webp'
  ];

  const allowedExt = ['.jpg', '.jpeg', '.png', '.webp'];

  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  if (allowedMimes.includes(mime) && allowedExt.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, WebP allowed'));
  }
};

/**
 * Configuration Multer
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

export default upload;