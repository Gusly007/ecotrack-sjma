const ApiError = require('../utils/api-error');

const canManageTournee = user => ['ADMIN', 'GESTIONNAIRE'].includes(user?.role);

const assertCanManageTournee = user => {
    if (!canManageTournee(user)) {
        throw new ApiError(403, 'Modification réservée aux gestionnaires et administrateurs');
    }
};

const assertTourneeAccess = (tournee, user) => {
    if (canManageTournee(user)) return;

    const agentId = Number(user?.id);
    if (user?.role !== 'AGENT' || !Number.isSafeInteger(agentId) || agentId <= 0
        || tournee.id_agent !== agentId) {
        throw new ApiError(403, 'Vous n\'êtes pas assigné à cette tournée');
    }
};

module.exports = { assertCanManageTournee, assertTourneeAccess };
