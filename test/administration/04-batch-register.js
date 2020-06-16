const ManagerProxy = artifacts.require("ManagerProxy");
const Manager = artifacts.require("Manager");
const ethers = require("ethers");

/**
 * @dev checks all parameters after construction.
 */
contract("Manager", async (accounts) => {
  const OWNER = accounts[0];

  let manager, proxy;
  let provider = new ethers.providers.JsonRpcProvider("http://localhost:8547");

  before(async () => {
    proxy = await ManagerProxy.deployed();
    let mgr = await proxy.getManagerImplementation();
    manager = await Manager.at(mgr);
  });

  it("[BATCHREGISTER] 1.1: Batch register domains", async () => {
    let names = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh"];
    let owners = [accounts[0], accounts[1], accounts[2], accounts[3], accounts[4], accounts[5], accounts[6]];

    await manager.batchRegisterDomains(names, owners, {from: OWNER});

    for (let i = 0; i < names.length; i++) {
      let address = await provider.resolveName(names[i] + ".dethlify.eth");
      assert.equal(address, owners[i], "Did not set owners.");
    }
  });
});
