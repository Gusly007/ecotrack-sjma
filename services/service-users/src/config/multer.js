import multer from 'multer';
import path from 'path';
import fs from 'fs';
import env from './env.js';

const uploadDir = 'storage/avatars/original';
const tempDir = 'storage/temp';

[uploadDir, tempDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const allowedExtensions = env.upload.allowedExtensions.map(e => `.${e}`);
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (!allowedExtensions.includes(ext)) {
      return cb(new Error('Invalid file extension'));
    }
    
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    const safeExt = ext === '.jpeg' ? '.jpg' : ext;
    const name = `${req.user.id}-${timestamp}-${randomSuffix}${safeExt}`;
    
    cb(null, name);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/webp'
  ];
  const allowedExt = env.upload.allowedExtensions.map(e => `.${e}`);
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  if (allowedMimes.includes(mime) && allowedExt.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, WebP allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.upload.maxFileSizeBytes
  }
});

export default upload;