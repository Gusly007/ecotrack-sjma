#!/usr/bin/env node
/**
 * Simulateur de capteurs IoT pour EcoTrack
 * 
 * Publie des mesures réalistes via MQTT sur le broker du service-iot.
 * Les données sont réceptionnées, traitées, validées et insérées en base automatiquement.
 * 
 * Usage:
 *   node scripts/simulate-sensors.js                          # Mode normal, 5 capteurs, 10 cycles
 *   node scripts/simulate-sensors.js --scenario critical      # Force des remplissages > 90%
 *   node scripts/simulate-sensors.js --scenario low-battery   # Force des batteries < 20%
 *   node scripts/simulate-sensors.js --scenario mixed         # Mélange de tous les scénarios
 *   node scripts/simulate-sensors.js --sensors CAP-0001,CAP-0002 --count 5
 *   node scripts/simulate-sensors.js --interval 2000 --count 20 --sensors-count 10
 */

const mqtt = require('mqtt');

// ─── Parsing des arguments CLI ───────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    broker: 'mqtt://localhost:1883',
    interval: 5000,
    count: 10,
    sensorsCount: 5,
    sensors: null,
    scenario: 'normal',  // normal | critical | low-battery | mixed
    verbose: true
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--broker':      opts.broker = args[++i]; break;
      case '--interval':    opts.interval = parseInt(args[++i], 10); break;
      case '--count':       opts.count = parseInt(args[++i], 10); break;
      case '--sensors-count': opts.sensorsCount = parseInt(args[++i], 10); break;
      case '--sensors':     opts.sensors = args[++i].split(',').map(s => s.trim()); break;
      case '--scenario':    opts.scenario = args[++i]; break;
      case '--quiet':       opts.verbose = false; break;
      case '--help':
        console.log(`
Simulateur de capteurs IoT EcoTrack

Options:
  --broker <url>         URL du broker MQTT (défaut: mqtt://localhost:1883)
  --interval <ms>        Intervalle entre les cycles en ms (défaut: 5000)
  --count <n>            Nombre de cycles à exécuter (défaut: 10, 0 = infini)
  --sensors-count <n>    Nombre de capteurs à simuler (défaut: 5)
  --sensors <list>       Liste de capteurs spécifiques (ex: CAP-0001,CAP-0003)
  --scenario <name>      Scénario: normal, critical, low-battery, mixed
  --quiet                Mode silencieux
  --help                 Afficher cette aide
`);
        process.exit(0);
    }
  }
  return opts;
}

// ─── Générateurs de données réalistes ────────────────────────────────────────

class SensorSimulator {
  constructor(uid, scenario) {
    this.uid = uid;
    this.scenario = scenario;

    // État interne persistant entre les cycles
    switch (scenario) {
      case 'critical':
        this.fillLevel = 80 + Math.random() * 10;    // Démarre haut (80-90%)
        this.battery = 40 + Math.random() * 40;
        break;
      case 'low-battery':
        this.fillLevel = 20 + Math.random() * 40;
        this.battery = 15 + Math.random() * 15;      // Démarre bas (15-30%)
        break;
      default:
        this.fillLevel = 5 + Math.random() * 30;     // Démarre bas (5-35%)
        this.battery = 70 + Math.random() * 25;      // Batterie correcte (70-95%)
    }

    this.temperature = 18 + Math.random() * 6;       // Température ambiante (18-24°C)
  }

