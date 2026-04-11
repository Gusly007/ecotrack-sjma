# Test Pyramid - EcoTrack

## Overview

La pyramid des tests montre la répartition des tests par niveau de complexité et de coût.

```
                    ╱╲
                   ╱  ╲
                  ╱ E2E╲        ← 14 tests (E2E)
                 ╱──────╲
                ╱        ╲
               ╱Integration╲  ← 4 tests (Integration)  
              ╱──────────────╲
             ╱                ╲
            ╱    Unit Tests    ╲  ← 252 tests (Unit)
           ╱──────────────────╲
          ┌────────────────────┐
          │   UI / Browser     │  ← 0 tests (Frontend)
          └────────────────────┘
```

## Installation

```bash
# Install dependencies
cd services/service-routes
npm install

# Install test reporter
npm install --save-dev jest-html-reporter
```

## Tests Details

### 1. Unit Tests (252 tests)
- **Purpose:** Tester les fonctions et méthodes isolément
- **Speed:** Très rapide (< 1s)
- **Cost:** Faible
- **Location:** `test/unit/`
- **Run:** `npm run test:unit`

### 2. Integration Tests (4 tests)
- **Purpose:** Tester les interactions entre modules
- **Speed:** Moyen (~1s)
- **Cost:** Moyen
- **Location:** `test/integration/`
- **Run:** `npm run test:integration`

### 3. E2E Tests (14 tests)
- **Purpose:** Tester les parcours completos
- **Speed:** Lent (~1-2s)
- **Cost:** Élevé
- **Location:** `test/e2e/`
- **Run:** `npm run test:e2e`

## Commands

```bash
# Run all tests
npm run test:all

# Run by type
npm run test:unit          # Unit tests
npm run test:integration   # Integration tests
npm run test:e2e          # E2E tests

# Run with coverage
npm run test:coverage
```

## Reports

- **HTML Report:** `test-results/test-report.html`
- **Coverage:** `coverage/lcov-report/index.html`

## service-routes Test Results

| Type | Tests | Status |
|------|-------|--------|
| Unit | 252 | ✓ Passed |
| Integration | 4 | ✓ Passed |
| E2E | 14 | ✓ Passed |
| **Total** | **266** | **✓** |

### Coverage

| Module | Statements | Branches | Functions | Lines |
|--------|-----------|----------|----------|--------|
| All | 78.83% | 64.03% | 80.80% | 78.68% |
| Controllers | 81.69% | 34.21% | 89.18% | 81.69% |
| Services | 74.19% | 66.02% | 78.33% | 72.81% |
| Middleware | 78.84% | 73.52% | 62.50% | 80.00% |
| Routes | 78.94% | 100% | 50% | 100% |
| Utils | 100% | 76.92% | 100% | 100% |
| Validators | 100% | 100% | 100% | 100% |