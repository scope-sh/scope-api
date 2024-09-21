import js from '@eslint/js';
import eslintPluginImportX from 'eslint-plugin-import-x';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default [
  js.configs.recommended,
  eslintPluginImportX.flatConfigs.recommended,
  eslintPluginImportX.flatConfigs.typescript,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parser: tseslint.parser,
      globals: {
        ...globals.node,
      },
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': 'off',
      'import-x/first': 'error',
      'import-x/exports-last': 'error',
      'import-x/newline-after-import': 'error',
      'import-x/prefer-default-export': 'error',
      'import-x/group-exports': 'error',
      'import-x/no-duplicates': 'error',
      'import-x/no-amd': 'error',
      'import-x/no-commonjs': 'error',
      'import-x/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',

          alphabetize: {
            order: 'asc',
          },
        },
      ],
      'import-x/no-unused-modules': 'error',
      'import-x/no-mutable-exports': 'error',
      'import-x/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: ['src/**/*.test.ts'],
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'error',
    },
  },
];