  /**
   * Génère la prochaine mesure en faisant évoluer l'état du capteur
   */
  nextMeasurement() {
    // Remplissage : augmente progressivement (collecte de déchets)
    const fillDelta = this.scenario === 'critical'
      ? 1.5 + Math.random() * 3       // Monte vite en mode critical
      : 0.5 + Math.random() * 2.5;    // Monte normalement

    this.fillLevel = Math.min(100, this.fillLevel + fillDelta);

    // Batterie : diminue lentement
    const batteryDelta = this.scenario === 'low-battery'
      ? 0.5 + Math.random() * 1.5     // Descend vite en mode low-battery
      : 0.02 + Math.random() * 0.1;   // Descend lentement

    this.battery = Math.max(0, this.battery - batteryDelta);

    // Température : oscille autour de la valeur courante
    const tempNoise = (Math.random() - 0.5) * 2;  // ±1°C
    this.temperature = Math.max(-5, Math.min(45, this.temperature + tempNoise));

    return {
      fill_level: parseFloat(this.fillLevel.toFixed(2)),
      battery: parseFloat(this.battery.toFixed(2)),
      temperature: parseFloat(this.temperature.toFixed(2))
    };
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs();

  // Déterminer les capteurs à simuler
  let sensorUids;
  if (opts.sensors) {
    sensorUids = opts.sensors;
  } else {
    // Prendre les N premiers capteurs de la base
    sensorUids = [];
    for (let i = 1; i <= opts.sensorsCount; i++) {
      sensorUids.push(`CAP-${String(i).padStart(4, '0')}`);
    }
  }

  // Attribuer un scénario à chaque capteur
  const simulators = sensorUids.map((uid, i) => {
    let scenario = opts.scenario;
    if (scenario === 'mixed') {
      const scenarios = ['normal', 'normal', 'critical', 'low-battery'];
      scenario = scenarios[i % scenarios.length];
    }
    return new SensorSimulator(uid, scenario);
  });

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🛰️  Simulateur IoT EcoTrack');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Broker    : ${opts.broker}`);
  console.log(`  Capteurs  : ${sensorUids.length} (${sensorUids.join(', ')})`);
  console.log(`  Scénario  : ${opts.scenario}`);
  console.log(`  Intervalle: ${opts.interval}ms`);
  console.log(`  Cycles    : ${opts.count === 0 ? 'infini' : opts.count}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  // Connexion MQTT
  console.log('Connexion au broker MQTT...');
  const client = mqtt.connect(opts.broker);

  await new Promise((resolve, reject) => {
    client.on('connect', () => {
      console.log('✅ Connecté au broker MQTT\n');
      resolve();
    });
    client.on('error', (err) => {
      console.error('❌ Erreur MQTT:', err.message);
      reject(err);
    });
    setTimeout(() => reject(new Error('Timeout connexion MQTT (10s)')), 10000);
  });

  // Boucle de simulation
  let cycle = 0;
  const totalMessages = { sent: 0, errors: 0 };

  const runCycle = () => {
    cycle++;
    const timestamp = new Date().toLocaleTimeString('fr-FR');

    if (opts.verbose) {
      console.log(`── Cycle ${cycle}/${opts.count || '∞'} [${timestamp}] ──`);
    }

    for (const sim of simulators) {
      const data = sim.nextMeasurement();
      const topic = `containers/${sim.uid}/data`;
      const payload = JSON.stringify(data);

      client.publish(topic, payload, { qos: 1 }, (err) => {
        if (err) {
          totalMessages.errors++;
          console.error(`  ❌ ${sim.uid}: erreur envoi`);
        } else {
          totalMessages.sent++;
          if (opts.verbose) {
            const flags = [];
            if (data.fill_level >= 90) flags.push('⚠️ CRITICAL');
            if (data.battery <= 20)    flags.push('🔋 LOW BAT');
            const flagStr = flags.length > 0 ? `  ${flags.join(' ')}` : '';

            console.log(
              `  📡 ${sim.uid} → fill: ${String(data.fill_level).padStart(6)}%` +
              ` | bat: ${String(data.battery).padStart(6)}%` +
              ` | temp: ${String(data.temperature).padStart(6)}°C${flagStr}`
            );
          }
        }
      });
    }

    // Vérifier s'il faut continuer
    if (opts.count > 0 && cycle >= opts.count) {
      setTimeout(() => {
        console.log('\n═══════════════════════════════════════════════════════════');
        console.log(`  ✅ Simulation terminée`);
        console.log(`  Messages envoyés : ${totalMessages.sent}`);
        console.log(`  Erreurs          : ${totalMessages.errors}`);
        console.log('═══════════════════════════════════════════════════════════');
        client.end();
        process.exit(0);
      }, 1000);  // Attendre que les derniers messages soient envoyés
    } else {
      setTimeout(runCycle, opts.interval);
    }
  };

  runCycle();

  // Gestion de l'arrêt propre (Ctrl+C)
  process.on('SIGINT', () => {
    console.log('\n\nArrêt demandé...');
    console.log(`Messages envoyés : ${totalMessages.sent} | Erreurs : ${totalMessages.errors}`);
    client.end();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Erreur fatale:', err.message);
  process.exit(1);
});
