module.exports = {
  env: {
    jest: true,
    node: true,
  },
  settings: {
    jest: {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      version: require('./node_modules/jest/package.json').version,
    },
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'plugin:jest/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 9,
  },
  plugins: ['@typescript-eslint', 'jest', 'unicorn'],
  ignorePatterns: ['**/cdk.out/**'],
  rules: {
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    'arrow-body-style': ['error', 'as-needed'],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-return-await': 'error',
    'object-shorthand': 'error',
    'unicorn/prefer-ternary': 'error',
    eqeqeq: 'error',
  },
}
