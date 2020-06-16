const Dethlify = artifacts.require("Dethlify");
const ethers = require("ethers");
const constants = require("../../utils/constants");

contract("Dethlify", async (accounts) => {
  const OWNER = accounts[0];
  const NOT_OWNER = accounts[1];
  const NEW_VERSION = "1.1.1";

  let dethlify;
  let provider = new ethers.providers.JsonRpcProvider("http://localhost:8547");

  before(async () => {
    let address = await provider.resolveName(constants.dethlifyENSFull);
    dethlify = await Dethlify.at(address);
  });

  it("[UPGRADE] 1.1: Upgrade to a new version", async () => {
    await dethlify.setVersion(NEW_VERSION, {from: OWNER});
    let cVersion = await dethlify.version.call();
    assert.equal(cVersion, NEW_VERSION, "Did not set a new version.");
  });

  it("[UPGRADE] 1.2: Attempt to set a new version as non-owner", async () => {
    try {
      await dethlify.setVersion("2.0.0", {from: NOT_OWNER});
      assert.equal(true, false, "Could set version as non-owner.");
    } catch (error) {
      assert.equal(error.reason, "BH: Only owner!", "Wrong revert reason.");
    }
  });
});
