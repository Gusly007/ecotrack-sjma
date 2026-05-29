import { unifiedSwaggerSpec } from './src/swagger-config.js';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, 'swagger-spec.json');

writeFileSync(outPath, JSON.stringify(unifiedSwaggerSpec, null, 2));
console.log(`swagger-spec.json written to ${outPath}`);
console.log('');
console.log('Run next:');
console.log('  npx @redocly/cli build-docs swagger-spec.json -o api-docs.html --title "EcoTrack API Unifiee"');


// cd ecotrack-sjma/services/api-gateway
// npm run docs:build
// # → api-docs.html ready, open in browser
