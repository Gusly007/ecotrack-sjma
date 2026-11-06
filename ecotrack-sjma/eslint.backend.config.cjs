const js = require('./frontend/node_modules/@eslint/js');
const globals = require('./frontend/node_modules/globals');

module.exports = [
  {
    ...js.configs.recommended,
    files: ['**/*.js', '**/*.cjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: globals.node,
    },
  },
  {
    files: ['services/{api-gateway,service-users,service-gamifications}/src/**/*.js'],
    languageOptions: { sourceType: 'module' },
  },
];
