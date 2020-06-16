const ManagerProxy = artifacts.require("ManagerProxy");
const Manager = artifacts.require("Manager");
const BaseModule = artifacts.require("BaseModule");
const CompoundModule = artifacts.require("CompoundModule");
const ethers = require("ethers");

/**
 * @dev checks all parameters after construction.
 */
contract("Manager", async (accounts) => {
  const OWNER = accounts[0];
  const NOT_OWNER = accounts[1];
  const NEW_VERSION = "1.1.1";

  let manager, proxy;
  let base, compound;

  before(async () => {
    proxy = await ManagerProxy.deployed();
    let mgr = await proxy.getManagerImplementation();
    manager = await Manager.at(mgr);

    base = await BaseModule.deployed();
    compound = await CompoundModule.deployed();
  });

  it("[IMPLEMENTATIONS] 1.1: Add multiple implementations", async () => {
    let sigs = [];
    let addresses = [];
    let contracts = [base];

    contracts.forEach(async (c) => {
      let iFace = new ethers.utils.Interface(c.abi);
      let functions = iFace.functions;
      Object.keys(functions).forEach(async (f) => {
        if (!f.includes("(")) {
          sigs.push(functions[f].sighash);
          addresses.push(c.address);
        }
      });
    });

    await manager.setNewVersionImplementation(NEW_VERSION, sigs, addresses, {from: OWNER});

    for (let i = 0; i < sigs.length; i++) {
      let a = await manager.getImplementationAddress(NEW_VERSION, sigs[i]);
      assert.equal(a, addresses[i], "Did not set implementation");
    }
  });

  it("[IMPLEMENTATIONS] 2.1: Add multiple implementations as non-owner", async () => {
    let sigs = [];
    let addresses = [];
    let contracts = [base];
    let newVersion = "3.0.0";

    contracts.forEach(async (c) => {
      let iFace = new ethers.utils.Interface(c.abi);
      let functions = iFace.functions;
      Object.keys(functions).forEach(async (f) => {
        if (!f.includes("(")) {
          sigs.push(functions[f].sighash);
          addresses.push(c.address);
        }
      });
    });

    try {
      await manager.setNewVersionImplementation(newVersion, sigs, addresses, {from: NOT_OWNER});
      assert.equal(true, false);
    } catch (error) {
      assert.equal(error.reason, "M: Only owner!", "Wrong revert reason.");
    }
  });

  it("[IMPLEMENTATIONS] 2.2: No overwrites", async () => {
    let sigs = [];
    let addresses = [];
    let contracts = [compound];
    let newVersion = "1.0.0";

    contracts.forEach(async (c) => {
      let iFace = new ethers.utils.Interface(c.abi);
      let functions = iFace.functions;
      Object.keys(functions).forEach(async (f) => {
        if (!f.includes("(")) {
          sigs.push(functions[f].sighash);
          addresses.push(c.address);
        }
      });
    });

    try {
      await manager.setNewVersionImplementation(newVersion, sigs, addresses, {from: OWNER});
      assert.equal(true, false, "Could overwrite version");
    } catch (error) {
      assert.equal(error.reason, "M: No overwrite allowed.", "Wrong revert reason.");
    }
  });
});
