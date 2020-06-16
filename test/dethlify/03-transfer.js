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
  it("[TRANSFER] 1.1: Transfer 1 ETH", async () => {
    let AMOUNT = 1;
    let PREV_BAL_CONTRACT = Number(ethers.utils.formatEther(await web3.eth.getBalance(dethlify.address)));
    let PREV_BAL_USER = Number(ethers.utils.formatEther(await web3.eth.getBalance(NOT_OWNER)));

    await dethlify.transfer(NOT_OWNER, ethers.utils.parseEther(String(AMOUNT)), {
      from: OWNER,
    });

    let AFTER_BAL_CONTRACT = Number(ethers.utils.formatEther(await web3.eth.getBalance(dethlify.address)));
    let AFTER_BAL_USER = Number(ethers.utils.formatEther(await web3.eth.getBalance(NOT_OWNER)));

    assert.equal(AFTER_BAL_CONTRACT, PREV_BAL_CONTRACT - AMOUNT, "Could not transfer amount.");
    assert.equal(AFTER_BAL_USER, PREV_BAL_USER + AMOUNT, "Receiver didn't receive amount.");
  });

  it("[TRANSFER] 1.2: Transfer 100 DAI", async () => {
    let AMOUNT = 100;
    let dai = await IERC20.at(constants.dai);

    let PREV_BAL_CONTRACT = Number(ethers.utils.formatUnits((await dai.balanceOf(dethlify.address)).toString(), 18));
    let PREV_BAL_USER = Number(ethers.utils.formatUnits((await dai.balanceOf(NOT_OWNER)).toString(), 18));

    await dethlify.transferToken(constants.dai, NOT_OWNER, ethers.utils.parseUnits(String(AMOUNT), 18), {
      from: OWNER,
    });
    let AFTER_BAL_CONTRACT = Number(ethers.utils.formatUnits((await dai.balanceOf(dethlify.address)).toString(), 18));
    let AFTER_BAL_USER = Number(ethers.utils.formatUnits((await dai.balanceOf(NOT_OWNER)).toString(), 18));

    assert.equal(AFTER_BAL_CONTRACT, PREV_BAL_CONTRACT - AMOUNT, "Could not transfer amount");
    assert.equal(AFTER_BAL_USER, PREV_BAL_USER + AMOUNT, "Could not transfer amount");
  });

  // NEGATIVE
  it("[TRANSFER] 2.1: Attempt to transfer 1 ETH as non-owner", async () => {
    let AMOUNT = 1;
    try {
      await dethlify.transfer(NOT_OWNER, ethers.utils.parseEther(String(AMOUNT)), {
        from: NOT_OWNER,
      });
      assert.equal(true, false, "Could steal money!");
    } catch (error) {
      assert.equal(error.reason, "BH: Only owner!", "Error reason invalid.");
    }
  });

  it("[TRANSFER] 2.2: Attempt to transfer 100 DAI as non-owner", async () => {
    let AMOUNT = 100;
    try {
      await dethlify.transferToken(constants.dai, NOT_OWNER, ethers.utils.parseUnits(String(AMOUNT), 18), {
        from: NOT_OWNER,
      });
      assert.equal(true, false, "Could steal money!");
    } catch (error) {
      assert.equal(error.reason, "BH: Only owner!", "Error reason invalid.");
    }
  });
});
