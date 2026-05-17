const logger = require('../utils/logger');

const INTERVAL_MS = 60 * 1000;

function startTourneeScheduler(tourneeService) {
  async function tick() {
    try {
      const started = await tourneeService.autoStartDueTournees();
      if (started.length > 0) {
        logger.info({ count: started.length, tournees: started.map((t) => t.code) }, 'Tournées démarrées automatiquement');
      }
    } catch (err) {
      logger.error({ err: err.message }, 'Erreur scheduler auto-start tournées');
    }
  }

  tick();
  const intervalId = setInterval(tick, INTERVAL_MS);
  logger.info({ intervalMs: INTERVAL_MS }, 'Scheduler tournées démarré');

  return intervalId;
}

module.exports = { startTourneeScheduler };
