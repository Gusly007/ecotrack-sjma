const jwt = require('jsonwebtoken');
global.testAuthToken = jwt.sign({ id_utilisateur: 1, role: 'admin' }, 'your_jwt_secret_key', { expiresIn: '1h' });
