// @ts-check
import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/', 'test-results/', 'playwright-report/'] },
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: { globals: globals.browser },
  },
  {
    // Game logic must stay pure so it runs under `node --test` (see CLAUDE.md).
    files: ['src/game/**/*.js'],
    rules: {
      'no-restricted-globals': ['error', 'window', 'document', 'performance'],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use the seeded RNG in src/game/rng.js.' },
        { object: 'Date', property: 'now', message: 'Pass time in; game logic is pure.' },
      ],
    },
  },
  {
    files: ['test/**/*.js', 'e2e/**/*.js', 'tools/**/*.js', '*.config.js'],
    languageOptions: { globals: globals.node },
  },
];
