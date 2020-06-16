module.exports = {
  client: require("ganache-cli"),
  port: 8547,

  providerOptions: {
    fork: "http://localhost:8545",
    unlocked_accounts: [
      "0x3e71552f3CBEAE776e8369B06376576487f59eB0", // usdc holder
      "0x78bc49be7bae5e0eec08780c86f0e8278b8b035b", // dai holder
      "0x230C20B0756388DD2b3d61B787C5713c1B18656A", // ens owner
    ],
    debug: true,
    network_id: 1,
    default_balance_ether: "10000",
  },
  skipFiles: ["Migrations.sol", "interfaces", "libs", "modules/Combi.sol"],
};
