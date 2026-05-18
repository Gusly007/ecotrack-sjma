const jwt = require('jsonwebtoken');
global.testAuthToken = jwt.sign({ id_utilisateur: 1, role: 'ADMIN' }, 'change_me_in_production_access_secret', { expiresIn: '1h' });
