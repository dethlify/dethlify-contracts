const BaseModule = artifacts.require("BaseModule");
const ethers = require("ethers");
const constants = require("../../utils/constants");

contract("Dethlify", async (accounts) => {
  const OWNER = accounts[0];
  const NEW_OWNER = accounts[1];
  const NOT_OWNER = accounts[3];

  let dethlify;
  let provider = new ethers.providers.JsonRpcProvider("http://localhost:8547");

  before(async () => {
    let address = await provider.resolveName(constants.dethlifyENSFull);
    dethlify = await BaseModule.at(address);
  });

  // POSITIVE
  it("[CHANGEOWNER] 1.1: Change Owner", async () => {
    await dethlify.changeOwner(NEW_OWNER, {from: OWNER});
    let newOwner = await dethlify.owner.call();
    assert.equal(newOwner, NEW_OWNER, "Did not change owner.");
  });

  // NEGATIVE
  it("[CHANGEOWNER] 2.1: Change owner as nonowner", async () => {
    try {
      await dethlify.changeOwner(NOT_OWNER, {from: NOT_OWNER});
      assert.equal(true, false, "Could change owner as non-owner!");
    } catch (error) {
      assert.equal(error.reason, "BH: Only owner!", "Wrong revert reason.");
    }
  });
});
