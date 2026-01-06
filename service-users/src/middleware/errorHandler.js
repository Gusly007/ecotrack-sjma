export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.stack);
 if (err.code === '23005') {
    return res.status(409).json({ message: 'Conflit : Ressource déjà existante.' });
  }

  if(err.message.includes('not found')) {
    return res.status(404).json({ message: err.message });
  }

  if(err.message.includes('token')) {
    return res.status(401).json({ message: 'Token invalide ou expiré.' });
  }

  if(err.message.includes('Validation')) {
    return res.status(400).json({ message: 'Données invalides.' });
  }
  res.status(500).json({ message: 'Erreur interne du serveur.' });
};


 export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
