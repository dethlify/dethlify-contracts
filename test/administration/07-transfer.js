const ManagerProxy = artifacts.require("ManagerProxy");
const Manager = artifacts.require("Manager");
const IERC20 = artifacts.require("IERC20");
const ethers = require("ethers");
const constants = require("../../utils/constants");

/**
 * @dev checks all parameters after construction.
 */
contract("Manager", async (accounts) => {
  const MANAGER_OWNER = accounts[0];
  const NOT_OWNER = accounts[1];
  const ETHER = "0x0000000000000000000000000000000000000000";

  let manager, proxy;
  let usdc;

  before(async () => {
    proxy = await ManagerProxy.deployed();
    let mgr = await proxy.getManagerImplementation();
    manager = await Manager.at(mgr);
    usdc = await IERC20.at(constants.usdc);
  });

  it("[TRANSFER] 1.1: Transfer ETH funds", async () => {
    await web3.eth.sendTransaction({from: MANAGER_OWNER, to: manager.address, value: ethers.utils.parseEther("10", "Ether")});

    let prev = await web3.eth.getBalance(manager.address);
    await manager.transfer(MANAGER_OWNER, ETHER, ethers.utils.parseEther("1", "Ether"), {from: MANAGER_OWNER});
    let after = await web3.eth.getBalance(manager.address);

    prev = Number(ethers.utils.formatUnits(prev.toString(), 18));
    after = Number(ethers.utils.formatUnits(after.toString(), 18));
    assert.equal(after, prev - 1, "Did not transfer funds.");
  });

  it("[TRANSFER] 1.2: Transfer Token funds", async () => {
    await usdc.transfer(manager.address, ethers.utils.parseUnits("10", 6));

    let prev = await usdc.balanceOf(manager.address);
    await manager.transfer(MANAGER_OWNER, constants.usdc, ethers.utils.parseUnits("1", 6), {from: MANAGER_OWNER});
    let after = await usdc.balanceOf(manager.address);

    prev = Number(ethers.utils.formatUnits(prev.toString(), 6));
    after = Number(ethers.utils.formatUnits(after.toString(), 6));
    assert.equal(after, prev - 1, "Did not transfer funds.");
  });

  it("[TRANSFER] 2.1: Transfer ETH funds as non-owner", async () => {
    await web3.eth.sendTransaction({from: MANAGER_OWNER, to: manager.address, value: ethers.utils.parseEther("10", "Ether")});

    try {
      await manager.transfer(MANAGER_OWNER, ETHER, ethers.utils.parseEther("1", "Ether"), {from: NOT_OWNER});
      assert.equal(true, false, "Could steal funds.");
    } catch (error) {
      assert.equal(error.reason, "M: Only owner!", "Wrong revert reason.");
    }
  });

  it("[TRANSFER] 2.2: Transfer token funds as non-owner", async () => {
    try {
      await usdc.transfer(manager.address, ethers.utils.parseUnits("10", 6));
      await manager.transfer(MANAGER_OWNER, constants.usdc, ethers.utils.parseUnits("1", 6), {from: NOT_OWNER});
      assert.equal(true, false, "Could steal funds.");
    } catch (error) {
      assert.equal(error.reason, "M: Only owner!", "Wrong revert reason.");
    }
  });
});
