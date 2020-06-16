const ManagerProxy = artifacts.require("ManagerProxy");
const Manager = artifacts.require("Manager");

/**
 * @dev checks all parameters after construction.
 */
contract("Manager", async (accounts) => {
  const OWNER = accounts[0];
  const NEW_SIGNER = accounts[6];

  let manager, proxy;

  before(async () => {
    proxy = await ManagerProxy.deployed();
    let mgr = await proxy.getManagerImplementation();
    manager = await Manager.at(mgr);
  });

  it("[SIGNERS] 1.1: Add and delete signer", async () => {
    let isSignerPrev = await manager.isSigner(NEW_SIGNER);
    await manager.addSigner(NEW_SIGNER, {from: OWNER});
    let isSignerAfter = await manager.isSigner(NEW_SIGNER);

    assert.equal(isSignerPrev, false);
    assert.equal(isSignerAfter, true);

    await manager.deleteSigner(NEW_SIGNER, {from: OWNER});

    let isSignerAfter2 = await manager.isSigner(NEW_SIGNER);
    assert.equal(isSignerAfter2, false);
  });
});
