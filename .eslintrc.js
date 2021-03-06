module.exports = {
  env: {
    node: true,
    commonjs: true,
    es6: true,
    mocha: true,
    "truffle/globals": true,
  },
  extends: "eslint:recommended",
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly",
  },
  parserOptions: {
    ecmaVersion: 11,
  },
  rules: {},
  plugins: ["truffle"],
};
