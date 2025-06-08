import globals from 'globals';
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierPlugin from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  {
    ignores: ['node_modules/', 'babel.config.js', 'metro.config.js', 'eslint.config.mjs', 'nlp_service/', 'database.sqlite'],
  },
  // Base config for all frontend JS/JSX/TS/TSX files
  {
    files: ['src/**/*.{js,jsx,ts,tsx}', 'App.js'], // Covers App.js and files in src
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      prettier: prettierPlugin,
      '@typescript-eslint': tseslint,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        __DEV__: 'readonly',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...eslintConfigPrettier.rules,
      'prettier/prettier': 'warn',
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'no-console': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  // Additional TypeScript-specific overrides
  {
    files: ['src/**/*.{ts,tsx}', 'App.tsx'],
    plugins: { // Ensure plugins are re-declared or inherited correctly if this object overrides the base
        '@typescript-eslint': tseslint,
        // react: reactPlugin, // if needed specifically here and not covered by file glob match with base
        // 'react-hooks': reactHooksPlugin,
        // prettier: prettierPlugin,
    },
    languageOptions: {
      parser: tsParser, // Redundant if base config for these files already sets it
      parserOptions: {
        ecmaFeatures: { jsx: true }, // Redundant if base already sets it
        project: './tsconfig.json',
      },
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  // Config for Backend JavaScript files (CommonJS)
  {
    files: ['backend/**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      prettier: prettierPlugin,
      '@typescript-eslint': tseslint, // Added for TS rules used below
    },
    rules: {
      ...js.configs.recommended.rules,
      ...eslintConfigPrettier.rules,
      'prettier/prettier': 'warn',
      'no-console': 'warn',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  // Config for plasservice.js (assuming it's at the root)
  {
      files: ['plasservice.js'],
      languageOptions: {
          sourceType: 'module',
          globals: {
              ...globals.node,
              ...globals.es2021,
          }
      },
      plugins: {
          prettier: prettierPlugin,
          '@typescript-eslint': tseslint, // Added for TS rules used below
      },
      rules: {
          ...js.configs.recommended.rules,
          ...eslintConfigPrettier.rules,
          'prettier/prettier': 'warn',
          'no-console': 'warn',
          '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      }
  }
];
