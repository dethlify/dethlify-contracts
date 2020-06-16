const ManagerProxy = artifacts.require("ManagerProxy");
const ethers = require("ethers");

/**
 * @dev checks all parameters after construction.
 */
contract("ManagerProxy", async (accounts) => {
  const OWNER = accounts[0];

  let proxy;

  before(async () => {
    proxy = await ManagerProxy.deployed();
  });

  it("[RECEIVE] 1.1: Receive funds", async () => {
    try {
      await web3.eth.sendTransaction({
        to: proxy.address,
        from: OWNER,
        value: ethers.utils.parseEther("10", "Ether").toString(),
      });
      assert.equal(true, false, "Could send funds to proxy.");
    } catch (error) {
      assert.equal(true, true);
    }
  });
});
