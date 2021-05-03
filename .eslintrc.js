//require('jest')

module.exports = {
  extends: [
    'eslint:recommended',
    /*    'plugin:jest/recommended'*/
  ],
  env: {
    'es6': true,
    'node': true,
  },
  parserOptions: {
    'ecmaVersion': 2018
  },
  globals: {
    'debug': true
  },
  rules: {
    // 'no-unused-vars': ['error', {
    //   'args': 'none'
    // }],
    'no-unused-vars': 'off',
    'no-inner-declarations': 0,
    'no-console': 0,
    'indent': [
      'error',
      2
    ],
    'linebreak-style': [
      'error',
      'unix'
    ],
    'quotes': [
      'error',
      'single'
    ],
    'semi': [
      'error',
      'never'
    ],
    'keyword-spacing': [
      'error',
      {
        /*        before: false,*/
        after: true,
      }
    ],
    'curly': [
      'error',
      'all'
    ],
    'brace-style': 'error',
    'space-infix-ops': [
      'error',
      {int32Hint: false}
    ],
    'semi-spacing': [
      'error',
      { after: true }
    ],
  }
}
