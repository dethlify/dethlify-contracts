module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8547,
      network_id: "*",
      networkCheckTimeout: 50000,
    },
  },

  compilers: {
    solc: {
      version: "0.6.10",
      settings: {
        optimizer: {
          enabled: true,
          runs: 900,
        },
      },
    },
  },
  ens: {
    enabled: true,
  },
  plugins: ["solidity-coverage"],
  mocha: {
    useColors: true,
    reporter: "spec", // mocha-junit-reporter
  },
};
