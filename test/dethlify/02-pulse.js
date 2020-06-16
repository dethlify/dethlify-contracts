const BaseModule = artifacts.require("BaseModule");
const constants = require("../../utils/constants");
const ethers = require("ethers");

contract("Dethlify", async (accounts) => {
  let dethlify;
  const OWNER = accounts[0];
  const NOT_OWNER = accounts[1];
  let provider = new ethers.providers.JsonRpcProvider("http://localhost:8547");

  before(async () => {
    let address = await provider.resolveName(constants.dethlifyENSFull);
    dethlify = await BaseModule.at(address);
  });

  // POSITIVE
  it("[PULSE] 1.1: Execute pulse function", async () => {
    let prevLast = await dethlify.last.call();
    await sleep(3000);
    await dethlify.pulse({from: OWNER});
    await sleep(3000);
    let afterLast = await dethlify.last.call();

    assert.notEqual(prevLast.toString(), afterLast.toString(), "Could not execute pulse.");
  });

  // NEGATIVE
  it("[PULSE] 2.1: Execute pulse function as nonowner", async () => {
    try {
      await dethlify.pulse({from: NOT_OWNER});
      assert.equal(true, false, "Could pulse as non-owner!");
    } catch (error) {
      assert.equal(error.reason, "BH: Only owner!", "Wrong revert reason.");
    }
  });
});

async function sleep(time) {
  await new Promise((resolve) => setTimeout(resolve, time));
}
