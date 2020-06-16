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

  it("[RECEIVE] 1.1: Receive funds", async () => {
    let prev = await provider.getBalance(manager.address);

    await web3.eth.sendTransaction({
      to: manager.address,
      from: OWNER,
      value: ethers.utils.parseEther("10", "Ether").toString(),
    });
    let after = await provider.getBalance(manager.address);
    assert.equal(false, prev.toString() === after.toString(), "Heirs and distribution are not set correctly."); // prettier-ignore
  });
});
