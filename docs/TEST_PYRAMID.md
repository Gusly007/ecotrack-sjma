# Pyramide de tests

Ce projet applique une pyramide de tests avec des objectifs chiffrés.

## Cibles

- Tests unitaires: 70%
- Tests d integration: 20%
- Tests end-to-end: 10%

## Bornes acceptees en CI

- Unitaires: 60% a 85%
- Integration: 15% a 25%
- E2E: 5% a 15%

## Lancer en local

Depuis la racine du projet:

1. Generer le rapport E2E scenarios

node scripts/e2e-scenarios-report.mjs

2. Generer le rapport de repartition pyramide

node scripts/test-pyramid-metrics.mjs

3. Generer le rapport integration services

node scripts/service-integration-report.mjs

## Rapports generes

- [reports/e2e/index.html](reports/e2e/index.html)
- [reports/pyramid/index.html](reports/pyramid/index.html)
- [reports/integration/index.html](reports/integration/index.html)

## Execution dans CI

Le controle pyramide est aussi execute dans la pipeline GitHub Actions:

- Workflow: [.github/workflows/ci.yml](.github/workflows/ci.yml)
- Job: test-pyramid
- Script execute: [scripts/test-pyramid-metrics.mjs](scripts/test-pyramid-metrics.mjs)

Le job echoue si la repartition sort des bornes definies ci-dessus.
