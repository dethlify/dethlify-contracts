const ManagerProxy = artifacts.require("ManagerProxy");
const Manager = artifacts.require("Manager");

/**
 * @dev checks all parameters after construction.
 */
contract("Manager", async (accounts) => {
  const OWNER = accounts[0];
  const NEW_OWNER = accounts[1];

  let manager, proxy;

  before(async () => {
    proxy = await ManagerProxy.deployed();
    let mgr = await proxy.getManagerImplementation();
    manager = await Manager.at(mgr);
  });

  it("[CHANGEOWNER] 1.1: Change Manager owner", async () => {
    await manager.changeOwner(NEW_OWNER, {from: OWNER});
    let newOwner = await manager.owner.call();

    assert.equal(NEW_OWNER, newOwner, "Didn't change owner.");

    await manager.changeOwner(OWNER, {from: NEW_OWNER});
  });
});
