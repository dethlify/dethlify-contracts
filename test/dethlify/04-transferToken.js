const IERC20 = artifacts.require("IERC20");
const BaseModule = artifacts.require("BaseModule");
const ethers = require("ethers");
const constants = require("../../utils/constants");

contract("Dethlify", async (accounts) => {
  const OWNER = accounts[0];
  const NOT_OWNER = accounts[1];
  let dethlify;

  let provider = new ethers.providers.JsonRpcProvider("http://localhost:8547");

  before(async () => {
    let address = await provider.resolveName(constants.dethlifyENSFull);
    dethlify = await BaseModule.at(address);
  });

  // POSITIVE
  it("[TRANSFERTOKEN] 1.1: Transfer 100 DAI", async () => {
    let dai = await IERC20.at(constants.dai);
    let AMOUNT = 100;
    let PREV_BAL_CONTRACT = Number(ethers.utils.formatEther((await dai.balanceOf(dethlify.address)).toString()).toString());
    let PREV_BAL_USER = Number(ethers.utils.formatEther((await dai.balanceOf(NOT_OWNER)).toString()).toString());

    await dethlify.transferToken(constants.dai, NOT_OWNER, ethers.utils.parseEther(String(AMOUNT)), {from: OWNER});

    let AFTER_BAL_CONTRACT = Number(ethers.utils.formatEther((await dai.balanceOf(dethlify.address)).toString()).toString());
    let AFTER_BAL_USER = Number(ethers.utils.formatEther((await dai.balanceOf(NOT_OWNER)).toString()).toString());

    assert.equal(AFTER_BAL_CONTRACT, PREV_BAL_CONTRACT - AMOUNT, "Could not transfer amount.");
    assert.equal(AFTER_BAL_USER, PREV_BAL_USER + AMOUNT, "Receiver didn't receive amount.");
  });

  // NEGATIVE
  it("[TRANSFERTOKEN] 2.1: Attempt to transfer 1 Token as non-owner", async () => {
    let AMOUNT = 1;
    try {
      await dethlify.transferToken(constants.dai, NOT_OWNER, ethers.utils.parseEther(String(AMOUNT)), {from: NOT_OWNER});
      assert.equal(true, false, "Could steal money!");
    } catch (error) {
      assert.equal(error.reason, "BH: Only owner!", "Error reason invalid.");
    }
  });
});
