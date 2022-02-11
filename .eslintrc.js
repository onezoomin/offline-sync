module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'plugin:react/recommended',
    'preact',
    'standard-with-typescript',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: [
    'react',
    '@typescript-eslint',
  ],
  rules: {
    'react/jsx-indent': ['warn', 2, { checkAttributes: true, indentLogicalExpressions: true }],
    'react/no-unknown-property': ['error', { ignore: ['class', 'autocomplete'] }],
    'comma-dangle': ['error', 'always-multiline'],
    '@typescript-eslint/no-unused-vars': ['warn', {
      varsIgnorePattern: '^_',
      argsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^ignore',
    }],
    '@typescript-eslint/no-non-null-assertion': 'warn', // for rIF, as type guards don't work there

    // lenient of bad code
    'operator-linebreak': ['warn', 'before'],
    'react/prop-types': ['warn'],
    'prefer-const': ['warn'],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/brace-style': 'warn',
    '@typescript-eslint/no-floating-promises': 'warn',
    '@typescript-eslint/promise-function-async': 'off',
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/restrict-template-expressions': 'warn',
    // https://github.com/typescript-eslint/typescript-eslint/issues/2540#issuecomment-692505191
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': 'warn',
    'react/no-unescaped-entities': 'warn',
    // '@typescript-eslint/prefer-nullish-coalesce': "warn",

    // @manu, how to change this?
    'multiline-ternary': ['error', 'always-multiline'],

    // remove duplicate
    'no-unused-vars': ['off'],
  },
  settings: {
    react: {
      pragma: 'h',
    },
  },
}
